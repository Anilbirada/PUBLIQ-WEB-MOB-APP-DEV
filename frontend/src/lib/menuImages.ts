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

// Disallow placeholder and mismatched scraped images
const isSuspiciousUrl = (url: string, itemName: string = ""): boolean => {
  const u = (url || "").toLowerCase();
  const n = (itemName || "").toLowerCase();
  if (u.includes("french_fries") && !n.includes("fry") && !n.includes("fries")) return true;
  if (u.includes("soup_bowl_met")) return true;
  if (u.includes("drawing")) return true;
  if (u.includes("placeholder")) return true;
  if (u.includes("gulab_jamun") && n.includes("brownie")) return true;
  if (u.includes("fish") && (n.includes("chicken") || n.includes("paneer") || n.includes("mushroom") || n.includes("dosa") || n.includes("mutton"))) return true;
  // Concentric circle placeholder webp assets
  if (u.includes("hyderabadi-lamb-biryani.webp") || u.includes("vegetable-tawa-biryani.webp") || u.includes("dum-biryani-hyderabadi.webp")) return true;
  if (u.includes("dal-saag-paneer-duo.webp") || u.includes("chettinad-pepper-curry.webp") || u.includes("crispy-salt-pepper-fish.webp") || u.includes("tandoori-garlic-naan.webp") || u.includes("aloo-beetroot-chaat.webp")) return true;
  return false;
};

export function getMenuItemImage(item: any, categoryName?: string, categorySlug?: string): string {
  if (!item) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";

  // 1. Exact item mapping by item ID (highest priority)
  if (item.id && itemImageMap.has(item.id)) {
    const mapped = itemImageMap.get(item.id)!;
    if (!isSuspiciousUrl(mapped, item.name)) return mapped;
  }

  // 2. Exact item mapping by Cleaned Name
  if (item.name) {
    const clean = item.name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
    if (itemImageMap.has(clean)) {
      const mapped = itemImageMap.get(clean)!;
      if (!isSuspiciousUrl(mapped, item.name)) return mapped;
    }
  }

  // 3. Direct item.image_url if NOT suspicious
  if (item.image_url && typeof item.image_url === "string") {
    if (!isSuspiciousUrl(item.image_url, item.name)) {
      if (item.image_url.startsWith("http") || (item.image_url.startsWith("/images/publiq/") && !item.image_url.includes("menu/"))) {
        return item.image_url;
      }
    }
  }

  // 4. Keyword-level culinary intelligence matching
  const nameLower = (item.name || "").toLowerCase();
  if (nameLower.includes("hyderabadi") || (nameLower.includes("biryani") && nameLower.includes("dum"))) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("biryani") || nameLower.includes("biriyani")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("clear soup")) {
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("mushroom soup") || nameLower.includes("cream of mushroom")) {
    return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("salad")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("papad")) {
    return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("peanut")) {
    return "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("brownie")) {
    return "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("lollipop") || nameLower.includes("lolypop")) {
    return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("palak chaat") || nameLower.includes("chaat")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("neer dosa")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("garlic naan")) {
    return "https://images.unsplash.com/photo-1697155406014-04dc649b0953?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("kulcha")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("roti")) {
    return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("paratha")) {
    return "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("dal makhani")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("dal tadka") || nameLower.includes("dal")) {
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("paneer")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("ghee roast")) {
    return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("chettinad")) {
    return "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("szechuan") || nameLower.includes("salt & pepper") || nameLower.includes("salt and pepper")) {
    return "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("chicken fry") || nameLower.includes("sukka")) {
    return "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80";
  }

  // 5. Ultimate fallback based on category
  const cat = (categoryName || categorySlug || "").toLowerCase();
  if (cat.includes("biryani") || cat.includes("biriyani")) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
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
