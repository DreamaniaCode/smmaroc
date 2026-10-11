/** Use the project's schema when the hosting connection omits it. */
export function databaseUrl(value = process.env.DATABASE_URL) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!url.searchParams.has("schema")) url.searchParams.set("schema", "smmaroc");
    return url.toString();
  } catch {
    return value; // Prisma reports invalid configuration without exposing it to clients.
  }
}
