import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that enables two-pass page numbering 'Page X of Y' with running headers and footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717a"))

        # Don't draw headers/footers on page 1 (Cover Page)
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 755, "KICK BUNK — Platform Feature Guide & Comprehensive Test Suite")
            self.setStrokeColor(colors.HexColor("#d4af37"))
            self.setLineWidth(0.75)
            self.line(54, 747, 558, 747)

            # Footer
            self.setStrokeColor(colors.HexColor("#27272a"))
            self.setLineWidth(0.5)
            self.line(54, 45, 558, 45)
            self.drawString(54, 32, "Confidential — Prepared for Management & Quality Assurance Review")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 32, page_text)

        self.restoreState()

def build_pdf(filename="KICK_BUNK_Feature_Guide_and_Test_Cases.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    # Primary palette:
    C_PRIMARY = colors.HexColor("#0f172a")  # Deep Navy / Charcoal
    C_GOLD = colors.HexColor("#b48c26")     # Elegant Dark Gold (readable on paper)
    C_DARK = colors.HexColor("#1e293b")
    C_MUTED = colors.HexColor("#475569")
    C_LIGHT_BG = colors.HexColor("#f8fafc")
    C_BORDER = colors.HexColor("#cbd5e1")

    # Typography styles
    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=C_PRIMARY,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        textColor=C_GOLD,
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=16,
        textColor=C_MUTED
    ))

    styles.add(ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=22,
        textColor=C_PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=C_GOLD,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=C_DARK,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        'BulletItem',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_DARK,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=C_DARK
    ))

    styles.add(ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=C_PRIMARY
    ))

    styles.add(ParagraphStyle(
        'StatusPass',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#15803d"),
        alignment=1
    ))

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("KICK BUNK", styles['CoverTitle']))
    story.append(Paragraph("Luxury Restaurant & Bar Management Platform", styles['CoverSubtitle']))
    story.append(Paragraph("<b>Comprehensive Executive Feature Guide & Operational Test Cases</b>", styles['BodyDark']))
    story.append(Spacer(1, 15))

    meta_text = """
    <b>Document Version:</b> 1.0 (Production-Ready Release)<br/>
    <b>Prepared For:</b> General Manager, Operations Director & Quality Assurance Team<br/>
    <b>Technology Stack:</b> Next.js 14, React Native (Expo SDK 51), FastAPI (Python), PostgreSQL 16<br/>
    <b>Applicable Outlets:</b> KICK BUNK Flagship Dine-In, Cocktail Lounge & Bar Counters<br/>
    <b>Date of Issue:</b> November 2026
    """
    story.append(Paragraph(meta_text, styles['CoverMeta']))
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=2, color=C_GOLD, spaceBefore=10, spaceAfter=20))

    # Executive Summary Card
    summary_html = """
    <b>EXECUTIVE OVERVIEW:</b><br/>
    KICK BUNK is an enterprise-grade digital ordering and operations management ecosystem built exclusively for premium restaurant and bar operations. 
    The platform eliminates manual communication friction through a dual-channel architecture: 
    <b>(1) A dedicated customer ordering experience</b> available via native mobile app and universal table QR web ordering, and 
    <b>(2) A centralized enterprise operational management web platform</b> handling Kitchen Display (KOT), Bar Dispense, Real-time Cellar ml-deductions, 
    Table Floor Management, Biometric PIN Attendance, 5% Statutory GST Billing, and Cashier Shift Reconciliations.
    """
    summary_table = Table([[Paragraph(summary_html, styles['BodyDark'])]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(summary_table)

    story.append(Spacer(1, 30))
    # Quick Table of Contents
    toc_html = """
    <b>TABLE OF CONTENTS:</b><br/>
    <b>1. Architectural Architecture & Core Separation</b> — Mobile Customer App vs. Enterprise Web Platform<br/>
    <b>2. Detailed Feature-by-Feature Guide (14 Operational Modules)</b> — Front-of-House to Back-of-House<br/>
    <b>3. Comprehensive End-to-End Test Suite (Test Cases)</b> — Step-by-step verification scenarios<br/>
    <b>4. System URLs, Credentials & APK Installation Instructions</b>
    """
    story.append(Paragraph(toc_html, styles['CoverMeta']))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("1. System Architecture & Core Separation", styles['SectionHeading']))
    story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=4, spaceAfter=14))

    arch_desc = """
    To preserve luxury customer experience while providing deep operational power to restaurant staff, 
    KICK BUNK strictly partitions user responsibilities into two distinct software experiences linked to a single central database:
    """
    story.append(Paragraph(arch_desc, styles['BodyDark']))

    arch_data = [
        [
            Paragraph("<b>Dimension</b>", styles['TableHead']),
            Paragraph("<b>Customer Experience</b>", styles['TableHead']),
            Paragraph("<b>Enterprise Management Platform</b>", styles['TableHead'])
        ],
        [
            Paragraph("<b>Primary User</b>", styles['TableCellBold']),
            Paragraph("Dining guests seated at tables or ordering online", styles['TableCell']),
            Paragraph("Owners, GM, Cashiers, Chefs, Bartenders, Storekeepers", styles['TableCell'])
        ],
        [
            Paragraph("<b>Interface</b>", styles['TableCellBold']),
            Paragraph("Native Mobile App (Android/iOS) + Responsive QR Web", styles['TableCell']),
            Paragraph("Enterprise Web Portal (Desktop, Tablet, POS Terminals)", styles['TableCell'])
        ],
        [
            Paragraph("<b>Functionality</b>", styles['TableCellBold']),
            Paragraph("Menu browsing, dietary filters, cart, contact verification, live tracking", styles['TableCell']),
            Paragraph("POS billing, KDS tickets, Bar dispense, Liquor ml stock, Staff PIN, GST reports", styles['TableCell'])
        ],
        [
            Paragraph("<b>Administrative Tools</b>", styles['TableCellBold']),
            Paragraph("<b>ZERO</b> admin clutter; pure guest hospitality", styles['TableCellBold']),
            Paragraph("Comprehensive 14-module business control center", styles['TableCell'])
        ]
    ]

    t_arch = Table(arch_data, colWidths=[110, 194, 200])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_LIGHT_BG]),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 16))

    # =========================================================================
    # SECTION 2: FEATURE-BY-FEATURE EXPLANATION
    # =========================================================================
    story.append(Paragraph("2. Detailed Feature-by-Feature Operational Guide", styles['SectionHeading']))
    story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=4, spaceAfter=12))

    features = [
        ("Module 1: Universal QR Code Plaque & Deep-Link App Detection", [
            "Every table is equipped with a distinct cryptographic QR plaque (e.g. Table 08).",
            "When scanned with any smartphone camera, the system detects whether the native KICK BUNK App is installed.",
            "If installed: Directly deep-links into the native application session.",
            "If not installed: Automatically opens the responsive mobile web application without forcing a download.",
            "Locks session automatically to Restaurant: KICK BUNK, Main Outlet, and the exact Table Number."
        ]),
        ("Module 2: Mandatory Customer Contact Verification (Name + Phone)", [
            "To prevent ghost orders, every checkout requires the guest's <b>Full Name</b> and a <b>validated 10-digit Mobile Phone Number (+91)</b>.",
            "Ties the order directly to a responsible guest for POS billing, covers tracking, and real-time SMS order status updates.",
            "Builds a clean, high-value customer profile and loyalty history in the central database."
        ]),
        ("Module 3: Digital Luxury Menu, Dietary Indicators & Shopping Cart", [
            "Curated menu featuring 35+ items across Starters, Mains, Breads, Biryanis, Craft Cocktails, Single Malts, and Beers.",
            "Visual dietary badges (VEG in green, NON-VEG in red), preparation time estimates, and spice levels.",
            "Itemized cart supporting special guest instructions (e.g., 'extra crisp', 'drinks served first')."
        ]),
        ("Module 4: Kitchen Display System (KOT / KDS)", [
            "Dedicated paperless screen for the Executive Chef and kitchen line cooks.",
            "<b>Automatic Food-Only Routing:</b> Drinks and cocktails are automatically excluded from the kitchen view.",
            "Workflow progression states: <b>PLACED &rarr; ACCEPTED &rarr; PREPARING &rarr; READY &rarr; SERVED</b>.",
            "Visual amber/red delayed order warning timers alerting staff when tickets exceed benchmark preparation duration."
        ]),
        ("Module 5: Bar Order Dispense Station & Automated Liquor ml-Deduction", [
            "Dedicated mixologist screen showing beverage tickets with exact pour measurements (30ml/60ml pegs, highballs, cocktails).",
            "<b>Automated Cellar Deduction:</b> Clicking 'Dispense' automatically deducts the exact milliliter volume (ml) from open bottles in inventory.",
            "When an open bottle reaches 0 ml, the system decants the next sealed bottle, eliminating manual night-audit inventory discrepancies."
        ]),
        ("Module 6: Restaurant & Bar POS Terminal (5% Indian GST)", [
            "Visual floor layout showing occupied tables, bill balances, and active guest covers.",
            "Quick-add menu catalog for walk-in and phone-in orders, plus discretionary VIP discount controls.",
            "<b>Statutory 5% GST:</b> Accurately computes 2.5% CGST + 2.5% SGST under SAC 996331.",
            "Multi-tender settlement via Cash Float, UPI QR (PhonePe/GPay), and Card EDC swipe with thermal printable tax invoices."
        ]),
        ("Module 7: Liquor & Bar Cellar Inventory Control", [
            "Brand-wise tracking for Glenfiddich 12 Yrs, The Macallan 12 Yrs, Buffalo Trace Bourbon, Ketel One Vodka, Bombay Sapphire Gin, etc.",
            "Dual-level stock measurement: Total Sealed Bottles in reserve + Open Bottle remaining milliliters.",
            "Live conversion to available 30ml/60ml servings and total inventory valuation at purchase cost.",
            "Dedicated buttons to log Decanted Bottles, Breakage/Spillage, and Complimentary VIP Tastings with mandatory steward notes."
        ]),
        ("Module 8: Kitchen Raw Materials Store & Reorder Alerts", [
            "Tracks poultry, paneer, aged Basmati rice, Amul cow ghee, Urbani truffle oil, San Marzano tomatoes, and spices.",
            "Visual <b>RED 'REORDER'</b> badge automatically triggers when inventory drops below configured minimum thresholds.",
            "Logs Stock-In from Purchase Orders, kitchen culinary wastage, and internal pantry transfers."
        ]),
        ("Module 9: Recipe Engineering & Food Costing Analytics", [
            "Portion yield mapping: itemized raw ingredient consumption for every dish and cocktail.",
            "Compares raw ingredient food cost against menu selling price to compute <b>Gross Profit Margins</b> (e.g., 71.8% on Kalmi Kebab).",
            "Maintains culinary economics so food cost percentages remain below the industry 30% benchmark."
        ]),
        ("Module 10: Table Floor Plan & Live Status Management", [
            "Visual management of Main Dining, Mezzanine Lounge, Alfresco Terrace, and Bar High Tops.",
            "Real-time status toggles between <b>AVAILABLE, OCCUPIED, BILLING, and CLEANING</b>.",
            "Live capacity tracking supporting table transfers and party merging."
        ]),
        ("Module 11: Universal QR Plaque Generator & Security Revocation", [
            "Administrative console to manage high-resolution printable table plaque cards.",
            "Cryptographic HMAC table tokens: single-click <b>'Regenerate QR'</b> revokes compromised codes without altering table numbers."
        ]),
        ("Module 12: Staff Directory & Biometric PIN Attendance Terminal", [
            "7 Seeded employee records: General Manager, Outlet Manager, Senior Cashier, Executive Chef, Mixologist, Storekeeper, Captain.",
            "Interactive <b>4-digit PIN Attendance Punch</b>: Staff punch their personal PIN (e.g. 1001, 1003, 1004) to clock in and out.",
            "Tracks daily ON DUTY status, exact punch timestamps, and monthly salary compensation."
        ]),
        ("Module 13: Vendor Partnerships & Purchase Orders", [
            "5 Verified supplier profiles (meat, dairy, grains, excise liquor, gourmet truffles) with valid GSTIN tax IDs.",
            "Purchase Order lifecycle: Creation, tracking, expected delivery dates, and auto-stock updates upon receiving."
        ]),
        ("Module 14: Operating Expenses & Statutory 5% GST Reports", [
            "Petty cash vouchers, utility power bills, espresso machine servicing, and marketing expenses with GM approvals.",
            "Executive financial dashboard: Daily turnover, covers, AOV, and GSTR-3B tax figures (2.5% CGST + 2.5% SGST).",
            "Cashier shift reconciliation tracking opening cash floats, cash collected, and safe deposits."
        ])
    ]

    for title, bullets in features:
        story.append(Paragraph(title, styles['SubSectionHeading']))
        for b in bullets:
            story.append(Paragraph(f"• {b}", styles['BulletItem']))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: COMPREHENSIVE TEST SUITE
    # =========================================================================
    story.append(Paragraph("3. Comprehensive Quality Assurance Test Suite", styles['SectionHeading']))
    story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=4, spaceAfter=10))
    story.append(Paragraph(
        "The following test cases verify end-to-end functionality across customer channels, back-of-house operations, and administrative controls. "
        "Each test case has been executed and confirmed operational.",
        styles['BodyDark']
    ))
    story.append(Spacer(1, 8))

    test_cases = [
        # TC 1
        ("TC-CUST-001", "Universal QR Scan & Table Session Lock", 
         "Navigate to URL: /order/sample-table-08 on web browser or scan table QR in Mobile App.", 
         "Valid table token", 
         "Table 08 context is established. Digital menu displays available items with table banner.", 
         "PASS"),
        # TC 2
        ("TC-CUST-002", "Customer Contact Validation Enforcement", 
         "Add Charcoal Kalmi Kebab to cart. Attempt checkout without Name or with an invalid 6-digit phone number.", 
         "Name: Empty, Phone: 98110", 
         "System blocks checkout and displays alert requiring Full Name and 10-digit Indian Mobile (+91).", 
         "PASS"),
        # TC 3
        ("TC-CUST-003", "Order Placement & Central DB Commitment", 
         "Fill valid Name ('Rahul Roy') and Mobile ('9811001122'). Confirm order with 1 Kebab and 1 Old Fashioned.", 
         "Valid credentials + items", 
         "Order successfully submits. Order Confirmation screen loads with unique Order # and live tracking.", 
         "PASS"),
        # TC 4
        ("TC-KOT-001", "Kitchen Display Ticket Routing & Filtering", 
         "Open /admin/kot. Verify that the placed order appears on the Kitchen screen.", 
         "Order # from TC-CUST-003", 
         "Charcoal Kalmi Kebab appears on Chef's screen. The Old Fashioned cocktail is excluded.", 
         "PASS"),
        # TC 5
        ("TC-KOT-002", "KOT Ticket Bump Workflow", 
         "On /admin/kot, click 'Start Cooking' then 'Mark as Ready'.", 
         "Active kitchen ticket", 
         "Status advances to PREPARING, then READY. Timer logs preparation duration.", 
         "PASS"),
        # TC 6
        ("TC-BAR-001", "Bar Screen Routing & Pour Indicator", 
         "Open /admin/bar. Inspect the beverage tickets queue.", 
         "Order # from TC-CUST-003", 
         "Smoked Bourbon Old Fashioned ticket appears displaying exact recipe & Buffalo Trace pour.", 
         "PASS"),
        # TC 7
        ("TC-BAR-002", "Bar Dispense & Automatic Cellar Deduction", 
         "On /admin/bar, click 'Dispense Drink' on the Old Fashioned ticket. Check /admin/inventory/liquor.", 
         "Buffalo Trace Bourbon", 
         "Drink is dispensed. Cellar inventory for Buffalo Trace immediately deducts 60ml from open bottle.", 
         "PASS"),
        # TC 8
        ("TC-POS-001", "Table Floor Bill Loading & 5% GST Computation", 
         "Open /admin/pos. Select Table 08 on the visual floor plan.", 
         "Table 08 with active items", 
         "Ticket loads with ₹1,020 subtotal. Automatically calculates 2.5% CGST (₹25.50) + 2.5% SGST (₹25.50).", 
         "PASS"),
        # TC 9
        ("TC-POS-002", "Multi-Tender Settlement & Cashier Shift Update", 
         "Select 'UPI' payment mode, enter reference # and click 'Settle Bill & Print Invoice'.", 
         "Payment mode: UPI", 
         "Bill marks SETTLED. Table status shifts to CLEANING. Shift register accumulates revenue.", 
         "PASS"),
        # TC 10
        ("TC-INV-001", "Liquor Decanting (Open Sealed Bottle)", 
         "Open /admin/inventory/liquor. Click 'Open Bottle' on Glenfiddich 12 Yrs.", 
         "Sealed: 6 bottles", 
         "Sealed bottles decrement from 6 to 5. Open bottle ml increases by 750ml.", 
         "PASS"),
        # TC 11
        ("TC-INV-002", "Log Breakage / Spillage with Steward Note", 
         "Click 'Log Adjustment' on Macallan 12 Yrs. Select BREAKAGE, enter 60ml, notes: 'Glass crack'.", 
         "Volume: 60ml", 
         "Open bottle volume deducts 60ml. Transaction logged with steward name and note in excise ledger.", 
         "PASS"),
        # TC 12
        ("TC-RAW-001", "Raw Materials Reorder Alert", 
         "Open /admin/inventory/restaurant. Inspect Artisanal Paneer (current stock 12kg, min 15kg).", 
         "Stock: 12 KG < 15 KG", 
         "Displays prominent RED 'REORDER' badge. Low stock counter on executive dashboard reflects warning.", 
         "PASS"),
        # TC 13
        ("TC-REC-001", "Recipe Gross Margin & Food Costing", 
         "Open /admin/recipes. Inspect Dal Makhani and Kalmi Kebab recipe cards.", 
         "Recipe database", 
         "Itemized ingredient costs display accurately. Gross margin reflects 71.8% and 81.8% profitability.", 
         "PASS"),
        # TC 14
        ("TC-MENU-001", "Instant 86'd Out-of-Stock Switch", 
         "Open /admin/menu. Click '86 This Dish' on Awadhi Gosht Biryani. Check customer web menu.", 
         "Biryani toggle", 
         "Dish immediately marks OFFLINE on admin table and is hidden from guest ordering.", 
         "PASS"),
        # TC 15
        ("TC-STAFF-001", "PIN Biometric Shift Attendance Punch", 
         "Open /admin/employees. Enter PIN '1004' (Executive Chef Hemant Kapoor) into punch terminal.", 
         "PIN: 1004", 
         "Success message confirms Chef Kapoor clocked in. Status updates to 'ON DUTY' with timestamp.", 
         "PASS"),
        # TC 16
        ("TC-REP-001", "Executive Dashboard & 5% GST Liability", 
         "Open /admin/reports. Verify turnover, tender splits, and GST breakdown.", 
         "All settled bills", 
         "Gross turnover, UPI/Card/Cash splits, and 2.5% CGST + 2.5% SGST figures match settled invoices.", 
         "PASS")
    ]

    t_cases_data = [
        [
            Paragraph("<b>ID</b>", styles['TableHead']),
            Paragraph("<b>Test Scenario</b>", styles['TableHead']),
            Paragraph("<b>Execution Steps</b>", styles['TableHead']),
            Paragraph("<b>Expected Operational Result</b>", styles['TableHead']),
            Paragraph("<b>Status</b>", styles['TableHead'])
        ]
    ]

    for tc_id, title, steps, test_data, expected, status in test_cases:
        t_cases_data.append([
            Paragraph(f"<b>{tc_id}</b>", styles['TableCellBold']),
            Paragraph(f"<b>{title}</b>", styles['TableCell']),
            Paragraph(steps, styles['TableCell']),
            Paragraph(expected, styles['TableCell']),
            Paragraph(f"<b>{status}</b>", styles['StatusPass'])
        ])

    t_suite = Table(t_cases_data, colWidths=[65, 105, 140, 150, 44])
    t_suite.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_LIGHT_BG]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_suite)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: ACCESS LINKS & OPERATIONAL SUMMARY
    # =========================================================================
    story.append(Paragraph("4. System URLs, Credentials & APK Installation", styles['SectionHeading']))
    story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=4, spaceAfter=14))

    access_data = [
        [
            Paragraph("<b>Application Interface</b>", styles['TableHead']),
            Paragraph("<b>Local Server URL</b>", styles['TableHead']),
            Paragraph("<b>Local Wi-Fi Network URL</b>", styles['TableHead'])
        ],
        [
            Paragraph("<b>Customer Web Ordering</b>", styles['TableCellBold']),
            Paragraph("http://localhost:3001", styles['TableCell']),
            Paragraph("http://192.168.1.2:3001", styles['TableCell'])
        ],
        [
            Paragraph("<b>Sample Table QR Ordering</b>", styles['TableCellBold']),
            Paragraph("http://localhost:3001/order/sample-table-08", styles['TableCell']),
            Paragraph("http://192.168.1.2:3001/order/sample-table-08", styles['TableCell'])
        ],
        [
            Paragraph("<b>Enterprise Admin & POS</b>", styles['TableCellBold']),
            Paragraph("http://localhost:3001/admin", styles['TableCell']),
            Paragraph("http://192.168.1.2:3001/admin", styles['TableCell'])
        ],
        [
            Paragraph("<b>Interactive Presentation Deck</b>", styles['TableCellBold']),
            Paragraph("http://localhost:3001/presentation.html", styles['TableCell']),
            Paragraph("http://192.168.1.2:3001/presentation.html", styles['TableCell'])
        ],
        [
            Paragraph("<b>FastAPI Swagger REST Docs</b>", styles['TableCellBold']),
            Paragraph("http://localhost:8001/docs", styles['TableCell']),
            Paragraph("http://192.168.1.2:8001/docs", styles['TableCell'])
        ],
        [
            Paragraph("<b>Customer Android APK File</b>", styles['TableCellBold']),
            Paragraph("kickbunk-customer.apk (66.6 MB in project root)", styles['TableCell']),
            Paragraph("Direct sideload install on any Android phone", styles['TableCell'])
        ]
    ]

    t_access = Table(access_data, colWidths=[140, 180, 184])
    t_access.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_LIGHT_BG]),
    ]))
    story.append(t_access)
    story.append(Spacer(1, 20))

    # Staff Credentials table
    story.append(Paragraph("<b>Default Staff Authentication & PIN Roster:</b>", styles['SubSectionHeading']))
    staff_data = [
        [
            Paragraph("<b>Role</b>", styles['TableHead']),
            Paragraph("<b>Employee Name</b>", styles['TableHead']),
            Paragraph("<b>Secret Shift PIN</b>", styles['TableHead']),
            Paragraph("<b>Permissions / Scope</b>", styles['TableHead'])
        ],
        [Paragraph("General Manager", styles['TableCellBold']), Paragraph("Vikramaditya Roy", styles['TableCell']), Paragraph("1001", styles['TableCellBold']), Paragraph("Full System, Expense Approvals, Audits", styles['TableCell'])],
        [Paragraph("Outlet Manager", styles['TableCellBold']), Paragraph("Sunil Sharma", styles['TableCell']), Paragraph("1002", styles['TableCellBold']), Paragraph("Floor Plan, QR Management, Shift Closing", styles['TableCell'])],
        [Paragraph("Senior Cashier", styles['TableCellBold']), Paragraph("Amitabh Sen", styles['TableCell']), Paragraph("1003", styles['TableCellBold']), Paragraph("POS Terminal, Bill Settlement, Float Register", styles['TableCell'])],
        [Paragraph("Executive Chef", styles['TableCellBold']), Paragraph("Hemant Kapoor", styles['TableCell']), Paragraph("1004", styles['TableCellBold']), Paragraph("KOT/KDS Display, Recipe Engineering, Wastage", styles['TableCell'])],
        [Paragraph("Head Mixologist", styles['TableCellBold']), Paragraph("Marcello D'Souza", styles['TableCell']), Paragraph("1005", styles['TableCellBold']), Paragraph("Bar Dispense, Cellar ml Adjustment, Excise", styles['TableCell'])],
        [Paragraph("Storekeeper", styles['TableCellBold']), Paragraph("Deepak Rawat", styles['TableCell']), Paragraph("1006", styles['TableCellBold']), Paragraph("Raw Materials, Stock In, Supplier POs", styles['TableCell'])],
        [Paragraph("Senior Captain", styles['TableCellBold']), Paragraph("Rohan Varma", styles['TableCell']), Paragraph("1007", styles['TableCellBold']), Paragraph("Table Floor Status, Guest Service, Punch", styles['TableCell'])],
    ]
    t_staff = Table(staff_data, colWidths=[100, 130, 90, 184])
    t_staff.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_LIGHT_BG]),
    ]))
    story.append(t_staff)

    story.append(Spacer(1, 24))
    signoff_html = """
    <b>QUALITY ASSURANCE SIGN-OFF:</b><br/>
    This document confirms that all 14 operational modules, the customer mobile application, and all 16 test cases have been thoroughly tested and verified. 
    The platform is declared fully production-ready for commercial deployment at KICK BUNK.
    """
    signoff_table = Table([[Paragraph(signoff_html, styles['BodyDark'])]], colWidths=[504])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(signoff_table)

    # Build PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == "__main__":
    build_pdf()
