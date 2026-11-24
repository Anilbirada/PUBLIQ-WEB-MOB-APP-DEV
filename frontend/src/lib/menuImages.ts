// PUBLIQ Premium Menu Image Resolver
// High-resolution, authentic photography mapping for all 407 food & beverage catalog items

export function getMenuItemImage(item: any, categoryName?: string, categorySlug?: string): string {
  if (!item) return "/images/publiq/food/butter-chicken-copper-handi.webp";

  const name = (item.name || "").toLowerCase();
  const catName = (categoryName || item.category_name || "").toLowerCase();
  const catSlug = (categorySlug || item.category_slug || "").toLowerCase();

  // 1. BEER & DRAUGHT
  if (catSlug.includes("beer") || catName.includes("beer") || name.includes("beer") || name.includes("budweiser") || name.includes("kingfisher") || name.includes("carlsberg") || name.includes("tuborg") || name.includes("bullet") || name.includes("knock out") || name.includes("bira") || name.includes("heineken") || name.includes("ub export")) {
    return "/images/publiq/drinks/draught-beer-mug.webp";
  }

  // 2. WHISKY & BLENDED SCOTCH
  if (catSlug.includes("whisky") || catName.includes("whisky") || name.includes("whisky") || name.includes("scotch") || name.includes("black dog") || name.includes("johnnie walker") || name.includes("teachers") || name.includes("100 pipers") || name.includes("blenders pride") || name.includes("royal stag") || name.includes("amrut") || name.includes("antiquity") || name.includes("bagpiper") || name.includes("dsp black") || name.includes("iconiq") || name.includes("signature") || name.includes("vat 69") || name.includes("8 pm") || name.includes("after dark")) {
    return "/images/publiq/drinks/blended-scotch-whisky.webp";
  }

  // 3. RUM
  if (catSlug.includes("rum") || catName.includes("rum") || name.includes("rum") || name.includes("old monk") || name.includes("bacardi") || name.includes("mcdowell") || name.includes("hercules") || name.includes("carnival")) {
    return "/images/publiq/drinks/publiq-smoked-bourbon.webp";
  }

  // 4. VODKA
  if (catSlug.includes("vodka") || catName.includes("vodka") || name.includes("vodka") || name.includes("magic moments") || name.includes("smirnoff") || name.includes("romanov") || name.includes("muscovy") || name.includes("absolut")) {
    return "/images/publiq/drinks/apple-sour-martini.webp";
  }

  // 5. BRANDY & GIN
  if (catSlug.includes("brandy") || catName.includes("brandy") || name.includes("brandy") || name.includes("mansion house") || name.includes("morpheus") || name.includes("bejois") || name.includes("old admiral")) {
    return "/images/publiq/drinks/blended-scotch-whisky.webp";
  }
  if (catSlug.includes("gin") || catName.includes("gin") || name.includes("gin") || name.includes("bombay sapphire") || name.includes("carnival dry")) {
    return "/images/publiq/drinks/apple-sour-martini.webp";
  }

  // 6. WINE & BREEZERS (RTD)
  if (catSlug.includes("wine") || catName.includes("wine") || name.includes("wine") || name.includes("sula") || name.includes("jacob") || name.includes("bro code") || name.includes("goanas") || name.includes("buzzball")) {
    return "/images/publiq/drinks/premium-wine-selection.webp";
  }
  if (name.includes("breezer") || name.includes("bacardi plus") || catSlug.includes("rtd")) {
    return "/images/publiq/drinks/fresh-fruit-juices-coolers.webp";
  }

  // 7. COCKTAILS, LIITS & SHOOTERS
  if (name.includes("iced tea") || name.includes("liit") || name.includes("bull frog") || name.includes("long island") || name.includes("long beach") || name.includes("texas")) {
    return "/images/publiq/drinks/craft-cocktails-mocktails.webp";
  }
  if (catSlug.includes("cocktail") || catName.includes("cocktail") || name.includes("cosmopolitan") || name.includes("margarita") || name.includes("daiquiri") || name.includes("manhattan") || name.includes("negroni") || name.includes("mai tai") || name.includes("martini") || name.includes("sour") || name.includes("sunrise") || name.includes("blue lagoon") || name.includes("shooter") || name.includes("kamikaze") || name.includes("jaggerbomb") || name.includes("brain hemrage")) {
    if (name.includes("gold") || name.includes("saffron") || name.includes("elixir")) {
      return "/images/publiq/drinks/publiq-gold-elixir.webp";
    }
    return "/images/publiq/drinks/craft-cocktails-mocktails.webp";
  }

  // 8. MOCKTAILS, JUICES, SHAKES & SOFT DRINKS
  if (name.includes("mojito") || name.includes("colada") || name.includes("fizz") || name.includes("mist") || name.includes("blast") || name.includes("guava") || name.includes("cooler") || name.includes("mocktail")) {
    return "/images/publiq/drinks/spiced-mango-mojito.webp";
  }
  if (name.includes("juice") || name.includes("milkshake") || name.includes("shake") || name.includes("lassi") || name.includes("butter milk") || name.includes("lime soda") || name.includes("water") || name.includes("cola") || name.includes("sprite") || name.includes("fanta") || name.includes("thums up") || name.includes("red bull") || name.includes("monster") || name.includes("soda")) {
    return "/images/publiq/drinks/fresh-fruit-juices-coolers.webp";
  }

  // 9. COASTAL SEAFOOD
  if (name.includes("anjal") && name.includes("rawa")) return "/images/publiq/food/anjal-fish-rawa-fry.webp";
  if (name.includes("anjal")) return "/images/publiq/food/anjal-fish-tawa-fry.webp";
  if (name.includes("bangda") && name.includes("rawa")) return "/images/publiq/food/bangda-fish-rawa-fry.webp";
  if (name.includes("bangda")) return "/images/publiq/food/bangda-fish-tawa-fry.webp";
  if (name.includes("prawn") && name.includes("pepper")) return "/images/publiq/food/prawns-pepper-fry.webp";
  if (name.includes("prawn") || name.includes("zingha")) return "/images/publiq/food/prawns-ghee-roast.webp";
  if (name.includes("fish") || name.includes("pomfret") || name.includes("silver fish")) {
    if (name.includes("salt") || name.includes("chilly") || name.includes("crispy")) {
      return "/images/publiq/food/crispy-salt-pepper-fish.webp";
    }
    return "/images/publiq/food/anjal-fish-tawa-fry.webp";
  }

  // 10. CHICKEN DISHES
  if (name.includes("chicken") && name.includes("ghee roast")) return "/images/publiq/food/chicken-ghee-roast.webp";
  if (name.includes("butter chicken") || name.includes("chicken butter masala")) return "/images/publiq/food/butter-chicken-copper-handi.webp";
  if (name.includes("chicken") && (name.includes("kondapuri") || name.includes("chettinad"))) return "/images/publiq/food/chicken-kondapuri-curry.webp";
  if (name.includes("chicken") && name.includes("pepper")) return "/images/publiq/food/chicken-pepper-dry.webp";
  if (name.includes("chicken") && (name.includes("sukka") || name.includes("fry"))) return "/images/publiq/food/chicken-fry-sukka.webp";
  if (name.includes("chicken") && name.includes("tawa")) return "/images/publiq/food/chicken-tawa-fry.webp";
  if (name.includes("chilli chicken") || (name.includes("chicken") && name.includes("andhra"))) return "/images/publiq/food/chilli-chicken-andhra.webp";
  if (name.includes("tandoori chicken") || name.includes("grill chicken") || name.includes("kalmi")) return "/images/publiq/food/tandoori-chicken-roast.webp";
  if (name.includes("tikka") || name.includes("kebab") || name.includes("seekh")) {
    if (name.includes("paneer")) return "/images/publiq/food/dal-saag-paneer-duo.webp";
    return "/images/publiq/food/tandoori-mixed-grill.webp";
  }

  // 11. MUTTON SPECIALS
  if (name.includes("mutton") || name.includes("lamb") || name.includes("paya")) {
    if (name.includes("rogan josh") || name.includes("masala") || name.includes("curry")) {
      return "/images/publiq/food/mutton-rogan-josh.webp";
    }
    if (name.includes("sukka") || name.includes("ghee roast")) {
      return "/images/publiq/food/mutton-sukka-roast.webp";
    }
    return "/images/publiq/food/mutton-fry-boti.webp";
  }

  // 12. VEGETARIAN CURRIES & GRAVIES
  if (name.includes("dal") || name.includes("makhani") || name.includes("tadka") || name.includes("paneer") || name.includes("palak") || name.includes("kadai veg") || name.includes("sev tomato")) {
    if (name.includes("mushroom")) return "/images/publiq/food/mushroom-ghee-roast.webp";
    return "/images/publiq/food/dal-saag-paneer-duo.webp";
  }

  // 13. INDIAN BREADS & ROTIS
  if (name.includes("naan") || name.includes("roti") || name.includes("kulcha") || name.includes("paratha") || name.includes("bread") || name.includes("dosa")) {
    return "/images/publiq/food/tandoori-garlic-naan.webp";
  }

  // 14. BIRYANI & RICE
  if (name.includes("biryani") || name.includes("pulao") || name.includes("rice")) {
    if (name.includes("veg")) return "/images/publiq/food/vegetable-tawa-biryani.webp";
    return "/images/publiq/food/hyderabadi-lamb-biryani.webp";
  }

  // 15. ORIENTAL / INDO-CHINESE
  if (name.includes("noodle") || name.includes("hakka") || name.includes("fried rice") || name.includes("schezwan") || name.includes("dragon") || name.includes("manchurian") || name.includes("lollipop") || name.includes("kung pao")) {
    return "/images/publiq/food/oriental-hakka-noodles.webp";
  }

  // 16. SOUPS & LITE BITES
  if (name.includes("soup") || name.includes("shorba") || name.includes("manchow") || name.includes("corn")) {
    return "/images/publiq/food/chettinad-pepper-curry.webp";
  }
  if (name.includes("chaat") || name.includes("papad") || name.includes("peanut") || name.includes("fries") || name.includes("cashew") || name.includes("spring roll")) {
    return "/images/publiq/food/crispy-spring-rolls.webp";
  }

  // 17. DESSERTS
  if (name.includes("brownie") || name.includes("ice cream") || name.includes("gulab jamun") || name.includes("cake") || name.includes("dessert")) {
    if (name.includes("brownie") || name.includes("sizzl")) {
      return "/images/publiq/food/sizzling-brownie-icecream.webp";
    }
    return "/images/publiq/food/chocolate-lava-cake-icecream.webp";
  }

  // Final Intelligent Fallback: Check if item is food or drink
  if (item.is_alcohol || catSlug.includes("beer") || catSlug.includes("whisky") || catSlug.includes("cocktail") || catSlug.includes("drink")) {
    return "/images/publiq/drinks/craft-cocktails-mocktails.webp";
  }

  return "/images/publiq/food/butter-chicken-copper-handi.webp";
}
