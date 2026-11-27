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
  if (u.includes("wikimedia.org") || u.includes("upload.wikimedia")) return true;
  if (u.includes("soup_bowl_met")) return true;
  if (u.includes("drawing")) return true;
  if (u.includes("placeholder")) return true;
  if (u.includes("photo-1603105037880")) return true; // antique porcelain plate
  
  // Chicken photo mismatched to beverage or dessert
  if (u.includes("photo-1567620832903") && (n.includes("tea") || n.includes("lagoon") || n.includes("blast") || n.includes("rice") || n.includes("noodles") || n.includes("beer") || n.includes("whisky"))) return true;
  if (u.includes("photo-1603894584373") && (n.includes("tea") || n.includes("mocktail") || n.includes("cocktail") || n.includes("rice") || n.includes("noodles") || n.includes("beer") || n.includes("gin") || n.includes("vodka"))) return true;

  return false;
};

export function getMenuItemImage(item: any, categoryName?: string, categorySlug?: string): string {
  if (!item) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";

  const nameLower = (item.name || "").toLowerCase();
  const cat = (categoryName || categorySlug || "").toLowerCase();

  // 1. Precise Category & Culinary Matching (Highest priority to avoid mismatched overrides)

  // MOCKTAILS & ICED TEAS
  if (cat.includes("mocktail") || nameLower.includes("iced tea") || nameLower.includes("mocktail") || nameLower.includes("cooler") || nameLower.includes("mojito")) {
    if (nameLower.includes("blue lagoon") || nameLower.includes("blue jack")) return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("berry") || nameLower.includes("blast")) return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("iced tea")) return "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("mojito") || nameLower.includes("mint")) return "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("sunrise") || nameLower.includes("orange")) return "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("green apple")) return "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80";
    return "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80";
  }

  // BEER & DRAUGHT
  if (cat.includes("beer") || cat.includes("draught") || nameLower.includes("beer") || nameLower.includes("lager") || nameLower.includes("draught")) {
    if (nameLower.includes("budweiser")) return "https://images.unsplash.com/photo-1608270195655-442807e1e626?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("kingfisher ultra")) return "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("kingfisher")) return "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("carlsberg") || nameLower.includes("tuborg")) return "https://images.unsplash.com/photo-1567696911980-2c17b6b041eb?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("corona")) return "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("heineken")) return "https://images.unsplash.com/photo-1618183479302-1e08ecbc2cb7?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("draught") || nameLower.includes("craft")) return "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=800&q=80";
    return "https://images.unsplash.com/photo-1471421298428-1513ab720a8e?auto=format&fit=crop&w=800&q=80";
  }

  // SHOOTERS & COCKTAILS
  if (cat.includes("cocktail") || cat.includes("shooter") || nameLower.includes("kamikaze") || nameLower.includes("jagger") || nameLower.includes("shooter")) {
    if (nameLower.includes("kamikaze")) return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("pink gin")) return "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=800&q=80";
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80";
  }

  // SPIRITS
  if (cat.includes("whisky") || cat.includes("scotch")) return "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80";
  if (cat.includes("rum")) return "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=800&q=80";
  if (cat.includes("vodka")) return "https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&w=800&q=80";
  if (cat.includes("brandy") || cat.includes("wine")) return "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80";

  // ORIENTAL RICE & NOODLES
  if (cat.includes("oriental") || nameLower.includes("fried rice") || nameLower.includes("noodles") || nameLower.includes("hakka") || nameLower.includes("schezwan")) {
    if (nameLower.includes("fried rice")) {
      if (nameLower.includes("chicken") || nameLower.includes("meat")) return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80";
      return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80";
    }
    if (nameLower.includes("noodles")) {
      if (nameLower.includes("chicken") || nameLower.includes("meat")) return "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80";
      return "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80";
    }
    if (nameLower.includes("kung pao") || nameLower.includes("manchurian") || nameLower.includes("stir")) {
      return "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80";
    }
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80";
  }

  // 2. Direct item.image_url if NOT suspicious
  if (item.image_url && typeof item.image_url === "string") {
    if (!isSuspiciousUrl(item.image_url, item.name)) {
      if (item.image_url.startsWith("http") || (item.image_url.startsWith("/images/publiq/") && !item.image_url.includes("menu/"))) {
        return item.image_url;
      }
    }
  }

  // 3. Exact mapping lookup
  if (item.id && itemImageMap.has(item.id)) {
    const mapped = itemImageMap.get(item.id)!;
    if (!isSuspiciousUrl(mapped, item.name)) return mapped;
  }
  if (item.name) {
    const clean = item.name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
    if (itemImageMap.has(clean)) {
      const mapped = itemImageMap.get(clean)!;
      if (!isSuspiciousUrl(mapped, item.name)) return mapped;
    }
  }

  // 4. Specific dish keyword matching
  if (nameLower.includes("soya chaap") || nameLower.includes("malai chaap")) {
    return "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("lotus stem")) {
    return "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("dahi ke kebab") || nameLower.includes("dahi kebab")) {
    return "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("kasturi murgh") || nameLower.includes("malai tikka")) {
    return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("tangdi kebab")) {
    return "https://images.unsplash.com/photo-1527477378378-0c644d62b9a7?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("amritsari") || nameLower.includes("ajwaini fish")) {
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("gilafi") || nameLower.includes("seekh kebab")) {
    return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("galouti")) {
    return "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("butter chicken") || nameLower.includes("butter masala")) {
    return "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("prawn") && nameLower.includes("ghee roast")) {
    return "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("prawn")) {
    return "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("hyderabadi") || nameLower.includes("biryani")) {
    if (nameLower.includes("mutton") || nameLower.includes("lamb")) return "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80";
    if (nameLower.includes("veg")) return "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80";
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("brownie")) {
    return "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("ice cream")) {
    return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("lollipop")) {
    return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("paneer")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("dal makhani")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("dal")) {
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80";
  }
  if (nameLower.includes("naan") || nameLower.includes("roti") || nameLower.includes("kulcha") || nameLower.includes("paratha")) {
    if (nameLower.includes("garlic")) return "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80";
    return "https://images.unsplash.com/photo-1697155406014-04dc649b0953?auto=format&fit=crop&w=800&q=80";
  }

  // 5. Ultimate fallback
  if (cat.includes("starter") || cat.includes("tandoor")) return "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80";
  if (cat.includes("coastal") || cat.includes("seafood")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80";
  return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80";
}
