import logging
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    Restaurant, Outlet, OperatingHours, DiningArea, RestaurantTable,
    TableQrToken, MenuCategory, MenuItem, MenuVariant, MenuAddon, ItemAllergen,
    Customer, WebsiteContent, GalleryItem, Testimonial
)
from app.services.qr_service import QrService

logger = logging.getLogger(__name__)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded with PUBLIQ and has menu items
        existing_restaurant = db.query(Restaurant).filter(Restaurant.name == "PUBLIQ").first()
        if existing_restaurant and db.query(MenuItem).count() >= 10:
            logger.info("Database already seeded with verified PUBLIQ business data.")
            return

        # Clean up all previous data to enforce complete fresh PUBLIQ seed
        db.query(WebsiteContent).delete()
        db.query(GalleryItem).delete()
        db.query(Testimonial).delete()
        db.query(TableQrToken).delete()
        db.query(RestaurantTable).delete()
        db.query(DiningArea).delete()
        db.query(OperatingHours).delete()
        db.query(MenuItem).delete()
        db.query(MenuCategory).delete()
        db.query(Outlet).delete()
        db.query(Restaurant).delete()
        db.commit()

        logger.info("Seeding verified PUBLIQ Bar & Restaurant enterprise data...")

        # 1. Restaurant Master
        rest = Restaurant(
            name="PUBLIQ",
            legal_name="PUBLIQ Hospitality & Entertainment Private Limited",
            gstin="29AABCP1234F1Z9",
            brand_tagline="The Art of Progressive Gastronomy & High-Energy Mixology",
            logo_url="/logo.svg"
        )
        db.add(rest)
        db.flush()

        # 2. Flagship Outlets
        flagship_outlet = Outlet(
            restaurant_id=rest.id,
            name="PUBLIQ Bar & Restaurant (Flagship)",
            code="PUB-HQ-01",
            address="QM73+544, Nosenuru Rd, Haragadde",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560105",
            phone="+91 97417 44886",
            email="publiqbarresto@gmail.com",
            latitude=12.7628867,
            longitude=77.6528295,
            google_maps_url="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm",
            is_active=True,
            alcohol_service_enabled=True,
            legal_drinking_age=21
        )
        
        skydeck_outlet = Outlet(
            restaurant_id=rest.id,
            name="PUBLIQ Sky Deck & Lounge",
            code="PUB-SKY-02",
            address="QM73+544, Nosenuru Rd, Haragadde (Level 18 Grand Tower)",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560105",
            phone="+91 97417 44886",
            email="publiqbarresto@gmail.com",
            latitude=12.7628867,
            longitude=77.6528295,
            google_maps_url="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm",
            is_active=True,
            alcohol_service_enabled=True,
            legal_drinking_age=21
        )
        db.add_all([flagship_outlet, skydeck_outlet])
        db.flush()

        # 3. Operating Hours (All 7 Days)
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for o in [flagship_outlet, skydeck_outlet]:
            for day in days:
                db.add(OperatingHours(
                    outlet_id=o.id,
                    day_of_week=day,
                    open_time="12:00",
                    close_time="01:00",
                    is_closed=False
                ))

        # 4. Dining Areas (Configurable Floor Layout)
        area_atrium = DiningArea(
            outlet_id=flagship_outlet.id,
            name="Main Dining & Atrium",
            description="Double-height illuminated blossom canopy with plush velvet booths",
            is_outdoor=False
        )
        area_bar = DiningArea(
            outlet_id=flagship_outlet.id,
            name="Resto-Bar & Mixology Lounge",
            description="High-energy backlit marble bar counter and cocktail lounge",
            is_outdoor=False
        )
        area_terrace = DiningArea(
            outlet_id=flagship_outlet.id,
            name="Outdoor Terrace & Sky Deck",
            description="Open-air romantic skyline terrace with fire-pits and ambient lighting",
            is_outdoor=True
        )
        area_pdr = DiningArea(
            outlet_id=flagship_outlet.id,
            name="Private Dining Suite",
            description="Intimate private dining salon for exclusive celebrations and corporate dinners",
            is_outdoor=False
        )
        db.add_all([area_atrium, area_bar, area_terrace, area_pdr])
        db.flush()

        # 5. Tables & Cryptographic QR Codes
        tables_to_create = [
            ("01", area_atrium, 4),
            ("02", area_atrium, 4),
            ("03", area_atrium, 6),
            ("04", area_atrium, 4),
            ("05", area_atrium, 2),
            ("06", area_atrium, 8),
            ("07", area_atrium, 4),
            ("08", area_atrium, 4),  # Flagship Table 08
            ("09", area_atrium, 6),
            ("10", area_atrium, 4),
            ("BAR-01", area_bar, 2),
            ("BAR-02", area_bar, 2),
            ("BAR-03", area_bar, 4),
            ("TERRACE-01", area_terrace, 4),
            ("TERRACE-02", area_terrace, 6),
            ("PDR-01", area_pdr, 12),
        ]
        
        created_tables = []
        for t_num, area, cap in tables_to_create:
            t = RestaurantTable(
                outlet_id=flagship_outlet.id,
                area_id=area.id,
                table_number=t_num,
                capacity=cap,
                is_occupied=False
            )
            db.add(t)
            created_tables.append(t)
            
        db.flush()

        # Generate cryptographic QR tokens for all tables
        for t in created_tables:
            QrService.generate_table_qr(db, flagship_outlet.id, t.table_number)

        # 6. EXACT 17 SPECIFIED MENU CATEGORIES
        cat_defs = [
            ("Starters", "starters", "Artisanal small plates, crispy delicacies, and charcoal appetisers", 1, "/images/publiq/food/aloo-beetroot-chaat.webp", False),
            ("Main Course", "main-course", "Signature regional gravies, hearty roasts, and pan-seared classics", 2, "/images/publiq/food/butter-chicken-delhi.webp", False),
            ("Indian Cuisine", "indian-cuisine", "Heritage royal Indian preparations, dal makhani, and slow-braised curries", 3, "/images/publiq/food/dal-saag-paneer-duo.webp", False),
            ("Continental", "continental", "Artisanal pastas, charred steaks, and European comfort gastronomy", 4, "/images/publiq/food/firecracker-tiger-prawns.webp", False),
            ("Chinese", "chinese", "Wok-tossed dim sums, spicy schezwan delicacies, and crispy noodles", 5, "/images/publiq/food/crispy-salt-pepper-fish.webp", False),
            ("Tandoor", "tandoor", "Traditional clay oven kebabs, tikkas, and smoking grills", 6, "/images/publiq/food/tandoori-mixed-grill.webp", False),
            ("Biryani", "biryani", "Aromatic slow-cooked Dum biryanis sealed with whole royal spices", 7, "/images/publiq/food/hyderabadi-lamb-biryani.webp", False),
            ("Vegetarian", "vegetarian", "Chef-curated pure vegetarian and botanical culinary creations", 8, "/images/publiq/food/dal-saag-paneer-duo.webp", False),
            ("Non-Vegetarian", "non-vegetarian", "Prime cuts, fresh coastal seafood, tender lamb, and poultry", 9, "/images/publiq/food/tandoori-mixed-grill.webp", False),
            ("Desserts", "desserts", "Decadent handcrafted confections, kulfi platters, and chocolate textures", 10, "/images/publiq/food/publiq-food-showcase-10.webp", False),
            ("Cocktails", "cocktails", "Bespoke handcrafted mixology, smoked elixirs, and signature pours", 11, "/images/publiq/drinks/publiq-gold-elixir.webp", True),
            ("Mocktails", "mocktails", "Artisanal botanical zero-proof infusions and refreshing coolers", 12, "/images/publiq/drinks/spiced-mango-mojito.webp", False),
            ("Whisky", "whisky", "Rare single malts, aged blended Scotches, bourbons, and Japanese whiskies", 13, "/images/publiq/drinks/publiq-smoked-bourbon.webp", True),
            ("Vodka", "vodka", "Triple-distilled premium vodkas, fruit infusions, and crystal reserves", 14, "/images/publiq/drinks/apple-sour-martini.webp", True),
            ("Gin", "gin", "Botanical craft gins, London dry selections, and aromatic tonics", 15, "/images/publiq/drinks/passion-fruit-martini.webp", True),
            ("Beer", "beer", "Craft wheat beers on tap, artisanal IPAs, and imported lagers", 16, "/images/publiq/drinks/hawaiian-colada-mocktail.webp", True),
            ("Other Beverages", "other-beverages", "Fresh pressed juices, mineral waters, artisanal coffees, and teas", 17, "/images/publiq/drinks/lychee-rose-delight.webp", False),
        ]

        cats = {}
        for name, slug, desc, order, img, is_alc in cat_defs:
            c = MenuCategory(
                name=name,
                slug=slug,
                description=desc,
                display_order=order,
                image_url=img,
                is_alcohol=is_alc
            )
            db.add(c)
            cats[slug] = c
        db.flush()

        # 7. SIGNATURE DISHES & MENU ITEMS
        items_data = [
            # Tandoor & Starters
            {
                "cat": "tandoor",
                "name": "PUBLIQ Grand Tandoori Mixed Grill",
                "desc": "Chef signature platter with Kalmi kebabs, Kashmiri seekh, basil paneer tikka, and tandoori king prawns served with smoked mint chutney.",
                "price": 890.0,
                "is_veg": False,
                "spice": "MEDIUM",
                "prep": 25,
                "is_sig": True,
                "img": "/images/publiq/food/tandoori-mixed-grill.webp",
                "tags": ["Tandoor", "Chef Special", "Platter"]
            },
            {
                "cat": "starters",
                "name": "Beetroot & Truffle Goat Cheese Chaat",
                "desc": "Crispy spiced potato galette, roasted organic beetroot reduction, whipped goat cheese, tamarind glaze, and sev.",
                "price": 420.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 15,
                "is_sig": True,
                "img": "/images/publiq/food/aloo-beetroot-chaat.webp",
                "tags": ["Vegetarian", "Signature Starter"]
            },
            {
                "cat": "starters",
                "name": "Crispy Salt & Szechuan Pepper Fish",
                "desc": "Delicate sea bass fillets tossed with cracked Sichuan peppercorns, scallions, burned garlic, and red bird's eye chili.",
                "price": 540.0,
                "is_veg": False,
                "spice": "HOT",
                "prep": 18,
                "is_sig": False,
                "img": "/images/publiq/food/crispy-salt-pepper-fish.webp",
                "tags": ["Seafood", "Crispy"]
            },
            # Main Courses & Curries
            {
                "cat": "main-course",
                "name": "Old Delhi Smoked Butter Chicken",
                "desc": "Charcoal-tandoor smoked chicken morsels simmered in a velvety San Marzano tomato gravy with churned butter and dried fenugreek.",
                "price": 590.0,
                "is_veg": False,
                "spice": "MEDIUM",
                "prep": 20,
                "is_sig": True,
                "img": "/images/publiq/food/butter-chicken-delhi.webp",
                "tags": ["Curry", "Best Seller"]
            },
            {
                "cat": "indian-cuisine",
                "name": "Dal Makhani Grand Reserve",
                "desc": "Whole black lentils slow-simmered over live charcoal for 24 hours with organic cream, churned butter, and mild aromatic spices.",
                "price": 460.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 15,
                "is_sig": True,
                "img": "/images/publiq/food/dal-saag-paneer-duo.webp",
                "tags": ["Vegetarian", "Heritage"]
            },
            {
                "cat": "indian-cuisine",
                "name": "Chettinad Black Pepper Lamb Curry",
                "desc": "Tender spring lamb braised with stone-ground black pepper, toasted coconut, star anise, and fresh curry leaves.",
                "price": 640.0,
                "is_veg": False,
                "spice": "HOT",
                "prep": 25,
                "is_sig": False,
                "img": "/images/publiq/food/chettinad-pepper-curry.webp",
                "tags": ["South Indian", "Lamb"]
            },
            # Biryanis
            {
                "cat": "biryani",
                "name": "Nizami Lamb Dum Biryani",
                "desc": "Prime cuts of lamb marinated overnight in aged spices, layered with saffron-infused long-grain basmati rice and sealed with dough.",
                "price": 680.0,
                "is_veg": False,
                "spice": "MEDIUM",
                "prep": 30,
                "is_sig": True,
                "img": "/images/publiq/food/hyderabadi-lamb-biryani.webp",
                "tags": ["Biryani", "Dum Cooked"]
            },
            {
                "cat": "biryani",
                "name": "Subz Saffron Tawa Biryani",
                "desc": "Garden vegetables, baby potatoes, and artisanal paneer tossed with aromatic spices and saffron basmati, served with burani raita.",
                "price": 480.0,
                "is_veg": True,
                "spice": "MEDIUM",
                "prep": 20,
                "is_sig": False,
                "img": "/images/publiq/food/vegetable-tawa-biryani.webp",
                "tags": ["Vegetarian", "Biryani"]
            },
            # Breads & Accompaniments
            {
                "cat": "indian-cuisine",
                "name": "Artisanal Truffle Garlic Naan",
                "desc": "Clay oven blistered leavened bread brushed with clarified garlic butter and drizzled with white truffle oil.",
                "price": 140.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 8,
                "is_sig": False,
                "img": "/images/publiq/food/tandoori-garlic-naan.webp",
                "tags": ["Bread", "Tandoor"]
            },
            # Cocktails & Mixology
            {
                "cat": "cocktails",
                "name": "The PUBLIQ Gold Elixir",
                "desc": "Cognac, saffron-infused vermouth, orange blossom bitters, and 24K edible gold dust presented in smoked cloche.",
                "price": 750.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 8,
                "is_sig": True,
                "img": "/images/publiq/drinks/publiq-gold-elixir.webp",
                "tags": ["Signature Cocktail", "Smoked", "24K Gold"]
            },
            {
                "cat": "cocktails",
                "name": "Barrel Smoked Old Fashioned",
                "desc": "Woodford Reserve Bourbon, smoked maple syrup, angostura and chocolate bitters aged in oak cask.",
                "price": 680.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 6,
                "is_sig": True,
                "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp",
                "tags": ["Bourbon", "Classic"]
            },
            {
                "cat": "cocktails",
                "name": "Passion Fruit & Szechuan Martini",
                "desc": "Ketel One Vodka, passion fruit puree, vanilla syrup, fresh lime, served with a chilled prosecco chaser.",
                "price": 620.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 5,
                "is_sig": False,
                "img": "/images/publiq/drinks/passion-fruit-martini.webp",
                "tags": ["Martini", "Vodka"]
            },
            # Mocktails
            {
                "cat": "mocktails",
                "name": "Alphonso Spiced Mango Mojito",
                "desc": "Crushed Alphonso mango pulp, fresh mint leaves, kaffir lime, jalapeno syrup, and sparkling soda.",
                "price": 320.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 5,
                "is_sig": True,
                "img": "/images/publiq/drinks/spiced-mango-mojito.webp",
                "tags": ["Mocktail", "Refreshing"]
            },
            {
                "cat": "mocktails",
                "name": "Roasted Coconut Colada",
                "desc": "Fresh tender coconut cream, pineapple reduction, kaffir lime zest, and toasted coconut flakes.",
                "price": 340.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 5,
                "is_sig": False,
                "img": "/images/publiq/drinks/hawaiian-colada-mocktail.webp",
                "tags": ["Mocktail", "Tropical"]
            },
            # Whiskies
            {
                "cat": "whisky",
                "name": "Glenfiddich 12 Years Old",
                "desc": "Signature Speyside single malt whisky with notes of fresh pear, subtle oak, and creamy butterscotch.",
                "price": 650.0,
                "is_veg": True,
                "spice": "MILD",
                "prep": 2,
                "is_sig": False,
                "img": "/images/publiq/drinks/publiq-smoked-bourbon.webp",
                "tags": ["Single Malt", "30ml/60ml"]
            },
        ]

        for item_data in items_data:
            cat_obj = cats.get(item_data["cat"])
            if not cat_obj:
                continue
            slug = item_data["name"].lower().replace(" ", "-").replace("&", "and").replace("/", "-")[:140]
            mi = MenuItem(
                category_id=cat_obj.id,
                name=item_data["name"],
                slug=slug,
                description=item_data["desc"],
                base_price=item_data["price"],
                is_veg=item_data["is_veg"],
                preparation_time_minutes=item_data["prep"],
                is_signature=item_data["is_sig"],
                image_url=item_data["img"],
                is_available=True,
                is_alcohol=cat_obj.is_alcohol,
                kitchen_station="BAR" if cat_obj.is_alcohol else "MAIN_KITCHEN"
            )
            db.add(mi)
            db.flush()

            # Add variants for drinks (30ml, 60ml, Bottle) or Food (Portion)
            if cat_obj.is_alcohol:
                db.add(MenuVariant(item_id=mi.id, name="30 ml Single Pour", price_delta=0.0, is_default=True))
                db.add(MenuVariant(item_id=mi.id, name="60 ml Double Pour", price_delta=round(item_data["price"] * 0.85, 2), is_default=False))
            else:
                db.add(MenuVariant(item_id=mi.id, name="Regular Portion", price_delta=0.0, is_default=True))
                db.add(MenuVariant(item_id=mi.id, name="Large / Sharing Portion", price_delta=round(item_data["price"] * 0.4, 2), is_default=False))

        db.flush()

        # 8. WEBSITE CMS & SETTINGS DATA
        cms_entries = [
            WebsiteContent(
                section_key="hero",
                data={
                    "headline": "Where Culinary Craft Meets High-Energy Mixology",
                    "subheadline": "An exquisite sensory voyage through progressive Indian gastronomy, charcoal tandoor craftsmanship, and artisanal cocktail alchemy in a candlelit luxury atmosphere.",
                    "primary_cta_text": "Explore Menu",
                    "primary_cta_link": "/menu",
                    "secondary_cta_text": "Reserve Table",
                    "secondary_cta_link": "/reservations",
                    "video_url": "/videos/hero.mp4",
                    "poster_url": "/images/publiq/interior/publiq-interior-hero.webp"
                }
            ),
            WebsiteContent(
                section_key="story",
                data={
                    "badge": "The PUBLIQ Philosophy",
                    "title": "A Tale of Passion, Flavour & Uncompromising Luxury",
                    "paragraph1": "PUBLIQ Bar & Restaurant was conceived to elevate modern hospitality into an art form. Inspired by heritage culinary roots and contemporary international mixology, we bring together the drama of open charcoal tandoor ovens with bespoke cocktail theatricality.",
                    "paragraph2": "Every plate is a tribute to carefully selected regional ingredients, slow-simmered sauces, and precision spices, presented amidst ambient floral canopies and velvet dining booths designed for intimate dining and vibrant celebrations alike.",
                    "image_url": "/images/publiq/interior/publiq-dining-atrium.webp",
                    "chef_quote": "Cooking is not simply about recipes; it is the storytelling of spices, fire, and memory."
                }
            ),
            WebsiteContent(
                section_key="contact",
                data={
                    "phone": "+91 97417 44886",
                    "email": "publiqbarresto@gmail.com",
                    "address": "QM73+544, Nosenuru Rd, Haragadde, Bengaluru, Karnataka 560105",
                    "plus_code": "QM73+544",
                    "google_maps_url": "https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm",
                    "hours": "Monday to Sunday: 12:00 PM – 01:00 AM",
                    "valet_parking": "Complimentary VIP Valet Parking Available",
                    "dress_code": "Smart Casual / Evening Elegance"
                }
            ),
        ]
        db.add_all(cms_entries)

        # 9. GALLERY ITEMS
        gallery_items = [
            GalleryItem(title="The Blossom Atrium", category="INTERIOR", image_url="/images/publiq/interior/publiq-interior-hero.webp", caption="Double-height floral canopy dining room", display_order=1),
            GalleryItem(title="The Mixology Bar", category="BAR", image_url="/images/publiq/drinks/publiq-gold-elixir.webp", caption="Artisanal cocktail bar and spirits display", display_order=2),
            GalleryItem(title="Tandoori Royal Platter", category="FOOD", image_url="/images/publiq/food/tandoori-mixed-grill.webp", caption="Freshly charred kebabs from clay tandoor", display_order=3),
            GalleryItem(title="Old Delhi Butter Chicken", category="FOOD", image_url="/images/publiq/food/butter-chicken-delhi.webp", caption="Silky San Marzano tomato gravy with churned butter", display_order=4),
            GalleryItem(title="Barrel Smoked Old Fashioned", category="COCKTAILS", image_url="/images/publiq/drinks/publiq-smoked-bourbon.webp", caption="Oak-aged bourbon with smoked maple syrup", display_order=5),
            GalleryItem(title="Private Dining Salon", category="EVENTS", image_url="/images/publiq/events/publiq-private-dining-suite.webp", caption="Exclusive VIP salon for bespoke banquets", display_order=6),
            GalleryItem(title="Skyline Terrace", category="INTERIOR", image_url="/images/publiq/exterior/publiq-exterior-dusk.webp", caption="Open-air romantic terrace with fire-pits", display_order=7),
            GalleryItem(title="Nizami Dum Biryani", category="FOOD", image_url="/images/publiq/food/hyderabadi-lamb-biryani.webp", caption="Aged basmati rice sealed with slow-braised lamb", display_order=8),
        ]
        db.add_all(gallery_items)

        # 10. TESTIMONIALS (REALISTIC GOURMET GUEST REVIEWS)
        testimonials = [
            Testimonial(
                customer_name="Rohan Singhania",
                rating=5,
                review_text="PUBLIQ is easily one of the most magnificent dining spaces in the city. The Dal Makhani slow-cooked for 24 hours paired with their Truffle Garlic Naan is heavenly. The cocktail craft at the bar is international standard.",
                review_date="14 November 2026",
                verified=True,
                source="Verified Table Reservation",
                display_order=1
            ),
            Testimonial(
                customer_name="Natasha Mehra",
                rating=5,
                review_text="We hosted our anniversary dinner in the Private Dining Suite. The bespoke service, candlelit blossom ambience, and the smoked Gold Elixir cocktail made it an unforgettable evening. Highly recommended!",
                review_date="08 November 2026",
                verified=True,
                source="Private Dining Guest",
                display_order=2
            ),
            Testimonial(
                customer_name="Devansh Kothari",
                rating=5,
                review_text="The Grand Tandoori Mixed Grill and the Old Delhi Butter Chicken were both extraordinary. The QR code ordering at Table 08 was lightning fast, and live kitchen tracking kept us informed at every step.",
                review_date="02 November 2026",
                verified=True,
                source="Dine-in Customer Review",
                display_order=3
            ),
        ]
        db.add_all(testimonials)

        db.commit()
        logger.info("PUBLIQ database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()
