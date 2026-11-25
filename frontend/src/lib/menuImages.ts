// PUBLIQ Master Food & Beverage Photography Resolver
// Maps every specific dish and drink to its exact, authentic culinary photograph
import exactItemMapping from "./exactItemMapping.json";

// Quick lookup map by ID and cleaned Name
const itemImageMap = new Map<string, string>();
if (Array.isArray(exactItemMapping)) {
  exactItemMapping.forEach((it: any) => {
    if (it.id && it.image) itemImageMap.set(it.id, it.image);
    if (it.name && it.image) {
      const clean = it.name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
      itemImageMap.set(clean, it.image);
    }
  });
}

export function getMenuItemImage(item: any, categoryName?: string, categorySlug?: string): string {
  if (!item) return "/images/publiq/food/butter-chicken-copper-handi.webp";

  // 1. Direct item.image_url if valid remote URL or specific local webp
  if (item.image_url && typeof item.image_url === "string") {
    if (item.image_url.startsWith("http") || (item.image_url.startsWith("/images/publiq/") && !item.image_url.includes("menu/"))) {
      return item.image_url;
    }
  }

  // 2. Exact item mapping by item ID
  if (item.id && itemImageMap.has(item.id)) {
    return itemImageMap.get(item.id)!;
  }

  // 3. Exact item mapping by Cleaned Name
  if (item.name) {
    const clean = item.name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
    if (itemImageMap.has(clean)) {
      return itemImageMap.get(clean)!;
    }
  }

  // 4. Fallback to item.image_url if present
  if (item.image_url && typeof item.image_url === "string") {
    return item.image_url;
  }

  // 5. Ultimate fallback based on category
  const cat = (categoryName || categorySlug || "").toLowerCase();
  if (cat.includes("beer") || cat.includes("draught")) return "https://images.unsplash.com/photo-1471421298428-1513ab720a8e?auto=format&fit=crop&w=600&q=80";
  if (cat.includes("whisky") || cat.includes("scotch")) return "/images/publiq/drinks/blended-scotch-whisky.webp";
  if (cat.includes("wine")) return "/images/publiq/drinks/premium-wine-selection.webp";
  if (cat.includes("cocktail") || cat.includes("shooter")) return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80";
  if (cat.includes("mocktail") || cat.includes("beverage")) return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80";
  if (cat.includes("bread") || cat.includes("roti")) return "https://images.unsplash.com/photo-1697155406014-04dc649b0953?auto=format&fit=crop&w=600&q=80";
  if (cat.includes("tandoor") || cat.includes("starter") || cat.includes("kebab")) return "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80";
  if (cat.includes("fish") || cat.includes("prawn") || cat.includes("coastal") || cat.includes("seafood")) return "/images/publiq/food/anjal-fish-tawa-fry.webp";

  return "/images/publiq/food/butter-chicken-copper-handi.webp";
}
