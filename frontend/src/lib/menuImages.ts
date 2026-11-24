// PUBLIQ Enterprise Menu Image Resolver
// High-resolution, authentic photography mapping for all 617 food & beverage catalog items

export function getMenuItemImage(item: any, categoryName?: string, categorySlug?: string): string {
  if (!item) return "/images/publiq/food/butter-chicken-copper-handi.webp";

  // 1. Prioritize explicit database product image URL if present and valid
  if (item.image_url && typeof item.image_url === "string" && item.image_url.trim().length > 3) {
    const rawUrl = item.image_url.trim();
    // Verify it's not a broken placeholder or old monochrome pattern
    if (!rawUrl.includes("placeholder") && !rawUrl.includes("black") && !rawUrl.includes("broken")) {
      return rawUrl;
    }
  }

  const name = (item.name || "").toLowerCase();
  const catName = (categoryName || item.category_name || "").toLowerCase();
  const catSlug = (categorySlug || item.category_slug || "").toLowerCase();
  const isAlcohol = Boolean(item.is_alcohol);
  const isVeg = Boolean(item.is_veg);

  // ==========================================
  // 2. BEER & DRAUGHT SELECTION
  // ==========================================
  if (catSlug.includes("beer") || catName.includes("beer") || name.includes("beer") || name.includes("budweiser") || name.includes("kingfisher") || name.includes("carlsberg") || name.includes("tuborg") || name.includes("bullet") || name.includes("knock out") || name.includes("bira") || name.includes("heineken") || name.includes("ub export") || name.includes("corona")) {
    if (name.includes("budweiser")) {
      return "/images/publiq/products/chilled-budweiser-beer-mug.webp";
    } else if (name.includes("kingfisher") || name.includes("draught")) {
      return "/images/publiq/products/beer-golden-draught-mug.webp";
    } else if (name.includes("bira") || name.includes("white")) {
      return "/images/publiq/products/beer-chilled-mug-amber.webp";
    } else if (name.includes("bottle") || name.includes("strong")) {
      return "/images/publiq/products/beer-two-frosty-mugs-cheers.webp";
    }
    return "/images/publiq/products/beer-budweiser-froth-mug.webp";
  }

  // ==========================================
  // 3. WHISKY, SCOTCH & SINGLE MALT
  // ==========================================
  if (catSlug.includes("whisky") || catName.includes("whisky") || name.includes("whisky") || name.includes("scotch") || name.includes("black dog") || name.includes("johnnie walker") || name.includes("teachers") || name.includes("100 pipers") || name.includes("blenders pride") || name.includes("royal stag") || name.includes("amrut") || name.includes("antiquity") || name.includes("bagpiper") || name.includes("dsp black") || name.includes("iconiq") || name.includes("signature") || name.includes("vat 69") || name.includes("8 pm") || name.includes("after dark") || name.includes("jack daniel") || name.includes("glenfiddich") || name.includes("chivas")) {
    if (name.includes("johnnie walker") || name.includes("black label")) {
      return "/images/publiq/products/johnnie-walker-black-label-rocks.webp";
    } else if (name.includes("single malt") || name.includes("glenfiddich") || name.includes("chivas")) {
      return "/images/publiq/products/whiskey-crystal-tumbler-bar.webp";
    } else if (name.includes("jack daniel") || name.includes("bourbon") || name.includes("smoked")) {
      return "/images/publiq/drinks/publiq-smoked-bourbon.webp";
    } else if (name.includes("double") || name.includes("blend")) {
      return "/images/publiq/products/whisky-amber-double-rocks.webp";
    }
    return "/images/publiq/products/whisky-on-the-rocks-tumbler.webp";
  }

  // ==========================================
  // 4. RUM
  // ==========================================
  if (catSlug.includes("rum") || catName.includes("rum") || name.includes("rum") || name.includes("old monk") || name.includes("bacardi") || name.includes("mcdowell") || name.includes("hercules") || name.includes("carnival")) {
    if (name.includes("old monk") || name.includes("black") || name.includes("dark")) {
      return "/images/publiq/drinks/publiq-smoked-bourbon.webp";
    } else if (name.includes("limon") || name.includes("white") || name.includes("carta blanca")) {
      return "/images/publiq/drinks/apple-sour-martini.webp";
    }
    return "/images/publiq/products/scotch-whisky-bar-bottles.webp";
  }

  // ==========================================
  // 5. VODKA
  // ==========================================
  if (catSlug.includes("vodka") || catName.includes("vodka") || name.includes("vodka") || name.includes("magic moments") || name.includes("smirnoff") || name.includes("romanov") || name.includes("muscovy") || name.includes("absolut")) {
    if (name.includes("green apple") || name.includes("apple")) {
      return "/images/publiq/drinks/apple-sour-martini.webp";
    } else if (name.includes("orange") || name.includes("citrus")) {
      return "/images/publiq/products/cocktails-cosmopolitan-blue-lagoon.webp";
    }
    return "/images/publiq/drinks/passion-fruit-martini.webp";
  }

  // ==========================================
  // 6. GIN, BRANDY & TEQUILA
  // ==========================================
  if (catSlug.includes("brandy") || catName.includes("brandy") || name.includes("mansion house") || name.includes("morpheus") || name.includes("bejois") || name.includes("old admiral") || name.includes("tequila") || name.includes("camino") || name.includes("jose cuervo")) {
    if (name.includes("tequila")) {
      return "/images/publiq/products/cocktails-tropical-trio.webp";
    }
    return "/images/publiq/products/whisky-amber-double-rocks.webp";
  }
  if (catSlug.includes("gin") || catName.includes("gin") || name.includes("gin") || name.includes("bombay sapphire") || name.includes("carnival dry") || name.includes("tanqueray") || name.includes("hendrick")) {
    return "/images/publiq/drinks/apple-sour-martini.webp";
  }

  // ==========================================
  // 7. WINE & BREEZERS (RTD)
  // ==========================================
  if (catSlug.includes("wine") || catName.includes("wine") || name.includes("wine") || name.includes("sula") || name.includes("jacob") || name.includes("bro code") || name.includes("goanas") || name.includes("buzzball")) {
    if (name.includes("red") || name.includes("shiraz") || name.includes("cabernet")) {
      return "/images/publiq/products/wine-red-glass-vineyard.webp";
    } else if (name.includes("white") || name.includes("chenin") || name.includes("chardonnay")) {
      return "/images/publiq/products/wine-cabernet-and-chardonnay.webp";
    } else if (name.includes("sparkling") || name.includes("brut") || name.includes("cremant")) {
      return "/images/publiq/drinks/premium-wine-selection.webp";
    }
    return "/images/publiq/products/wine-vintage-red-white-grapes.webp";
  }
  if (name.includes("breezer") || name.includes("bacardi plus") || catSlug.includes("rtd")) {
    return "/images/publiq/products/cocktails-blue-lagoon-tequila-sunrise.webp";
  }

  // ==========================================
  // 8. COCKTAILS, MOCKTAILS & LIITS
  // ==========================================
  if (name.includes("mojito")) {
    return "/images/publiq/products/classic-mojito-fresh-mint.webp";
  }
  if (name.includes("blue lagoon") || name.includes("blue kamikaze") || name.includes("blue ocean") || name.includes("electric blue")) {
    return "/images/publiq/products/exotic-blue-lagoon-cocktail.webp";
  }
  if (name.includes("martini") || name.includes("cosmopolitan")) {
    return "/images/publiq/products/cocktails-cosmopolitan-blue-lagoon.webp";
  }
  if (name.includes("gold elixir") || name.includes("old fashioned")) {
    return "/images/publiq/drinks/publiq-gold-elixir.webp";
  }
  if (catSlug.includes("cocktail") || catName.includes("cocktail") || catSlug.includes("mocktail") || catName.includes("mocktail")) {
    return "/images/publiq/products/cocktails-tropical-trio.webp";
  }

  // ==========================================
  // 9. SHAKES, JUICES & BEVERAGES
  // ==========================================
  if (name.includes("watermelon")) {
    return "/images/publiq/products/fresh-watermelon-lime-cooler.webp";
  }
  if (catSlug.includes("juice") || catName.includes("juice") || name.includes("juice")) {
    return "/images/publiq/products/fresh-juices-trio-glass.webp";
  }
  if (catSlug.includes("shake") || catName.includes("shake") || name.includes("shake") || name.includes("milkshake") || name.includes("coffee")) {
    if (name.includes("cold coffee")) {
      return "/images/publiq/products/chocolate-pastry-berries-iced-coffee.webp";
    }
    return "/images/publiq/products/strawberry-shake-and-cola.webp";
  }
  if (name.includes("water") || name.includes("kinley") || name.includes("soda") || name.includes("coca") || name.includes("fanta") || name.includes("thums")) {
    return "/images/publiq/products/strawberry-shake-and-cola.webp";
  }

  // ==========================================
  // 10. SOUPS
  // ==========================================
  if (catSlug.includes("soup") || catName.includes("soup") || name.includes("soup")) {
    return "/images/publiq/products/hot-chicken-manchow-soup.webp";
  }

  // ==========================================
  // 11. COASTAL SEAFOOD
  // ==========================================
  if (catSlug.includes("coastal") || catSlug.includes("seafood") || name.includes("fish") || name.includes("prawn") || name.includes("surmai") || name.includes("anjal") || name.includes("bangda") || name.includes("crab") || name.includes("pomfret")) {
    if (name.includes("prawn")) {
      if (name.includes("ghee roast")) {
        return "/images/publiq/products/prawn-ghee-roast-jumbo.webp";
      } else if (name.includes("grilled") || name.includes("tiger") || name.includes("tandoori")) {
        return "/images/publiq/products/grilled-tiger-prawns-lemon.webp";
      }
      return "/images/publiq/products/coastal-tiger-prawns-roast.webp";
    } else if (name.includes("rawa")) {
      return "/images/publiq/products/fish-rawa-fry.webp";
    } else if (name.includes("tawa")) {
      return "/images/publiq/products/fish-tawa-fry.webp";
    } else if (name.includes("surmai") || name.includes("kingfish")) {
      return "/images/publiq/products/surmai-kingfish-fry.webp";
    }
    return "/images/publiq/products/fish-cutlet-fry.webp";
  }

  // ==========================================
  // 12. BIRYANI & RICE
  // ==========================================
  if (name.includes("biryani") || catSlug.includes("biryani")) {
    if (name.includes("mutton") || name.includes("lamb") || name.includes("dum")) {
      return "/images/publiq/products/dum-mutton-biryani-copper-pot.webp";
    } else if (name.includes("chicken")) {
      return "/images/publiq/products/royal-dum-biryani-platter.webp";
    } else if (isVeg || name.includes("veg") || name.includes("subz")) {
      return "/images/publiq/food/vegetable-tawa-biryani.webp";
    }
    return "/images/publiq/food/hyderabadi-lamb-biryani.webp";
  }

  // ==========================================
  // 13. INDIAN BREADS (NAAN, ROTI, KULCHA)
  // ==========================================
  if (catSlug.includes("bread") || name.includes("naan") || name.includes("roti") || name.includes("kulcha") || name.includes("paratha")) {
    return "/images/publiq/food/tandoori-garlic-naan.webp";
  }

  // ==========================================
  // 14. DESSERTS
  // ==========================================
  if (catSlug.includes("dessert") || name.includes("brownie") || name.includes("ice cream") || name.includes("cake") || name.includes("lava") || name.includes("sundae")) {
    if (name.includes("lava") || name.includes("cake")) {
      return "/images/publiq/products/molten-chocolate-lava-cake-icecream.webp";
    } else if (name.includes("pastry")) {
      return "/images/publiq/products/chocolate-pastry-berries-iced-coffee.webp";
    }
    return "/images/publiq/products/sizzling-brownie-vanilla-scoop.webp";
  }

  // ==========================================
  // 15. CONTINENTAL / FAST FOOD (PIZZA, PASTA, BURGER, FRIES)
  // ==========================================
  if (name.includes("pizza")) {
    return "/images/publiq/products/wood-fired-bbq-chicken-pizza.webp";
  }
  if (name.includes("pasta")) {
    return "/images/publiq/products/creamy-alfredo-chicken-pasta.webp";
  }
  if (name.includes("fries") || name.includes("nacho")) {
    return "/images/publiq/products/crispy-golden-french-fries.webp";
  }
  if (name.includes("burger") || name.includes("zinger")) {
    return "/images/publiq/products/crispy-kfc-style-chicken-burger.webp";
  }

  // ==========================================
  // 16. INDO-CHINESE & ORIENTAL
  // ==========================================
  if (name.includes("spring roll")) {
    return "/images/publiq/products/crispy-veg-spring-rolls-golden.webp";
  }
  if (name.includes("noodle") || name.includes("hakka")) {
    return "/images/publiq/products/indo-chinese-veg-hakka-noodles.webp";
  }
  if (name.includes("chilli chicken") || name.includes("dragon") || name.includes("manchurian")) {
    return "/images/publiq/products/chilli-chicken-wok.webp";
  }
  if (catSlug.includes("chinese") || catSlug.includes("oriental")) {
    return "/images/publiq/products/veg-hakka-noodles-wok.webp";
  }

  // ==========================================
  // 17. VEGETARIAN MAINS & STARTERS
  // ==========================================
  if (isVeg || catSlug.includes("veg") || name.includes("paneer") || name.includes("mushroom") || name.includes("dal")) {
    if (name.includes("paneer") && (name.includes("tikka") || name.includes("kebab") || name.includes("starter") || catSlug.includes("starter"))) {
      return "/images/publiq/products/tandoori-paneer-tikka-skewer.webp";
    } else if (name.includes("paneer")) {
      return "/images/publiq/products/paneer-butter-masala-roti.webp";
    } else if (name.includes("mushroom")) {
      return "/images/publiq/products/mushroom-ghee-roast-juicy.webp";
    } else if (name.includes("dal")) {
      return "/images/publiq/products/traditional-dal-makhani-copper-handi.webp";
    } else if (name.includes("chaat") || name.includes("palak")) {
      return "/images/publiq/food/aloo-beetroot-chaat.webp";
    }
    return "/images/publiq/products/tandoori-paneer-tikka-skewer.webp";
  }

  // ==========================================
  // 18. MUTTON & LAMB
  // ==========================================
  if (name.includes("mutton") || name.includes("lamb") || name.includes("boti")) {
    if (name.includes("sukka") || name.includes("fry") || name.includes("roast")) {
      return "/images/publiq/products/mutton-sukka-boti.webp";
    } else if (name.includes("rogan") || name.includes("curry") || name.includes("shank")) {
      return "/images/publiq/products/mutton-rogan-josh-shank.webp";
    } else if (name.includes("pepper") || name.includes("chettinad")) {
      return "/images/publiq/products/chettinad-pepper-mutton.webp";
    }
    return "/images/publiq/products/pepper-mutton-boti.webp";
  }

  // ==========================================
  // 19. POULTRY & TANDOOR (CHICKEN)
  // ==========================================
  if (name.includes("chicken") || name.includes("murgh") || name.includes("tandoori") || name.includes("kebab") || name.includes("tikka") || name.includes("kalmi")) {
    if (name.includes("65")) {
      return "/images/publiq/products/chicken-65-fiery.webp";
    } else if (name.includes("sukka")) {
      return "/images/publiq/products/chicken-sukka-roast.webp";
    } else if (name.includes("ghee roast")) {
      return "/images/publiq/products/chicken-ghee-roast-crispy.webp";
    } else if (name.includes("tandoori") || name.includes("kalmi")) {
      return "/images/publiq/products/tandoori-chicken-roast-spicy.webp";
    } else if (name.includes("butter chicken") || name.includes("curry") || name.includes("handi")) {
      return "/images/publiq/products/chicken-curry-handi.webp";
    } else if (name.includes("tikka") || name.includes("masala")) {
      return "/images/publiq/products/chicken-tikka-masala-copper-pot.webp";
    }
    return "/images/publiq/products/chicken-sukka-roast.webp";
  }

  // Safe fallback by department
  return isAlcohol
    ? "/images/publiq/products/cocktails-tropical-trio.webp"
    : "/images/publiq/products/butter-chicken-copper-bowl.webp";
}
