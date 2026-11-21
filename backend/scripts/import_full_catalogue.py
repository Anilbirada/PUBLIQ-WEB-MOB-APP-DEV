import os
import sys
import re
import uuid
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import MenuCategory, MenuItem, MenuVariant, MenuAddon, ItemAllergen

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

# Complete Catalogue Data as per specification
CATALOGUE = [
    # 1. VEG STARTERS
    {
        "category": "Veg Starters",
        "slug": "veg-starters",
        "description": "Artisanal clay oven tikkas, crispy nibbles and luxury vegetarian appetizers.",
        "display_order": 1,
        "is_alcohol": False,
        "items": [
            {"name": "Paneer Tikka", "price": 349, "veg": True, "desc": "Charcoal grilled cottage cheese marinated in Kashmiri chillies, mustard oil and hung curd.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Paneer Malai Tikka", "price": 379, "veg": True, "desc": "Velvety cottage cheese cubes steeped in rich cardamom cream, cashew paste and royal saffron.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Achari Paneer Tikka", "price": 359, "veg": True, "desc": "Tangy pickling spices, mustard and fenugreek rubbed paneer roasted in the tandoor.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Tandoori Mushroom", "price": 329, "veg": True, "desc": "Fresh button mushrooms tossed in Punjabi tandoori spices and char-roasted to perfection.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Stuffed Mushroom", "price": 349, "veg": True, "desc": "Plump button mushrooms filled with spiced cheese, bell peppers and fine herbs.", "img": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"},
            {"name": "Hara Bhara Kebab", "price": 289, "veg": True, "desc": "Pan-seared spinach, green pea and spiced potato patties with roasted cashew crowns.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Dahi Ke Kebab", "price": 319, "veg": True, "desc": "Golden crusted, melt-in-the-mouth hung curd medallions delicately spiced with green cardamom.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Veg Seekh Kebab", "price": 299, "veg": True, "desc": "Minced farm vegetables and crushed nuts skewer-roasted over glowing charcoal embers.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Crispy Corn", "price": 249, "veg": True, "desc": "Sweet corn kernels flash-fried until crunchy, tossed with lime, scallions and chaat spices.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Peri Peri French Fries", "price": 229, "veg": True, "desc": "Crispy potato fingers tossed in our fiery African birds-eye peri peri seasoning.", "img": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80"},
            {"name": "Cheese French Fries", "price": 279, "veg": True, "desc": "Golden fried potatoes smothered in molten cheddar and jalapeño cheese sauce.", "img": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&q=80"},
            {"name": "Chilli Paneer", "price": 329, "veg": True, "desc": "Crispy cottage cheese wok-tossed with green chillies, garlic, capsicum and dark soya.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Gobi Manchurian", "price": 269, "veg": True, "desc": "Crispy cauliflower florets glazed in spicy ginger, garlic, coriander and scallion glaze.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Baby Corn Chilli", "price": 289, "veg": True, "desc": "Crispy golden baby corn tossed in an Indo-Chinese spicy garlic and chilli sauce.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Veg Spring Rolls", "price": 269, "veg": True, "desc": "Crispy golden pastry rolls stuffed with shredded wok vegetables served with sweet chilli dip.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Veg Manchurian", "price": 279, "veg": True, "desc": "Golden vegetable dumplings tossed dry with ginger, garlic, soya and scallions.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Chilli Garlic Mushroom", "price": 329, "veg": True, "desc": "Sautéed button mushrooms glazed in fiery red chillies and caramelized garlic.", "img": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"},
            {"name": "Honey Chilli Potato", "price": 289, "veg": True, "desc": "Crispy potato batons coated in a sweet-spicy honey chilli glaze and toasted sesame seeds.", "img": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80"},
            {"name": "Soya Chaap Tikka", "price": 329, "veg": True, "desc": "Protein-rich soya chaap marinated in tandoori spices and charred over embers.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Malai Broccoli", "price": 349, "veg": True, "desc": "Fresh broccoli florets smothered in cream cheese, roasted garlic and white pepper, chargrilled.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
        ]
    },

    # 2. NON-VEG STARTERS
    {
        "category": "Non-Veg Starters",
        "slug": "non-veg-starters",
        "description": "Charcoal roasted kebabs, succulent chicken tikkas and tender mutton morsels.",
        "display_order": 2,
        "is_alcohol": False,
        "items": [
            {"name": "Chicken Tikka", "price": 399, "veg": False, "desc": "Tender boneless chicken marinated in smoked mustard oil, hung yogurt and degi mirch.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Malai Tikka", "price": 429, "veg": False, "desc": "Succulent chicken breasts infused with processed cheese, cashew butter and green cardamom.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Chicken Hariyali Tikka", "price": 419, "veg": False, "desc": "Chicken cubes marinated in fresh mint, coriander, green chillies and roasted cumin.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Chicken Achari Tikka", "price": 419, "veg": False, "desc": "Smoky chicken skewers infused with Punjabi pickle spices, kalonji and mustard.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Lasooni Tikka", "price": 429, "veg": False, "desc": "Boneless chicken marinated with toasted garlic, brown onion paste and yellow chillies.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Tandoori Chicken Half", "price": 429, "veg": False, "desc": "Half spring chicken steeped in royal tandoori spices and roasted crisp over charcoal.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Tandoori Chicken Full", "price": 749, "veg": False, "desc": "Whole spring chicken bathed in authentic Punjabi marinade and roasted over coal.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Tangdi Kebab", "price": 399, "veg": False, "desc": "Succulent chicken drumsticks stuffed with spiced cheese and char-grilled.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Kalmi Kebab", "price": 419, "veg": False, "desc": "Royal Mughlai chicken thighs glazed in cashew nut cream, egg glaze and crushed black pepper.", "img": "/images/kickbunk/magicpin_01_kalmi_kebab.webp"},
            {"name": "Chicken Seekh Kebab", "price": 399, "veg": False, "desc": "Minced chicken skewers delicately spiced with mint, mace and aromatic spices.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Chicken 65", "price": 359, "veg": False, "desc": "Crispy South Indian spiced chicken tossed with fresh curry leaves and slit green chillies.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Crispy Chicken", "price": 349, "veg": False, "desc": "Panko crusted fried chicken tenders served with a spicy roasted garlic aioli.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Dragon Chicken", "price": 369, "veg": False, "desc": "Crisp chicken batons tossed with cashews, bell peppers, dry red chillies and tangy sauce.", "img": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80"},
            {"name": "Pepper Chicken", "price": 379, "veg": False, "desc": "Pan-roasted chicken tossed with freshly cracked Tellicherry black pepper and curry leaves.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chilli Chicken", "price": 369, "veg": False, "desc": "All-time favourite Indo-Chinese wok-fried chicken with chillies, onions and dark soya.", "img": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80"},
            {"name": "Chicken Manchurian", "price": 379, "veg": False, "desc": "Crispy chicken bites glazed in a savoury ginger, garlic, coriander and scallion glaze.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Chicken Lollipop", "price": 399, "veg": False, "desc": "Frenched chicken winglets deep fried to a crispy golden brown, served with Schezwan sauce.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Chicken Wings", "price": 379, "veg": False, "desc": "Crispy roasted wings glazed in smoky chipotle barbecue sauce.", "img": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80"},
            {"name": "Chicken Popcorn", "price": 329, "veg": False, "desc": "Bite-sized seasoned chicken nuggets fried crisp with peri peri dip.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "BBQ Chicken", "price": 429, "veg": False, "desc": "Grilled chicken supreme coated with rich hickory smoked barbecue glaze.", "img": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80"},
            {"name": "Mutton Seekh Kebab", "price": 479, "veg": False, "desc": "Hand-pounded spiced lamb mince skewered and roasted to juicy perfection in tandoor.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Mutton Shami Kebab", "price": 449, "veg": False, "desc": "Silky smooth lamb and chana dal patties pan-seared with aromatic whole spices.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"}
        ]
    },

    # 3. SEAFOOD STARTERS
    {
        "category": "Seafood Starters",
        "slug": "seafood-starters",
        "description": "Coastal catches, Arabian Sea tiger prawns and spice-crusted fish starters.",
        "display_order": 3,
        "is_alcohol": False,
        "items": [
            {"name": "Fish Finger", "price": 399, "veg": False, "desc": "Golden crumbed fish fillets served with tartare dip and house fries.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Fish Tikka", "price": 499, "veg": False, "desc": "Succulent cubes of fish marinated in carom seeds, curd and yellow chilli, char-grilled.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Fish Amritsari", "price": 449, "veg": False, "desc": "Crispy carom-scented batter fried fish fillets dusted with chaat masala.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Andhra Chilli Fish", "price": 429, "veg": False, "desc": "Wok-tossed fish cubes with fiery green chillies and spicy Guntur masala.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Tandoori Prawns", "price": 529, "veg": False, "desc": "Jumbo tiger prawns marinated with aromatic tandoori masala, chargrilled on skewers.", "img": "/images/publiq/food/firecracker-tiger-prawns.webp"},
            {"name": "Prawn Koliwada", "price": 499, "veg": False, "desc": "Mumbai fishermen's style spiced batter fried prawns served with spicy mint chutney.", "img": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80"},
            {"name": "Garlic Butter Prawns", "price": 549, "veg": False, "desc": "Pan-seared ocean prawns tossed with golden garlic flakes, butter and fresh parsley.", "img": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80"},
            {"name": "Chilli Prawns", "price": 499, "veg": False, "desc": "Crisp tiger prawns tossed with fiery chillies, garlic and scallions in dark soya glaze.", "img": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80"},
            {"name": "Prawn Pepper Fry", "price": 529, "veg": False, "desc": "Chettinad style pan-fried prawns tossed with fresh black pepper and curry leaves.", "img": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80"},
            {"name": "Squid Pepper Fry", "price": 499, "veg": False, "desc": "Tender squid rings tossed with crushed peppercorns, shallots and coastal spices.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"}
        ]
    },

    # 4. SOUPS
    {
        "category": "Soups",
        "slug": "soups",
        "description": "Comforting warm broths, aromatic oriental soups and creamy veloutés.",
        "display_order": 4,
        "is_alcohol": False,
        "items": [
            {"name": "Tomato Soup", "price": 179, "veg": True, "desc": "Classic ripe plum tomato soup topped with herb croutons and cream drizzle.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Sweet Corn Soup", "price": 189, "veg": True, "desc": "Velvety sweet corn broth with tender corn niblets and subtle white pepper.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Veg Manchow Soup", "price": 199, "veg": True, "desc": "Spicy Indo-Chinese dark broth spiked with garlic, coriander and topped with crispy noodles.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Hot & Sour Soup", "price": 199, "veg": True, "desc": "Tangy and spicy thick broth packed with mushrooms, bamboo shoots and tofu.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Lemon Coriander Soup", "price": 189, "veg": True, "desc": "Zesty clear vegetable broth infused with fresh coriander stems and crushed garlic.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Cream of Mushroom", "price": 229, "veg": True, "desc": "Silky button mushroom puree finished with fresh cream, truffle essence and thyme.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Chicken Sweet Corn Soup", "price": 219, "veg": False, "desc": "Comforting sweet corn soup with shredded chicken breast and egg drops.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Chicken Manchow Soup", "price": 229, "veg": False, "desc": "Spicy brown garlic broth with minced chicken and crisp fried noodles.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Chicken Hot & Sour Soup", "price": 229, "veg": False, "desc": "Fiery oriental chicken broth with chilli vinegar, shiitake and egg ribbons.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Chicken Clear Soup", "price": 199, "veg": False, "desc": "Nutritious slow-simmered chicken consommé seasoned with ginger and white pepper.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"},
            {"name": "Chicken Lemon Coriander Soup", "price": 219, "veg": False, "desc": "Refreshing chicken soup infused with fresh lime juice, coriander and ginger.", "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"}
        ]
    },

    # 5. INDIAN VEGETARIAN MAIN COURSE
    {
        "category": "Indian Vegetarian Main Course",
        "slug": "indian-veg-main-course",
        "description": "Rich cottage cheese curries, traditional dals and heritage North Indian preparations.",
        "display_order": 5,
        "is_alcohol": False,
        "items": [
            {"name": "Paneer Butter Masala", "price": 349, "veg": True, "desc": "Cottage cheese simmered in a velvet tomato, butter and cashew makhani gravy.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Paneer Tikka Masala", "price": 369, "veg": True, "desc": "Smoky tandoori paneer cubes tossed in a robust onion and bell pepper gravy.", "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"},
            {"name": "Kadai Paneer", "price": 339, "veg": True, "desc": "Paneer batons stir-fried with bell peppers and freshly ground kadai coriander seeds.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Palak Paneer", "price": 329, "veg": True, "desc": "Fresh cottage cheese cooked in garlic-infused pureed spinach tempered with cumin.", "img": "/images/publiq/food/dal-saag-paneer-duo.webp"},
            {"name": "Shahi Paneer", "price": 359, "veg": True, "desc": "Royal Awadhi style paneer in an aromatic white gravy of cashews, cream and saffron.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Matar Paneer", "price": 319, "veg": True, "desc": "Tender green peas and soft paneer simmered in a spiced tomato-onion curry.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"},
            {"name": "Mushroom Masala", "price": 329, "veg": True, "desc": "Button mushrooms cooked with caramelized onions, tomatoes and garam masala.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Kadai Mushroom", "price": 339, "veg": True, "desc": "Mushrooms and crunchy capsicum tossed in spicy pounded kadai spices.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Veg Kolhapuri", "price": 299, "veg": True, "desc": "Garden vegetables simmered in a fiery Maharashtrian red chilli and coconut curry.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Veg Handi", "price": 319, "veg": True, "desc": "Mixed vegetables slow-cooked in a traditional clay pot with roasted spices.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Mix Veg Curry", "price": 289, "veg": True, "desc": "Carrots, beans, peas, and florets cooked in a homestyle spiced onion gravy.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Dal Tadka", "price": 259, "veg": True, "desc": "Yellow toor dal tempered with desi ghee, cumin, garlic and whole dry red chillies.", "img": "/images/publiq/food/dal-saag-paneer-duo.webp"},
            {"name": "Dal Fry", "price": 249, "veg": True, "desc": "Creamy yellow lentils sautéed with golden onions, tomatoes and coriander.", "img": "/images/publiq/food/dal-saag-paneer-duo.webp"},
            {"name": "Dal Makhani", "price": 299, "veg": True, "desc": "Black urad lentils slow-simmered for 24 hours with butter, cream and tomatoes.", "img": "/images/publiq/food/dal-saag-paneer-duo.webp"},
            {"name": "Chana Masala", "price": 279, "veg": True, "desc": "Soft chickpeas simmered in a tangy Punjabi amchur and pomegranate seed gravy.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Aloo Gobi", "price": 269, "veg": True, "desc": "Classic dry sauté of potatoes and cauliflower tossed with ginger and turmeric.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Malai Kofta", "price": 329, "veg": True, "desc": "Paneer and potato dumplings stuffed with dry fruits, served in a rich cashew gravy.", "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80"}
        ]
    },

    # 6. NON-VEG MAIN COURSE
    {
        "category": "Non-Veg Main Course",
        "slug": "non-veg-main-course",
        "description": "Legendary butter chicken, slow-cooked mutton rogan josh and spicy coastal curries.",
        "display_order": 6,
        "is_alcohol": False,
        "items": [
            {"name": "Butter Chicken", "price": 429, "veg": False, "desc": "Tandoori chicken pieces steeped in a silk makhani gravy enriched with fresh butter and cream.", "img": "/images/publiq/food/butter-chicken-delhi.webp"},
            {"name": "Chicken Tikka Masala", "price": 449, "veg": False, "desc": "Char-grilled chicken tikka cooked in a spicy, full-bodied tomato and onion gravy.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Kadai Chicken", "price": 419, "veg": False, "desc": "Chicken tossed with bell peppers and roasted kadai spices in a thick masala.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Handi", "price": 429, "veg": False, "desc": "Rustic chicken curry slow-cooked in a clay vessel with browned onions and yogurt.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Chettinad", "price": 429, "veg": False, "desc": "Spicy South Indian delicacy infused with star anise, poppy seeds, and black pepper.", "img": "/images/publiq/food/chettinad-pepper-curry.webp"},
            {"name": "Andhra Chicken Curry", "price": 429, "veg": False, "desc": "Fiery Andhra style chicken simmered with spicy Guntur red chillies.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Kolhapuri", "price": 419, "veg": False, "desc": "Hot and pungent chicken curry flavoured with roasted coconut and dry red chillies.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Mughlai Chicken", "price": 449, "veg": False, "desc": "Imperial chicken curry in an egg-enriched almond and cashew gravy.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Chicken Do Pyaza", "price": 399, "veg": False, "desc": "Tender chicken cooked with double the onions—both caramelized and diced crunchy.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"},
            {"name": "Mutton Rogan Josh", "price": 499, "veg": False, "desc": "Kashmiri lamb delicacy slow-cooked with mawal flower essence, fennel and ratanjot.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Mutton Masala", "price": 499, "veg": False, "desc": "Tender pieces of mutton cooked in a thick spicy gravy with aromatic spices.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Mutton Handi", "price": 519, "veg": False, "desc": "Bone-in lamb simmered in clay handi with onions, whole spices and rich broth.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Mutton Pepper Masala", "price": 529, "veg": False, "desc": "Spicy pan-roasted mutton seasoned generously with crushed Malabar black pepper.", "img": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80"},
            {"name": "Egg Masala", "price": 279, "veg": False, "desc": "Hard-boiled eggs simmered in a spiced tomato, onion, and cumin gravy.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Egg Curry", "price": 259, "veg": False, "desc": "Homestyle egg curry with golden pan-fried eggs and fresh coriander.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Fish Curry", "price": 459, "veg": False, "desc": "Fresh river fish fillets simmered in a tangy tamarind, mustard and tomato gravy.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Prawn Masala", "price": 499, "veg": False, "desc": "Plump ocean prawns cooked with kokum, coconut milk and coastal spice masala.", "img": "/images/publiq/food/firecracker-tiger-prawns.webp"}
        ]
    },

    # 7. BIRYANI AND RICE
    {
        "category": "Biryani and Rice",
        "slug": "biryani-and-rice",
        "description": "Dum cooked Basmati biryanis layered with saffron, ghee and fragrant spices.",
        "display_order": 7,
        "is_alcohol": False,
        "items": [
            {"name": "Veg Dum Biryani", "price": 329, "veg": True, "desc": "Long grain basmati rice and farm vegetables dum-cooked with saffron and kewra water.", "img": "/images/publiq/food/vegetable-tawa-biryani.webp"},
            {"name": "Paneer Biryani", "price": 349, "veg": True, "desc": "Spiced cottage cheese cubes layered with aromatic basmati rice, fried onions and mint.", "img": "/images/publiq/food/vegetable-tawa-biryani.webp"},
            {"name": "Mushroom Biryani", "price": 329, "veg": True, "desc": "Earthy button mushrooms cooked in spices and layered with fragrant dum rice.", "img": "/images/publiq/food/vegetable-tawa-biryani.webp"},
            {"name": "Hyderabadi Chicken Biryani", "price": 399, "veg": False, "desc": "Authentic Nizami chicken biryani dum cooked with brown onions, mint and saffron milk.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Chicken Dum Biryani", "price": 419, "veg": False, "desc": "Fragrant basmati rice layered with succulent marinated chicken pieces, slow cooked under seal.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Chicken Boneless Biryani", "price": 429, "veg": False, "desc": "Tender boneless chicken tikka layered with spiced basmati rice and caramelized onions.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Mutton Dum Biryani", "price": 499, "veg": False, "desc": "Tender cuts of goat meat slow-cooked with aged Basmati rice and royal biryani spices.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Egg Biryani", "price": 319, "veg": False, "desc": "Spiced boiled eggs layered with seasoned basmati rice, mint and fried shallots.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Prawn Biryani", "price": 499, "veg": False, "desc": "Juicy ocean prawns spiced with coastal masala and sealed in fragrant basmati dum.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Family Chicken Biryani", "price": 899, "veg": False, "desc": "Generous family platter of Hyderabadi chicken biryani, served with salan and raita.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Family Mutton Biryani", "price": 1099, "veg": False, "desc": "Large family feast of tender mutton dum biryani served with mirchi ka salan.", "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp"},
            {"name": "Jeera Rice", "price": 199, "veg": True, "desc": "Steamed aged basmati rice tempered with roasted cumin seeds and desi ghee.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Ghee Rice", "price": 229, "veg": True, "desc": "Aromatic Basmati rice tossed in pure desi cow ghee, fried cashews and raisins.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Steamed Rice", "price": 179, "veg": True, "desc": "Fluffy long-grain steamed royal Basmati rice.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Veg Pulao", "price": 249, "veg": True, "desc": "Basmati rice cooked with fresh seasonal vegetables and whole spices.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Peas Pulao", "price": 249, "veg": True, "desc": "Fragrant basmati rice gently cooked with sweet green peas and whole cardamom.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Curd Rice", "price": 199, "veg": True, "desc": "Cooling South Indian rice tempered with mustard seeds, curry leaves, ginger and pomegranate.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
        ]
    },

    # 8. INDIAN BREADS
    {
        "category": "Indian Breads",
        "slug": "indian-breads",
        "description": "Clay oven tandoori rotis, flaky parathas and artisanal stuffed naans.",
        "display_order": 8,
        "is_alcohol": False,
        "items": [
            {"name": "Tandoori Roti", "price": 45, "veg": True, "desc": "Traditional whole wheat flatbread baked in the clay tandoor.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Butter Roti", "price": 55, "veg": True, "desc": "Whole wheat tandoori flatbread brushed with golden butter.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Plain Naan", "price": 70, "veg": True, "desc": "Refined flour leavened bread freshly baked in the tandoor.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Butter Naan", "price": 80, "veg": True, "desc": "Soft, fluffy tandoori naan brushed generously with melted butter.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Garlic Naan", "price": 95, "veg": True, "desc": "Soft leavened bread studded with chopped garlic and coriander, topped with butter.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Cheese Naan", "price": 129, "veg": True, "desc": "Tandoori naan stuffed with molten mozzarella and cheddar cheese.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Lachha Paratha", "price": 85, "veg": True, "desc": "Multi-layered crispy whole wheat flaky bread baked with desi ghee.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Pudina Paratha", "price": 85, "veg": True, "desc": "Layered flaky paratha dusted with fragrant dried mint powder.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Aloo Kulcha", "price": 99, "veg": True, "desc": "Leavened bread stuffed with spiced mashed potatoes and coriander.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Paneer Kulcha", "price": 119, "veg": True, "desc": "Amritsari style kulcha stuffed with seasoned grated paneer and herbs.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Tandoori Paratha", "price": 79, "veg": True, "desc": "Crispy whole wheat layered flatbread baked in the tandoor.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"},
            {"name": "Roomali Roti", "price": 55, "veg": True, "desc": "Paper-thin handkerchief bread tossed in the air and baked on an inverted wok.", "img": "/images/publiq/food/tandoori-garlic-naan.webp"}
        ]
    },

    # 9. CHINESE AND ASIAN – VEGETARIAN
    {
        "category": "Chinese and Asian – Vegetarian",
        "slug": "chinese-asian-veg",
        "description": "Wok-tossed noodles, fragrant fried rice and authentic Thai curries.",
        "display_order": 9,
        "is_alcohol": False,
        "items": [
            {"name": "Veg Fried Rice", "price": 269, "veg": True, "desc": "Fragrant rice tossed in a blazing wok with finely diced vegetables and light soya.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Schezwan Fried Rice", "price": 289, "veg": True, "desc": "Spicy wok-tossed rice with crunchy vegetables and our house-made Schezwan paste.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Chilli Garlic Fried Rice", "price": 299, "veg": True, "desc": "Fragrant wok rice loaded with toasted golden garlic, red chillies and scallions.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Veg Hakka Noodles", "price": 269, "veg": True, "desc": "Traditional wok-tossed noodles with shredded cabbage, carrots, capsicum and soya.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Schezwan Noodles", "price": 289, "veg": True, "desc": "Noodles tossed with spicy fiery Schezwan sauce and farm-fresh julienne vegetables.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Chilli Garlic Noodles", "price": 299, "veg": True, "desc": "Stir-fried noodles infused with caramelized garlic flakes and red chilli oil.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Singapore Noodles", "price": 319, "veg": True, "desc": "Thin vermicelli noodles stir-fried with mild madras curry powder, peppers and greens.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Veg Chilli Basil", "price": 329, "veg": True, "desc": "Crisp vegetables and tofu stir-fried with fresh holy basil, birds eye chillies and soya.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Thai Green Curry", "price": 379, "veg": True, "desc": "Fragrant coconut milk curry scented with lemongrass, galangal and Thai basil, served with rice.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Thai Red Curry", "price": 379, "veg": True, "desc": "Spicy coconut curry with kaffir lime leaves, bamboo shoots and seasonal vegetables.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Veg Manchurian Gravy", "price": 299, "veg": True, "desc": "Vegetable dumplings simmered in a savory, tangy soya, ginger and garlic sauce.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
        ]
    },

    # 10. CHINESE AND ASIAN – NON-VEGETARIAN
    {
        "category": "Chinese and Asian – Non-Vegetarian",
        "slug": "chinese-asian-non-veg",
        "description": "Sizzling chicken wok bowls, prawn noodles and authentic Asian specialities.",
        "display_order": 10,
        "is_alcohol": False,
        "items": [
            {"name": "Chicken Fried Rice", "price": 319, "veg": False, "desc": "Wok-tossed basmati rice with shredded chicken, scrambled eggs, and spring onions.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Egg Fried Rice", "price": 289, "veg": False, "desc": "Wok-fried rice with tender scrambled eggs and finely minced scallions.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Schezwan Chicken Rice", "price": 339, "veg": False, "desc": "Fiery wok-tossed rice with tender chicken chunks and spicy Schezwan chili paste.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Chicken Hakka Noodles", "price": 319, "veg": False, "desc": "Silky noodles stir-fried with juicy chicken strips, cabbage, and bell peppers.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Chicken Schezwan Noodles", "price": 339, "veg": False, "desc": "Spicy stir-fried noodles with shredded chicken and bold Schezwan sauce.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Chicken Chilli Garlic Noodles", "price": 349, "veg": False, "desc": "Wok-tossed noodles with chicken, roasted garlic flakes, and red chilli oil.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"},
            {"name": "Chicken Manchurian Gravy", "price": 349, "veg": False, "desc": "Crispy chicken bites in a lush ginger, garlic and spring onion brown gravy.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Chicken Chilli Basil", "price": 369, "veg": False, "desc": "Sliced chicken breast stir-fried with aromatic Thai holy basil and fresh red chillies.", "img": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80"},
            {"name": "Thai Chicken Curry", "price": 429, "veg": False, "desc": "Aromatic coconut milk Thai green or red curry with tender chicken and bamboo shoots.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Prawn Fried Rice", "price": 399, "veg": False, "desc": "Wok-tossed jasmine rice with plump ocean prawns, scrambled egg, and scallions.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Prawn Hakka Noodles", "price": 399, "veg": False, "desc": "Stir-fried noodles with succulent prawns, crunchy peppers, and aromatic soya glaze.", "img": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"}
        ]
    },

    # 11. CONTINENTAL AND ITALIAN
    {
        "category": "Continental and Italian",
        "slug": "continental-italian",
        "description": "Handcrafted stone-baked pizzas, gourmet burgers, pastas and sizzling steaks.",
        "display_order": 11,
        "is_alcohol": False,
        "items": [
            {"name": "Margherita Pizza", "price": 329, "veg": True, "desc": "Thin crust pizza with San Marzano tomato sauce, fresh mozzarella and sweet basil.", "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"},
            {"name": "Farmhouse Veg Pizza", "price": 379, "veg": True, "desc": "Loaded with bell peppers, sweet corn, mushrooms, black olives and mozzarella cheese.", "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"},
            {"name": "Paneer Tikka Pizza", "price": 399, "veg": True, "desc": "Spiced tandoori paneer, red onions, bell peppers and mozzarella on a thin crust.", "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"},
            {"name": "BBQ Chicken Pizza", "price": 449, "veg": False, "desc": "Smoky barbecue pulled chicken, red onions, cilantro and aged mozzarella.", "img": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"},
            {"name": "Chicken Supreme Pizza", "price": 479, "veg": False, "desc": "Grilled chicken, peri-peri chicken, jalapeños, olives and mozzarella cheese.", "img": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"},
            {"name": "Classic Veg Burger", "price": 279, "veg": True, "desc": "Crispy vegetable patty in a toasted brioche bun with lettuce, tomatoes and cheese slice.", "img": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80"},
            {"name": "Crispy Chicken Burger", "price": 329, "veg": False, "desc": "Golden fried spiced chicken breast with gherkins, cheddar cheese, and house mayo.", "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"},
            {"name": "PUBLIQ Special Chicken Burger", "price": 379, "veg": False, "desc": "Double grilled chicken patties, caramelised onions, bacon jam, and molten cheese.", "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"},
            {"name": "White Sauce Veg Pasta", "price": 349, "veg": True, "desc": "Penne pasta in a velvety parmesan and garlic alfredo sauce with sauteed broccoli.", "img": "https://images.unsplash.com/photo-1621996346565-e3d5d62810ac?w=800&q=80"},
            {"name": "Red Sauce Veg Pasta", "price": 329, "veg": True, "desc": "Penne pasta tossed in an aromatic arrabbiata sauce with garlic, basil and parmesan.", "img": "https://images.unsplash.com/photo-1621996346565-e3d5d62810ac?w=800&q=80"},
            {"name": "Pink Sauce Pasta", "price": 369, "veg": True, "desc": "Creamy blend of slow-roasted tomato sauce and parmesan cream with bell peppers.", "img": "https://images.unsplash.com/photo-1621996346565-e3d5d62810ac?w=800&q=80"},
            {"name": "Chicken Alfredo Pasta", "price": 419, "veg": False, "desc": "Fettuccine or penne pasta with grilled chicken in rich parmesan garlic cream sauce.", "img": "https://images.unsplash.com/photo-1621996346565-e3d5d62810ac?w=800&q=80"},
            {"name": "Chicken Arrabbiata Pasta", "price": 399, "veg": False, "desc": "Spicy tomato herb sauce with sliced grilled chicken and aged parmesan shavings.", "img": "https://images.unsplash.com/photo-1621996346565-e3d5d62810ac?w=800&q=80"},
            {"name": "Grilled Chicken Steak", "price": 499, "veg": False, "desc": "Tender grilled chicken breast served with mashed potatoes, butter vegetables and pepper jus.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Chicken Sizzler", "price": 529, "veg": False, "desc": "Sizzling platter of grilled chicken steak, buttered herb rice, French fries and BBQ sauce.", "img": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"},
            {"name": "Veg Sizzler", "price": 429, "veg": True, "desc": "Sizzling platter with paneer cutlet, stuffed bell pepper, french fries, and herb rice.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Fish Sizzler", "price": 549, "veg": False, "desc": "Pan-seared fish steak on a sizzling plate with lemon butter sauce, fries, and greens.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"}
        ]
    },

    # 12. DESSERTS
    {
        "category": "Desserts",
        "slug": "desserts",
        "description": "Decadent chocolate brownies, authentic New York cheesecake and royal Indian sweets.",
        "display_order": 12,
        "is_alcohol": False,
        "items": [
            {"name": "Chocolate Brownie", "price": 199, "veg": True, "desc": "Warm fudgy dark chocolate brownie topped with chocolate drizzle.", "img": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80"},
            {"name": "Brownie with Ice Cream", "price": 249, "veg": True, "desc": "Hot walnut brownie paired with a scoop of Madagascar vanilla bean ice cream.", "img": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80"},
            {"name": "Chocolate Lava Cake", "price": 229, "veg": True, "desc": "Molten chocolate cake with an oozy dark chocolate center.", "img": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80"},
            {"name": "New York Cheesecake", "price": 299, "veg": True, "desc": "Creamy baked Philadelphia style cheesecake on a buttery graham cracker crust.", "img": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80"},
            {"name": "Tiramisu", "price": 299, "veg": True, "desc": "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone mousse.", "img": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80"},
            {"name": "Gulab Jamun", "price": 149, "veg": True, "desc": "Two golden khoya dumplings soaked in fragrant green cardamom and rose sugar syrup.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Rasmalai", "price": 179, "veg": True, "desc": "Soft cottage cheese discs immersed in chilled saffron and pistachio infused rabdi.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Kulfi", "price": 149, "veg": True, "desc": "Traditional dense, slow-cooked Indian ice cream with pistachios and saffron.", "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"},
            {"name": "Vanilla Ice Cream", "price": 129, "veg": True, "desc": "Two generous scoops of creamy vanilla bean ice cream.", "img": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80"},
            {"name": "Chocolate Ice Cream", "price": 149, "veg": True, "desc": "Two scoops of rich Belgian dark chocolate ice cream.", "img": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80"},
            {"name": "Chocolate Sundae", "price": 229, "veg": True, "desc": "Vanilla and chocolate scoops layered with fudge, toasted almonds, and whipped cream.", "img": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80"},
            {"name": "Fruit Salad with Ice Cream", "price": 199, "veg": True, "desc": "Fresh seasonal fruit bowl served alongside rich vanilla ice cream.", "img": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80"}
        ]
    },

    # 13. BAR SNACKS / CHAKNA
    {
        "category": "Bar Snacks",
        "slug": "bar-snacks",
        "description": "Crunchy chakna, spicy fries, nachos and sharing nibbles for the drinks table.",
        "display_order": 13,
        "is_alcohol": False,
        "items": [
            {"name": "Masala Peanuts", "price": 129, "veg": True, "desc": "Crunchy roasted peanuts tossed with chopped onions, green chillies and chaat masala.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Masala Papad", "price": 119, "veg": True, "desc": "Crispy roasted papad topped with diced tomatoes, onions, coriander and tangy spices.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Roasted Papad", "price": 89, "veg": True, "desc": "Two crisp tandoor roasted lentil papads served with mint chutney.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Salted French Fries", "price": 199, "veg": True, "desc": "Crispy golden fried potato batons with sea salt and tomato ketchup.", "img": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80"},
            {"name": "Peri Peri Fries", "price": 229, "veg": True, "desc": "Crisp french fries dusted with spicy African bird's eye peri-peri seasoning.", "img": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80"},
            {"name": "Cheese Nachos", "price": 299, "veg": True, "desc": "Corn tortilla chips layered with molten cheese, jalapeños, salsa and sour cream.", "img": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&q=80"},
            {"name": "Chicken Popcorn", "price": 329, "veg": False, "desc": "Crispy seasoned bite-sized chicken nuggets with garlic dip.", "img": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"},
            {"name": "Chicken Wings", "price": 379, "veg": False, "desc": "Smoky BBQ glazed crispy roasted chicken wings.", "img": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80"},
            {"name": "Fish Fingers", "price": 399, "veg": False, "desc": "Crumb fried seasoned fish fillets with tartare sauce.", "img": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80"},
            {"name": "Peanut Masala", "price": 129, "veg": True, "desc": "Fried peanuts tossed in lime, green chillies, red onion, and black salt.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Chilli Chicken", "price": 369, "veg": False, "desc": "Crisp fried chicken cubes wok-tossed with chillies, capsicum, and scallions.", "img": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80"},
            {"name": "Crispy Corn", "price": 249, "veg": True, "desc": "Crispy batter fried sweet corn kernels tossed with spices and fresh herbs.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "Mixed Nuts", "price": 199, "veg": True, "desc": "Premium selection of salted roasted cashews, almonds and peanuts.", "img": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&q=80"},
            {"name": "PUBLIQ Special Bar Platter", "price": 699, "veg": False, "desc": "Grand sharing platter with chicken popcorn, wings, fish fingers, onion rings and fries.", "img": "/images/publiq/food/publiq-signature-platter.webp"}
        ]
    },

    # 14. MOCKTAILS
    {
        "category": "Mocktails",
        "slug": "mocktails",
        "description": "Refreshing non-alcoholic handcrafted botanicals, coolers and tropical punches.",
        "display_order": 14,
        "is_alcohol": False,
        "items": [
            {"name": "Virgin Mojito", "price": 229, "veg": True, "desc": "Crushed mint leaves, fresh lime wedges and cane sugar churned with sparkling soda.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Blue Lagoon", "price": 249, "veg": True, "desc": "Blue curacao syrup shaken with fresh lime juice, sprite and a citrus twist.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Watermelon Cooler", "price": 229, "veg": True, "desc": "Freshly muddled sweet watermelon, mint, sea salt and lime on crushed ice.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Passion Fruit Punch", "price": 259, "veg": True, "desc": "Exotic passion fruit nectar, pineapple juice and lemon topped with sparkling fizz.", "img": "/images/publiq/drinks/passion-fruit-martini.webp"},
            {"name": "Green Apple Mojito", "price": 249, "veg": True, "desc": "Crisp green apple puree muddled with mint, lime and sparkling soda.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Strawberry Mojito", "price": 249, "veg": True, "desc": "Sweet ripe strawberry compote, fresh garden mint, lime and club soda.", "img": "/images/publiq/drinks/lychee-rose-delight.webp"},
            {"name": "Cucumber Mint Cooler", "price": 229, "veg": True, "desc": "Hydrating English cucumber ribbons, fresh mint leaves and rock salt with club soda.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Virgin Piña Colada", "price": 279, "veg": True, "desc": "Creamy coconut milk, pineapple juice and crushed ice blended silky smooth.", "img": "/images/publiq/drinks/hawaiian-colada-mocktail.webp"},
            {"name": "Cranberry Cooler", "price": 249, "veg": True, "desc": "Tart American cranberries, ginger cordial and soda on rock ice.", "img": "/images/publiq/drinks/lychee-rose-delight.webp"},
            {"name": "Mango Chilli Cooler", "price": 249, "veg": True, "desc": "Alphonso mango pulp paired with a kick of green bird's eye chilli and rock salt.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Orange Sunrise", "price": 229, "veg": True, "desc": "Layered fresh orange juice and sweet grenadine syrup served over crushed ice.", "img": "/images/publiq/drinks/passion-fruit-martini.webp"},
            {"name": "PUBLIQ Special Garden Mist", "price": 279, "veg": True, "desc": "Signature elixir of elderflower cordial, kiwi, cucumber, and botanical mist.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Blue Ocean", "price": 249, "veg": True, "desc": "Vibrant blue curacao, lime juice, litchi extract and effervescent soda.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Lychee Cooler", "price": 259, "veg": True, "desc": "Fragrant lychee nectar and rose petal cordial over sparkling ice.", "img": "/images/publiq/drinks/lychee-rose-delight.webp"},
            {"name": "Kiwi Mojito", "price": 259, "veg": True, "desc": "Fresh crushed kiwi fruit, garden mint sprigs, lime and chilled tonic water.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"}
        ]
    },

    # 15. FRESH JUICES
    {
        "category": "Fresh Juices",
        "slug": "fresh-juices",
        "description": "Cold-pressed pure fruit juices with zero artificial sweeteners or concentrates.",
        "display_order": 15,
        "is_alcohol": False,
        "items": [
            {"name": "Fresh Lime Juice", "price": 99, "veg": True, "desc": "Freshly squeezed lime juice with choice of sweet, salted or mixed seasoning.", "img": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80"},
            {"name": "Watermelon Juice", "price": 149, "veg": True, "desc": "Pure cold-pressed fresh watermelon juice served chilled.", "img": "https://images.unsplash.com/photo-1589734157816-41974e2f107f?w=800&q=80"},
            {"name": "Orange Juice", "price": 169, "veg": True, "desc": "Freshly squeezed citrus oranges packed with vitamin C.", "img": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80"},
            {"name": "Pineapple Juice", "price": 159, "veg": True, "desc": "Tropical fresh Queen pineapple juice with a pinch of rock salt.", "img": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80"},
            {"name": "Mosambi Juice", "price": 159, "veg": True, "desc": "Freshly squeezed sweet lime juice, natural and energizing.", "img": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80"},
            {"name": "Pomegranate Juice", "price": 199, "veg": True, "desc": "Ruby red fresh pomegranate pearls pressed pure with zero additives.", "img": "https://images.unsplash.com/photo-1589734157816-41974e2f107f?w=800&q=80"},
            {"name": "Carrot Juice", "price": 149, "veg": True, "desc": "Freshly extracted sweet red carrot juice with a hint of ginger.", "img": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80"},
            {"name": "Mixed Fruit Juice", "price": 189, "veg": True, "desc": "Nutrient-packed blend of apple, orange, pineapple, and watermelon.", "img": "https://images.unsplash.com/photo-1589734157816-41974e2f107f?w=800&q=80"},
            {"name": "Apple Juice", "price": 179, "veg": True, "desc": "Crisp Royal Gala apples cold-pressed pure with a hint of cinnamon.", "img": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80"}
        ]
    },

    # 16. MILKSHAKES
    {
        "category": "Milkshakes",
        "slug": "milkshakes",
        "description": "Thick artisanal milkshakes, cold brews and gourmet chocolate shakes.",
        "display_order": 16,
        "is_alcohol": False,
        "items": [
            {"name": "Vanilla Milkshake", "price": 199, "veg": True, "desc": "Rich whole milk blended with pure vanilla bean gelato.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "Chocolate Milkshake", "price": 219, "veg": True, "desc": "Creamy blend of Dutch dark chocolate fudge and rich milk.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "Strawberry Milkshake", "price": 219, "veg": True, "desc": "Blended real strawberries and vanilla ice cream topped with strawberry glaze.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "Oreo Milkshake", "price": 249, "veg": True, "desc": "Thick shake loaded with crushed Oreo cookies, vanilla cream and fudge drizzle.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "KitKat Milkshake", "price": 249, "veg": True, "desc": "Chunky KitKat chocolate wafer fingers blended into thick creamy milkshake.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "Mango Milkshake", "price": 229, "veg": True, "desc": "Delicious Alphonso mango pulp churned with rich milk and vanilla cream.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"},
            {"name": "Cold Coffee", "price": 199, "veg": True, "desc": "Chilled espresso shot blended with milk, vanilla ice cream, and cocoa powder.", "img": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80"},
            {"name": "Chocolate Cold Coffee", "price": 229, "veg": True, "desc": "Cold coffee whipped with rich dark chocolate fudge and mocha shavings.", "img": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80"},
            {"name": "Ferrero Rocher Shake", "price": 279, "veg": True, "desc": "Decadent hazelnut Ferrero Rocher pralines blended with Nutella and cream.", "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80"}
        ]
    },

    # 17. SOFT DRINKS AND HOT BEVERAGES
    {
        "category": "Soft Drinks and Hot Beverages",
        "slug": "soft-drinks-beverages",
        "description": "Chilled aerated sodas, artisan coffees, green teas and mineral water.",
        "display_order": 17,
        "is_alcohol": False,
        "items": [
            {"name": "Coca-Cola", "price": 80, "veg": True, "desc": "Chilled can of Coca-Cola (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Pepsi", "price": 80, "veg": True, "desc": "Chilled can of Pepsi (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Sprite", "price": 80, "veg": True, "desc": "Crisp lemon-lime soda (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Thums Up", "price": 80, "veg": True, "desc": "Strong carbonated cola with a thunderous punch (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Fanta", "price": 80, "veg": True, "desc": "Fruity orange fizzy soda (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Soda", "price": 60, "veg": True, "desc": "Chilled sparkling club soda (330ml).", "img": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80"},
            {"name": "Mineral Water 500 ml", "price": 40, "veg": True, "desc": "Packaged premium purified drinking water (500ml).", "img": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&q=80"},
            {"name": "Mineral Water 1 L", "price": 60, "veg": True, "desc": "Packaged premium natural mineral water (1 Litre).", "img": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&q=80"},
            {"name": "Masala Tea", "price": 70, "veg": True, "desc": "Authentic Indian chai brewed with milk, ginger, cardamom, and clove.", "img": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80"},
            {"name": "Green Tea", "price": 90, "veg": True, "desc": "Organic Darjeeling whole leaf green tea rich in antioxidants.", "img": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80"},
            {"name": "Espresso", "price": 120, "veg": True, "desc": "Single shot of intense 100% Arabica dark roast coffee with golden crema.", "img": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"},
            {"name": "Cappuccino", "price": 149, "veg": True, "desc": "Fresh espresso balanced with equal parts steamed milk and velvety foam.", "img": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"},
            {"name": "Cafe Latte", "price": 159, "veg": True, "desc": "Silky espresso topped with hot steamed milk and delicate microfoam art.", "img": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"}
        ]
    },

    # 18. SIGNATURE COCKTAILS
    {
        "category": "Signature Cocktails",
        "slug": "signature-cocktails",
        "description": "Artisan mixology, house infused syrups, smoked bourbons and luxury bar creations.",
        "display_order": 18,
        "is_alcohol": True,
        "items": [
            {"name": "Classic Mojito", "price": 449, "veg": True, "desc": "White rum, muddled mint, fresh lime juice, cane sugar, and sparkling club soda.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Strawberry Mojito", "price": 479, "veg": True, "desc": "White rum, crushed garden strawberries, fresh mint, lime and sparkling soda.", "img": "/images/publiq/drinks/lychee-rose-delight.webp"},
            {"name": "Blue Lagoon Cocktail", "price": 479, "veg": True, "desc": "Premium vodka, blue curacao liqueur, lemonade, and freshly squeezed lime.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Cosmopolitan", "price": 499, "veg": True, "desc": "Vodka citron, triple sec, tart cranberry juice, and fresh lime juice.", "img": "/images/publiq/drinks/passion-fruit-martini.webp"},
            {"name": "Margarita", "price": 499, "veg": True, "desc": "Silver tequila, triple sec, and fresh lime served with a hand-salted rim.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Whiskey Sour", "price": 529, "veg": True, "desc": "Bourbon whiskey, freshly squeezed lemon juice, simple syrup, and angostura bitters.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Long Island Iced Tea", "price": 599, "veg": True, "desc": "Potent mix of vodka, white rum, gin, tequila, triple sec, lime and a splash of cola.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Piña Colada", "price": 499, "veg": True, "desc": "White rum, coconut cream, and pineapple juice blended to a tropical perfection.", "img": "/images/publiq/drinks/hawaiian-colada-mocktail.webp"},
            {"name": "Espresso Martini", "price": 549, "veg": True, "desc": "Vodka, fresh hot espresso shot, coffee liqueur, and vanilla bean syrup.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Negroni", "price": 599, "veg": True, "desc": "London dry gin, Campari bitter, and sweet vermouth stirred over crystal ice sphere.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Aperol Spritz", "price": 549, "veg": True, "desc": "Aperol aperitivo, sparkling Prosecco, and a splash of soda with an orange wheel.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Old Fashioned", "price": 599, "veg": True, "desc": "Bourbon whiskey muddled with demerara sugar cube, Angostura bitters, and orange peel.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Moscow Mule", "price": 499, "veg": True, "desc": "Vodka, fiery ginger beer, and fresh lime served in a copper mug with mint sprig.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Daiquiri", "price": 479, "veg": True, "desc": "White rum, fresh key lime juice, and simple sugar syrup shaken ice cold.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "PUBLIQ Smoked Old Fashioned", "price": 649, "veg": True, "desc": "Oak-smoked Kentucky bourbon infused with bitters and flamed orange zest.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "PUBLIQ Signature Garden Cocktail", "price": 599, "veg": True, "desc": "Hendrick's gin, elderflower cordial, cucumber, and botanical prosecco spritz.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"}
        ]
    },

    # 19. BEER
    {
        "category": "Beer",
        "slug": "beer",
        "description": "Crisp lagers, Belgian wits, craft draughts and international imported beers.",
        "display_order": 19,
        "is_alcohol": True,
        "items": [
            {"name": "Kingfisher Premium – 330 ml", "price": 220, "veg": True, "desc": "The king of good times. Crisp and clean lager (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Kingfisher Ultra – 330 ml", "price": 260, "veg": True, "desc": "Smooth, refined, and ultra-crisp premium malt lager (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Kingfisher Ultra Max – 330 ml", "price": 280, "veg": True, "desc": "Maximum flavour, strong smooth lager brewed with fine pilsen malts (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Budweiser Premium – 330 ml", "price": 260, "veg": True, "desc": "The King of Beers. Beechwood aged for supreme smoothness (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Budweiser Magnum – 330 ml", "price": 290, "veg": True, "desc": "Super premium strong beer with rich malt complexity (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Bira White – 330 ml", "price": 300, "veg": True, "desc": "Delicious wheat beer brewed with coriander and orange peel (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Corona Extra – 330 ml", "price": 350, "veg": True, "desc": "Iconic Mexican pale lager served with a slice of fresh lime (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Hoegaarden – 330 ml", "price": 380, "veg": True, "desc": "Authentic Belgian wheat beer with natural cloudiness and citrus aroma (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Heineken – 330 ml", "price": 320, "veg": True, "desc": "Pure malt Dutch premium lager brewed with 100% barley and A-yeast (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Craft Draught Beer – 330 ml", "price": 299, "veg": True, "desc": "Freshly pulled artisanal craft beer on tap (330ml).", "serving_size": "330 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"},
            {"name": "Craft Draught Beer – 500 ml", "price": 399, "veg": True, "desc": "Large stein of fresh draught craft beer on tap (500ml).", "serving_size": "500 ml", "img": "https://images.unsplash.com/photo-1608270191965-02946c7664ff?w=800&q=80"}
        ]
    },

    # 20. WHISKY (with 30ml / 60ml variants)
    {
        "category": "Whisky",
        "slug": "whisky",
        "description": "Single malts, blended Scotch, Irish whiskeys and premium American bourbons.",
        "display_order": 20,
        "is_alcohol": True,
        "items": [
            {"name": "Blenders Pride", "price": 220, "price_60": 420, "veg": True, "desc": "Smooth Indian whisky blended with imported Scotch malts.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "100 Pipers", "price": 230, "price_60": 440, "veg": True, "desc": "Smooth blended Scotch whisky with smoky and fruity notes.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Teacher's Highland Cream", "price": 260, "price_60": 500, "veg": True, "desc": "High peat content blended Scotch with rich amber depth.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Jameson", "price": 320, "price_60": 620, "veg": True, "desc": "Triple distilled smooth Irish whiskey with hints of toasted wood.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Jack Daniel's", "price": 360, "price_60": 700, "veg": True, "desc": "Tennessee sour mash whiskey mellowed through sugar maple charcoal.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Chivas Regal 12", "price": 390, "price_60": 760, "veg": True, "desc": "Rich 12-year-old blended Scotch with notes of honey, hazelnut, and ripe orchard fruit.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Johnnie Walker Black Label", "price": 390, "price_60": 760, "veg": True, "desc": "Iconic 12-year blended Scotch with deep layers of smoke and rich fruit.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Glenlivet 12", "price": 480, "price_60": 930, "veg": True, "desc": "Classic Speyside single malt scotch matured in European and American oak.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Glenfiddich 12", "price": 520, "price_60": 1000, "veg": True, "desc": "World's most awarded single malt with notes of fresh pear and subtle oak.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Monkey Shoulder", "price": 420, "price_60": 820, "veg": True, "desc": "Rich, smooth, and playful blend of three Speyside single malts.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"}
        ]
    },

    # 21. VODKA (with 30ml / 60ml variants)
    {
        "category": "Vodka",
        "slug": "vodka",
        "description": "Distilled grain vodkas, triple-filtered spirits and ultra-premium brands.",
        "display_order": 21,
        "is_alcohol": True,
        "items": [
            {"name": "Smirnoff", "price": 220, "price_60": 420, "veg": True, "desc": "Triple distilled, ten times filtered classic grain vodka.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Absolut", "price": 280, "price_60": 540, "veg": True, "desc": "Swedish winter wheat vodka distilled continuously for pure smoothness.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Grey Goose", "price": 450, "price_60": 880, "veg": True, "desc": "French luxury vodka crafted from single-origin Picardie wheat and spring water.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Finlandia", "price": 280, "price_60": 540, "veg": True, "desc": "Clean Finnish vodka distilled from golden suomi barley and glacial spring water.", "img": "/images/publiq/drinks/apple-sour-martini.webp"},
            {"name": "Skyy Vodka", "price": 280, "price_60": 540, "veg": True, "desc": "Quadruple distilled American vodka with exceptionally smooth finish.", "img": "/images/publiq/drinks/apple-sour-martini.webp"}
        ]
    },

    # 22. RUM (with 30ml / 60ml variants)
    {
        "category": "Rum",
        "slug": "rum",
        "description": "Dark molasses rums, white rums, spiced rums and coconut Caribbean spirits.",
        "display_order": 22,
        "is_alcohol": True,
        "items": [
            {"name": "Old Monk", "price": 180, "price_60": 340, "veg": True, "desc": "Legendary Indian vatted dark rum with rich caramel and vanilla aroma.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Bacardi Carta Blanca", "price": 220, "price_60": 420, "veg": True, "desc": "Classic Puerto Rican white rum aged in white oak barrels for light crisp cocktail notes.", "img": "/images/publiq/drinks/spiced-mango-mojito.webp"},
            {"name": "Bacardi Black", "price": 250, "price_60": 480, "veg": True, "desc": "Rich, robust dark rum crafted in heavily charred oak barrels.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Captain Morgan", "price": 250, "price_60": 480, "veg": True, "desc": "Original spiced Caribbean rum seasoned with island spices and natural flavours.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Malibu", "price": 280, "price_60": 540, "veg": True, "desc": "Caribbean white rum infused with natural coconut flavour.", "img": "/images/publiq/drinks/hawaiian-colada-mocktail.webp"}
        ]
    },

    # 23. GIN (with 30ml / 60ml variants)
    {
        "category": "Gin",
        "slug": "gin",
        "description": "London dry gins, Indian craft botanicals and Scottish cucumber & rose infusions.",
        "display_order": 23,
        "is_alcohol": True,
        "items": [
            {"name": "Greater Than", "price": 260, "price_60": 500, "veg": True, "desc": "Pioneering Indian London dry gin distilled with Himalayan juniper and fresh citrus.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Bombay Sapphire", "price": 320, "price_60": 620, "veg": True, "desc": "Vapour-infused with 10 hand-selected exotic botanicals from around the globe.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Tanqueray", "price": 350, "price_60": 680, "veg": True, "desc": "Four times distilled London dry gin with perfect balance of juniper and coriander.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Hendrick's", "price": 500, "price_60": 950, "veg": True, "desc": "Small batch Scottish gin infused with Bulgarian rose petals and crisp cucumber.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Gordon's", "price": 280, "price_60": 540, "veg": True, "desc": "World's favourite London dry gin with hand-picked wild juniper berries.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"}
        ]
    },

    # 24. TEQUILA AND BRANDY (with 30ml / 60ml variants)
    {
        "category": "Tequila and Brandy",
        "slug": "tequila-brandy",
        "description": "Mexican blue agave tequilas and fine matured grape brandies.",
        "display_order": 24,
        "is_alcohol": True,
        "items": [
            {"name": "Jose Cuervo", "price": 300, "price_60": 580, "veg": True, "desc": "Especial Reposado gold tequila rested in seasoned oak casks.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Camino Tequila", "price": 280, "price_60": 540, "veg": True, "desc": "Mexican silver tequila distilled from blue Weber agave with clean citrus finish.", "img": "/images/publiq/drinks/publiq-gold-elixir.webp"},
            {"name": "Mansion House Brandy", "price": 180, "price_60": 340, "veg": True, "desc": "Popular French grape brandy aged in oak vats with rich fruit aroma.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"},
            {"name": "Morpheus Brandy", "price": 220, "price_60": 420, "veg": True, "desc": "XO blended premium grape brandy aged in seasoned oak barrels.", "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp"}
        ]
    },

    # 25. WINE
    {
        "category": "Wine",
        "slug": "wine",
        "description": "Estate red wines, crisp sauvignon blancs, sparkling proseccos and reserve vintages.",
        "display_order": 25,
        "is_alcohol": True,
        "items": [
            {"name": "House Red Wine – 150 ml", "price": 399, "veg": True, "desc": "Medium-bodied red wine with ripe berry notes and soft oak tannins (150ml Glass).", "serving_size": "150 ml Glass", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "House White Wine – 150 ml", "price": 399, "veg": True, "desc": "Crisp and dry white wine with notes of green apple and fresh citrus (150ml Glass).", "serving_size": "150 ml Glass", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "Premium Red Wine – 150 ml", "price": 499, "veg": True, "desc": "Full-bodied reserve cabernet sauvignon with blackcurrant and cedar aromas (150ml Glass).", "serving_size": "150 ml Glass", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "Premium White Wine – 150 ml", "price": 499, "veg": True, "desc": "Estate chardonnay with butter notes, white peach and crisp minerality (150ml Glass).", "serving_size": "150 ml Glass", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "Sparkling Wine – 150 ml", "price": 599, "veg": True, "desc": "Effervescent dry prosecco with golden bubbles and floral aromatics (150ml Flute).", "serving_size": "150 ml Flute", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "House Red Wine Bottle – 750 ml", "price": 1899, "veg": True, "desc": "Full bottle of our signature house red blend (750ml Bottle).", "serving_size": "750 ml Bottle", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "House White Wine Bottle – 750 ml", "price": 1899, "veg": True, "desc": "Full bottle of crisp, refreshing house white wine (750ml Bottle).", "serving_size": "750 ml Bottle", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"},
            {"name": "Premium Wine Bottle – 750 ml", "price": 2499, "veg": True, "desc": "Handcrafted vintage reserve wine bottle aged in French oak (750ml Bottle).", "serving_size": "750 ml Bottle", "img": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"}
        ]
    }
]

def run_import():
    db: Session = SessionLocal()
    try:
        print("--- STARTING COMPLETE DIGITAL MENU REPLACEMENT ---")
        
        # 1. Archive previously active products (Do not delete historical records)
        old_items = db.query(MenuItem).filter(MenuItem.is_available == True).all()
        for it in old_items:
            it.is_available = False
        db.commit()
        print(f"Archived {len(old_items)} historical products to preserve order and invoice records.")

        # 2. Archive previously active categories that don't match our new slugs
        new_slugs = {c["slug"] for c in CATALOGUE}
        old_cats = db.query(MenuCategory).all()
        for cat in old_cats:
            if cat.slug not in new_slugs:
                cat.is_active = False
        db.commit()

        # 3. Create or update categories and products
        total_imported = 0
        categories_imported = 0

        for cat_data in CATALOGUE:
            category = db.query(MenuCategory).filter(MenuCategory.slug == cat_data["slug"]).first()
            if not category:
                category = MenuCategory(
                    name=cat_data["category"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    display_order=cat_data["display_order"],
                    image_url=cat_data["items"][0]["img"] if cat_data["items"] else None,
                    is_alcohol=cat_data["is_alcohol"],
                    is_active=True
                )
                db.add(category)
                db.commit()
                db.refresh(category)
            else:
                category.name = cat_data["category"]
                category.description = cat_data["description"]
                category.display_order = cat_data["display_order"]
                category.image_url = cat_data["items"][0]["img"] if cat_data["items"] else category.image_url
                category.is_alcohol = cat_data["is_alcohol"]
                category.is_active = True
                db.commit()

            categories_imported += 1

            for item_data in cat_data["items"]:
                item_slug = f"{slugify(item_data['name'])}-{cat_data['slug']}" if cat_data['slug'] == 'bar-snacks' else slugify(item_data["name"])

                item = db.query(MenuItem).filter(MenuItem.slug == item_slug).first()
                if not item:
                    item = MenuItem(
                        category_id=category.id,
                        name=item_data["name"],
                        slug=item_slug,
                        description=item_data["desc"],
                        base_price=float(item_data["price"]),
                        is_veg=item_data["veg"],
                        is_alcohol=cat_data["is_alcohol"],
                        alcohol_abv=42.8 if cat_data["is_alcohol"] and "whisky" in cat_data["slug"] else (5.0 if "beer" in cat_data["slug"] else (13.5 if "wine" in cat_data["slug"] else None)),
                        serving_size=item_data.get("serving_size", "30 ml" if "price_60" in item_data else "1 Portion"),
                        is_bestseller="Special" in item_data["name"] or "Signature" in item_data["name"] or "Butter Chicken" in item_data["name"] or "Biryani" in item_data["name"],
                        is_signature="PUBLIQ" in item_data["name"] or "Signature" in item_data["name"],
                        preparation_time_minutes=15,
                        image_url=item_data["img"],
                        is_available=True,
                        kitchen_station="BAR" if cat_data["is_alcohol"] or cat_data["slug"] in ["mocktails", "fresh-juices", "milkshakes", "soft-drinks-beverages"] else ("TANDOOR" if "tikka" in item_data["name"].lower() or "tandoori" in item_data["name"].lower() or "kebab" in item_data["name"].lower() else "MAIN_KITCHEN")
                    )
                    db.add(item)
                    db.commit()
                    db.refresh(item)
                else:
                    item.category_id = category.id
                    item.name = item_data["name"]
                    item.description = item_data["desc"]
                    item.base_price = float(item_data["price"])
                    item.is_veg = item_data["veg"]
                    item.is_alcohol = cat_data["is_alcohol"]
                    item.image_url = item_data["img"]
                    item.is_available = True
                    item.serving_size = item_data.get("serving_size", "30 ml" if "price_60" in item_data else "1 Portion")
                    db.commit()

                # Add 30ml and 60ml variants for spirits
                if "price_60" in item_data:
                    delta = float(item_data["price_60"]) - float(item_data["price"])
                    db.query(MenuVariant).filter(MenuVariant.item_id == item.id).delete()
                    v30 = MenuVariant(item_id=item.id, name="30 ml Peg", price_delta=0.0, is_default=True)
                    v60 = MenuVariant(item_id=item.id, name="60 ml Peg", price_delta=delta, is_default=False)
                    db.add_all([v30, v60])
                    db.commit()

                total_imported += 1

        print(f"SUCCESS: Successfully imported {total_imported} menu items across {categories_imported} categories.")
        return total_imported, categories_imported

    except Exception as e:
        db.rollback()
        print(f"ERROR: Import failed with error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
