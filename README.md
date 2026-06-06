# MediFlow AI — Intelligent Patient Portal & Clinical Documentation System

A full-stack healthcare automation platform built for Nigerian hospitals and clinics.
MediFlow digitises the complete patient journey from self-registration through to
post-consultation follow-up, with an AI-powered clinical query engine for doctors.

## Built With
- **Lovable** — React frontend (patient portal + doctor dashboard)
- **n8n** — Workflow automation (all business logic and integrations)
- **Supabase** — PostgreSQL database, pgvector, REST API
- **OpenAI GPT-4o** — Clinical AI assistant (RAG engine)
- **Google Calendar API** — Appointment sync for doctors

## Features
- Patient self-registration and PIN-based login
- Atomic appointment booking with double-booking prevention
- Urgent case detection from pre-visit symptoms
- Google Calendar sync for every confirmed appointment
- Doctor queue dashboard with allergy warnings and urgent flags
- AI clinical assistant — doctors query patient history in natural language
- SOAP note saving with automatic vector embedding for future RAG retrieval
- Appointment cancellation with instant slot freeing
- Admin analytics dashboard with live clinic metrics
- Full notification audit log for every patient event

## Project Structure
mediflow-ai/
├── /src                  ← React frontend (synced from Lovable)
├── /supabase
│   └── schema.sql        ← All tables, views, and functions
├── /n8n-workflows
│   ├── registration.json
│   ├── login.json
│   ├── booking.json
│   ├── rag-query.json
│   ├── save-note.json
│   ├── cancel.json
│   └── analytics.json
├── .env.example
└── README.md

## Environment Variables
Copy `.env.example` to `.env` and fill in your values:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
N8N_REGISTER_URL=
N8N_LOGIN_URL=
N8N_BOOK_URL=
N8N_CANCEL_URL=
N8N_RAG_URL=
N8N_SAVE_NOTE_URL=
N8N_ANALYTICS_URL=

## Setup
1. Create a Supabase project and enable the pgvector extension
2. Run `/supabase/schema.sql` in the Supabase SQL Editor
3. Import all workflows from `/n8n-workflows` into your n8n instance
4. Configure credentials in n8n — Supabase, OpenAI, Google Calendar
5. Add all environment variables to your Lovable project settings
6. Deploy

## n8n Workflows
| Workflow | Endpoint | Purpose |
|---|---|---|
| Patient Registration | POST /register | Validate, deduplicate, create patient |
| Patient Login | POST /login | Authenticate via PIN |
| Appointment Booking | POST /book | Atomic slot lock, Calendar sync, urgent detection |
| RAG Clinical Query | POST /rag-query | AI-powered patient history search |
| Save SOAP Note | POST /save-note | Save consultation, embed note into pgvector |
| Cancel Appointment | POST /cancel | Cancel and free slot |
| Analytics Dashboard | POST /analytics | Aggregate clinic metrics |

## System Architecture
<img width="620" height="749" alt="image" src="https://github.com/user-attachments/assets/4d14e713-7d9f-42c4-b43a-0a690bf1a67a" />

## System Design
<img width="665" height="458" alt="Homepage" src="https://github.com/user-attachments/assets/fd0df2a2-1376-4cd7-96cd-3bb2fb551523" />
<img width="827" height="447" alt="MediFlow AI image" src="https://github.com/user-attachments/assets/41f15a53-9f69-4307-a3cd-44136a9d9f2f" />
<img width="686" height="352" alt="Live Dashboard" src="https://github.com/user-attachments/assets/2d7508d0-ed00-4a7e-aac9-ac2b3a7a7a2e" />

## Author
Okpara Kenneth Chinonso
Healthcare — Nigeria & Africa
Built May 2026
