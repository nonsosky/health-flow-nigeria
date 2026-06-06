-- Table: public.appointments --

create table public.appointments (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  slot_id uuid null,
  chief_complaint text not null,
  pre_symptoms text null,
  status text null default 'booked'::text,
  urgent_flag boolean null default false,
  booked_at timestamp with time zone null default now(),
  constraint appointments_pkey primary key (id),
  constraint appointments_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE,
  constraint appointments_slot_id_fkey foreign KEY (slot_id) references slots (id) on delete CASCADE,
  constraint appointments_status_check check (
    (
      status = any (
        array[
          'booked'::text,
          'checked_in'::text,
          'in_progress'::text,
          'completed'::text,
          'cancelled'::text,
          'no_show'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_appointments_patient on public.appointments using btree (patient_id) TABLESPACE pg_default;

create index IF not exists idx_appointments_slot on public.appointments using btree (slot_id) TABLESPACE pg_default;

create index IF not exists idx_appointments_status on public.appointments using btree (status) TABLESPACE pg_default;


-- Table: public.clinical_notes --
create table public.clinical_notes (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  visit_id uuid null,
  content text not null,
  embedding public.vector null,
  created_at timestamp with time zone null default now(),
  constraint clinical_notes_pkey primary key (id),
  constraint clinical_notes_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE,
  constraint clinical_notes_visit_id_fkey foreign KEY (visit_id) references visits (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_clinical_notes_patient on public.clinical_notes using btree (patient_id) TABLESPACE pg_default;

create index IF not exists idx_clinical_notes_embedding on public.clinical_notes using ivfflat (embedding vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;


-- View: public.doctor_queue --
create view public.doctor_queue as
select
  a.id as appointment_id,
  a.status,
  a.urgent_flag,
  a.chief_complaint,
  a.pre_symptoms,
  s.slot_date,
  s.slot_time,
  s.doctor_name,
  p.id as patient_id,
  p.full_name,
  p.date_of_birth,
  p.gender,
  p.phone,
  p.blood_group,
  p.allergies
from
  appointments a
  join slots s on s.id = a.slot_id
  join patients p on p.id = a.patient_id
order by
  s.slot_time;

-- Table: public.doctors --
create table public.doctors (
  id uuid not null default gen_random_uuid (),
  full_name text not null,
  email text not null,
  phone text null,
  specialisation text null,
  portal_pin text not null,
  created_at timestamp with time zone null default now(),
  constraint doctors_pkey primary key (id),
  constraint doctors_email_key unique (email)
) TABLESPACE pg_default;

-- Table: public.notifications --
create table public.notifications (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  type text null,
  channel text null default 'whatsapp'::text,
  message text not null,
  sent_at timestamp with time zone null default now(),
  status text null default 'sent'::text,
  constraint notifications_pkey primary key (id),
  constraint notifications_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE,
  constraint notifications_status_check check (
    (
      status = any (
        array['sent'::text, 'delivered'::text, 'failed'::text]
      )
    )
  ),
  constraint notifications_type_check check (
    (
      type = any (
        array[
          'confirmation'::text,
          'reminder'::text,
          'post_visit'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_notifications_patient on public.notifications using btree (patient_id) TABLESPACE pg_default;


-- View: public.patient_history --
create view public.patient_history as
select
  a.id as appointment_id,
  a.status,
  a.booked_at,
  s.slot_date,
  s.slot_time,
  s.doctor_name,
  v.id as visit_id,
  v.diagnosis,
  v.prescription,
  v.soap_assessment,
  v.soap_plan,
  v.visit_date
from
  appointments a
  join slots s on s.id = a.slot_id
  left join visits v on v.appointment_id = a.id
order by
  s.slot_date desc,
  s.slot_time desc;

-- Table: public.patients --
create table public.patients (
  id uuid not null default gen_random_uuid (),
  full_name text not null,
  date_of_birth date null,
  gender text null,
  phone text null,
  blood_group text null,
  allergies text null,
  portal_pin text null,
  created_at timestamp with time zone null default now(),
  email text null,
  constraint patients_pkey primary key (id),
  constraint patients_email_key unique (email),
  constraint patients_phone_key unique (phone),
  constraint patients_gender_check check (
    (
      gender = any (
        array['male'::text, 'female'::text, 'other'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Table: public.slots --
create table public.slots (
  id uuid not null default gen_random_uuid (),
  doctor_name text not null,
  slot_date date not null,
  slot_time time without time zone not null,
  duration_min integer null default 30,
  is_available boolean null default true,
  created_at timestamp with time zone null default now(),
  doctor_id uuid null,
  constraint slots_pkey primary key (id),
  constraint slots_doctor_name_slot_date_slot_time_key unique (doctor_name, slot_date, slot_time),
  constraint slots_doctor_id_fkey foreign KEY (doctor_id) references doctors (id)
) TABLESPACE pg_default;

create index IF not exists idx_slots_date_available on public.slots using btree (slot_date, is_available) TABLESPACE pg_default;

--View: public.urgent_cases_today --
create view public.urgent_cases_today as
select
  p.full_name,
  a.chief_complaint as symptom,
  s.slot_time,
  a.status,
  a.urgent_flag,
  s.slot_date
from
  appointments a
  join patients p on p.id = a.patient_id
  join slots s on s.id = a.slot_id
where
  a.urgent_flag = true
  and (
    a.status = any (array['booked'::text, 'checked_in'::text])
  )
  and s.slot_date = CURRENT_DATE
order by
  s.slot_time;

-- Table: public.visits --
create table public.visits (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  appointment_id uuid null,
  visit_date timestamp with time zone null default now(),
  chief_complaint text not null,
  soap_subjective text null,
  soap_objective text null,
  soap_assessment text null,
  soap_plan text null,
  diagnosis text null,
  prescription text null,
  doctor_name text null,
  raw_notes text null,
  created_at timestamp with time zone null default now(),
  doctor_id uuid null,
  constraint visits_pkey primary key (id),
  constraint visits_appointment_id_fkey foreign KEY (appointment_id) references appointments (id) on delete set null,
  constraint visits_doctor_id_fkey foreign KEY (doctor_id) references doctors (id),
  constraint visits_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_visits_patient on public.visits using btree (patient_id) TABLESPACE pg_default;

create index IF not exists idx_visits_appointment on public.visits using btree (appointment_id) TABLESPACE pg_default;


-- Function: public.cancel_appointment(uuid)
CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
DECLARE
  v_slot_id UUID;
BEGIN
  -- Get the slot linked to this appointment
  SELECT slot_id INTO v_slot_id
  FROM appointments
  WHERE id = p_appointment_id;

  -- Mark appointment cancelled
  UPDATE appointments
  SET status = 'cancelled'
  WHERE id = p_appointment_id;

  -- Free the slot back up
  UPDATE slots
  SET is_available = TRUE
  WHERE id = v_slot_id;
END;


-- Function: public.book_appointment(uuid, uuid, text, text)
CREATE OR REPLACE FUNCTION public.book_appointment(p_patient_id uuid, p_slot_id uuid, p_chief_complaint text, p_pre_symptoms text)
 RETURNS uuid
 LANGUAGE plpgsql
DECLARE
  v_appointment_id UUID;
  v_slot_available BOOLEAN;
BEGIN
  SELECT is_available INTO v_slot_available
  FROM slots WHERE id = p_slot_id
  FOR UPDATE;               -- row lock prevents race conditions

  IF NOT v_slot_available THEN
    RAISE EXCEPTION 'SLOT_TAKEN: This slot has already been booked.';
  END IF;

  INSERT INTO appointments (patient_id, slot_id, chief_complaint, pre_symptoms)
  VALUES (p_patient_id, p_slot_id, p_chief_complaint, p_pre_symptoms)
  RETURNING id INTO v_appointment_id;

  UPDATE slots SET is_available = FALSE WHERE id = p_slot_id;

  RETURN v_appointment_id;
END;



-- Function: public.authenticate_doctor(text, text)
CREATE OR REPLACE FUNCTION public.authenticate_doctor(p_email text, p_pin text)
 RETURNS TABLE(id uuid, full_name text, email text, specialisation text)
 LANGUAGE plpgsql
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.full_name,
    d.email,
    d.specialisation
  FROM doctors d
  WHERE d.email      = LOWER(TRIM(p_email))
    AND d.portal_pin = p_pin;
END;


-- Function: public.authenticate_patient(text, text)
CREATE OR REPLACE FUNCTION public.authenticate_patient(p_email text, p_pin text)
 RETURNS TABLE(id uuid, full_name text, email text, phone text, blood_group text, allergies text)
 LANGUAGE plpgsql
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.blood_group,
    p.allergies
  FROM patients p
  WHERE p.email      = LOWER(TRIM(p_email))
    AND p.portal_pin = p_pin;
  -- Returns 0 rows = wrong credentials
  -- Returns 1 row  = login success, pass patient_id to frontend
END;
