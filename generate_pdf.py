import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Custom canvas that performs two passes to dynamically compute 
    total page numbers and draw enterprise headers/footers.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Suppress header and footer on cover / title block page
        if self._pageNumber > 1:
            # Running Header
            self.drawString(54, 750, "GlucoTrack AI — Enterprise Comparative Market Analysis")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(54, 742, 612 - 54, 742)
            
            # Running Footer
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(612 - 54, 34, page_text)
            self.drawString(54, 34, "CONFIDENTIAL — ENTERPRISE PRODUCT & ARCHITECTURE EVALUATION")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(54, 46, 612 - 54, 46)
            
        self.restoreState()

def create_market_analysis_pdf(output_path):
    # Setup document document template with standard letter dimensions & 54pt margins
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    printable_width = 612 - 54 * 2  # 504 points
    
    # Palette Definition
    PRIMARY = colors.HexColor("#1E3A8A")      # Navy Primary
    SECONDARY = colors.HexColor("#2563EB")    # Slate Blue Secondary
    TEXT_DARK = colors.HexColor("#0F172A")    # Dark Charcoal Headers
    TEXT_BODY = colors.HexColor("#334155")    # Slate Body Text
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Card background
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Accent Line Color
    
    # Styles Definition
    styles = getSampleStyleSheet()
    
    doc_title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )
    
    doc_subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=TEXT_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_BODY,
        spaceAfter=6,
        alignment=TA_LEFT
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    meta_val_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_BODY
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=TA_CENTER
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_BODY
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_BODY,
        alignment=TA_CENTER
    )

    story = []

    # --- HEADER BLOCK ---
    story.append(Paragraph("GlucoTrack AI", doc_subtitle_style))
    story.append(Paragraph("Comparative Market Analysis & Enterprise Feature Assessment", doc_title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=4, spaceAfter=12))

    # Metadata Card Table
    meta_data = [
        [
            Paragraph("Document Ref:", meta_label_style), Paragraph("ENT-GTAI-COMP-2026-V1", meta_val_style),
            Paragraph("Date:", meta_label_style), Paragraph("September 9, 2026", meta_val_style)
        ],
        [
            Paragraph("Classification:", meta_label_style), Paragraph("Enterprise Strategy & Technical Assessment", meta_val_style),
            Paragraph("Prepared For:", meta_label_style), Paragraph("Executive & Technical Leadership", meta_val_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[85, 167, 75, 177])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # --- SECTION 1: EXECUTIVE SUMMARY ---
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    exec_summary_text = (
        "This document provides a rigorous enterprise-level comparative analysis of <b>GlucoTrack AI</b> against "
        "existing commercial digital diabetes management platforms available in the global healthcare ecosystem. "
        "The digital health market is broadly bifurcated into two primary paradigms: hardware-tethered Continuous "
        "Glucose Monitoring (CGM) systems and manual logbook applications. GlucoTrack AI establishes a distinct "
        "niche by unifying zero-friction Computer Vision screen scanning (Google Gemini Vision API) for non-connected "
        "Blood Glucose Meters (BGMs), clinical Time-In-Range (TIR) metrics, and Large Language Model (LLM) pattern recognition."
    )
    story.append(Paragraph(exec_summary_text, body_style))
    story.append(Spacer(1, 10))

    # --- SECTION 2: GLUCOTRACK AI TECHNICAL TAXONOMY ---
    story.append(Paragraph("2. Technical Feature Taxonomy of GlucoTrack AI", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    features = [
        ("Computer Vision LCD Display OCR:", "Utilizes Google Gemini 1.5/2.0 Vision API to extract numerical values and measurement units (mg/dL or mmol/L) from 7-segment digital LCD displays of handheld glucometers, eliminating manual entry errors."),
        ("Clinical Time-In-Range (TIR) Analytics:", "Categorizes blood glucose measurements into five standardized clinical glycemic zones: Very Low (&lt;54 mg/dL), Low (54–69 mg/dL), Target (70–180 mg/dL), High (181–250 mg/dL), and Very High (&gt;250 mg/dL)."),
        ("Estimated HbA1c (eA1c) Calculation:", "Computes standardized eA1c percentages derived from average blood glucose concentrations using the ADAG formula (eA1c = (Mean Glucose + 46.7) / 28.7)."),
        ("Glycemic Variability Metrics:", "Measures statistical dispersion including Standard Deviation (SD) and Coefficient of Variation (CV%), offering clinical insights into glucose stability."),
        ("Contextual AI Pattern Recognition:", "Generates non-diagnostic natural language clinical insights, identifying recurrent patterns such as postprandial spikes, dawn phenomenon, and nocturnal hypoglycemia risk."),
        ("Progressive Web App (PWA) Architecture:", "Operates as an installable cross-platform PWA with offline Service Worker support, maintaining high accessibility across web and mobile devices without proprietary hardware dependency.")
    ]
    
    for title, desc in features:
        bullet_content = f"• <b>{title}</b> {desc}"
        story.append(Paragraph(bullet_content, bullet_style))
    story.append(Spacer(1, 10))

    # --- SECTION 3: COMMERCIAL LANDSCAPE ANALYSIS ---
    story.append(Paragraph("3. Commercial Landscape Analysis", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    story.append(Paragraph("The market for commercial diabetes management applications spans four primary product categories:", body_style))
    
    categories = [
        ("Category A — Continuous Glucose Monitor (CGM) Platforms (Dexcom Clarity, Abbott FreeStyle LibreLink):", 
         "Dominant platforms tied to wearable subcutaneous sensors. They deliver automated 24/7 glucose streaming every 1 to 5 minutes, real-time trend arrows, and urgent low-glucose acoustic alarms."),
        ("Category B — Commercial Logbook Systems (MySugr by Roche, Health2Sync, Diabetes M):", 
         "Established digital logbooks offering insulin bolus calculation, Active Insulin-on-Board (IOB) tracking, structured meal logging, PDF physician reports, and Bluetooth device synchronization."),
        ("Category C — AI-Driven & Predictive Platforms (Center Health / Stella AI, One Drop, Snaq.ai):", 
         "Platforms emphasizing machine learning. Center Health provides conversational text assistance; One Drop delivers predictive glucose trend forecasting; Snaq.ai utilizes computer vision for meal image recognition and carb estimation."),
        ("Category D — Clinical Aggregators & Power-User Tools (Tidepool, Sugarmate):", 
         "Open or specialized platforms focusing on clinic-level data aggregation across insulin pumps, CGMs, and BGMs for endocrinologists and caregiver networks.")
    ]

    for title, desc in categories:
        story.append(Paragraph(f"<b>{title}</b>", h2_style))
        story.append(Paragraph(desc, body_style))
    
    story.append(Spacer(1, 10))

    # --- SECTION 4: ENTERPRISE COMPARATIVE MATRIX ---
    story.append(Paragraph("4. Enterprise Comparative Feature Matrix", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    matrix_headers = [
        Paragraph("Capability / Requirement", table_header_style),
        Paragraph("GlucoTrack AI", table_header_style),
        Paragraph("CGM Ecosystems<br/>(Dexcom / Libre)", table_header_style),
        Paragraph("Logbook Platforms<br/>(MySugr / Diabetes M)", table_header_style),
        Paragraph("AI Platforms<br/>(Center / One Drop)", table_header_style)
    ]

    matrix_rows = [
        [
            Paragraph("LCD Screen Camera OCR", table_cell_bold),
            Paragraph("Native (Gemini Vision)", table_cell_center),
            Paragraph("N/A (Direct Sensor)", table_cell_center),
            Paragraph("Manual / Bluetooth", table_cell_center),
            Paragraph("Manual / Hardware BT", table_cell_center)
        ],
        [
            Paragraph("24/7 Automated Streaming", table_cell_bold),
            Paragraph("No (Point-in-Time)", table_cell_center),
            Paragraph("Yes (Every 1-5 mins)", table_cell_center),
            Paragraph("No (Point-in-Time)", table_cell_center),
            Paragraph("No (Point-in-Time)", table_cell_center)
        ],
        [
            Paragraph("5-Zone Time-In-Range (TIR)", table_cell_bold),
            Paragraph("Yes (Standard Clinical)", table_cell_center),
            Paragraph("Yes (Native GMI/TIR)", table_cell_center),
            Paragraph("Yes (Configurable)", table_cell_center),
            Paragraph("Partial / Basic", table_cell_center)
        ],
        [
            Paragraph("Estimated HbA1c (eA1c)", table_cell_bold),
            Paragraph("Yes (ADAG Formula)", table_cell_center),
            Paragraph("Yes (GMI Index)", table_cell_center),
            Paragraph("Yes (Standard)", table_cell_center),
            Paragraph("Yes (Calculated)", table_cell_center)
        ],
        [
            Paragraph("Generative AI Insights", table_cell_bold),
            Paragraph("Yes (Gemini LLM)", table_cell_center),
            Paragraph("Basic Rule Alerts", table_cell_center),
            Paragraph("No (Static Rules)", table_cell_center),
            Paragraph("Yes (Proprietary AI)", table_cell_center)
        ],
        [
            Paragraph("Urgent Hypo/Hyper Alarms", table_cell_bold),
            Paragraph("No", table_cell_center),
            Paragraph("Yes (Critical Alerts)", table_cell_center),
            Paragraph("No", table_cell_center),
            Paragraph("Partial (Notifications)", table_cell_center)
        ],
        [
            Paragraph("Insulin Bolus Calculator", table_cell_bold),
            Paragraph("No", table_cell_center),
            Paragraph("Integrated (Pumps)", table_cell_center),
            Paragraph("Yes (FDA Approved)", table_cell_center),
            Paragraph("No", table_cell_center)
        ],
        [
            Paragraph("Hardware Dependency", table_cell_bold),
            Paragraph("None (Universal)", table_cell_center),
            Paragraph("High (CGM Sensors)", table_cell_center),
            Paragraph("Medium (BT Meters)", table_cell_center),
            Paragraph("Medium (Proprietary)", table_cell_center)
        ],
        [
            Paragraph("Cost / Subscription Model", table_cell_bold),
            Paragraph("Open / Zero Cost", table_cell_center),
            Paragraph("High ($100-300/mo)", table_cell_center),
            Paragraph("Freemium ($6-15/mo)", table_cell_center),
            Paragraph("Subscription", table_cell_center)
        ]
    ]

    table_data = [matrix_headers] + matrix_rows
    col_widths = [114, 95, 100, 100, 95]
    
    comp_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    
    story.append(comp_table)
    story.append(Spacer(1, 14))

    # --- SECTION 5: STRATEGIC EVALUATION & DIFFERENTIATION ---
    story.append(Paragraph("5. Strategic Evaluation & Differentiators", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("5.1 Where Commercial Market Leaders Excel", h2_style))
    diff_commercial = [
        ("Automated Continuous Data Stream:", "CGM systems capture 288 readings per day without user intervention, enabling complete glycemic trend curve visualization."),
        ("Life-Saving Critical Alarms:", "Real-time alerts for impending nocturnal hypoglycemia provide immediate patient safety, a function non-continuous point-in-time systems cannot perform."),
        ("Regulatory & Clinical Certification:", "Platforms like MySugr and Dexcom Clarity carry FDA 510(k) clearances and CE mark certifications as regulated medical device software, enabling active insulin dosing decisions."),
        ("Ecosystem & EHR Integration:", "Direct clinic connectivity via HL7/FHIR interfaces allows endocrinologists to pull data directly into Electronic Health Record (EHR) systems.")
    ]
    for title, desc in diff_commercial:
        story.append(Paragraph(f"• <b>{title}</b> {desc}", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("5.2 Where GlucoTrack AI Outperforms Existing Solutions", h2_style))
    diff_glucotrack = [
        ("Universal Accessibility for Non-Connected Meters:", "Eliminates financial and hardware barriers for millions of users relying on standard non-Bluetooth handheld glucometers through Computer Vision OCR."),
        ("Advanced Natural Language Reasoning:", "Leverages multi-modal LLMs (Google Gemini) for contextualized pattern synthesis, exceeding the rigid rule-based notifications of traditional applications."),
        ("Zero Hardware Lock-In & Zero Subscription Cost:", "Provides enterprise-grade analytics (TIR, eA1c, variability) without locking users into expensive proprietary sensor ecosystems or monthly software subscriptions."),
        ("Data Sovereignty & Open Platform Architecture:", "Offers full user control over raw glucose records with standard REST APIs and local database portability (SQLite / PostgreSQL).")
    ]
    for title, desc in diff_glucotrack:
        story.append(Paragraph(f"• <b>{title}</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # --- SECTION 6: CONCLUSION & ARCHITECTURAL RECOMMENDATIONS ---
    story.append(Paragraph("6. Enterprise Conclusion & Strategic Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    conclusion_text = (
        "While commercial medical-grade applications (such as Dexcom Clarity and MySugr) lead in continuous sensor "
        "streaming, safety alarms, and regulatory approvals, <b>GlucoTrack AI</b> solves a critical unaddressed gap in digital "
        "health: providing high-tier AI analytics and frictionless logbook entry for traditional, non-connected blood glucose meters. "
        "<br/><br/>"
        "<b>Strategic Roadmap Recommendations for Enterprise Deployment:</b>"
    )
    story.append(Paragraph(conclusion_text, body_style))

    recommendations = [
        ("Optional Bluetooth LE Integration:", "Incorporate Web-Bluetooth API handlers to support direct syncing from smart meters alongside camera OCR."),
        ("Nutrition & Barcode API Integration:", "Expand meal context tracking by integrating open food databases (e.g., Open Food Facts API) for automated carb calculations."),
        ("Health Connect & Apple Healthkit Integration:", "Enable bidirectional sync with native mobile health frameworks to aggregate physical activity and heart rate metrics."),
        ("Clinical Export Standardization:", "Enhance PDF export formatting to conform to standard AGP (Ambulatory Glucose Profile) reporting templates used by endocrinologists.")
    ]
    for title, desc in recommendations:
        story.append(Paragraph(f"• <b>{title}</b> {desc}", bullet_style))

    # Build document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    output_pdf = "/home/dell/glucotrack-ai/GlucoTrack_AI_Market_Analysis.pdf"
    create_market_analysis_pdf(output_pdf)
    print(f"PDF generated successfully at: {output_pdf}")
