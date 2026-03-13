# ImmoTrack

**Plateforme de gestion de transactions immobilières pour les courtiers du Québec**

ImmoTrack est une application web moderne conçue pour simplifier et optimiser la gestion des transactions immobilières au Québec. Conforme aux normes de l'OACIQ, elle offre aux courtiers une vue d'ensemble complète de leurs transactions tout en fournissant aux clients une transparence totale sur l'avancement de leur dossier.

## 📸 Captures d'écran

*À venir*

## 🛠️ Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Frontend & SSR** | Astro | 6.0.4 |
| **Base de données** | PostgreSQL | 16 |
| **ORM** | Drizzle ORM | 0.45.1 |
| **Authentification** | Better Auth | 1.5.5 |
| **Styles** | Tailwind CSS | 4.2.1 |
| **Langage** | TypeScript | - |
| **Runtime** | Node.js | 22+ |
| **Virtualisation** | Docker | - |

## ✅ Prérequis

- **Node.js** 22.12.0 ou supérieur
- **Docker** et **Docker Compose** (pour PostgreSQL)
- **npm** ou **yarn**

## 🚀 Installation et Démarrage Rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/benoitliard/immo.git
cd immo
```

### 2. Installer les dépendances

```bash
npm install --legacy-peer-deps
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
DATABASE_URL=postgresql://immotrack:immotrack@localhost:5434/immotrack
BETTER_AUTH_SECRET=dev-secret-key-not-for-production-use-32chars
BETTER_AUTH_URL=http://localhost:4321
PUBLIC_BETTER_AUTH_URL=http://localhost:4321
POSTGRES_USER=immotrack
POSTGRES_PASSWORD=immotrack
POSTGRES_DB=immotrack
```

> **Note :** Ces valeurs sont configurées pour le développement local. Pour la production, utilisez des valeurs sécurisées appropriées.

### 4. Démarrer PostgreSQL avec Docker

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Vérifiez que le conteneur PostgreSQL est en cours d'exécution :

```bash
docker ps
```

### 5. Exécuter les migrations de base de données

```bash
npx drizzle-kit push
```

### 6. Importer les données de démonstration

```bash
npm run db:seed
```

Cette commande crée des comptes de démonstration, des profils de courtiers, et 6 transactions d'exemple.

### 7. Lancer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:4321**

## 👥 Comptes de Démonstration

Le script de seed crée automatiquement les comptes suivants. Tous utilisent le mot de passe : **`demo1234`**

### Courtiers
| Email | Nom | Agence | Transactions |
|-------|-----|--------|--------------|
| `marie@immotrack.ca` | Marie-Claude Tremblay | ImmoPlus Montréal | 3 |
| `jf@immotrack.ca` | Jean-François Lavoie | Groupe Immobilier Québec | 2 |

### Clients
| Email | Nom | Rôle |
|-------|-----|------|
| `sophie@email.com` | Sophie Gagnon | Acheteuse |
| `marc@email.com` | Marc-André Dupont | Vendeur |
| `isabelle@email.com` | Isabelle Roy | Acheteuse |
| `patrick@email.com` | Patrick Côté | Locataire / Acheteur |
| `amelie@email.com` | Amélie Bergeron | Vendeuse |

### Professionnels
| Email | Nom | Profession |
|-------|-----|-----------|
| `louise@notaire.qc.ca` | Me Louise Pelletier | Notaire |
| `robert@inspection.ca` | Robert Gauthier | Inspecteur |

### Administration
| Email | Nom |
|-------|-----|
| `admin@immotrack.ca` | Admin ImmoTrack |

## 📁 Structure du Projet

```
immo/
├── src/
│   ├── pages/
│   │   ├── broker/           # Pages réservées aux courtiers
│   │   ├── portal/           # Portail client (lecture seule)
│   │   ├── admin/            # Pages administrateur
│   │   ├── api/              # Routes API
│   │   ├── login.astro       # Authentification
│   │   └── index.astro       # Accueil
│   ├── components/
│   │   ├── ui/               # Composants réutilisables (Button, Card, Input, etc.)
│   │   └── auth/             # Formulaires d'authentification
│   ├── layouts/
│   │   ├── BrokerLayout.astro    # Layout pour courtiers
│   │   ├── PortalLayout.astro    # Layout pour clients
│   │   └── BaseLayout.astro      # Layout de base
│   ├── db/
│   │   ├── schema/           # Définitions Drizzle ORM
│   │   ├── relations.ts      # Relations entre tables
│   │   ├── seed.ts           # Script d'import données de test
│   │   └── index.ts          # Instance Drizzle
│   ├── lib/
│   │   ├── auth.ts           # Configuration Better Auth (serveur)
│   │   ├── auth-client.ts    # Client auth (côté client)
│   │   ├── db.ts             # Connexion base de données
│   │   ├── stages.ts         # Logique des étapes de transaction
│   │   ├── activity.ts       # Logging d'activité
│   │   └── labels.ts         # Labels et énumérations
│   └── middleware.ts         # Middleware d'authentification et contrôle d'accès
├── docker/
│   └── docker-compose.dev.yml   # Configuration PostgreSQL local
├── astro.config.mjs          # Configuration Astro (SSR, port)
├── package.json              # Dépendances et scripts
└── README.md                 # Ce fichier
```

## ✨ Fonctionnalités Principales

### 🎯 Gestion des Transactions
ImmoTrack prend en charge trois types de transactions courantes au Québec avec workflows OACIQ :

#### Achat (10 étapes)
1. Recherche de propriété
2. Contrat de courtage — Achat (formulaire OACIQ BCA)
3. Visites
4. Promesse d'achat (formulaire OACIQ PA/PAC)
5. Négociation (formulaire OACIQ CP)
6. Réalisation des conditions
7. Préparation notariale
8. Signature hypothèque
9. Signature acte de vente
10. Remise des clés

#### Vente (9 étapes)
1. Évaluation (analyse comparative de marché)
2. Contrat de courtage — Vente (formulaire OACIQ BCG)
3. Préparation mise en marché
4. Mise en marché
5. Réception des offres
6. Négociation
7. Suivi des conditions
8. Clôture
9. Suivi post-vente

#### Location (7 étapes)
1. Recherche
2. Contrat de courtage — Location (formulaire OACIQ BCL)
3. Visites
4. Vérification locataire
5. Signature du bail (formulaire TAL)
6. État des lieux
7. Suivi du bail

### 📊 Tableau de Bord Courtier
- Vue synthétique des transactions en cours et complétées
- Statistiques en temps réel (nombre de transactions par type, étapes complétées)
- Listes triables et filtrables
- Accès rapide aux détails de chaque dossier

### 👤 Portail Client
- Suivi en lecture seule de ses propres transactions
- Visualisation de l'étape actuelle et de la progression
- Consultation des propriétés associées
- Historique des activités
- Notifications de mise à jour

### 🏠 Gestion des Propriétés
- Fiche propriété détaillée avec photos
- Galerie d'images
- Spécifications complètes (chambres, salles de bain, taxes, frais de condo, etc.)
- Support des tours virtuels
- Import depuis Centris (via numéro d'annonce MLS)

### 🔐 Contrôle d'Accès Basé sur les Rôles
- **Courtier** : Accès complet à ses transactions, gestion des propriétés et clients
- **Client** : Accès au portail de suivi de ses propres transactions (lecture seule)
- **Admin** : Accès administrateur pour gestion globale et reporting
- **Professionnel** (notaire, inspecteur) : Accès limité aux transactions où ils sont participant

### 📝 Fonctionnalités de Collaboration
- Messagerie transactionnelle pour communication broker–client
- Partage de documents
- Journal d'activité complet
- Notifications de mise à jour (changement d'étape, nouveau message, document téléchargé)

### 📊 Conformité OACIQ
Tous les workflows suivent les normes de l'Ordre des courtiers immobiliers du Québec :
- Utilisation des formulaires standardisés (BCA, BCG, BCL, PA/PAC, CP)
- Respect des étapes mandatoires
- Traçabilité complète des actions
- Archivage des documents

## 🗄️ Schéma de Base de Données

ImmoTrack utilise 12+ tables PostgreSQL pour gérer les données :

| Table | Fonction |
|-------|----------|
| `user` | Comptes utilisateurs (courtiers, clients, admin) |
| `broker_profiles` | Profils détaillés des courtiers (licence OACIQ, agence) |
| `properties` | Propriétés (adresse, type, caractéristiques) |
| `property_photos` | Photos et galeries pour chaque propriété |
| `transactions` | Dossiers de transactions (achat, vente, location) |
| `transaction_participants` | Participants (buyers, sellers, notaires, inspecteurs) |
| `transaction_stages` | Étapes individuelles d'une transaction |
| `stage_templates` | Modèles d'étapes réutilisables par type de transaction |
| `messages` | Messagerie transactionnelle |
| `documents` | Documents téléchargés (formulaires, certificats, etc.) |
| `activity_log` | Audit trail complet des actions |
| `notifications` | Notifications utilisateur |

## 📋 Scripts Disponibles

```bash
# Développement
npm run dev              # Démarrer le serveur de développement
npm run build            # Build pour production
npm run preview          # Prévisualiser le build

# Base de données
npm run db:push          # Appliquer les migrations
npm run db:generate      # Générer les migrations (après modifications du schéma)
npm run db:migrate       # Migrer la base (compatible Mode de production)
npm run db:seed          # Importer les données de démonstration
npm run db:studio        # Ouvrir Drizzle Studio (explorateur DB graphique)

# Tests
npm run test             # Exécuter les tests une fois
npm run test:watch       # Mode watch des tests
npm run test:coverage    # Rapport de couverture
```

## 🔗 Routes Principales

| Route | Rôle Requis | Description |
|-------|-----------|-------------|
| `/` | Public | Page d'accueil |
| `/login` | Public | Connexion |
| `/signup` | Public | Inscription |
| `/broker/dashboard` | Courtier, Admin | Tableau de bord courtier |
| `/broker/transactions` | Courtier, Admin | Liste des transactions |
| `/broker/transactions/new` | Courtier, Admin | Créer une nouvelle transaction |
| `/broker/transactions/[id]` | Courtier, Admin | Détails d'une transaction |
| `/broker/profile` | Courtier, Admin | Profil courtier |
| `/portal` | Client | Portail client |
| `/portal/transactions/[id]` | Client | Détails transaction (lecture seule) |
| `/admin` | Admin | Page administration |

## 🔐 Authentification et Sécurité

- Authentification par email/mot de passe via **Better Auth**
- Sessions sécurisées avec cookies httpOnly
- Contrôle d'accès appliqué via middleware (`src/middleware.ts`)
- Hachage sécurisé des mots de passe
- Séparation des données par utilisateur et rôle

## 🌐 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://user:pass@host:port/db` |
| `BETTER_AUTH_SECRET` | Clé secrète pour sessions (min. 32 caractères) | *Voir `.env`* |
| `BETTER_AUTH_URL` | URL de la page de connexion (backend) | `http://localhost:4321` |
| `PUBLIC_BETTER_AUTH_URL` | URL publique (frontend) | `http://localhost:4321` |
| `POSTGRES_USER` | Utilisateur PostgreSQL | `immotrack` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `immotrack` |
| `POSTGRES_DB` | Nom de la base de données | `immotrack` |

## 🚢 Déploiement

### Build pour Production

```bash
npm run build
npm run start
```

L'application sera servie sur `http://localhost:4321` (ou le port configuré).

### Avec Docker

Un `Dockerfile` peut être généré pour containeriser l'application. Voir la section déploiement dans la documentation Astro officielle.

## 📚 Documentation Supplémentaire

- [Astro Documentation](https://docs.astro.build/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [OACIQ - Formulaires Standardisés](https://www.oaciq.com/)

## 🤝 Contribution

Les contributions sont bienvenues ! Veuillez :

1. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
2. Commiter vos changements (`git commit -m "Ajouter ma fonctionnalité"`)
3. Pousser vers la branche (`git push origin feature/ma-fonctionnalite`)
4. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

---

**Version :** 0.0.1
**Dernière mise à jour :** Mars 2026

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt.
