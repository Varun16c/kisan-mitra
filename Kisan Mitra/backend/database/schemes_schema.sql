CREATE TABLE IF NOT EXISTS schemes (
    -- Identity (your existing fields)
    id TEXT PRIMARY KEY,  -- keep as TEXT to match existing string IDs
    name TEXT NOT NULL,   -- short display name (what frontend shows)
    canonical_name TEXT,  -- full official name
    short_name TEXT,
    aliases TEXT[] DEFAULT '{}',
    
    -- Classification (your existing fields)
    category TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    states TEXT[] DEFAULT '{"all"}',  -- matches your existing "states" field name
    level TEXT DEFAULT 'central',
    state_specific TEXT,
    ministry TEXT,
    department TEXT,
    
    -- Benefit (your existing fields)
    benefit_amount NUMERIC DEFAULT 0,
    benefit_description TEXT DEFAULT '',
    benefit_type TEXT DEFAULT 'cash',
    benefit_frequency TEXT DEFAULT 'annual',
    benefit_amount_max NUMERIC,
    
    -- Eligibility (stored as JSONB matching your existing eligibility dict structure)
    eligibility JSONB DEFAULT '{}',
    -- eligibility JSONB must contain these keys to match eligibility_service.py:
    -- occupation, age_min, age_max, gender, caste,
    -- min_land_acres, max_land_acres, max_annual_income,
    -- disqualifiers, must_be_rural, must_be_bpl,
    -- must_be_bpl_or_kutcha_house, must_be_shg_member,
    -- must_have_farm_loan, must_be_pm_kisan_beneficiary,
    -- girl_child_age_max, must_have_girl_child,
    -- no_existing_lpg, no_existing_bank_account, must_be_secc_listed
    
    -- Documents (your existing field name)
    documents_required TEXT[] DEFAULT '{}',
    documents_optional TEXT[] DEFAULT '{}',
    
    -- Application (your existing fields)
    apply_url TEXT DEFAULT '',
    apply_mode TEXT[] DEFAULT '{}',
    apply_steps TEXT[] DEFAULT '{}',
    helpline TEXT,
    deadline TEXT,  -- keep as TEXT, your code uses strptime on it
    deadline_label TEXT DEFAULT '',
    deadline_type TEXT DEFAULT 'rolling',
    
    -- Ineligibility messages (your existing field)
    ineligibility_rules JSONB DEFAULT '{}',
    
    -- Content
    description TEXT DEFAULT '',
    description_hi TEXT,
    description_mr TEXT,
    summary TEXT,
    
    -- Pipeline metadata (NEW fields for tracking)
    sources TEXT[] DEFAULT '{}',
    source_ids JSONB DEFAULT '{}',
    confidence_score NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    needs_review BOOLEAN DEFAULT false,
    review_reason TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schemes_active ON schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_schemes_eligibility ON schemes USING GIN(eligibility);
CREATE INDEX IF NOT EXISTS idx_schemes_aliases ON schemes USING GIN(aliases);
CREATE INDEX IF NOT EXISTS idx_schemes_documents ON schemes USING GIN(documents_required);
CREATE INDEX IF NOT EXISTS idx_schemes_states ON schemes USING GIN(states);

-- Pipeline tracking
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    processed INTEGER DEFAULT 0,
    new_schemes INTEGER DEFAULT 0,
    merged INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    needs_review_count INTEGER DEFAULT 0,
    duration_seconds NUMERIC,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS failed_ingestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_data JSONB,
    source_url TEXT,
    source_name TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table for storing user forms
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    profile_data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
