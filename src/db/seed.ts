import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

// Auth instance for creating users with proper password hashing
const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || 'seed-secret',
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  baseURL: 'http://localhost:4321',
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'client', input: true },
    },
  },
});

// ─── STAGE TEMPLATES ────────────────────────────────────────────────────────

const purchaseStages: Array<{
  transactionType: 'purchase' | 'sale' | 'rental';
  name: string;
  description: string;
  orderIndex: number;
}> = [
  {
    transactionType: 'purchase',
    name: 'Recherche de propriété',
    description: 'Définition des critères, budget et obtention de la pré-approbation hypothécaire.',
    orderIndex: 1,
  },
  {
    transactionType: 'purchase',
    name: 'Contrat de courtage - Achat',
    description: 'Signature du formulaire OACIQ obligatoire (BCA) avec le courtier.',
    orderIndex: 2,
  },
  {
    transactionType: 'purchase',
    name: 'Visites',
    description: 'Visites de propriétés sélectionnées avec notes et comparaisons.',
    orderIndex: 3,
  },
  {
    transactionType: 'purchase',
    name: "Promesse d'achat",
    description: "Rédaction et signature du formulaire OACIQ PA/PAC incluant le prix offert et les conditions.",
    orderIndex: 4,
  },
  {
    transactionType: 'purchase',
    name: 'Négociation',
    description: 'Échange de contre-propositions via le formulaire OACIQ CP.',
    orderIndex: 5,
  },
  {
    transactionType: 'purchase',
    name: 'Réalisation des conditions',
    description: "Levée des conditions : inspection en bâtiment, financement hypothécaire, certificat de localisation.",
    orderIndex: 6,
  },
  {
    transactionType: 'purchase',
    name: 'Préparation notariale',
    description: 'Vérification des titres de propriété et préparation des actes par le notaire.',
    orderIndex: 7,
  },
  {
    transactionType: 'purchase',
    name: 'Signature hypothèque',
    description: "Signature de l'acte hypothécaire chez le notaire et versement de la mise de fonds.",
    orderIndex: 8,
  },
  {
    transactionType: 'purchase',
    name: 'Signature acte de vente',
    description: 'Transfert officiel de la propriété et inscription au Registre foncier du Québec.',
    orderIndex: 9,
  },
  {
    transactionType: 'purchase',
    name: 'Remise des clés',
    description: 'Prise de possession de la propriété et suivi post-transaction.',
    orderIndex: 10,
  },
];

const saleStages: Array<{
  transactionType: 'purchase' | 'sale' | 'rental';
  name: string;
  description: string;
  orderIndex: number;
}> = [
  {
    transactionType: 'sale',
    name: 'Évaluation',
    description: 'Analyse comparative de marché (ACM) pour établir le prix de vente optimal.',
    orderIndex: 1,
  },
  {
    transactionType: 'sale',
    name: 'Contrat de courtage - Vente',
    description: 'Signature du formulaire OACIQ obligatoire (BCG) avec le courtier vendeur.',
    orderIndex: 2,
  },
  {
    transactionType: 'sale',
    name: 'Préparation mise en marché',
    description: 'Rédaction de la déclaration du vendeur, photos professionnelles et obtention du certificat de localisation.',
    orderIndex: 3,
  },
  {
    transactionType: 'sale',
    name: 'Mise en marché',
    description: 'Publication du listing, visites, portes ouvertes et suivi des prospects.',
    orderIndex: 4,
  },
  {
    transactionType: 'sale',
    name: 'Réception des offres',
    description: "Présentation et analyse des promesses d'achat reçues.",
    orderIndex: 5,
  },
  {
    transactionType: 'sale',
    name: 'Négociation',
    description: 'Rédaction de contre-propositions et gestion des conditions.',
    orderIndex: 6,
  },
  {
    transactionType: 'sale',
    name: 'Suivi des conditions',
    description: "Facilitation de l'inspection, du financement de l'acheteur et de la levée des conditions.",
    orderIndex: 7,
  },
  {
    transactionType: 'sale',
    name: 'Clôture',
    description: "Signature chez le notaire, distribution des fonds et règlement de la commission.",
    orderIndex: 8,
  },
  {
    transactionType: 'sale',
    name: 'Suivi post-vente',
    description: "Archivage du dossier, vérification de la commission et demande de référence au client.",
    orderIndex: 9,
  },
];

const rentalStages: Array<{
  transactionType: 'purchase' | 'sale' | 'rental';
  name: string;
  description: string;
  orderIndex: number;
}> = [
  {
    transactionType: 'rental',
    name: 'Recherche',
    description: 'Définition des critères de recherche de locataire ou de logement.',
    orderIndex: 1,
  },
  {
    transactionType: 'rental',
    name: 'Contrat de courtage - Location',
    description: 'Signature du formulaire OACIQ (BCL) pour la représentation en location.',
    orderIndex: 2,
  },
  {
    transactionType: 'rental',
    name: 'Visites',
    description: 'Organisation et réalisation des visites des unités disponibles.',
    orderIndex: 3,
  },
  {
    transactionType: 'rental',
    name: 'Vérification locataire',
    description: 'Vérification du crédit, de l\'emploi et des références du candidat locataire.',
    orderIndex: 4,
  },
  {
    transactionType: 'rental',
    name: 'Signature du bail',
    description: 'Signature du formulaire de bail obligatoire du Tribunal administratif du logement (TAL).',
    orderIndex: 5,
  },
  {
    transactionType: 'rental',
    name: 'État des lieux',
    description: "Inspection d'entrée documentée avec photos et rapport contradictoire.",
    orderIndex: 6,
  },
  {
    transactionType: 'rental',
    name: 'Suivi du bail',
    description: 'Archivage du dossier et suivi du début de la location.',
    orderIndex: 7,
  },
];

// ─── DEMO USERS ─────────────────────────────────────────────────────────────

async function createUser(name: string, email: string, password: string, role: string) {
  // Check if user already exists
  const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (existing) {
    console.log(`  ⏭ ${email} existe déjà`);
    return existing;
  }

  const res = await auth.api.signUpEmail({
    body: { name, email, password, role },
  });

  const [created] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  console.log(`  ✓ ${name} (${role}) — ${email}`);
  return created;
}

// ─── SEED FUNCTION ──────────────────────────────────────────────────────────

async function seed() {
  console.log('Starting seed...\n');

  // ── Stage templates ───────────────────────────────────────────────────────
  console.log('📋 Stage templates...');
  await db.delete(schema.stageTemplates);

  const allStages = [...purchaseStages, ...saleStages, ...rentalStages];
  await db.insert(schema.stageTemplates).values(allStages);

  const inserted = await db.select().from(schema.stageTemplates).orderBy(
    schema.stageTemplates.transactionType,
    schema.stageTemplates.orderIndex
  );
  console.log(`  ✓ ${inserted.length} modèles (${inserted.filter(s => s.transactionType === 'purchase').length} achat, ${inserted.filter(s => s.transactionType === 'sale').length} vente, ${inserted.filter(s => s.transactionType === 'rental').length} location)\n`);

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('👤 Utilisateurs...');
  const pwd = 'demo1234';

  // Courtiers
  const broker1 = await createUser('Marie-Claude Tremblay', 'marie@immotrack.ca', pwd, 'broker');
  const broker2 = await createUser('Jean-François Lavoie', 'jf@immotrack.ca', pwd, 'broker');

  // Clients
  const client1 = await createUser('Sophie Gagnon', 'sophie@email.com', pwd, 'client');
  const client2 = await createUser('Marc-André Dupont', 'marc@email.com', pwd, 'client');
  const client3 = await createUser('Isabelle Roy', 'isabelle@email.com', pwd, 'client');
  const client4 = await createUser('Patrick Côté', 'patrick@email.com', pwd, 'client');
  const client5 = await createUser('Amélie Bergeron', 'amelie@email.com', pwd, 'client');

  // Notaire
  const notaire = await createUser('Me Louise Pelletier', 'louise@notaire.qc.ca', pwd, 'client');

  // Inspecteur
  const inspecteur = await createUser('Robert Gauthier', 'robert@inspection.ca', pwd, 'client');

  // Admin
  const admin = await createUser('Admin ImmoTrack', 'admin@immotrack.ca', pwd, 'admin');

  console.log(`  Mot de passe commun: ${pwd}\n`);

  // ── Broker profiles ───────────────────────────────────────────────────────
  console.log('🏢 Profils courtiers...');
  for (const { userId, license, agency, phone, bio } of [
    {
      userId: broker1.id,
      license: 'J12-345-678',
      agency: 'ImmoPlus Montréal',
      phone: '514-555-0101',
      bio: 'Courtière immobilière depuis 12 ans, spécialisée dans le Plateau Mont-Royal et Rosemont. Membre OACIQ.',
    },
    {
      userId: broker2.id,
      license: 'J98-765-432',
      agency: 'Groupe Immobilier Québec',
      phone: '418-555-0202',
      bio: 'Courtier immobilier résidentiel et commercial à Québec. 8 ans d\'expérience, spécialiste du Vieux-Québec.',
    },
  ]) {
    const [existing] = await db.select().from(schema.brokerProfiles).where(eq(schema.brokerProfiles.userId, userId));
    if (!existing) {
      await db.insert(schema.brokerProfiles).values({
        userId,
        licenseNumber: license,
        agency,
        phone,
        bio,
      });
      console.log(`  ✓ Profil ${agency}`);
    } else {
      console.log(`  ⏭ Profil ${agency} existe déjà`);
    }
  }
  console.log('');

  // ── Properties + Transactions ─────────────────────────────────────────────
  console.log('🏠 Propriétés et transactions...');

  // Helper to create a full transaction with property, stages, participants
  async function createTransaction(opts: {
    broker: typeof broker1;
    title: string;
    type: 'purchase' | 'sale' | 'rental';
    property: {
      address: string;
      city: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      listingPrice: number;
      yearBuilt?: number;
      lotArea?: number;
      livingArea?: number;
      floors?: number;
      parking?: string;
      heating?: string;
      waterHeater?: string;
      municipalTax?: number;
      schoolTax?: number;
      condoFees?: number;
      zoning?: string;
      lot?: string;
      nearbyServices?: string;
      features?: string;
      descriptionLong?: string;
      virtualTourUrl?: string;
    };
    participants: Array<{ user: typeof client1; role: string }>;
    advanceToStage: number; // advance to this stage (1 = first stage is current)
    closingDate?: string;
    notes?: string;
  }) {
    // Check if transaction with same title already exists for this broker
    const [existingTx] = await db.select().from(schema.transactions)
      .where(eq(schema.transactions.title, opts.title));
    if (existingTx) {
      console.log(`  ⏭ "${opts.title}" existe déjà`);
      return existingTx;
    }

    // Create property
    const [property] = await db.insert(schema.properties).values({
      address: opts.property.address,
      city: opts.property.city,
      propertyType: opts.property.propertyType,
      bedrooms: opts.property.bedrooms,
      bathrooms: opts.property.bathrooms,
      listingPrice: opts.property.listingPrice,
      createdBy: opts.broker.id,
      yearBuilt: opts.property.yearBuilt,
      lotArea: opts.property.lotArea,
      livingArea: opts.property.livingArea,
      floors: opts.property.floors,
      parking: opts.property.parking,
      heating: opts.property.heating,
      waterHeater: opts.property.waterHeater,
      municipalTax: opts.property.municipalTax,
      schoolTax: opts.property.schoolTax,
      condoFees: opts.property.condoFees,
      zoning: opts.property.zoning,
      lot: opts.property.lot,
      nearbyServices: opts.property.nearbyServices,
      features: opts.property.features,
      descriptionLong: opts.property.descriptionLong,
      virtualTourUrl: opts.property.virtualTourUrl,
    }).returning();

    // Create transaction
    const [tx] = await db.insert(schema.transactions).values({
      title: opts.title,
      type: opts.type,
      brokerId: opts.broker.id,
      propertyId: property.id,
      currentStageOrder: opts.advanceToStage,
      closingDate: opts.closingDate ? new Date(opts.closingDate) : null,
      notes: opts.notes ?? null,
    }).returning();

    // Create stages from templates
    const templates = await db.select().from(schema.stageTemplates)
      .where(eq(schema.stageTemplates.transactionType, opts.type))
      .orderBy(schema.stageTemplates.orderIndex);

    const stageValues = templates.map((t, i) => ({
      transactionId: tx.id,
      name: t.name,
      description: t.description,
      orderIndex: t.orderIndex,
      status: t.orderIndex < opts.advanceToStage ? 'completed' as const
        : t.orderIndex === opts.advanceToStage ? 'current' as const
        : 'pending' as const,
      completedAt: t.orderIndex < opts.advanceToStage ? new Date() : null,
    }));

    await db.insert(schema.transactionStages).values(stageValues);

    // Add participants
    for (const p of opts.participants) {
      await db.insert(schema.transactionParticipants).values({
        transactionId: tx.id,
        userId: p.user.id,
        role: p.role as any,
      });
    }

    // Log activity
    await db.insert(schema.activityLog).values({
      transactionId: tx.id,
      userId: opts.broker.id,
      action: 'transaction_created',
      metadata: JSON.stringify({ title: opts.title, type: opts.type }),
    });

    const stageLabel = stageValues.find(s => s.status === 'current')?.name ?? '?';
    console.log(`  ✓ "${opts.title}" — étape ${opts.advanceToStage}/${templates.length} (${stageLabel}), ${opts.participants.length} participants`);
    return tx;
  }

  // Transaction 1: Achat condo Plateau (Marie-Claude + Sophie)
  await createTransaction({
    broker: broker1,
    title: 'Achat Condo — 4567 Rue Saint-Denis',
    type: 'purchase',
    property: {
      address: '4567 Rue Saint-Denis, app. 302',
      city: 'Montréal',
      propertyType: 'condo',
      bedrooms: 2,
      bathrooms: 1,
      listingPrice: 485000,
      yearBuilt: 2018,
      livingArea: 850,
      floors: 1,
      parking: 'Stationnement intérieur',
      heating: 'Chauffage central',
      municipalTax: 285000,
      schoolTax: 45000,
      condoFees: 35000,
      zoning: 'Résidentiel',
      features: '["Balcon", "Rangement", "Gym", "Piscine sur le toit", "Ascenseur"]',
      descriptionLong: 'Magnifique condo lumineux au 3e étage d\'un immeuble neuf situé au coeur du Plateau Mont-Royal. Construit en 2018, ce logement moderne offre des finitions haut de gamme : cuisine ouverte avec comptoirs de quartz, planchers de bois d\'ingénierie, salle de bain en céramique pleine hauteur et fenestration généreuse. Le balcon privé orienté sud permet de profiter du soleil toute la journée. L\'immeuble dispose d\'un gym entièrement équipé, d\'une piscine sur le toit avec vue sur la ville et d\'un espace rangement inclus. À deux pas du métro Mont-Royal, des restaurants et boutiques de la rue Saint-Denis, ce condo représente une opportunité exceptionnelle pour un premier acheteur ou investisseur.',
    },
    participants: [
      { user: client1, role: 'buyer' },
      { user: notaire, role: 'notary' },
    ],
    advanceToStage: 6, // Réalisation des conditions
    closingDate: '2026-05-15',
    notes: 'Pré-approbation obtenue chez Desjardins. Inspection prévue le 20 mars.',
  });

  // Transaction 2: Vente maison Rosemont (Marie-Claude + Marc-André vend)
  await createTransaction({
    broker: broker1,
    title: 'Vente Maison — 234 Rue Beaubien Est',
    type: 'sale',
    property: {
      address: '234 Rue Beaubien Est',
      city: 'Montréal',
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      listingPrice: 725000,
      yearBuilt: 1945,
      lotArea: 3200,
      livingArea: 1450,
      floors: 2,
      parking: 'Garage simple',
      heating: 'Chauffage au gaz',
      municipalTax: 485000,
      schoolTax: 72000,
      zoning: 'Résidentiel',
      features: '["Cour arrière", "Sous-sol fini", "Foyer", "Planchers de bois franc"]',
      descriptionLong: 'Charmante maison de ville à Rosemont, entièrement rénovée tout en préservant son cachet d\'époque. Construite en 1945, elle allie le charme de l\'architecture montréalaise traditionnelle aux commodités modernes. Le rez-de-chaussée comprend un salon lumineux avec foyer au gaz, une salle à manger et une cuisine rénovée avec îlot central. À l\'étage, trois chambres spacieuses et deux salles de bain complètes. Le sous-sol fini offre un espace polyvalent idéal pour un bureau ou une salle familiale. La cour arrière aménagée avec terrasse et jardin mature constitue un véritable havre de paix. Garage simple attenant. Situé à distance de marche du marché Jean-Talon, des parcs du quartier et du métro Beaubien.',
    },
    participants: [
      { user: client2, role: 'seller' },
    ],
    advanceToStage: 4, // Mise en marché
    closingDate: '2026-06-01',
    notes: 'Photos professionnelles faites. Déclaration du vendeur signée.',
  });

  // Transaction 3: Achat duplex Villeray (Marie-Claude + Isabelle)
  await createTransaction({
    broker: broker1,
    title: 'Achat Duplex — 1890 Rue de Castelnau',
    type: 'purchase',
    property: {
      address: '1890 Rue de Castelnau Est',
      city: 'Montréal',
      propertyType: 'duplex',
      bedrooms: 5,
      bathrooms: 2,
      listingPrice: 890000,
      yearBuilt: 1952,
      lotArea: 2800,
      livingArea: 2200,
      floors: 2,
      parking: 'Stationnement arrière (2)',
      heating: 'Plinthes électriques',
      municipalTax: 620000,
      schoolTax: 95000,
      zoning: 'Résidentiel',
      features: '["Revenus locatifs", "Cour arrière", "Sous-sol", "Balcons avant/arrière"]',
      descriptionLong: 'Excellent duplex clé en main dans le quartier Villeray, idéal pour propriétaire-occupant ou investisseur. Construit en 1952 et soigneusement entretenu, cet immeuble à revenus offre deux unités distinctes : un grand 4½ au rez-de-chaussée (3 chambres) et un 3½ à l\'étage (2 chambres), chacun avec balcon avant et arrière. Les revenus locatifs actuels couvrent en grande partie les frais de possession. Sous-sol partiellement aménagé avec buanderie et rangement séparé pour chaque unité. Grande cour arrière commune avec stationnements pour deux véhicules. Toiture refaite en 2019, système électrique mis à jour. Emplacement stratégique à proximité du parc Jarry, du marché Jean-Talon et de l\'axe commercial de la rue Jarry.',
    },
    participants: [
      { user: client3, role: 'buyer' },
      { user: inspecteur, role: 'inspector' },
    ],
    advanceToStage: 3, // Visites
    notes: '3 visites planifiées cette semaine.',
  });

  // Transaction 4: Location Québec (JF + Patrick locataire)
  await createTransaction({
    broker: broker2,
    title: 'Location 5½ — 78 Rue Cartier',
    type: 'rental',
    property: {
      address: '78 Rue Cartier, app. 4',
      city: 'Québec',
      propertyType: 'condo',
      bedrooms: 2,
      bathrooms: 1,
      listingPrice: 1800,
      yearBuilt: 2005,
      livingArea: 900,
      floors: 1,
      parking: 'Aucun',
      heating: 'Plinthes électriques',
      condoFees: 0,
      features: '["Buanderie dans l\'unité", "Balcon", "Rangement"]',
      descriptionLong: 'Beau 5½ au 4e étage d\'un immeuble résidentiel bien tenu dans le quartier Montcalm à Québec. Construit en 2005, l\'appartement offre un aménagement fonctionnel avec salon spacieux, cuisine semi-ouverte, deux chambres à coucher et une salle de bain complète. La buanderie dans l\'unité et le balcon privatif sont des atouts appréciables. Rangement inclus au sous-sol. Chauffage aux plinthes électriques (électricité incluse dans le loyer). Situé à quelques minutes de marche des Plaines d\'Abraham, du Grand Théâtre et des commerces de la Grande Allée.',
    },
    participants: [
      { user: client4, role: 'tenant' },
    ],
    advanceToStage: 5, // Signature du bail
    notes: 'Vérification crédit OK. Bail standard TAL.',
  });

  // Transaction 5: Vente condo Vieux-Québec (JF + Amélie vend)
  await createTransaction({
    broker: broker2,
    title: 'Vente Condo — 15 Rue du Petit-Champlain',
    type: 'sale',
    property: {
      address: '15 Rue du Petit-Champlain, app. 201',
      city: 'Québec',
      propertyType: 'condo',
      bedrooms: 1,
      bathrooms: 1,
      listingPrice: 395000,
      yearBuilt: 1890,
      livingArea: 720,
      floors: 1,
      parking: 'Aucun',
      heating: 'Chauffage central',
      municipalTax: 310000,
      schoolTax: 48000,
      condoFees: 28000,
      features: '["Vue sur le fleuve", "Cachet historique", "Plafonds hauts", "Moulures d\'origine"]',
      descriptionLong: 'Rare opportunité d\'acquérir un condo de caractère au coeur du Vieux-Québec, dans un immeuble patrimonial datant de 1890. Ce 2½ lumineux au 2e étage conjugue charme d\'époque et confort contemporain : plafonds hauts de 10 pieds, moulures d\'origine restaurées, parquet de bois massif et fenêtres généreuses offrant une vue partielle sur le fleuve Saint-Laurent. La cuisine a été rénovée avec goût en respectant l\'esprit historique du bâtiment. Salle de bain en céramique avec douche italienne. L\'immeuble est géré par un syndicat rigoureux avec fonds de prévoyance bien capitalisé. Idéal comme résidence principale ou pied-à-terre. À deux pas de la rue du Petit-Champlain, du Château Frontenac et du funiculaire.',
    },
    participants: [
      { user: client5, role: 'seller' },
    ],
    advanceToStage: 7, // Suivi des conditions
    closingDate: '2026-04-10',
    notes: 'Offre acceptée à 385 000$. Inspection passée sans problème.',
  });

  // Transaction 6: Achat maison complété (Marie-Claude + Patrick)
  const tx6 = await createTransaction({
    broker: broker1,
    title: 'Achat Maison — 567 Avenue Maplewood',
    type: 'purchase',
    property: {
      address: '567 Avenue Maplewood',
      city: 'Outremont',
      propertyType: 'house',
      bedrooms: 4,
      bathrooms: 3,
      listingPrice: 1250000,
      yearBuilt: 1935,
      lotArea: 5500,
      livingArea: 2800,
      floors: 3,
      parking: 'Garage double',
      heating: 'Chauffage au gaz',
      municipalTax: 980000,
      schoolTax: 145000,
      zoning: 'Résidentiel',
      features: '["Piscine creusée", "Terrain paysagé", "Cave à vin", "Bureau à domicile", "Foyer double", "Planchers de bois franc"]',
      descriptionLong: 'Somptueuse résidence d\'exception dans l\'un des quartiers les plus prisés de Montréal. Érigée en 1935 et complètement rénovée par un architecte de renom, cette maison de trois étages allie l\'élégance classique d\'Outremont aux standards les plus élevés de la construction contemporaine. Le rez-de-chaussée à aire ouverte accueille un grand salon avec foyer double face, une salle à manger formelle et une cuisine de chef équipée d\'appareils Miele et Wolf. Au premier étage, la suite parentale avec dressing et salle de bain spa (bain îlot, douche vapeur) est accompagnée de trois chambres additionnelles et de deux salles de bain complètes. Le troisième niveau aménagé offre un bureau à domicile lumineux avec terrasse privée. La cave à vin climatisée peut accueillir plus de 500 bouteilles. En extérieur, le terrain paysagé de 5 500 pi² comprend une piscine creusée chauffée, une terrasse en pierre naturelle et un garage double avec charge pour véhicule électrique. À proximité des meilleures écoles, du parc Outremont et du boulevard Bernard.',
    },
    participants: [
      { user: client4, role: 'buyer' },
      { user: notaire, role: 'notary' },
      { user: inspecteur, role: 'inspector' },
    ],
    advanceToStage: 10, // Remise des clés (dernière étape)
    closingDate: '2026-02-28',
    notes: 'Transaction complétée. Clés remises le 28 février.',
  });

  // Mark tx6 as completed
  if (tx6.status !== 'completed') {
    await db.update(schema.transactions)
      .set({ status: 'completed', actualPrice: 1225000, updatedAt: new Date() })
      .where(eq(schema.transactions.id, tx6.id));
  }

  console.log('');

  // ── Notifications ─────────────────────────────────────────────────────────
  console.log('🔔 Notifications...');
  const notifications = [
    { userId: client1.id, type: 'stage_change' as const, title: 'Étape avancée', message: 'Votre transaction "Achat Condo — 4567 Rue Saint-Denis" est passée à l\'étape "Réalisation des conditions".', transactionId: null as string | null },
    { userId: client1.id, type: 'document_uploaded' as const, title: 'Nouveau document', message: 'Un certificat de localisation a été ajouté à votre dossier.', transactionId: null },
    { userId: client2.id, type: 'transaction_update' as const, title: 'Mise à jour', message: 'Votre propriété sur Beaubien Est est maintenant en marché sur Centris.', transactionId: null },
    { userId: client3.id, type: 'new_message' as const, title: 'Nouveau message', message: 'Marie-Claude Tremblay vous a envoyé un message concernant votre dossier.', transactionId: null },
    { userId: client4.id, type: 'stage_change' as const, title: 'Signature du bail', message: 'Votre bail pour le 78 Rue Cartier est prêt à être signé.', transactionId: null },
    { userId: client5.id, type: 'stage_change' as const, title: 'Suivi des conditions', message: 'L\'acheteur a obtenu son financement. La transaction progresse.', transactionId: null },
  ];

  for (const n of notifications) {
    await db.insert(schema.notifications).values(n);
  }
  console.log(`  ✓ ${notifications.length} notifications créées\n`);

  // ── Messages (sample chat) ────────────────────────────────────────────────
  console.log('💬 Messages de démonstration...');

  // Get the first transaction for messages
  const [firstTx] = await db.select().from(schema.transactions)
    .where(eq(schema.transactions.title, 'Achat Condo — 4567 Rue Saint-Denis'));

  if (firstTx) {
    const msgs = [
      { transactionId: firstTx.id, senderId: broker1.id, type: 'system' as const, content: 'Transaction créée — Achat Condo 4567 Rue Saint-Denis' },
      { transactionId: firstTx.id, senderId: broker1.id, type: 'text' as const, content: 'Bonjour Sophie! Votre dossier d\'achat est maintenant ouvert. Je vous tiendrai informée à chaque étape.' },
      { transactionId: firstTx.id, senderId: client1.id, type: 'text' as const, content: 'Merci Marie-Claude! J\'ai hâte de voir comment ça avance. Est-ce que la pré-approbation est suffisante?' },
      { transactionId: firstTx.id, senderId: broker1.id, type: 'text' as const, content: 'Oui, Desjardins confirme 500 000$ — on est dans les clous pour ce condo. L\'inspection est prévue le 20 mars avec Robert Gauthier.' },
      { transactionId: firstTx.id, senderId: client1.id, type: 'text' as const, content: 'Parfait! Est-ce que je dois être présente pour l\'inspection?' },
      { transactionId: firstTx.id, senderId: broker1.id, type: 'text' as const, content: 'C\'est recommandé mais pas obligatoire. Robert est très minutieux, il vous enverra un rapport complet avec photos.' },
      { transactionId: firstTx.id, senderId: broker1.id, type: 'system' as const, content: 'Étape avancée : Réalisation des conditions' },
    ];

    for (const m of msgs) {
      await db.insert(schema.messages).values(m);
    }
    console.log(`  ✓ ${msgs.length} messages dans "Achat Condo — 4567 Rue Saint-Denis"\n`);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Seed terminé avec succès!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('  Comptes de démonstration (mot de passe: demo1234):');
  console.log('');
  console.log('  Courtiers:');
  console.log('    marie@immotrack.ca    — Marie-Claude Tremblay (3 transactions)');
  console.log('    jf@immotrack.ca       — Jean-François Lavoie (2 transactions)');
  console.log('');
  console.log('  Clients:');
  console.log('    sophie@email.com      — Sophie Gagnon (acheteuse)');
  console.log('    marc@email.com        — Marc-André Dupont (vendeur)');
  console.log('    isabelle@email.com    — Isabelle Roy (acheteuse)');
  console.log('    patrick@email.com     — Patrick Côté (locataire + acheteur)');
  console.log('    amelie@email.com      — Amélie Bergeron (vendeuse)');
  console.log('');
  console.log('  Professionnels:');
  console.log('    louise@notaire.qc.ca  — Me Louise Pelletier (notaire)');
  console.log('    robert@inspection.ca  — Robert Gauthier (inspecteur)');
  console.log('');
  console.log('  Admin:');
  console.log('    admin@immotrack.ca    — Admin ImmoTrack');
  console.log('');
}

seed()
  .then(async () => {
    console.log('Seed completed!');
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await client.end();
    process.exit(1);
  });
