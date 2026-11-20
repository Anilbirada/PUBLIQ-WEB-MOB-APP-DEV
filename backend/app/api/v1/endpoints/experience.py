from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.models import WebsiteContent, GalleryItem, Testimonial, PrivateEventBooking

router = APIRouter()

# --- 1. PUBLIQ CINEMATIC EXPERIENCE VIDEOS ---

class VideoItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    video_url: str
    poster_url: str
    duration_seconds: int
    display_order: int
    is_active: bool = True
    tagline: str

INITIAL_VIDEOS: List[dict] = [
    {
        "id": "vid-1",
        "title": "Fresh Charcoal Tandoor & Grills",
        "category": "Live Kitchen & Tandoor",
        "description": "Watch our master chefs grill tender kebabs over live charcoal embers and slow-simmer rich Awadhi gravies in our open kitchen.",
        "video_url": "/videos/food.mp4",
        "poster_url": "/images/publiq/food/tandoori-mixed-grill.webp",
        "duration_seconds": 38,
        "display_order": 1,
        "is_active": True,
        "tagline": "Fresh Charcoal Grills & Rich Indian Curries"
    },
    {
        "id": "vid-2",
        "title": "Handcrafted Cocktails & Mixology",
        "category": "Signature Bar & Drinks",
        "description": "Watch our master bartenders craft smoked bourbon drinks, edible 24K gold cocktails, and refreshing tropical fruit coolers.",
        "video_url": "/videos/cocktails.mp4",
        "poster_url": "/images/publiq/drinks/publiq-gold-elixir.webp",
        "duration_seconds": 34,
        "display_order": 2,
        "is_active": True,
        "tagline": "Creative Cocktails & Fresh Botanicals"
    },
    {
        "id": "vid-3",
        "title": "Spirits Cellar & Single Malts",
        "category": "Fine Spirits & Craft Beers",
        "description": "Explore our curated collection of single malts, aged bourbons, premium wines, and fresh draft craft beers on tap.",
        "video_url": "/videos/bar.mp4",
        "poster_url": "/images/publiq/drinks/publiq-smoked-bourbon.webp",
        "duration_seconds": 42,
        "display_order": 3,
        "is_active": True,
        "tagline": "Premium Whiskies, Wines & Cold Draft Beers"
    },
    {
        "id": "vid-4",
        "title": "Weekend Live DJ & Nightlife Party",
        "category": "Nightlife & Live DJ",
        "description": "Feel the electric energy of weekend DJ music, live acoustic sessions, dancing, and cocktail toasts under starlit canopies.",
        "video_url": "/videos/party.mp4?v=3",
        "poster_url": "/images/publiq/events/publiq-nightlife-party.webp?v=3",
        "duration_seconds": 45,
        "display_order": 4,
        "is_active": True,
        "tagline": "Live DJ Music, Great Beats & Party Energy"
    },
    {
        "id": "vid-5",
        "title": "The Blossom Dining Hall & Atmosphere",
        "category": "Dining Experience",
        "description": "Relax in our beautiful illuminated floral dining room with velvet booths and private tables made for celebrations.",
        "video_url": "/videos/ambience.mp4",
        "poster_url": "/images/publiq/interior/publiq-interior-hero.webp",
        "duration_seconds": 40,
        "display_order": 5,
        "is_active": True,
        "tagline": "Warm Hospitality & Elegant Ambiance"
    }
]

videos_db = [dict(v) for v in INITIAL_VIDEOS]

@router.get("/videos")
def get_experience_videos(active_only: bool = True):
    items = [v for v in videos_db if (v["is_active"] if active_only else True)]
    return sorted(items, key=lambda x: x["display_order"])

@router.post("/videos")
def create_or_update_video(payload: dict):
    video_id = payload.get("id") or f"vid-{str(uuid.uuid4())[:6]}"
    existing = next((v for v in videos_db if v["id"] == video_id), None)
    
    video_data = {
        "id": video_id,
        "title": payload.get("title", "Cinematic Experience"),
        "category": payload.get("category", "General"),
        "description": payload.get("description", ""),
        "video_url": payload.get("video_url", ""),
        "poster_url": payload.get("poster_url", ""),
        "duration_seconds": int(payload.get("duration_seconds", 30)),
        "display_order": int(payload.get("display_order", len(videos_db) + 1)),
        "is_active": bool(payload.get("is_active", True)),
        "tagline": payload.get("tagline", "Extraordinary Experience")
    }
    
    if existing:
        existing.update(video_data)
        return {"success": True, "action": "updated", "video": existing}
    else:
        videos_db.append(video_data)
        return {"success": True, "action": "created", "video": video_data}

@router.post("/videos/reorder")
def reorder_videos(ordered_ids: List[str]):
    for idx, vid_id in enumerate(ordered_ids):
        for v in videos_db:
            if v["id"] == vid_id:
                v["display_order"] = idx + 1
    return {"success": True, "message": "Videos reordered successfully"}


# --- 2. EVENTS & PRIVATE DINING ---

INITIAL_EVENTS = [
    {
        "id": "evt-1",
        "title": "Bespoke Birthday & Milestone Celebrations",
        "category": "Private Parties",
        "tagline": "Personalized Luxury with Custom Menus & Private Salon Styling",
        "description": "Celebrate your milestone birthday in our velvet dining booths or private salon. Includes custom dessert styling, bespoke tasting menus, signature cocktail named after the host, and dedicated steward service.",
        "capacity": "10 to 60 Guests",
        "image_url": "/images/publiq/events/publiq-event-birthday.webp",
        "inclusions": ["Custom Birthday Cake & Dessert Bar", "Dedicated Bartender & Steward", "Candlelit Floral Salon Decor", "Tailored 4-Course Degustation Menu"]
    },
    {
        "id": "evt-2",
        "title": "Corporate Soirées & Brand Receptions",
        "category": "Corporate Events",
        "tagline": "Sophisticated Business Entertaining & Cocktail Hours",
        "description": "Host memorable corporate dinners, product unveilings, or annual celebration mixers. High-speed Wi-Fi, audio-visual projection support, and seamless buffet or plated course arrangements.",
        "capacity": "20 to 120 Guests",
        "image_url": "/images/publiq/events/publiq-event-corporate.webp",
        "inclusions": ["Wireless Microphones & HD AV Setup", "Corporate GST Tax Invoicing", "Premium Open Bar Packages", "Executive Chef Live Stations"]
    },
    {
        "id": "evt-3",
        "title": "Exclusive Private Dining Suite Buyouts",
        "category": "Exclusive Venues",
        "tagline": "Total Privacy with Bespoke Sommelier & Chef Curations",
        "description": "Exclusive access to our private salon featuring dedicated bar counter, sommelier pairings, and personalized ambient lighting and sound control.",
        "capacity": "12 to 30 Guests",
        "image_url": "/images/publiq/events/publiq-private-dining-suite.webp",
        "inclusions": ["Exclusive Room Access", "Private Sommelier Pairing", "Customized Sound & Ambient Lighting", "Multi-Cuisine Charcoal Tandoor Tasting"]
    }
]

@router.get("/events")
def get_events_list():
    return INITIAL_EVENTS

@router.post("/events/enquiry")
def submit_event_enquiry(payload: dict, db: Session = Depends(get_db)):
    """Submit a private party or event enquiry saved to database."""
    name = payload.get("guest_name") or payload.get("name", "Valued Guest")
    phone = payload.get("phone", "")
    email = payload.get("email", "")
    event_type = payload.get("event_type", "Private Celebration")
    event_date = payload.get("preferred_date") or payload.get("event_date", datetime.now().strftime("%Y-%m-%d"))
    guest_count = int(payload.get("guest_count", 20))
    special_requests = payload.get("special_requests", "")

    booking = PrivateEventBooking(
        name=name,
        email=email,
        phone=phone,
        event_type=event_type,
        event_date=event_date,
        guest_count=guest_count,
        special_requirements=special_requests,
        status="PENDING"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "enquiry_id": booking.id,
        "message": f"Thank you, {name}. The PUBLIQ Event Concierge will contact you at {phone} within 2 hours to curate your celebration."
    }

@router.get("/events/enquiries")
def get_all_enquiries(db: Session = Depends(get_db)):
    bookings = db.query(PrivateEventBooking).order_by(PrivateEventBooking.created_at.desc()).all()
    return bookings


# --- 3. WEBSITE CMS & CONTENT MANAGEMENT ---

@router.get("/cms/sections")
def get_all_cms_sections(db: Session = Depends(get_db)):
    """Retrieve all website content sections for frontend rendering."""
    contents = db.query(WebsiteContent).all()
    result = {}
    for c in contents:
        result[c.section_key] = c.data
    return result

@router.get("/cms/section/{key}")
def get_cms_section(key: str, db: Session = Depends(get_db)):
    c = db.query(WebsiteContent).filter(WebsiteContent.section_key == key).first()
    if not c:
        return {}
    return c.data

@router.post("/cms/section/{key}")
def update_cms_section(key: str, payload: dict, db: Session = Depends(get_db)):
    """Admin endpoint to update website content sections."""
    c = db.query(WebsiteContent).filter(WebsiteContent.section_key == key).first()
    if not c:
        c = WebsiteContent(section_key=key, data=payload)
        db.add(c)
    else:
        c.data = payload
    db.commit()
    return {"success": True, "section": key, "data": c.data}


# --- 4. GALLERY & TESTIMONIALS ---

@router.get("/gallery")
def get_gallery_items(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(GalleryItem).filter(GalleryItem.is_active == True)
    if category and category.upper() != "ALL":
        query = query.filter(GalleryItem.category == category.upper())
    return query.order_by(GalleryItem.display_order.asc()).all()

@router.post("/gallery")
def add_gallery_item(payload: dict, db: Session = Depends(get_db)):
    item = GalleryItem(
        title=payload.get("title", "PUBLIQ Experience"),
        category=payload.get("category", "INTERIOR"),
        image_url=payload.get("image_url", "/images/publiq/interior/publiq-interior-hero.webp"),
        caption=payload.get("caption", ""),
        display_order=payload.get("display_order", 0)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "item": item}

@router.get("/testimonials")
def get_testimonials(db: Session = Depends(get_db)):
    return db.query(Testimonial).filter(Testimonial.is_active == True).order_by(Testimonial.display_order.asc()).all()


# --- 5. AI SOMMELIER & RESTAURANT ASSISTANT ---

class AiChatPayload(BaseModel):
    message: str
    guest_context: Optional[dict] = None

@router.post("/ai/chat")
def ai_restaurant_assistant(payload: AiChatPayload):
    msg = payload.message.lower().strip()
    
    if any(k in msg for k in ["wine", "cocktail", "pair", "drink", "whisky", "malt", "beer", "alcohol"]):
        if any(k in msg for k in ["kebab", "chicken", "tikka", "meat", "tandoor"]):
            reply = (
                "🍷 **PUBLIQ Sommelier Recommendation:** For our **Grand Tandoori Mixed Grill** or **Old Delhi Butter Chicken**, "
                "I recommend pairing with our **The PUBLIQ Gold Elixir** (the 24K cognac & orange blossom notes harmonize with tandoor smoke) "
                "or a dram of **The Macallan 12 Yrs Double Cask**, whose dried fruit and warm oak spices balance the rich makhani gravy impeccably."
            )
        elif any(k in msg for k in ["paneer", "veg", "dal", "vegetarian", "chaat"]):
            reply = (
                "🍸 **PUBLIQ Sommelier Recommendation:** With our **Beetroot & Truffle Chaat** or **Dal Makhani Grand Reserve**, "
                "our **Hendrick's Botanical Gin & Tonic** with cucumber and rose petal essence provides crisp effervescence that cuts through the creaminess, "
                "refreshing your palate with every bite."
            )
        else:
            reply = (
                "🥂 **PUBLIQ Spirits Cellar Highlights:** Our cellar features rare single malts like **Glenfiddich 12 Yrs** and **The Macallan 12 Yrs**, "
                "small-batch **Woodford Reserve Bourbon**, and artisan cocktails like our **Barrel Smoked Old Fashioned**. "
                "Let me know which course you are contemplating, and I shall curate your pour."
            )
    elif any(k in msg for k in ["recommend", "best", "signature", "popular", "famous", "food", "eat"]):
        if "veg" in msg:
            reply = (
                "🌿 **Executive Chef Rajeshwar Rawat's Vegetarian Signatures:**\n"
                "1. **Beetroot & Truffle Goat Cheese Chaat (₹420):** Crispy potato galette, organic roasted beetroot, and whipped cheese.\n"
                "2. **Dal Makhani Grand Reserve (₹460):** Simmered for 24 hours on glowing charcoal embers with churned butter.\n"
                "3. **Artisanal Truffle Garlic Naan (₹140):** Blistered tandoori bread with clarified butter and white truffle oil."
            )
        else:
            reply = (
                "🔥 **Chef's Non-Vegetarian Masterpieces:**\n"
                "1. **PUBLIQ Grand Tandoori Mixed Grill (₹890):** Kalmi kebabs, seekh, basil paneer, and tandoori king prawns.\n"
                "2. **Old Delhi Smoked Butter Chicken (₹590):** Charcoal-smoked boneless chicken in velvety San Marzano gravy.\n"
                "3. **Nizami Lamb Dum Biryani (₹680):** Slow-cooked lamb layered with aged saffron basmati in sealed handi."
            )
    elif any(k in msg for k in ["reserve", "table", "book", "seating", "timing", "hours"]):
        reply = (
            "✨ **PUBLIQ Concierge:** We offer four distinctive dining atmospheres:\n"
            "• **Main Dining & Atrium:** Candlelit tables under our illuminated blossom canopy.\n"
            "• **Resto-Bar & Mixology Lounge:** High-energy seating adjacent to the mixologist counter.\n"
            "• **Outdoor Terrace & Sky Deck:** Open-air skyline views with fire-pits.\n"
            "• **Private Dining Suite:** Exclusive VIP room for private celebrations.\n\n"
            "You can book immediately using our **Reserve Table** button or call **+91 98000 12345**."
        )
    elif any(k in msg for k in ["location", "where", "address", "parking", "dress code"]):
        reply = (
            "📍 **PUBLIQ Destination & Concierge Details:**\n"
            "• **Location:** Level 4 & Rooftop, Central Promenade, Hospitality District.\n"
            "• **Valet:** Complimentary VIP Valet Parking available at entrance.\n"
            "• **Hours:** 12:00 PM to 01:00 AM daily.\n"
            "• **Dress Code:** Smart casual / evening elegance."
        )
    else:
        reply = (
            "Welcome to **PUBLIQ Bar & Restaurant**. I am your AI Hospitality Concierge. "
            "I can assist you with spirit pairings, guide you through our culinary signatures, "
            "help coordinate a private celebration, or answer dining questions. How may I assist you today?"
        )

    return {
        "reply": reply,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# --- 6. AI PROMOTIONS MANAGEMENT ---

INITIAL_PROMOS = [
    {
        "id": "promo-1",
        "title": "Weekend Single Malt & Jazz Soirée",
        "channel": "Instagram & VIP Broadcast",
        "content_type": "Social Reel Copy & Video Script",
        "generated_content": "Whispers of Speyside oak meet evening elegance. 🎷🥃 Indulge in complimentary chef tasting plates with every twin peg of Glenfiddich or Macallan this Saturday night at PUBLIQ. Reserve your table early.",
        "video_prompt_concept": "Cinematic slow-motion pour of amber single malt over hand-carved ice sphere with soft golden bokeh background and saxophone jazz score.",
        "status": "APPROVED",
        "created_at": "2026-11-18T18:00:00Z",
        "reviewed_by": "General Manager"
    },
    {
        "id": "promo-2",
        "title": "Live Charcoal Tandoor Spotlight",
        "channel": "Website Hero & Email Newsletter",
        "content_type": "Culinary Storytelling",
        "generated_content": "24 hours of patience. Real embers. Pure churned butter. Experience the legend of Old Delhi recreated in our luxury dining atrium. Taste the smoke, cherish the luxury at PUBLIQ.",
        "video_prompt_concept": "High-speed macro capture of glowing red embers, skewers being lifted from clay tandoor, and velvety saffron butter gravy bubbling in brass pot.",
        "status": "PENDING_APPROVAL",
        "created_at": "2026-11-19T09:30:00Z",
        "reviewed_by": None
    }
]

promos_db = [dict(p) for p in INITIAL_PROMOS]

@router.get("/ai/promos")
def get_ai_promotions():
    return sorted(promos_db, key=lambda x: x["created_at"], reverse=True)

@router.post("/ai/generate-promo")
def generate_ai_promotional_content(payload: dict):
    theme = payload.get("theme", "Signature Mixology")
    channel = payload.get("channel", "Instagram & Web")
    promo_id = f"promo-{str(uuid.uuid4())[:6]}"
    new_promo = {
        "id": promo_id,
        "title": f"PUBLIQ Spotlight: {theme.title()}",
        "channel": channel,
        "content_type": "Video Script & Campaign",
        "generated_content": f"Elevate your evenings where exquisite gastronomy meets transcendent mixology. At PUBLIQ, every pour tells a story, and every dish is a celebration of taste. Experience {theme.lower()} redefined in our luxury dining atrium.",
        "video_prompt_concept": f"Cinematic sweeping camera shot starting over candlelit dining tables, zooming into a bartender straining a smoking 24K gold cocktail with rim lighting.",
        "status": "PENDING_APPROVAL",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_by": None
    }
    promos_db.insert(0, new_promo)
    return {"success": True, "promo": new_promo, "message": "Campaign generated and queued for Manager approval."}

@router.post("/ai/promos/{promo_id}/approve")
def approve_ai_promotion(promo_id: str):
    promo = next((p for p in promos_db if p["id"] == promo_id), None)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    promo["status"] = "APPROVED"
    promo["reviewed_by"] = "General Manager"
    promo["approved_at"] = datetime.now(timezone.utc).isoformat()
    return {"success": True, "promo": promo}
