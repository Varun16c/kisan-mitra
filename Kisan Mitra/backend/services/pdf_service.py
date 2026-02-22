"""ReportLab PDF generation service for action plan reports."""
import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT

GREEN = HexColor("#16a34a")
AMBER = HexColor("#f59e0b")
BLUE = HexColor("#0ea5e9")
LIGHTGRAY = HexColor("#f3f4f6")
DARKGRAY = HexColor("#374151")

def generate_action_plan_pdf(user_profile: dict, eligibility_results: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    heading1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=GREEN, fontSize=18, spaceAfter=6)
    heading2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=DARKGRAY, fontSize=13, spaceAfter=4)
    normal = ParagraphStyle("norm", parent=styles["Normal"], fontSize=9, leading=14)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=DARKGRAY)

    eligible = [r for r in eligibility_results if r.get("eligible")]
    partial = [r for r in eligibility_results if r.get("partially_eligible") and not r.get("eligible")]
    total_benefit = sum(r["benefit_amount"] for r in eligible)

    story = []

    # Header
    story.append(Paragraph("🌾 Kisan Mitra", heading1))
    story.append(Paragraph("Rural Government Scheme Action Plan", ParagraphStyle("sub", fontSize=13, textColor=BLUE, spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN))
    story.append(Spacer(1, 0.3*cm))

    # User summary
    story.append(Paragraph(f"Prepared for: <b>{user_profile.get('name', 'Beneficiary')}</b>", normal))
    story.append(Paragraph(f"State: {user_profile.get('state', 'N/A')} | Occupation: {user_profile.get('occupation', 'N/A')} | Generated: {datetime.now().strftime('%d %b %Y')}", small))
    story.append(Spacer(1, 0.4*cm))

    # Summary box
    summary_data = [
        [Paragraph("<b>✅ Eligible Schemes</b>", normal), Paragraph("<b>💰 Total Annual Benefit</b>", normal), Paragraph("<b>📋 Partial Eligible</b>", normal)],
        [Paragraph(f"<font size=20 color='#16a34a'><b>{len(eligible)}</b></font>", normal),
         Paragraph(f"<font size=16 color='#0ea5e9'><b>₹{total_benefit:,}</b></font>", normal),
         Paragraph(f"<font size=20 color='#f59e0b'><b>{len(partial)}</b></font>", normal)],
    ]
    summary_table = Table(summary_data, colWidths=[5.5*cm, 7*cm, 5.5*cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), LIGHTGRAY),
        ("BACKGROUND", (0,1), (-1,1), white),
        ("BOX", (0,0), (-1,-1), 1, GREEN),
        ("INNERGRID", (0,0), (-1,-1), 0.5, HexColor("#d1fae5")),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.5*cm))

    # Action plan table
    story.append(Paragraph("📋 Prioritized Action Plan", heading2))
    action_data = [["#", "Scheme Name", "Benefit", "Deadline", "Key Documents"]]
    for i, r in enumerate(eligible[:15], 1):
        docs = ", ".join([d["label"] for d in r.get("missing_documents", [])][:2]) or "All docs ready ✅"
        deadline_str = r.get("deadline", "N/A")
        action_data.append([
            str(i),
            r["scheme_name"][:35],
            f"₹{r['benefit_amount']:,}",
            deadline_str,
            docs[:45],
        ])
    action_table = Table(action_data, colWidths=[0.7*cm, 6.5*cm, 2.2*cm, 2.5*cm, 5.1*cm])
    action_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), GREEN),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTSIZE", (0,0), (-1,0), 8),
        ("FONTSIZE", (0,1), (-1,-1), 7.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, LIGHTGRAY]),
        ("BOX", (0,0), (-1,-1), 0.5, DARKGRAY),
        ("INNERGRID", (0,0), (-1,-1), 0.3, HexColor("#e5e7eb")),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(action_table)
    story.append(Spacer(1, 0.5*cm))

    # Unified document checklist
    story.append(Paragraph("📂 Documents You Need", heading2))
    all_missing = {}
    for r in eligible:
        for doc in r.get("missing_documents", []):
            if doc["id"] not in all_missing:
                all_missing[doc["id"]] = {"label": doc["label"], "schemes": []}
            all_missing[doc["id"]]["schemes"].append(r["scheme_name"][:25])
    if all_missing:
        for doc_id, info in list(all_missing.items())[:10]:
            schemes_str = ", ".join(info["schemes"][:3])
            story.append(Paragraph(f"☐  <b>{info['label']}</b> — needed for: {schemes_str}", normal))
    else:
        story.append(Paragraph("🎉 You have all required documents for your eligible schemes!", normal))

    story.append(Spacer(1, 0.5*cm))
    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Paragraph("Generated by Kisan Mitra | kisanmitra.in | This report is for informational purposes only.", small))

    doc.build(story)
    return buffer.getvalue()
