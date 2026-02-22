/**
 * Complete UI translations for en/hi/mr.
 * Used by useTranslation hook throughout the app.
 */
const T = {
    // Navigation
    home: { en: 'Home', hi: 'होम', mr: 'मुख्यपृष्ठ' },
    dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
    schemes: { en: 'Schemes', hi: 'योजनाएं', mr: 'योजना' },
    chat: { en: 'AI Chat', hi: 'AI चैट', mr: 'AI चॅट' },
    documents: { en: 'Documents', hi: 'दस्तावेज', mr: 'कागदपत्रे' },
    action_plan: { en: 'Action Plan', hi: 'कार्य योजना', mr: 'कृती योजना' },
    admin: { en: 'Admin', hi: 'एडमिन', mr: 'प्रशासन' },
    logout: { en: 'Logout', hi: 'लॉगआउट', mr: 'बाहेर पडा' },
    bookmarks: { en: 'Bookmarks', hi: 'बुकमार्क', mr: 'बुकमार्क' },
    simulator: { en: 'Simulator', hi: 'सिम्युलेटर', mr: 'सिम्युलेटर' },

    // Landing
    hero_title: {
        en: '₹2.4 Lakh Crore in Schemes. Find Yours in 2 Minutes.',
        hi: '₹2.4 लाख करोड़ की योजनाएं। 2 मिनट में अपनी ढूंढें।',
        mr: '₹2.4 लाख कोटी योजना. 2 मिनिटांत तुमची शोधा.'
    },
    hero_subtitle: {
        en: 'AI-powered discovery for farmers, laborers, women, artisans & all rural Indians',
        hi: 'किसानों, मजदूरों, महिलाओं, कारीगरों और सभी ग्रामीण भारतीयों के लिए AI सहायता',
        mr: 'शेतकरी, मजूर, महिला, कारागीर आणि सर्व ग्रामीण भारतीयांसाठी AI मदत'
    },
    get_started: { en: 'Get Started Free', hi: 'मुफ्त शुरू करें', mr: 'मोफत सुरू करा' },

    // Onboarding
    onboarding_title: { en: 'Set Up Your Profile', hi: 'अपनी प्रोफाइल बनाएं', mr: 'तुमची प्रोफाइल तयार करा' },
    next: { en: 'Next', hi: 'आगे', mr: 'पुढे' },
    back: { en: 'Back', hi: 'पीछे', mr: 'मागे' },
    submit: { en: 'Find My Schemes', hi: 'मेरी योजनाएं खोजें', mr: 'माझ्या योजना शोधा' },
    step_personal: { en: 'Personal Info', hi: 'व्यक्तिगत जानकारी', mr: 'वैयक्तिक माहिती' },
    step_livelihood: { en: 'Livelihood', hi: 'आजीविका', mr: 'उपजीविका' },
    step_financial: { en: 'Financial', hi: 'वित्तीय', mr: 'आर्थिक' },
    step_documents: { en: 'Documents', hi: 'दस्तावेज', mr: 'कागदपत्रे' },

    // Dashboard
    eligible_count: { en: 'Eligible Schemes', hi: 'पात्र योजनाएं', mr: 'पात्र योजना' },
    total_benefit: { en: 'Total Annual Benefit', hi: 'कुल वार्षिक लाभ', mr: 'एकूण वार्षिक लाभ' },
    partial_count: { en: 'Partial Eligibility', hi: 'आंशिक पात्रता', mr: 'आंशिक पात्रता' },
    apply_now: { en: 'Apply Now', hi: 'अभी आवेदन करें', mr: 'आता अर्ज करा' },
    why_ineligible: { en: 'Why?', hi: 'क्यों?', mr: 'का?' },
    view_details: { en: 'View Details', hi: 'विवरण देखें', mr: 'तपशील पाहा' },

    // Schemes filter
    all: { en: 'All', hi: 'सभी', mr: 'सर्व' },
    eligible: { en: 'Eligible', hi: 'पात्र', mr: 'पात्र' },
    partial: { en: 'Partial', hi: 'आंशिक', mr: 'आंशिक' },
    agriculture: { en: 'Agriculture', hi: 'कृषि', mr: 'कृषी' },
    housing: { en: 'Housing', hi: 'आवास', mr: 'गृहनिर्माण' },
    finance: { en: 'Finance', hi: 'वित्त', mr: 'वित्त' },
    education: { en: 'Education', hi: 'शिक्षा', mr: 'शिक्षण' },
    health: { en: 'Health', hi: 'स्वास्थ्य', mr: 'आरोग्य' },
    women: { en: 'Women', hi: 'महिला', mr: 'महिला' },
    labor: { en: 'Labor', hi: 'श्रमिक', mr: 'कामगार' },
    artisan: { en: 'Artisan', hi: 'कारीगर', mr: 'कारागीर' },

    // Chat
    ask_anything: { en: 'Ask anything about your schemes...', hi: 'योजनाओं के बारे में कुछ भी पूछें...', mr: 'योजनांबद्दल काहीही विचारा...' },
    listening: { en: 'Listening...', hi: 'सुन रहा हूं...', mr: 'ऐकतोय...' },
    send: { en: 'Send', hi: 'भेजें', mr: 'पाठवा' },
    quick_q1: { en: 'What schemes am I eligible for?', hi: 'मैं किन योजनाओं के लिए पात्र हूं?', mr: 'मी कोणत्या योजनांसाठी पात्र आहे?' },
    quick_q2: { en: 'What documents do I need?', hi: 'मुझे कौन से दस्तावेज चाहिए?', mr: 'मला कोणती कागदपत्रे लागतात?' },
    quick_q3: { en: 'Which scheme to apply first?', hi: 'पहले कौन सी योजना के लिए आवेदन करें?', mr: 'प्रथम कोणत्या योजनेसाठी अर्ज करावा?' },
    quick_q4: { en: 'How much benefit can I get?', hi: 'मुझे कितना लाभ मिल सकता है?', mr: 'मला किती लाभ मिळू शकतो?' },

    // Documents
    upload_doc: { en: 'Upload Document', hi: 'दस्तावेज अपलोड करें', mr: 'कागदपत्र अपलोड करा' },
    drag_drop: { en: 'Drag & drop or click to upload', hi: 'खींचें और छोड़ें या क्लिक करें', mr: 'ड्रॅग करा किंवा क्लिक करा' },
    extracting: { en: 'Extracting information...', hi: 'जानकारी निकाली जा रही है...', mr: 'माहिती काढली जात आहे...' },

    // Common
    loading: { en: 'Loading...', hi: 'लोड हो रहा है...', mr: 'लोड होत आहे...' },
    error: { en: 'Something went wrong', hi: 'कुछ गलत हो गया', mr: 'काहीतरी चूक झाली' },
    save: { en: 'Save', hi: 'सहेजें', mr: 'जतन करा' },
    cancel: { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा' },
    close: { en: 'Close', hi: 'बंद करें', mr: 'बंद करा' },
    deadline: { en: 'Deadline', hi: 'अंतिम तिथि', mr: 'अंतिम तारीख' },
    days_left: { en: 'days left', hi: 'दिन बचे', mr: 'दिवस शिल्लक' },
    benefit: { en: 'Benefit', hi: 'लाभ', mr: 'लाभ' },
    match: { en: 'Match', hi: 'मिलान', mr: 'जुळणी' },
    yes: { en: 'Yes', hi: 'हां', mr: 'होय' },
    no: { en: 'No', hi: 'नहीं', mr: 'नाही' },
}

export default T
