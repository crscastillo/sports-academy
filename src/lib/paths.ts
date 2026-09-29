export const paths = {
  dashboard: (slug: string) => `/${slug}/dashboard`,
  players: {
    list: (slug: string) => `/${slug}/players`,
    new: (slug: string) => `/${slug}/players/new`,
    detail: (slug: string, id: string) => `/${slug}/players/${id}`,
  },
  teams: {
    list: (slug: string) => `/${slug}/teams`,
    detail: (slug: string, id: string) => `/${slug}/teams/${id}`,
  },
  coaches: {
    list: (slug: string) => `/${slug}/coaches`,
  },
  trainings: {
    list: (slug: string) => `/${slug}/trainings`,
    new: (slug: string) => `/${slug}/trainings/new`,
    detail: (slug: string, id: string) => `/${slug}/trainings/${id}`,
  },
  matchdays: {
    list: (slug: string) => `/${slug}/matchdays`,
    new: (slug: string) => `/${slug}/matchdays/new`,
    detail: (slug: string, id: string) => `/${slug}/matchdays/${id}`,
  },
  donations: {
    list: (slug: string) => `/${slug}/donations`,
    detail: (slug: string, id: string) => `/${slug}/donations/${id}`,
  },
  payments: {
    list: (slug: string, period?: string) => (period ? `/${slug}/payments?period=${period}` : `/${slug}/payments`),
  },
  staff: {
    list: (slug: string) => `/${slug}/staff`,
  },
  settings: {
    list: (slug: string) => `/${slug}/settings`,
  },
};
