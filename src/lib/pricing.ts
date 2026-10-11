/** Retail MAD per 1,000: supplier cost converted at fixed 10 MAD/USD, plus 80%. */
export function sellingPrice(rate: number, currency = "USD") {
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Invalid supplier price");
  return rate * (currency === "MAD" ? 1 : 10) * 1.8;
}
