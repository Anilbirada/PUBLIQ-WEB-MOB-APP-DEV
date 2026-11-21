"""
PUBLIQ Dual-Business Department Helper
Classifies menu items into FOOD (Anil) vs BEVERAGE (Ramesh S P).
"""

from typing import Any, Optional

BEVERAGE_CATEGORIES = {
    'cocktails', 'mocktails', 'whisky', 'vodka', 'gin', 'beer', 'other beverages',
    'signature cocktails', 'classic cocktails', 'rum', 'wine', 'soft drinks',
    'fresh juices', 'milkshakes', 'soft drinks and hot beverages', 'tequila and brandy',
    'bar beverages', 'beverages', 'drinks', 'spirits', 'liqueurs', 'shots'
}

BEVERAGE_KEYWORDS = [
    'cocktail', 'mocktail', 'whisky', 'whiskey', 'vodka', 'gin', 'beer', 'rum',
    'wine', 'tequila', 'brandy', 'juice', 'shake', 'smoothie', 'soda', 'tonic',
    'beverage', 'drink', 'coffee', 'tea', 'cooler', 'mojito', 'margarita',
    'martini', 'sangria', 'champagne', 'scotch', 'bourbon', 'draught'
]

def determine_item_department(menu_item: Any, category_name: Optional[str] = None) -> str:
    """
    Returns 'BEVERAGE' for Ramesh S P or 'FOOD' for Anil.
    """
    if getattr(menu_item, 'is_alcohol', False):
        return "BEVERAGE"
        
    cat = (category_name or "").strip().lower()
    if not cat and hasattr(menu_item, 'category') and menu_item.category:
        cat = (getattr(menu_item.category, 'name', '') or "").strip().lower()
        
    if cat in BEVERAGE_CATEGORIES:
        return "BEVERAGE"
        
    for kw in BEVERAGE_KEYWORDS:
        if kw in cat:
            return "BEVERAGE"
            
    # Also check item name for obvious beverage names if category was general
    item_name = (getattr(menu_item, 'name', '') or "").strip().lower()
    for kw in ['cocktail', 'mocktail', 'beer', 'whisky', 'vodka', 'gin', 'rum', 'wine', 'juice', 'shake', 'mojito']:
        if kw in item_name and not any(food_term in item_name for food_term in ['chicken', 'paneer', 'curry', 'rice', 'biryani', 'gravy', 'masala', 'pizza', 'burger', 'platter']):
            return "BEVERAGE"
            
    return "FOOD"
