export async function fetchCatalog() {
  const response = await fetch("/api/services", { cache: "no-store" });
  let data;
  try { data = await response.json(); } catch {
    throw new Error("Le catalogue est temporairement indisponible. Veuillez réessayer dans quelques instants.");
  }
  if (!response.ok) throw new Error(data.error || "Catalogue indisponible.");
  if (!Array.isArray(data.services)) throw new Error("Le catalogue reçu est incomplet. Veuillez réessayer.");
  return data.services;
}
