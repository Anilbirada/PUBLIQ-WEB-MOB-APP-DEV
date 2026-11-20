import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    C_BG = RGBColor(14, 16, 20)         # Obsidian Black
    C_CARD = RGBColor(24, 27, 33)       # Dark Slate Card
    C_GOLD = RGBColor(212, 175, 55)     # Luxury Gold Accent
    C_WHITE = RGBColor(245, 245, 247)   # Crisp Text White
    C_MUTED = RGBColor(161, 161, 170)   # Subdued Muted Gray
    C_ACCENT_BG = RGBColor(32, 36, 45)  # Inner card background
    C_GREEN = RGBColor(74, 222, 128)    # Success emerald
    C_RED = RGBColor(248, 113, 113)     # Alert red

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, category, title, subtitle=None):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Category Tracker
        p0 = tf.paragraphs[0]
        p0.text = category.upper()
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = C_GOLD

        # Slide Title
        p1 = tf.add_paragraph()
        p1.text = title
        p1.font.size = Pt(24)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE
        p1.space_before = Pt(4)

        if subtitle:
            p2 = tf.add_paragraph()
            p2.text = subtitle
            p2.font.size = Pt(12)
            p2.font.color.rgb = C_MUTED
            p2.space_before = Pt(3)

    # -------------------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Accent decorative border
    top_line = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.8), Inches(0.08), Inches(5.9))
    top_line.fill.solid()
    top_line.fill.fore_color.rgb = C_GOLD
    top_line.line.fill.background()

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11.0), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "KICK BUNK"
    p0.font.size = Pt(48)
    p0.font.bold = True
    p0.font.color.rgb = C_GOLD

    p1 = tf.add_paragraph()
    p1.text = "Luxury Restaurant & Bar Management Platform"
    p1.font.size = Pt(28)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_before = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Executive Feature Walkthrough • Dual-Experience Architecture • End-to-End System Guide"
    p2.font.size = Pt(14)
    p2.font.color.rgb = C_MUTED
    p2.space_before = Pt(16)

    p3 = tf.add_paragraph()
    p3.text = "Customer Mobile App (Android/iOS) + Enterprise Web POS & Operations Hub"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = C_GOLD
    p3.space_before = Pt(30)

    # -------------------------------------------------------------
    # SLIDE 2: THE TWO WORLDS ARCHITECTURE
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "System Architecture", "The Two Worlds of KICK BUNK", "Dedicated customer luxury experience backed by a high-performance enterprise management hub.")

    def add_card(slide, x, y, w, h, title, subtitle, bullets, highlight_color=C_GOLD):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD
        card.line.color.rgb = highlight_color
        card.line.width = Pt(1.5)

        tb = slide.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.3), Inches(w - 0.6), Inches(h - 0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = tf.paragraphs[0]
        p0.text = title
        p0.font.size = Pt(18)
        p0.font.bold = True
        p0.font.color.rgb = highlight_color

        if subtitle:
            p1 = tf.add_paragraph()
            p1.text = subtitle
            p1.font.size = Pt(12)
            p1.font.color.rgb = C_MUTED
            p1.space_before = Pt(4)

        for b in bullets:
            p = tf.add_paragraph()
            p.text = f"•  {b}"
            p.font.size = Pt(12)
            p.font.color.rgb = C_WHITE
            p.space_before = Pt(8)

    add_card(s2, 0.8, 2.0, 5.6, 4.8, 
             "1. Customer Mobile Application", 
             "Exclusively for dining and bar guests",
             [
                 "Standalone native React Native / Expo app (Android APK ready)",
                 "Zero admin complexity: purely luxury ordering and table discovery",
                 "Universal QR camera scanner with automatic table identification",
                 "Customer Contact Verification: Full Name & Mobile (+91) enforced",
                 "Live order tracking from Kitchen to Table"
             ], C_GOLD)

    add_card(s2, 6.9, 2.0, 5.6, 4.8, 
             "2. Enterprise Web Platform", 
             "For Owners, GMs, Cashiers, Chefs, Bartenders & Staff",
             [
                 "Full Next.js 14 responsive operational terminal",
                 "Restaurant & Bar POS with 5% GST (2.5% CGST + 2.5% SGST)",
                 "Kitchen Display System (KOT / KDS) & Bar Dispense Station",
                 "Per-ml Liquor Cellar & Raw Material Inventory tracking",
                 "Staff Biometric PIN terminal, Suppliers, Expenses & Audit"
             ], RGBColor(96, 165, 250))

    # -------------------------------------------------------------
    # SLIDE 3: UNIVERSAL QR CODE & APP DETECTION
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Customer Channel", "Smart Universal QR Ordering & App Detection", "Seamless physical-to-digital transition with automatic device intelligence.")

    add_card(s3, 0.8, 2.0, 3.6, 4.8, 
             "STEP 1: Guest Scans", 
             "Table QR Plaque",
             [
                 "Every table holds a bespoke cryptographic QR code plaque.",
                 "Customer points native phone camera at the plaque.",
                 "URL: kickbunk.com/order/{token}",
                 "No special scanning apps required."
             ])

    add_card(s3, 4.8, 2.0, 3.6, 4.8, 
             "STEP 2: Intelligent Routing", 
             "Deep-Linking & Fallback",
             [
                 "App Detection checks if Kick Bunk Mobile App is installed.",
                 "If YES: Instantly launches native Android/iOS mobile application.",
                 "If NO: Automatically opens responsive web ordering.",
                 "Guest is NEVER forced to download an app to order."
             ], RGBColor(192, 132, 252))

    add_card(s3, 8.8, 2.0, 3.7, 4.8, 
             "STEP 3: Table Locked", 
             "Instant Context Identification",
             [
                 "Identifies Restaurant: KICK BUNK.",
                 "Identifies Outlet: Selected branch location.",
                 "Identifies Table Number: e.g. Table 08.",
                 "Loads live digital menu with table-specific ordering session."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 4: MANDATORY CUSTOMER CONTACT ENFORCEMENT
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Guest Authentication", "Customer Identification & Contact Security", "Mandatory Name and Mobile validation before any food or drink order is submitted.")

    add_card(s4, 0.8, 2.0, 5.6, 4.8, 
             "The Business Requirement", 
             "Why Contact Verification is Essential",
             [
                 "Prevents anonymous ghost orders from unauthorized scans.",
                 "Ties table orders directly to a responsible guest for POS billing.",
                 "Enables real-time SMS status alerts as dishes are prepared.",
                 "Builds the restaurant's high-value VIP customer loyalty directory.",
                 "Ensures seamless multi-steward and split-billing identification."
             ])

    add_card(s4, 6.9, 2.0, 5.6, 4.8, 
             "Technical Implementation", 
             "Validated on both Mobile App & Web",
             [
                 "Guest Full Name: Required string validation.",
                 "Mobile Number: Strictly validated 10-digit Indian (+91) format.",
                 "Checkout Shield: Order button remains locked until contact info is verified.",
                 "Stored securely in PostgreSQL relational database alongside Order items.",
                 "Auto-populates for repeat orders during the same dining session."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 5: DIGITAL MENU & SHOPPING CART
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Menu Experience", "Luxury Digital Catalog & Shopping Cart", "Artisanal food and beverage presentation with instant preparation filters.")

    add_card(s5, 0.8, 2.0, 3.6, 4.8, 
             "Artisanal Culinary Menu", 
             "35+ Curated Luxury Items",
             [
                 "Starters: Charcoal Kalmi Kebab, Truffle Paneer Tikka, Dahi Ke Kebab.",
                 "Mains: Old Delhi Butter Chicken, 24-Hour Dal Makhani, Awadhi Gosht.",
                 "Breads & Rice: Chur-Chur Garlic Naan, Mountain Mutton Biryani.",
                 "Dietary badges: Clear VEG / NON-VEG indicators and prep times."
             ])

    add_card(s5, 4.8, 2.0, 3.6, 4.8, 
             "Beverages & Spirits", 
             "Single Malts & Mixology",
             [
                 "Craft Cocktails: Smoked Bourbon Old Fashioned, Botanical Gin & Tonic.",
                 "Speyside Single Malts: Glenfiddich 12 Yrs, The Macallan 12 Sherry Oak.",
                 "Blended & Bourbons: Buffalo Trace, Black Dog Triple Gold.",
                 "Options for 30ml / 60ml pegs with mixers and ice preferences."
             ], C_GOLD)

    add_card(s5, 8.8, 2.0, 3.7, 4.8, 
             "Live Cart & Customization", 
             "Guest Convenience",
             [
                 "Special Instructions: 'Make it extra spicy', 'Serve drinks first'.",
                 "Real-time price recalculation with itemized bill preview.",
                 "Seamless multi-item ordering for the entire table party.",
                 "Instant order placement direct to central database."
             ], RGBColor(96, 165, 250))

    # -------------------------------------------------------------
    # SLIDE 6: KITCHEN DISPLAY SYSTEM (KOT / KDS)
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Back of House Operations", "Kitchen Display System (KOT / KDS)", "Paperless, real-time food preparation routing for Executive Chefs and line cooks.")

    add_card(s6, 0.8, 2.0, 5.6, 4.8, 
             "Smart Food-Only Ticket Routing", 
             "Zero Beverage Clutter for the Kitchen",
             [
                 "Beverage and bar items are automatically filtered out.",
                 "Tickets display Table Number, Guest Name, and exact Item Counts.",
                 "Special culinary instructions highlighted with visual alert icons.",
                 "Chronological queue prioritization based on order submission timestamp."
             ])

    add_card(s6, 6.9, 2.0, 5.6, 4.8, 
             "Chef Workflow & Delay Monitoring", 
             "Actionable State Machine",
             [
                 "One-touch lifecycle: PLACED → ACCEPTED → PREPARING → READY → SERVED.",
                 "Visual Delay Warning: Tickets turn amber/red if prep exceeds threshold.",
                 "Marking 'Ready' alerts floor stewards for immediate table delivery.",
                 "Audit trail records exact preparation duration for culinary KPIs."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 7: BAR ORDER MANAGEMENT & AUTO-DEDUCTION
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Beverage Operations", "Bar Dispense Station & Auto-Liquor Deduction", "Dedicated mixologist screen with automated per-milliliter stock reconciliation.")

    add_card(s7, 0.8, 2.0, 5.6, 4.8, 
             "Bartender Dispense Queue", 
             "Streamlined Drink Production",
             [
                 "Cocktails, single malts, wines, and cervezas route directly here.",
                 "Clear pour measurements: 30ml Peg, 60ml Peg, Full Pint, or Highball.",
                 "Mixer choices (Soda, Tonic, Ginger Ale) clearly distinguished.",
                 "Bartender confirms dispense with a single button press."
             ])

    add_card(s7, 6.9, 2.0, 5.6, 4.8, 
             "Automated Cellar Deduction Engine", 
             "Real-Time Liquor Inventory Sync",
             [
                 "Dispensing a drink automatically decants ml volume from open bottle.",
                 "When open bottle is exhausted, automatically opens next sealed bottle.",
                 "Eliminates end-of-night manual liquor measurement discrepancies.",
                 "Maintains legally compliant excise register in real time."
             ], C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 8: RESTAURANT & BAR POS TERMINAL
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Front of House Billing", "Restaurant & Bar POS Terminal", "Rapid table billing, statutory 5% Indian Restaurant GST, and shift management.")

    add_card(s8, 0.8, 2.0, 5.6, 4.8, 
             "Floor Grid & Bill Management", 
             "Intuitive Cashier Interface",
             [
                 "Visual table selector showing active occupied tables & covers.",
                 "Quick-add menu catalog for walk-in or phone-in orders.",
                 "VIP discretionary discount toggle (5%, 10%, 15%, 20%).",
                 "Table transfer and ticket merging capabilities.",
                 "Multi-tender settlement: Cash Float, UPI QR, and Card EDC."
             ])

    add_card(s8, 6.9, 2.0, 5.6, 4.8, 
             "Statutory Indian 5% GST Compliance", 
             "Accurate Automated Tax Engine",
             [
                 "Strict 5% Restaurant GST calculation (SAC 996331).",
                 "Accurately split into 2.5% CGST + 2.5% SGST on every invoice.",
                 "Cashier Shift accumulation with opening float tracking.",
                 "One-click formatted GST Invoice generation ready for thermal printing."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 9: LIQUOR & BAR INVENTORY CONTROL
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Inventory & Compliance", "Liquor & Bar Inventory Control", "Precision brand-wise tracking, open bottle volume, and excise reconciliation.")

    add_card(s9, 0.8, 2.0, 5.6, 4.8, 
             "Brand-Wise Spirits Tracking", 
             "Complete Cellar Asset Valuation",
             [
                 "Pre-configured brands: Glenfiddich, Macallan, Buffalo Trace, Ketel One, etc.",
                 "Dual tracking: Total Sealed Bottles in reserve + Open Bottle remaining ml.",
                 "Real-time conversion into remaining available 30ml/60ml servings.",
                 "Total cellar financial asset value computed at purchase cost."
             ])

    add_card(s9, 6.9, 2.0, 5.6, 4.8, 
             "Excise Reconciliation & Wastage", 
             "Strict Bar Governance",
             [
                 "Manual 'Open Bottle' action to decant sealed bottle to bar rack.",
                 "Log Breakage / Spillage with mandatory steward notes.",
                 "Record Complimentary / VIP Tasting pours to balance stock.",
                 "State Excise audit logs with brand excise identification codes."
             ], C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 10: KITCHEN RAW MATERIALS & STORE
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Supply Chain Control", "Kitchen Raw Materials & Dry Store", "Perishables and dry store stock control with automated low-stock warnings.")

    add_card(s10, 0.8, 2.0, 5.6, 4.8, 
             "Ingredient Catalog & Valuation", 
             "Cold Chain & Pantry Stock",
             [
                 "Poultry & Meats (Chicken drumsticks/thighs in KG).",
                 "Dairy & Fats (Artisanal paneer, Amul cow ghee, dairy cream).",
                 "Grains & Preserves (Aged Daawat Basmati, San Marzano tomatoes, lentils).",
                 "Gourmet imports (Urbani white truffle oil in Liters).",
                 "Total kitchen store asset value calculated in real time."
             ])

    add_card(s10, 6.9, 2.0, 5.6, 4.8, 
             "Stock Movement & Reorder Alerts", 
             "Zero Kitchen Stockouts",
             [
                 "Minimum Reorder Level triggers immediate visual RED warnings.",
                 "Log Stock-In from supplier Purchase Orders.",
                 "Log Culinary Spoilage & Wastage with reason codes.",
                 "Internal store transfers between central cold store and line prep."
             ], C_RED)

    # -------------------------------------------------------------
    # SLIDE 11: RECIPE ENGINEERING & FOOD COSTING
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Culinary Economics", "Recipe Engineering & Food Costing", "Detailed ingredient yield mapping, dish portion costing, and gross margin analytics.")

    add_card(s11, 0.8, 2.0, 5.6, 4.8, 
             "Engineered Recipe Cards", 
             "Transparent Food Costing",
             [
                 "Itemized ingredient breakdown for every dish and cocktail.",
                 "Example: Charcoal Kalmi Kebab uses 0.35kg chicken, curd, and ghee.",
                 "Food Cost: ₹124.00 vs Selling Price: ₹440.00.",
                 "Portion yield specifications (grams / pieces / cocktail volume)."
             ])

    add_card(s11, 6.9, 2.0, 5.6, 4.8, 
             "Hospitality Profitability Benchmarks", 
             "Healthy Gross Margin Assurance",
             [
                 "Automated Gross Margin % computation (e.g. 71.8% on kebabs, 81.8% on dal).",
                 "Ensures food cost % remains below the industry standard 30% benchmark.",
                 "Cocktail profitability analytics (e.g. 75.5% on Old Fashioned).",
                 "Feeds automated inventory deduction upon order placement."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 12: FLOOR PLAN & QR PLAQUE MANAGEMENT
    # -------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Physical Restaurant Control", "Floor Plan & Universal QR Plaque Management", "Dynamic visual table status and cryptographic table token regeneration.")

    add_card(s12, 0.8, 2.0, 5.6, 4.8, 
             "Interactive Floor Visualizer", 
             "Real-Time Dining Room Layout",
             [
                 "Dining Areas: Main Dining Hall, Mezzanine Lounge, Alfresco, Bar High Tops.",
                 "Dynamic status badges: AVAILABLE, OCCUPIED, BILLING, CLEANING.",
                 "One-click status updates for table busboys and floor captains.",
                 "Live table capacity indicators (2-Seater, 4-Seater, 6-Seater, Booths)."
             ])

    add_card(s12, 6.9, 2.0, 5.6, 4.8, 
             "Cryptographic Table QR Plaques", 
             "Anti-Tamper Token Security",
             [
                 "Every table plaque holds a unique cryptographic HMAC token.",
                 "Monitors total scan counts and last scanned timestamp.",
                 "Regenerate QR Token button instantly revokes compromised codes.",
                 "Generates high-resolution printable table plaque cards."
             ], RGBColor(96, 165, 250))

    # -------------------------------------------------------------
    # SLIDE 13: STAFF DIRECTORY & BIOMETRIC PIN TERMINAL
    # -------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    add_header(s13, "Workforce Management", "Staff Directory & Biometric PIN Attendance", "Staff roster, role permissions, and interactive shift punch terminal.")

    add_card(s13, 0.8, 2.0, 5.6, 4.8, 
             "Staff Directory & Role Badges", 
             "7 Seeded Enterprise Profiles",
             [
                 "General Manager, Outlet Manager, Senior Cashier, Executive Chef.",
                 "Head Mixologist, Inventory & Store Manager, Senior Floor Captain.",
                 "Stores employee contact phone, email, and compensation records.",
                 "Role-based authorization for sensitive POS actions and refunds."
             ])

    add_card(s13, 6.9, 2.0, 5.6, 4.8, 
             "PIN Clock-In / Clock-Out Terminal", 
             "Live Shift Attendance",
             [
                 "Interactive 4-digit PIN punch terminal (e.g. GM: 1001, Cashier: 1003).",
                 "Instant clock-in validation with employee name confirmation.",
                 "Tracks daily duty status: ON DUTY vs OFF DUTY with exact timestamps.",
                 "Audits payroll hours and cashier shift accountability."
             ], C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 14: VENDORS, PURCHASE ORDERS & EXPENSES
    # -------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    add_header(s14, "Financial Governance", "Vendors, Purchase Orders & Operating Expenses", "Procurement workflows and general ledger petty cash management.")

    add_card(s14, 0.8, 2.0, 5.6, 4.8, 
             "Verified Suppliers & POs", 
             "Procurement Directory",
             [
                 "5 Verified vendors (Poultry, Dairy, Grains, State Liquor, Truffles).",
                 "GSTIN tax compliance credentials and payment credit terms (NET 7-30).",
                 "Purchase Order tracking from ORDERED to RECEIVED.",
                 "Direct integration with raw material inventory upon receipt."
             ])

    add_card(s14, 6.9, 2.0, 5.6, 4.8, 
             "Operating Expenses & Petty Cash", 
             "Voucher Authorizations",
             [
                 "Records utility tariffs, machine maintenance, emergency mandi cash.",
                 "Payment modes: Cash Float, UPI, Company Card, Bank NEFT.",
                 "GM authorization stamp on every voucher.",
                 "Audited financial ledger preventing petty cash leakage."
             ], RGBColor(192, 132, 252))

    # -------------------------------------------------------------
    # SLIDE 15: FINANCIAL AUDIT & 5% STATUTORY GST
    # -------------------------------------------------------------
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15)
    add_header(s15, "Taxation & Analytics", "Financial Audit & 5% Statutory GST Reports", "Executive sales analytics, tender reconciliations, and tax compliance.")

    add_card(s15, 0.8, 2.0, 5.6, 4.8, 
             "Revenue & Executive KPIs", 
             "Real-Time Business Health",
             [
                 "Daily Gross Turnover & Total Guest Covers.",
                 "Average Order Value (AOV) tracking.",
                 "Live Dining Room table occupancy % rate.",
                 "Inventory warning counters for low liquor and raw materials."
             ])

    add_card(s15, 6.9, 2.0, 5.6, 4.8, 
             "Statutory GST Liability & Tenders", 
             "GSTR-3B Filing Ready",
             [
                 "Taxable turnover net of taxes.",
                 "Accurate 2.5% CGST liability + 2.5% SGST liability calculation.",
                 "Payment Tender Reconciliation: UPI vs Card Swipe vs Cash Register.",
                 "Cashier Shift reconciliation with opening float and safe balances."
             ], C_GREEN)

    # -------------------------------------------------------------
    # SLIDE 16: CONCLUSION & ACCESS LINKS
    # -------------------------------------------------------------
    s16 = prs.slides.add_slide(blank_layout)
    set_slide_background(s16)
    add_header(s16, "Platform Summary", "KICK BUNK Ready For Production Deployment", "Fully operational customer experience and restaurant management ecosystem.")

    add_card(s16, 0.8, 2.0, 5.6, 4.8, 
             "Customer Mobile & Web Links", 
             "Hospitality Ordering",
             [
                 "Customer Web Portal: http://localhost:3001",
                 "Sample Dine-In QR Ordering: http://localhost:3001/order/sample-table-08",
                 "Customer Mobile App (APK): kickbunk-customer.apk (66.6 MB)",
                 "Local Wi-Fi Network Access: http://192.168.1.2:3001",
                 "Cloud APK Download: expo.dev/artifacts/eas"
             ], C_GOLD)

    add_card(s16, 6.9, 2.0, 5.6, 4.8, 
             "Enterprise Web & API Endpoints", 
             "Operations & Backend Hub",
             [
                 "Enterprise Admin Suite: http://localhost:3001/admin",
                 "FastAPI Swagger Documentation: http://localhost:8001/docs",
                 "API Health Check: http://localhost:8001/api/v1/health",
                 "PostgreSQL 16: Port 5433 (37 Relational Tables)",
                 "FastAPI Server: Port 8001 (67 REST Endpoints)"
             ], RGBColor(96, 165, 250))

    output_path = "KICK_BUNK_Executive_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
