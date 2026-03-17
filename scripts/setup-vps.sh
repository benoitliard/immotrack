#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Script de configuration initiale du VPS OVH pour ImmoTrack
#
# À exécuter une seule fois en tant que root sur le VPS :
#   curl -fsSL https://raw.githubusercontent.com/benoitliard/immotrack/main/scripts/setup-vps.sh | bash
#
# Prérequis : Ubuntu 22.04 ou supérieur
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Variables de configuration ─────────────────────────────────────────────────
DEPLOY_USER="deploy"
PROJECT_DIR="/home/${DEPLOY_USER}/immotrack"
REPO_URL="https://github.com/benoitliard/immotrack.git"
BACKUP_DIR="/home/${DEPLOY_USER}/backups"

# ── Couleurs pour les messages ──────────────────────────────────────────────────
VERT='\033[0;32m'
JAUNE='\033[1;33m'
ROUGE='\033[0;31m'
RESET='\033[0m'

info()    { echo -e "${VERT}[INFO]${RESET} $1"; }
warning() { echo -e "${JAUNE}[ATTENTION]${RESET} $1"; }
erreur()  { echo -e "${ROUGE}[ERREUR]${RESET} $1"; exit 1; }

# ── Vérification des droits root ───────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  erreur "Ce script doit être exécuté en tant que root."
fi

# ── 1. Mise à jour du système ──────────────────────────────────────────────────
info "Mise à jour des paquets système..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw

# ── 2. Installation de Docker ──────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  info "Docker est déjà installé ($(docker --version))"
else
  info "Installation de Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  info "Docker installé avec succès."
fi

# ── 3. Création de l'utilisateur deploy ───────────────────────────────────────
if id "${DEPLOY_USER}" &>/dev/null; then
  info "L'utilisateur '${DEPLOY_USER}' existe déjà."
else
  info "Création de l'utilisateur '${DEPLOY_USER}'..."
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  info "Utilisateur '${DEPLOY_USER}' créé."
fi

# Ajout au groupe docker pour pouvoir exécuter Docker sans sudo
usermod -aG docker "${DEPLOY_USER}"
info "Utilisateur '${DEPLOY_USER}' ajouté au groupe docker."

# ── 4. Configuration du pare-feu (UFW) ────────────────────────────────────────
info "Configuration du pare-feu UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
info "Pare-feu configuré : ports 22, 80, 443 ouverts."

# ── 5. Création du répertoire de backups ──────────────────────────────────────
info "Création du répertoire de sauvegardes..."
mkdir -p "${BACKUP_DIR}"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${BACKUP_DIR}"

# ── 6. Clonage du dépôt ───────────────────────────────────────────────────────
if [ -d "${PROJECT_DIR}/.git" ]; then
  info "Le dépôt existe déjà dans ${PROJECT_DIR}."
else
  info "Clonage du dépôt dans ${PROJECT_DIR}..."
  sudo -u "${DEPLOY_USER}" git clone "${REPO_URL}" "${PROJECT_DIR}"
  info "Dépôt cloné avec succès."
fi

# ── 7. Génération du fichier .env ─────────────────────────────────────────────
ENV_FILE="${PROJECT_DIR}/.env"

if [ -f "${ENV_FILE}" ]; then
  warning "Le fichier .env existe déjà. Il ne sera pas écrasé."
else
  info "Génération du fichier .env avec des secrets aléatoires..."

  # Génération de secrets cryptographiquement sûrs
  BETTER_AUTH_SECRET=$(openssl rand -base64 32)
  POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

  cat > "${ENV_FILE}" << EOF
# ──────────────────────────────────────────────────────────────────────────────
# Configuration ImmoTrack — Production
# Généré le $(date '+%Y-%m-%d %H:%M:%S')
#
# IMPORTANT : Éditez ce fichier avant de démarrer l'application.
# Remplacez les valeurs marquées "A_CONFIGURER" par vos vraies valeurs.
# ──────────────────────────────────────────────────────────────────────────────

# ── Domaine ───────────────────────────────────────────────────────────────────
# Votre nom de domaine pointant vers ce VPS (ex: immotrack.example.com)
DOMAIN=A_CONFIGURER

# ── Base de données PostgreSQL ────────────────────────────────────────────────
POSTGRES_USER=immotrack
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=immotrack
DATABASE_URL=postgresql://immotrack:${POSTGRES_PASSWORD}@postgres:5432/immotrack

# ── Authentification (better-auth) ────────────────────────────────────────────
# Secret généré automatiquement — ne pas modifier en production
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
# URL publique de l'application (ex: https://immotrack.example.com)
BETTER_AUTH_URL=https://A_CONFIGURER

# ── Application Astro ─────────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=4321
EOF

  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  info "Fichier .env généré dans ${ENV_FILE}"
fi

# ── 8. Récapitulatif et prochaines étapes ─────────────────────────────────────
echo ""
echo -e "${VERT}══════════════════════════════════════════════════════════════${RESET}"
echo -e "${VERT}  Configuration initiale terminée avec succès !${RESET}"
echo -e "${VERT}══════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "${JAUNE}Prochaines étapes :${RESET}"
echo ""
echo "  1. Configurez votre domaine DNS pour pointer vers ce VPS"
echo ""
echo "  2. Éditez le fichier .env :"
echo "       sudo -u ${DEPLOY_USER} nano ${ENV_FILE}"
echo "     → Remplacez les valeurs 'A_CONFIGURER' par votre domaine réel"
echo "     → Vérifiez que DATABASE_URL correspond à vos valeurs POSTGRES_*"
echo ""
echo "  3. Démarrez l'application :"
echo "       sudo -u ${DEPLOY_USER} bash -c 'cd ${PROJECT_DIR} && docker compose -f docker/docker-compose.yml up -d'"
echo ""
echo "  4. Appliquez les migrations de base de données :"
echo "       sudo -u ${DEPLOY_USER} bash -c 'cd ${PROJECT_DIR} && docker compose -f docker/docker-compose.yml exec app npx drizzle-kit push'"
echo ""
echo "  5. Configurez les secrets GitHub Actions dans votre dépôt :"
echo "     → VPS_HOST         : $(hostname -I | awk '{print $1}')"
echo "     → VPS_USER         : ${DEPLOY_USER}"
echo "     → VPS_SSH_KEY      : (clé SSH privée autorisée pour ${DEPLOY_USER})"
echo "     → VPS_PROJECT_PATH : ${PROJECT_DIR}"
echo ""
echo "  6. (Optionnel) Ajoutez le script de backup au cron :"
echo "       crontab -u ${DEPLOY_USER} -e"
echo "     Ajoutez : 0 3 * * * ${PROJECT_DIR}/scripts/backup.sh"
echo ""
