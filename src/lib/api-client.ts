export async function readApi(url: string) {
 const response = await fetch(url, {cache: "no-store"});
 let data;
 try { data = await response.json(); } catch { throw new Error("Le serveur ne répond pas correctement. Veuillez réessayer."); }
 if (!response.ok) throw new Error(data.error || "Impossible de charger les données.");
 return data;
}
