🌾 Kisan Mitra
AI-Powered Government Scheme Discovery Platform

An intelligent web platform that helps farmers discover government welfare schemes through AI-driven eligibility assessment, document OCR, and multilingual conversational assistance.

Built using React, FastAPI, PostgreSQL, Supabase, Gemini Vision OCR, and Groq LLM APIs.

🚀 Overview
Kisan Mitra simplifies access to government welfare schemes by automating the process of document verification, eligibility checking, and personalized scheme recommendations.

Instead of manually searching multiple government portals, farmers can upload their documents, complete a profile, and instantly receive schemes they qualify for.

The platform combines Artificial Intelligence, OCR, rule-based eligibility evaluation, and conversational AI into a single user-friendly application.

✨ Key Features
👤 User Management
Secure Authentication
Farmer Profile Management
Personalized Dashboard
Admin Login & Dashboard
📄 Intelligent Document Processing
Aadhaar OCR
PAN OCR
Land Record Processing
PDF Document Parsing
Automatic Information Extraction
🧠 AI-Powered Eligibility Engine
Rule-based eligibility evaluation
Government scheme recommendation
Profile enrichment
Duplicate record detection
Intelligent filtering
🤖 AI Assistant
Multilingual chatbot
Government scheme guidance
Personalized recommendations
Gemini + Groq powered responses
📚 Government Scheme Explorer
Browse schemes
Search schemes
Bookmark schemes
Benefit Calculator
Personalized Action Plan
📊 Farmer Dashboard
Saved Schemes
Uploaded Documents
Eligibility Status
Notifications
Reports
🏗 System Architecture
                     React Frontend
                           │
                           ▼
                     FastAPI Backend
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
 Eligibility Engine      OCR Engine      AI Chatbot
        │                  │                  │
        ▼                  ▼                  ▼
 PostgreSQL           Gemini Vision      Groq LLM API
        │
        ▼
     Supabase
⚙ Tech Stack
Frontend
React.js
Vite
JavaScript
CSS
Backend
FastAPI
Python
Database
PostgreSQL
Supabase
Artificial Intelligence
Gemini Vision OCR
Gemini API
Groq LLM API
Tools
Git
GitHub
REST APIs
📁 Repository Structure
Kisan Mitra/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── Layout/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── services/
│   │   └── data_sources/
│   ├── database/
│   ├── data/
│   ├── scripts/
│   ├── requirements.txt
│   ├── main.py
│   └── supabase_schema.sql
│
└── README.md
🧩 Backend Modules
Authentication
User Authentication
Admin Authentication
OCR Services
Aadhaar OCR
PAN OCR
PDF Processing
AI Services
Gemini Integration
Groq Integration
Conversational Assistant
Eligibility Engine
Government Scheme Matching
Profile Evaluation
Eligibility Scoring
Search Services
Scheme Search
Data Enrichment
Duplicate Detection
Database Layer
PostgreSQL
Supabase Integration
Schema Management
🖥 Frontend Modules
User Pages
Landing Page
Authentication
Dashboard
Profile
Documents
Chat
Bookmarks
Schemes
Benefit Calculator
Action Plan
Admin
Admin Login
Admin Dashboard
Shared Components
Navigation
Sidebar
Notifications
Calendar
Tooltips
🔄 Application Workflow
Farmer Registration
        │
        ▼
Profile Completion
        │
        ▼
Document Upload
        │
        ▼
Gemini Vision OCR
        │
        ▼
Structured Data Extraction
        │
        ▼
Eligibility Engine
        │
        ▼
Government Scheme Matching
        │
        ▼
AI Chatbot Assistance
        │
        ▼
Recommended Schemes
📸 Screenshots
Coming Soon

Landing Page
Dashboard
OCR Module
AI Chatbot
Government Schemes
Benefit Calculator
Admin Panel
🚀 Future Enhancements
Voice Assistant
Regional Language Expansion
WhatsApp Notifications
Government API Integration
Mobile Application
AI-based Scheme Ranking
Application Status Tracking
👨‍💻 Developed By
Ayush Bhunya

Information Technology Engineering Student

📄 License
This project was developed for educational and hackathon purposes.
