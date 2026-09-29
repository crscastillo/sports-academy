/** Throws with the Postgres/PostgREST error message if the query failed; otherwise returns it unchanged. */
export function must<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}
