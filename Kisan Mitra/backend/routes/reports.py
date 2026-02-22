"""Reports route — generate and stream PDF action plan report."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.pdf_service import generate_action_plan_pdf
from services.eligibility_service import run_eligibility
import io

router = APIRouter()

class ReportRequest(BaseModel):
    profile: dict

@router.post("/action-plan")
def generate_report(body: ReportRequest):
    try:
        eligibility_results = run_eligibility(body.profile)
        pdf_bytes = generate_action_plan_pdf(body.profile, eligibility_results)
        name = body.profile.get("name", "beneficiary").replace(" ", "_")
        filename = f"kisan_mitra_action_plan_{name}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.get("/admin/stats")
def admin_stats():
    """Seed analytics data for admin dashboard."""
    return {
        "total_farmers": 1247,
        "total_schemes_discovered": 8432,
        "total_benefit_unlocked_cr": 24.7,
        "avg_schemes_per_user": 6.8,
        "top_schemes": [
            {"name": "PM-KISAN", "count": 892},
            {"name": "PMFBY", "count": 743},
            {"name": "MGNREGA", "count": 631},
            {"name": "Ayushman Bharat", "count": 589},
            {"name": "PM Ujjwala", "count": 421},
            {"name": "KCC", "count": 398},
            {"name": "PMKVY", "count": 312},
            {"name": "PM Vishwakarma", "count": 278},
        ],
        "top_missing_documents": [
            {"document": "Land Record / 7-12", "percent_missing": 34},
            {"document": "Caste Certificate", "percent_missing": 28},
            {"document": "Income Certificate", "percent_missing": 22},
            {"document": "BPL Card", "percent_missing": 19},
        ],
        "state_distribution": [
            {"state": "Maharashtra", "users": 423},
            {"state": "Uttar Pradesh", "users": 198},
            {"state": "Madhya Pradesh", "users": 156},
            {"state": "Bihar", "users": 134},
            {"state": "Rajasthan", "users": 112},
            {"state": "Others", "users": 224},
        ],
        "recent_registrations": [
            {"date": "2026-02-20", "count": 47},
            {"date": "2026-02-19", "count": 38},
            {"date": "2026-02-18", "count": 52},
            {"date": "2026-02-17", "count": 29},
            {"date": "2026-02-16", "count": 61},
        ]
    }
