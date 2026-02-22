"""OCR route — upload document image, extract with Gemini, validate against profile."""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import json
from services.gemini_service import extract_document_ocr, validate_against_profile, get_document_scheme_coverage
from services.eligibility_service import ALL_SCHEMES

router = APIRouter()

@router.post("/extract")
async def extract_document_route(
    file: UploadFile = File(...),
    profile: str = Form(default="{}")
):
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")

    try:
        image_bytes = await file.read()
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed.")

        user_profile = json.loads(profile)
        extracted = await extract_document_ocr(image_bytes, file.content_type)
        mismatches = validate_against_profile(extracted, user_profile)
        scheme_coverage = get_document_scheme_coverage(extracted.get("document_type", ""), ALL_SCHEMES)

        return {
            "extracted_data": extracted,
            "validation_result": {
                "is_valid": len(mismatches) == 0,
                "mismatches": mismatches,
                "mismatch_count": len(mismatches),
            },
            "schemes_this_document_covers": scheme_coverage,
            "document_type_detected": extracted.get("document_type", "other"),
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
