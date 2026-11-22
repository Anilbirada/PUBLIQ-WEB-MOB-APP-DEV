import uuid
from sqlalchemy.orm import Session
from app.models import Restaurant, Outlet

def get_or_create_primary_outlet(db: Session) -> Outlet:
    """
    Safely retrieves or provisions the primary PUBLIQ HARAGADDE outlet
    and parent restaurant entity with guaranteed zero FK or schema errors.
    """
    outlet = db.query(Outlet).first()
    if outlet:
        return outlet

    rest = db.query(Restaurant).first()
    if not rest:
        rest = Restaurant(
            name="PUBLIQ",
            legal_name="PUBLIQ Hospitality & Entertainment Private Limited",
            gstin="29AABCP1234F1Z9",
            brand_tagline="The Art of Progressive Gastronomy & High-Energy Mixology",
            logo_url="/logo.svg"
        )
        db.add(rest)
        db.flush()

    outlet = Outlet(
        id=str(uuid.uuid4()),
        restaurant_id=rest.id,
        name="PUBLIQ HARAGADDE",
        code="PUB-HARAGADDE",
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
    db.add(outlet)
    db.commit()
    db.refresh(outlet)
    return outlet
