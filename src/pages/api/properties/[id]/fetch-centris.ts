import type { APIRoute } from 'astro';
import { db } from '~/lib/db';
import { properties, transactions } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error } from '~/lib/api-response';

// POST /api/properties/[id]/fetch-centris — fetch Centris listing data and update property
export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorise', 401);
  }

  const { id } = params;
  if (!id) return error('ID requis', 400);

  // Verify property exists
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  if (!property) return error('Propriete introuvable', 404);

  // Verify user has access via a linked transaction
  if (user.role !== 'admin') {
    const [tx] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.propertyId, id), eq(transactions.brokerId, user.id)));

    if (!tx) return error('Acces refuse', 403);
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Corps de requete invalide', 400);
  }

  if (!body || typeof body !== 'object') {
    return error('Corps de requete invalide', 400);
  }

  const { url: inputUrl, mlsNumber } = body as { url?: string; mlsNumber?: string };

  if (!inputUrl && !mlsNumber) {
    return error('URL ou numero MLS requis', 400);
  }

  // Build the Centris URL
  let centrisUrl: string;
  let extractedMlsNumber: string | null = null;

  if (inputUrl) {
    centrisUrl = inputUrl.trim();
    // Try to extract MLS number from URL
    const mlsMatch = centrisUrl.match(/\/(\d{8,})\/?(\?|$)/);
    if (mlsMatch) {
      extractedMlsNumber = mlsMatch[1];
    }
  } else {
    const mls = (mlsNumber as string).trim();
    extractedMlsNumber = mls;
    centrisUrl = `https://www.centris.ca/fr/propriete~a-vendre~/${mls}`;
  }

  // Fetch the Centris page
  let html: string;
  try {
    const response = await fetch(centrisUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return error(`Impossible de recuperer la page Centris (HTTP ${response.status})`, 502);
    }

    html = await response.text();
  } catch {
    return error('Erreur reseau lors de la connexion a Centris', 502);
  }

  // --- Extract data from the HTML ---
  const extracted: Record<string, unknown> = {};

  // 1. JSON-LD structured data
  const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        // RealEstateListing or Product schema
        const type = item['@type'];
        if (type === 'RealEstateListing' || type === 'Product' || type === 'House' || type === 'Apartment') {
          if (item.name && !extracted.description) {
            extracted.description = String(item.name);
          }
          if (item.description && !extracted.descriptionLong) {
            extracted.descriptionLong = String(item.description);
          }
          if (item.address) {
            const addr = item.address;
            if (addr.streetAddress && !extracted.address) {
              extracted.address = String(addr.streetAddress);
            }
            if (addr.addressLocality && !extracted.city) {
              extracted.city = String(addr.addressLocality);
            }
            if (addr.addressRegion && !extracted.province) {
              extracted.province = String(addr.addressRegion);
            }
            if (addr.postalCode && !extracted.postalCode) {
              extracted.postalCode = String(addr.postalCode);
            }
          }
          if (item.offers?.price && !extracted.listingPrice) {
            const price = parseFloat(String(item.offers.price).replace(/[^\d.]/g, ''));
            if (!isNaN(price) && price > 0) {
              extracted.listingPrice = Math.round(price);
            }
          }
          if (item.numberOfRooms && !extracted.bedrooms) {
            const rooms = parseInt(String(item.numberOfRooms));
            if (!isNaN(rooms)) extracted.bedrooms = rooms;
          }
          if (item.numberOfBathroomsTotal && !extracted.bathrooms) {
            const baths = parseInt(String(item.numberOfBathroomsTotal));
            if (!isNaN(baths)) extracted.bathrooms = baths;
          }
          if (item.floorSize?.value && !extracted.livingArea) {
            const area = parseInt(String(item.floorSize.value));
            if (!isNaN(area)) extracted.livingArea = area;
          }
          if (item.lotSize?.value && !extracted.lotArea) {
            const lot = parseInt(String(item.lotSize.value));
            if (!isNaN(lot)) extracted.lotArea = lot;
          }
          if (item.yearBuilt && !extracted.yearBuilt) {
            const yr = parseInt(String(item.yearBuilt));
            if (!isNaN(yr) && yr > 1600 && yr <= 2100) extracted.yearBuilt = yr;
          }
        }
      }
    } catch {
      // Skip malformed JSON-LD blocks
    }
  }

  // 2. Open Graph meta tags
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  const ogUrl = extractMeta(html, 'og:url');

  if (ogTitle && !extracted.description) {
    extracted.description = ogTitle;
  }
  if (ogDescription && !extracted.descriptionLong) {
    extracted.descriptionLong = ogDescription;
  }

  // Try to extract MLS from og:url if not already known
  if (ogUrl && !extractedMlsNumber) {
    const m = ogUrl.match(/\/(\d{8,})\/?/);
    if (m) extractedMlsNumber = m[1];
  }

  // 3. Parse __NEXT_DATA__ (Next.js SSR payload)
  const nextDataMatch = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      walkNextData(nextData, extracted);
    } catch {
      // Ignore parse errors
    }
  }

  // 4. Heuristic extraction from HTML text patterns
  // Price: look for patterns like "450 000 $" or "$450,000"
  if (!extracted.listingPrice) {
    const priceMatch = html.match(/(\d[\d\s]{2,8})\s*\$(?!\s*\/\s*mois)/i);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/\s/g, '');
      const price = parseInt(priceStr);
      if (!isNaN(price) && price > 10000 && price < 100000000) {
        extracted.listingPrice = price;
      }
    }
  }

  // Address from title tag
  if (!extracted.address) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const titleText = titleMatch[1].replace(/\s+/g, ' ').trim();
      // Centris titles often follow the pattern: "Address, City | ..."
      const addrMatch = titleText.match(/^([^,|]+),\s*([^,|]+)/);
      if (addrMatch) {
        extracted.address = addrMatch[1].trim();
        extracted.city = extracted.city ?? addrMatch[2].trim();
      }
    }
  }

  // Bedrooms: look for "X chambres" or "X ch."
  if (!extracted.bedrooms) {
    const bedroomsMatch = html.match(/(\d+)\s*(?:chambre|ch\.)/i);
    if (bedroomsMatch) {
      const n = parseInt(bedroomsMatch[1]);
      if (!isNaN(n) && n <= 20) extracted.bedrooms = n;
    }
  }

  // Bathrooms: look for "X salle" or "X s.d.b"
  if (!extracted.bathrooms) {
    const bathroomsMatch = html.match(/(\d+)\s*(?:salle[s]?\s*de\s*bain|s\.d\.b)/i);
    if (bathroomsMatch) {
      const n = parseInt(bathroomsMatch[1]);
      if (!isNaN(n) && n <= 20) extracted.bathrooms = n;
    }
  }

  // Year built: look for "Annee de construction: YYYY" or similar
  if (!extracted.yearBuilt) {
    const yearMatch = html.match(/(?:construit|construction|built)[^\d]{1,30}((?:19|20)\d{2})/i);
    if (yearMatch) {
      const yr = parseInt(yearMatch[1]);
      if (!isNaN(yr) && yr > 1600 && yr <= 2100) extracted.yearBuilt = yr;
    }
  }

  // Living area in sq ft
  if (!extracted.livingArea) {
    const areaMatch = html.match(/(\d[\d\s]*)\s*pi[e\u00e8]?[s]?[²2]/i);
    if (areaMatch) {
      const area = parseInt(areaMatch[1].replace(/\s/g, ''));
      if (!isNaN(area) && area > 50 && area < 100000) extracted.livingArea = area;
    }
  }

  // --- Build the DB update payload ---
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  let fieldsUpdated = 0;

  const fieldMap: Array<[string, string]> = [
    ['address', 'address'],
    ['city', 'city'],
    ['province', 'province'],
    ['postalCode', 'postalCode'],
    ['description', 'description'],
    ['descriptionLong', 'descriptionLong'],
    ['listingPrice', 'listingPrice'],
    ['bedrooms', 'bedrooms'],
    ['bathrooms', 'bathrooms'],
    ['livingArea', 'livingArea'],
    ['lotArea', 'lotArea'],
    ['yearBuilt', 'yearBuilt'],
    ['floors', 'floors'],
    ['parking', 'parking'],
    ['heating', 'heating'],
    ['zoning', 'zoning'],
    ['virtualTourUrl', 'virtualTourUrl'],
  ];

  for (const [extractedKey, dbKey] of fieldMap) {
    if (extracted[extractedKey] !== undefined) {
      updateValues[dbKey] = extracted[extractedKey];
      fieldsUpdated++;
    }
  }

  // Always update MLS number and Centris URL if we have them
  if (extractedMlsNumber) {
    updateValues.mlsNumber = extractedMlsNumber;
    fieldsUpdated++;
  }

  // Store Centris URL in virtualTourUrl only if not already set and we don't have a better one
  // Instead, store the centris URL as the source in description if no virtual tour
  // Note: we store the canonical Centris URL in a note, but the schema doesn't have a centrisUrl field.
  // We'll add it to the description prefix if description is empty, otherwise skip.

  if (fieldsUpdated === 0) {
    return json({
      property,
      fieldsUpdated: 0,
      message: 'Aucune donnee extractible trouvee sur cette page Centris. La page est peut-etre rendue cote client uniquement.',
    });
  }

  const [updated] = await db
    .update(properties)
    .set(updateValues)
    .where(eq(properties.id, id))
    .returning();

  return json({ property: updated, fieldsUpdated });
};

// --- Helpers ---

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  let match = regex.exec(html);
  if (match) return decodeHtmlEntities(match[1]);

  // Also try content-first form: <meta content="..." property="...">
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegex(property)}["']`,
    'i',
  );
  match = regex2.exec(html);
  if (match) return decodeHtmlEntities(match[1]);

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

// Recursively walk Next.js __NEXT_DATA__ to find property fields
function walkNextData(obj: unknown, extracted: Record<string, unknown>, depth = 0): void {
  if (depth > 8 || !obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      walkNextData(item, extracted, depth + 1);
    }
    return;
  }

  const o = obj as Record<string, unknown>;

  // Look for common Centris data keys
  if (typeof o['Price'] === 'number' && !extracted.listingPrice) {
    extracted.listingPrice = o['Price'] as number;
  }
  if (typeof o['price'] === 'number' && !extracted.listingPrice) {
    extracted.listingPrice = o['price'] as number;
  }
  if (typeof o['NbBedroom'] === 'number' && !extracted.bedrooms) {
    extracted.bedrooms = o['NbBedroom'] as number;
  }
  if (typeof o['NbBathroom'] === 'number' && !extracted.bathrooms) {
    extracted.bathrooms = o['NbBathroom'] as number;
  }
  if (typeof o['YearBuilt'] === 'number' && !extracted.yearBuilt) {
    extracted.yearBuilt = o['YearBuilt'] as number;
  }
  if (typeof o['LivingArea'] === 'number' && !extracted.livingArea) {
    extracted.livingArea = o['LivingArea'] as number;
  }
  if (typeof o['LotArea'] === 'number' && !extracted.lotArea) {
    extracted.lotArea = o['LotArea'] as number;
  }
  if (typeof o['Address'] === 'string' && !extracted.address) {
    extracted.address = o['Address'] as string;
  }
  if (typeof o['City'] === 'string' && !extracted.city) {
    extracted.city = o['City'] as string;
  }
  if (typeof o['PostalCode'] === 'string' && !extracted.postalCode) {
    extracted.postalCode = o['PostalCode'] as string;
  }
  if (typeof o['Description'] === 'string' && !extracted.descriptionLong) {
    extracted.descriptionLong = o['Description'] as string;
  }
  if (typeof o['Zoning'] === 'string' && !extracted.zoning) {
    extracted.zoning = o['Zoning'] as string;
  }

  // Recurse into nested objects
  for (const value of Object.values(o)) {
    if (value && typeof value === 'object') {
      walkNextData(value, extracted, depth + 1);
    }
  }
}
