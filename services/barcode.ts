export interface BarcodeProduct {
  name: string;
  dosage?: string;
}

// Queries Open Food Facts by UPC/EAN barcode.
// Returns null if the product is not found or the API is unavailable.
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,quantity`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { status: number; product?: { product_name?: string; quantity?: string } };
    if (json.status !== 1 || !json.product?.product_name) return null;
    return {
      name: json.product.product_name,
      dosage: json.product.quantity ?? undefined,
    };
  } catch {
    return null;
  }
}
