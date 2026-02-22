async def fetch_huggingface() -> list[dict]:
    """Load shrijayan/gov_myscheme dataset. Returns raw dicts."""
    from datasets import load_dataset
    print("Loading HuggingFace dataset...")
    ds = load_dataset("shrijayan/gov_myscheme", split="train")
    print(f"Found {len(ds)} schemes in dataset")
    
    raw_schemes = []
    for row in ds:
        # Extract text from the PDF document
        pdf_doc = row.get('pdf')
        if not pdf_doc:
            continue
            
        full_text = ""
        try:
            for page in pdf_doc.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            continue
            
        if not full_text.strip():
            continue
            
        # Try to pull a quick name from the first line for the progress bar, 
        # but Llama 3 will fix it properly later
        first_line = full_text.strip().split('\n')[0][:100]
            
        raw = {
            'name': first_line if first_line else "HuggingFace Scheme Document",
            'description': full_text[:10000],  # Give Llama 3 the first 10,000 chars of text
            'eligibility_raw': '',
            'benefits_raw': '',
            'apply_steps_raw': '',
            'official_url': ''
        }
        raw_schemes.append(raw)
    
    print(f"Valid schemes to process: {len(raw_schemes)}")
    return raw_schemes
