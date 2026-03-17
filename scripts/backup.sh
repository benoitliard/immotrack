#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Script de sauvegarde PostgreSQL pour ImmoTrack
#
# Crée une sauvegarde compressée de la base de données et conserve
# les 30 derniers jours de sauvegardes.
#
# Usage manuel :
#   bash /home/deploy/immotrack/scripts/backup.sh
#
# Via crontab (exécution quotidienne à 3h du matin) :
#   0 3 * * * /home/deploy/immotrack/scripts/backup.sh >> /home/deploy/backups/backup.log 2>&1
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
PROJECT_DIR="/home/deploy/immotrack"
BACKUP_DIR="/home/deploy/backups"
RETENTION_JOURS=30
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
FICHIER_BACKUP="${BACKUP_DIR}/immotrack_${DATE}.sql.gz"

# ── Couleurs pour les messages ──────────────────────────────────────────────────
info()   { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
erreur() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERREUR] $1" >&2; exit 1; }

# ── Vérifications préalables ───────────────────────────────────────────────────
if [ ! -d "${PROJECT_DIR}" ]; then
  erreur "Répertoire du projet introuvable : ${PROJECT_DIR}"
fi

if [ ! -d "${BACKUP_DIR}" ]; then
  info "Création du répertoire de sauvegardes : ${BACKUP_DIR}"
  mkdir -p "${BACKUP_DIR}"
fi

# Chargement des variables d'environnement
ENV_FILE="${PROJECT_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
  erreur "Fichier .env introuvable : ${ENV_FILE}"
fi

# Extraction des variables nécessaires depuis .env
POSTGRES_USER=$(grep '^POSTGRES_USER=' "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
POSTGRES_DB=$(grep '^POSTGRES_DB=' "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'")

if [ -z "${POSTGRES_USER}" ] || [ -z "${POSTGRES_DB}" ]; then
  erreur "Variables POSTGRES_USER ou POSTGRES_DB manquantes dans le fichier .env"
fi

# ── Sauvegarde de la base de données ──────────────────────────────────────────
info "Démarrage de la sauvegarde de la base '${POSTGRES_DB}'..."

docker compose -f "${PROJECT_DIR}/docker/docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${FICHIER_BACKUP}"

# Vérification que le fichier a bien été créé et n'est pas vide
if [ ! -s "${FICHIER_BACKUP}" ]; then
  erreur "La sauvegarde a échoué ou le fichier est vide : ${FICHIER_BACKUP}"
fi

TAILLE=$(du -sh "${FICHIER_BACKUP}" | cut -f1)
info "Sauvegarde créée avec succès : ${FICHIER_BACKUP} (${TAILLE})"

# ── Suppression des sauvegardes anciennes ─────────────────────────────────────
info "Suppression des sauvegardes de plus de ${RETENTION_JOURS} jours..."
FICHIERS_SUPPRIMES=$(find "${BACKUP_DIR}" -name "immotrack_*.sql.gz" -mtime "+${RETENTION_JOURS}" -print)

if [ -n "${FICHIERS_SUPPRIMES}" ]; then
  find "${BACKUP_DIR}" -name "immotrack_*.sql.gz" -mtime "+${RETENTION_JOURS}" -delete
  NOMBRE=$(echo "${FICHIERS_SUPPRIMES}" | wc -l)
  info "${NOMBRE} ancienne(s) sauvegarde(s) supprimée(s)."
else
  info "Aucune ancienne sauvegarde à supprimer."
fi

# ── Récapitulatif ──────────────────────────────────────────────────────────────
NOMBRE_TOTAL=$(find "${BACKUP_DIR}" -name "immotrack_*.sql.gz" | wc -l)
info "Sauvegarde terminée. Total des sauvegardes conservées : ${NOMBRE_TOTAL}"
