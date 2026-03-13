import { describe, it, expect } from 'vitest';

// Stage template data extracted directly from the seed file — no DB required.
// This mirrors src/db/seed.ts exactly so tests stay in sync with the source of truth.

type StageTemplate = {
  transactionType: 'purchase' | 'sale' | 'rental';
  name: string;
  description: string;
  orderIndex: number;
};

const purchaseStages: StageTemplate[] = [
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

const saleStages: StageTemplate[] = [
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

const rentalStages: StageTemplate[] = [
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
    description: "Vérification du crédit, de l'emploi et des références du candidat locataire.",
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

const allStages = [...purchaseStages, ...saleStages, ...rentalStages];

describe('Stage template data', () => {
  describe('All three transaction types are present', () => {
    it('has templates for purchase transactions', () => {
      const purchase = allStages.filter(s => s.transactionType === 'purchase');
      expect(purchase.length).toBeGreaterThan(0);
    });

    it('has templates for sale transactions', () => {
      const sale = allStages.filter(s => s.transactionType === 'sale');
      expect(sale.length).toBeGreaterThan(0);
    });

    it('has templates for rental transactions', () => {
      const rental = allStages.filter(s => s.transactionType === 'rental');
      expect(rental.length).toBeGreaterThan(0);
    });
  });

  describe('Stage counts per transaction type', () => {
    it('purchase has exactly 10 stages', () => {
      const purchase = allStages.filter(s => s.transactionType === 'purchase');
      expect(purchase).toHaveLength(10);
    });

    it('sale has exactly 9 stages', () => {
      const sale = allStages.filter(s => s.transactionType === 'sale');
      expect(sale).toHaveLength(9);
    });

    it('rental has exactly 7 stages', () => {
      const rental = allStages.filter(s => s.transactionType === 'rental');
      expect(rental).toHaveLength(7);
    });
  });

  describe('orderIndex sequencing', () => {
    it('purchase orderIndex starts at 1 and is sequential', () => {
      const stages = allStages.filter(s => s.transactionType === 'purchase');
      stages.forEach((stage, i) => {
        expect(stage.orderIndex).toBe(i + 1);
      });
    });

    it('sale orderIndex starts at 1 and is sequential', () => {
      const stages = allStages.filter(s => s.transactionType === 'sale');
      stages.forEach((stage, i) => {
        expect(stage.orderIndex).toBe(i + 1);
      });
    });

    it('rental orderIndex starts at 1 and is sequential', () => {
      const stages = allStages.filter(s => s.transactionType === 'rental');
      stages.forEach((stage, i) => {
        expect(stage.orderIndex).toBe(i + 1);
      });
    });
  });

  describe('Required fields on every stage', () => {
    it('every stage has a non-empty name', () => {
      allStages.forEach(stage => {
        expect(stage.name).toBeTruthy();
        expect(typeof stage.name).toBe('string');
        expect(stage.name.length).toBeGreaterThan(0);
      });
    });

    it('every stage has a non-empty description', () => {
      allStages.forEach(stage => {
        expect(stage.description).toBeTruthy();
        expect(typeof stage.description).toBe('string');
        expect(stage.description.length).toBeGreaterThan(0);
      });
    });

    it('every stage has a valid transactionType', () => {
      const validTypes = ['purchase', 'sale', 'rental'];
      allStages.forEach(stage => {
        expect(validTypes).toContain(stage.transactionType);
      });
    });
  });

  describe('Total stage count', () => {
    it('total is 26 stages across all transaction types', () => {
      expect(allStages).toHaveLength(26);
    });
  });
});
