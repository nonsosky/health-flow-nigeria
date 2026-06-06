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

## Author
Okpara Kenneth Chinonso
Healthcare — Nigeria & Africa
Built May 2026
