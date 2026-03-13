export const typeLabels: Record<string, string> = {
  purchase: 'Achat',
  sale: 'Vente',
  rental: 'Location',
};

export const typeBadgeVariant: Record<string, 'info' | 'success' | 'warning'> = {
  purchase: 'info',
  sale: 'success',
  rental: 'warning',
};

export const statusLabels: Record<string, string> = {
  active: 'Active',
  completed: 'Complétée',
  cancelled: 'Annulée',
  on_hold: 'En pause',
};

export const statusBadgeVariant: Record<string, 'success' | 'neutral' | 'danger' | 'warning'> = {
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
  on_hold: 'warning',
};

export const roleLabels: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  notary: 'Notaire',
  inspector: 'Inspecteur',
  broker: 'Courtier',
  tenant: 'Locataire',
  landlord: 'Propriétaire',
};

export const stageStatusIcon: Record<string, string> = {
  completed: 'check',
  current: 'active',
  pending: 'pending',
  skipped: 'skip',
};

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}
