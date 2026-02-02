--
-- PostgreSQL database dump
--

\restrict s3r4rDrQUAE9Pkr9LAlkeObKLJ7eNC2bTdIBprQJCquJvuRyuQVCbauVkF6FeL6

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ad_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ad_type AS ENUM (
    'sell',
    'buy',
    'service',
    'other'
);


ALTER TYPE public.ad_type OWNER TO postgres;

--
-- Name: content_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.content_type AS ENUM (
    'post',
    'document',
    'photo',
    'video',
    'presentation'
);


ALTER TYPE public.content_type OWNER TO postgres;

--
-- Name: control_object_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.control_object_status AS ENUM (
    'active',
    'inactive',
    'under_inspection',
    'violation',
    'closed'
);


ALTER TYPE public.control_object_status OWNER TO postgres;

--
-- Name: document_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'archived'
);


ALTER TYPE public.document_status OWNER TO postgres;

--
-- Name: document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_type AS ENUM (
    'report_1_osp',
    'report_2_ssg',
    'report_3_spvp',
    'report_4_sovp',
    'report_5_spzhs',
    'report_6_sspz',
    'report_co',
    'incident_photo',
    'inspection_act',
    'order',
    'instruction',
    'other'
);


ALTER TYPE public.document_type OWNER TO postgres;

--
-- Name: incident_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.incident_type AS ENUM (
    'fire',
    'nonfire',
    'steppe_fire',
    'steppe_smolder',
    'co_nofire'
);


ALTER TYPE public.incident_type OWNER TO postgres;

--
-- Name: org_unit_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.org_unit_type AS ENUM (
    'MCHS',
    'DCHS',
    'DISTRICT'
);


ALTER TYPE public.org_unit_type OWNER TO postgres;

--
-- Name: organization_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.organization_type AS ENUM (
    'district',
    'region',
    'rk'
);


ALTER TYPE public.organization_type OWNER TO postgres;

--
-- Name: package_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.package_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected'
);


ALTER TYPE public.package_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'editor',
    'reviewer',
    'approver',
    'admin',
    'user',
    'supplier',
    'moderator',
    'MCHS',
    'DCHS',
    'DISTRICT',
    'OCHS'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_categories (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ad_categories OWNER TO postgres;

--
-- Name: ads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ads (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    category_id character varying NOT NULL,
    user_id character varying NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(255) NOT NULL,
    description text NOT NULL,
    requirements text,
    ad_type public.ad_type DEFAULT 'other'::public.ad_type,
    price numeric(12,2),
    price_negotiable boolean DEFAULT false,
    location character varying(255),
    contact_phone character varying(50),
    contact_email character varying(255),
    images text[],
    views integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ads OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id character varying NOT NULL,
    user_id character varying,
    action character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id character varying NOT NULL,
    details jsonb,
    ip_address character varying,
    user_agent character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: control_objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.control_objects (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    category character varying NOT NULL,
    subcategory character varying,
    address text NOT NULL,
    region character varying,
    district character varying,
    latitude numeric(10,7),
    longitude numeric(10,7),
    status public.control_object_status DEFAULT 'active'::public.control_object_status NOT NULL,
    risk_level character varying DEFAULT 'medium'::character varying,
    last_inspection_date timestamp without time zone,
    next_inspection_date timestamp without time zone,
    description text,
    contact_person character varying,
    contact_phone character varying,
    details jsonb,
    org_unit_id character varying,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.control_objects OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    title text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    document_id character varying NOT NULL,
    comment text NOT NULL,
    comment_type character varying DEFAULT 'general'::character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.document_comments OWNER TO postgres;

--
-- Name: document_tag_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tag_relations (
    document_id character varying NOT NULL,
    tag_id character varying NOT NULL
);


ALTER TABLE public.document_tag_relations OWNER TO postgres;

--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tags (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(7) DEFAULT '#3b82f6'::character varying,
    organization_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.document_tags OWNER TO postgres;

--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_versions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    document_id character varying NOT NULL,
    version integer NOT NULL,
    file_path character varying,
    file_name character varying,
    change_description text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.document_versions OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    document_type public.document_type NOT NULL,
    file_path character varying,
    file_name character varying,
    file_size integer,
    mime_type character varying,
    period character varying,
    region character varying,
    organization_id character varying NOT NULL,
    status public.document_status DEFAULT 'draft'::public.document_status NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_public boolean DEFAULT false,
    incident_id character varying,
    package_id character varying,
    created_by character varying NOT NULL,
    updated_by character varying,
    approved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    approved_at timestamp without time zone
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    date_time timestamp without time zone NOT NULL,
    locality character varying NOT NULL,
    incident_type public.incident_type NOT NULL,
    address text NOT NULL,
    description text,
    cause character varying,
    cause_code character varying,
    object_type character varying,
    object_code character varying,
    region character varying,
    city character varying,
    damage numeric(15,2) DEFAULT '0'::numeric,
    deaths_total integer DEFAULT 0,
    deaths_children integer DEFAULT 0,
    deaths_drunk integer DEFAULT 0,
    deaths_co_total integer DEFAULT 0,
    deaths_co_children integer DEFAULT 0,
    injured_total integer DEFAULT 0,
    injured_children integer DEFAULT 0,
    injured_co_total integer DEFAULT 0,
    injured_co_children integer DEFAULT 0,
    saved_people_total integer DEFAULT 0,
    saved_people_children integer DEFAULT 0,
    saved_property numeric(15,2) DEFAULT '0'::numeric,
    org_unit_id character varying NOT NULL,
    created_by character varying NOT NULL,
    package_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    status character varying(20) DEFAULT 'pending'::character varying,
    cause_detailed character varying,
    object_detailed character varying,
    floor integer,
    total_floors integer,
    building_details jsonb,
    livestock_lost jsonb,
    destroyed_items jsonb,
    time_of_day character varying,
    archived_at timestamp without time zone,
    steppe_area numeric(15,2) DEFAULT 0,
    steppe_damage numeric(15,2) DEFAULT 0,
    steppe_people_total integer DEFAULT 0,
    steppe_people_dead integer DEFAULT 0,
    steppe_people_injured integer DEFAULT 0,
    steppe_animals_total integer DEFAULT 0,
    steppe_animals_dead integer DEFAULT 0,
    steppe_animals_injured integer DEFAULT 0,
    steppe_extinguished_total integer DEFAULT 0,
    steppe_extinguished_area numeric(15,2) DEFAULT 0,
    steppe_extinguished_damage numeric(15,2) DEFAULT 0,
    steppe_garrison_people integer DEFAULT 0,
    steppe_garrison_units integer DEFAULT 0,
    steppe_mchs_people integer DEFAULT 0,
    steppe_mchs_units integer DEFAULT 0,
    latitude numeric(10,7),
    longitude numeric(10,7)
);


ALTER TABLE public.incidents OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: normative_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.normative_documents (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    title character varying(500) NOT NULL,
    short_title character varying(100),
    document_number character varying(100),
    document_date character varying(50),
    category character varying(100) NOT NULL,
    description text,
    external_url character varying(1000) NOT NULL,
    source character varying(100) DEFAULT 'adilet'::character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.normative_documents OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    type character varying DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: org_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.org_units (
    id character varying(50) DEFAULT gen_random_uuid() NOT NULL,
    type public.org_unit_type NOT NULL,
    name character varying(255) NOT NULL,
    parent_id character varying(50),
    region_name character varying(255) DEFAULT ''::character varying,
    unit_name character varying(255) DEFAULT ''::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    code character varying
);


ALTER TABLE public.org_units OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type public.organization_type NOT NULL,
    parent_id character varying,
    code character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    period character varying NOT NULL,
    organization_id character varying NOT NULL,
    status public.package_status DEFAULT 'draft'::public.package_status NOT NULL,
    submitted_by character varying,
    submitted_at timestamp without time zone,
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    org_unit_id character varying
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- Name: photo_albums; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photo_albums (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    subsection_id character varying NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    cover_image_url character varying,
    author_id character varying,
    tags text[],
    views integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.photo_albums OWNER TO postgres;

--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    album_id character varying NOT NULL,
    title character varying(500),
    description text,
    image_url character varying NOT NULL,
    thumbnail_url character varying,
    "order" integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    subsection_id character varying NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt text,
    content text,
    content_type public.content_type DEFAULT 'post'::public.content_type,
    author_id character varying,
    featured_image_url character varying,
    tags text[],
    views integer DEFAULT 0,
    is_published boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    published_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: presentations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presentations (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    subsection_id character varying NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    file_url character varying NOT NULL,
    thumbnail_url character varying,
    slide_count integer,
    author_id character varying,
    tags text[],
    views integer DEFAULT 0,
    downloads integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.presentations OWNER TO postgres;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: subsections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subsections (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    section_id character varying NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subsections OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    username character varying,
    password_hash character varying NOT NULL,
    full_name character varying,
    region character varying,
    district character varying DEFAULT ''::character varying,
    role public.user_role DEFAULT 'editor'::public.user_role NOT NULL,
    organization_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email text DEFAULT ''::text NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    profile_image_url character varying(255),
    company_name character varying(255),
    phone character varying(255),
    auth_provider character varying(255) DEFAULT 'local'::character varying,
    telegram_id character varying(255),
    city character varying(255),
    rating numeric(3,2) DEFAULT 0.00,
    review_count integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    bio text,
    specializations jsonb,
    work_experience integer,
    service_area jsonb,
    documents jsonb,
    is_online boolean DEFAULT false,
    last_active_at timestamp without time zone,
    portfolio_items jsonb,
    org_unit_id character varying(50),
    must_change_on_first_login boolean DEFAULT false,
    last_login_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.videos (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    subsection_id character varying NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    video_url character varying NOT NULL,
    thumbnail_url character varying,
    duration integer,
    author_id character varying,
    tags text[],
    views integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.videos OWNER TO postgres;

--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_instances (
    id character varying NOT NULL,
    workflow_id character varying,
    entity_id character varying NOT NULL,
    current_step integer DEFAULT 0,
    status character varying DEFAULT 'pending'::character varying,
    data jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workflow_instances OWNER TO postgres;

--
-- Name: workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflows (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    entity_type character varying NOT NULL,
    steps jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workflows OWNER TO postgres;

--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Data for Name: ad_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ad_categories (id, title, slug, description, icon, "order", is_active, created_at) FROM stdin;
493e6721-58d8-49d7-94ad-e21d25adcdf0	Проектирование систем пожарной безопасности	fire-system-design	Разработка проектов автоматических систем пожаротушения, пожарной сигнализации и других систем ПБ	fas fa-drafting-compass	1	t	2025-12-17 16:50:42.811761
63579461-8c87-412b-9837-8443708da89d	Монтаж и наладка оборудования	equipment-installation	Установка и настройка противопожарного оборудования	fas fa-tools	2	t	2025-12-17 16:50:43.043698
367d298f-15e1-405e-bd75-8ce2d43954dc	Техническое обслуживание	technical-maintenance	Регулярное обслуживание систем пожарной безопасности	fas fa-cogs	3	t	2025-12-17 16:50:43.272857
5b3c1f0a-6101-45ef-9495-2a6b4991f5ca	Экспертиза и консультации	expertise-consulting	Экспертные заключения и консультации по вопросам пожарной безопасности	fas fa-user-tie	4	t	2025-12-17 16:50:43.50504
0912dd30-a31c-413f-a486-2637bed97282	Поставка оборудования	equipment-supply	Поставка противопожарного оборудования и материалов	fas fa-truck	5	t	2025-12-17 16:50:43.734192
e3b954ef-c612-438c-b1d9-b0a482de8dfd	Обучение персонала	staff-training	Обучение и повышение квалификации по пожарной безопасности	fas fa-chalkboard-teacher	6	t	2025-12-17 16:50:43.96374
\.


--
-- Data for Name: ads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ads (id, category_id, user_id, title, slug, description, requirements, ad_type, price, price_negotiable, location, contact_phone, contact_email, images, views, is_active, is_featured, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: control_objects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.control_objects (id, name, category, subcategory, address, region, district, latitude, longitude, status, risk_level, last_inspection_date, next_inspection_date, description, contact_person, contact_phone, details, org_unit_id, created_by, created_at, updated_at) FROM stdin;
575d3057-4f73-4b4f-a909-fb294e212a9d	ТОО "Казахмыс Энерго"	Высокая	H1	г. Алматы, ул. Абая 150	Алматы	Алмалинский район	\N	\N	active	high	\N	\N	\N	\N	\N	{"subjectBIN": "123456789012", "subjective": {"incidents12m": 0, "prevViolations": 2}, "subjectName": "ТОО Казахмыс Энерго", "objectiveLevel": "Высокая", "characteristics": {"hasAPS": true, "hasAUPT": true, "buildingType": "Промышленное здание", "heightMeters": "25", "hasPrivateFireService": true}, "objectiveCategoryId": "H1", "entrepreneurshipCategory": "Крупное"}	dchs-almaty	e9423f41-3e08-4972-9a80-4843565a2dcd	2026-01-30 10:48:42.586889	2026-01-30 11:02:47.911
722a3594-7cf5-4b02-8239-9ef9a5e5a92d	АО "Шымкент Нефтепереработка"	Средняя	M15	г. Шымкент, промзона	Туркестанская область	г. Шымкент	\N	\N	active	medium	\N	\N	\N	\N	\N	{"subjectBIN": "456789012345", "subjective": {"incidents12m": 1, "prevViolations": 1}, "subjectName": "АО Шымкент Нефтепереработка", "objectiveLevel": "Средняя", "characteristics": {"hasAPS": true, "hasAUPT": true, "buildingType": "Нефтеперерабатывающий завод", "heightMeters": "40", "hasPrivateFireService": true}, "objectiveCategoryId": "M15", "entrepreneurshipCategory": "Крупное"}	mchs-rk	09947d97-b839-4678-a895-e38450711802	2026-01-30 10:48:42.586889	2026-01-30 11:02:58.257
0367ad36-ce04-4328-b218-5d332b359219	ИП Сериков А.Б. - Магазин	Низкая	L9	г. Астана, пр. Республики 45	Астана	Есильский район	\N	\N	active	low	\N	\N	\N	\N	\N	{"subjectBIN": "987654321098", "subjective": {"incidents12m": 0, "prevViolations": 0}, "subjectName": "ИП Сериков А.Б.", "objectiveLevel": "Низкая", "characteristics": {"hasAPS": true, "hasAUPT": false, "buildingType": "Торговое помещение", "heightMeters": "6", "hasPrivateFireService": false}, "objectiveCategoryId": "L9", "entrepreneurshipCategory": "Малое"}	dchs-astana	1cc5c9ff-afb0-4dc1-bebc-ab18affe35d2	2026-01-30 10:48:42.586889	2026-01-30 11:03:06.2
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, title, created_at) FROM stdin;
1	Новый чат	2026-01-26 12:05:17.223166
2	Новый чат	2026-01-26 12:23:59.205936
3	Новый чат	2026-01-26 15:09:05.994628
4	Новый чат	2026-01-30 09:01:47.700431
5	Новый чат	2026-01-30 09:17:12.655116
6	Новый чат	2026-01-30 09:27:41.178872
7	Новый чат	2026-01-30 09:49:55.790348
\.


--
-- Data for Name: document_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_comments (id, document_id, comment, comment_type, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: document_tag_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tag_relations (document_id, tag_id) FROM stdin;
\.


--
-- Data for Name: document_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tags (id, name, color, organization_id, created_at) FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_versions (id, document_id, version, file_path, file_name, change_description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, description, document_type, file_path, file_name, file_size, mime_type, period, region, organization_id, status, version, is_public, incident_id, package_id, created_by, updated_by, approved_by, created_at, updated_at, approved_at) FROM stdin;
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incidents (id, date_time, locality, incident_type, address, description, cause, cause_code, object_type, object_code, region, city, damage, deaths_total, deaths_children, deaths_drunk, deaths_co_total, deaths_co_children, injured_total, injured_children, injured_co_total, injured_co_children, saved_people_total, saved_people_children, saved_property, org_unit_id, created_by, package_id, created_at, updated_at, status, cause_detailed, object_detailed, floor, total_floors, building_details, livestock_lost, destroyed_items, time_of_day, archived_at, steppe_area, steppe_damage, steppe_people_total, steppe_people_dead, steppe_people_injured, steppe_animals_total, steppe_animals_dead, steppe_animals_injured, steppe_extinguished_total, steppe_extinguished_area, steppe_extinguished_damage, steppe_garrison_people, steppe_garrison_units, steppe_mchs_people, steppe_mchs_units, latitude, longitude) FROM stdin;
9dc62727-921d-44fb-91b8-bfdd1b792578	2026-01-20 14:30:00	cities	fire	ул. Абая, 123, кв. 45	Пожар в жилой квартире от неосторожного обращения с огнем	Неосторожное обращение с огнем	6	Жилой дом	1	Астана	Астана	150.50	0	0	0	0	0	1	0	0	0	0	0	0.00	district-1	d4401734-8d2c-4574-8e30-c279b4acbe83	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	6.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
164d816f-8e6d-4d1d-ad69-7e0ef10db964	2026-01-19 08:15:00	cities	fire	ул. Кенесары, 52	Пожар в офисном здании	Короткое замыкание	1	Офисное здание	2	Астана	Астана	320.00	0	0	0	0	0	2	0	0	0	0	0	0.00	district-1	d4401734-8d2c-4574-8e30-c279b4acbe83	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	1.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
5a772740-7096-45f3-8a87-442d19f07a5a	2026-01-18 22:45:00	cities	fire	пр. Республики, 89	Пожар на кухне ресторана	Неосторожное обращение с огнем при готовке	6	Ресторан	5	Астана	Астана	180.00	0	0	0	0	0	1	0	0	0	0	0	0.00	district-1	d4401734-8d2c-4574-8e30-c279b4acbe83	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	6.4	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
d0f0720d-2a31-450a-b59e-96918869c201	2026-01-17 03:20:00	cities	fire	ул. Сыганак, 45, кв. 12	Пожар от непотушенной сигареты	Неосторожность при курении	6	Жилой дом	1	Астана	Астана	85.00	1	0	0	0	0	1	0	0	0	0	0	0.00	district-1	d4401734-8d2c-4574-8e30-c279b4acbe83	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	6.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
605bb78d-2954-4e5b-a956-52c02fc0e825	2026-01-16 16:30:00	cities	nonfire	ул. Момышулы, 34	Ложный вызов - задымление от ремонта	\N	9	Жилой дом	1	Астана	Астана	0.00	0	0	0	0	0	0	0	0	0	0	0	0.00	district-1	d4401734-8d2c-4574-8e30-c279b4acbe83	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	9.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
a372e3f7-5e78-4d89-b293-9534b7e65299	2026-01-20 11:00:00	cities	fire	ул. Тауелсыздык, 78	Пожар в магазине бытовой техники	Неисправность электрооборудования	1	Магазин	6	Астана	Астана	450.00	0	0	0	0	0	3	0	0	0	0	0	0.00	district-2	6af9072b-a776-4c28-8343-2683b5b95ded	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	1.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
1079a628-eba8-4c86-9172-0e2dcaa90d5b	2026-01-19 19:45:00	cities	fire	пр. Кабанбай батыра, 56	Пожар в подвале жилого дома	Поджог	7	Жилой дом	1	Астана	Астана	120.00	0	0	0	0	0	0	0	0	0	0	0	0.00	district-2	6af9072b-a776-4c28-8343-2683b5b95ded	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	7.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
87b5a679-dab9-4569-a09c-00454554fc1a	2026-01-18 07:30:00	cities	co_nofire	ул. Байтурсынова, 145	Отравление угарным газом в квартире	Неисправность газового котла	2	Жилой дом	1	Астана	Астана	0.00	1	0	0	0	0	2	0	0	0	0	0	0.00	district-2	6af9072b-a776-4c28-8343-2683b5b95ded	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	2.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
a4930beb-3f0d-4997-8ec0-3aee4dc18415	2026-01-17 14:20:00	cities	fire	ул. Орынбор, 23	Пожар в автосервисе	Нарушение правил эксплуатации	4	Автосервис	4	Астана	Астана	280.00	0	0	0	0	0	1	0	0	0	0	0	0.00	district-2	6af9072b-a776-4c28-8343-2683b5b95ded	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	4.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
9ce7d44d-64aa-4503-bb44-c7143c4a0589	2026-01-20 23:50:00	cities	fire	ул. Толе би, 234	Пожар в кафе от неисправного оборудования	Неисправность газового оборудования	2	Кафе	5	Алматы	Алматы	380.00	0	0	0	0	0	4	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	2.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
8620cf53-be14-4a50-90ab-b16faaba0cd5	2026-01-19 10:15:00	cities	fire	пр. Достык, 112	Пожар в торговом центре	Неисправность электропроводки	1	ТЦ	6	Алматы	Алматы	1200.00	0	0	0	0	0	5	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	1.3	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
23fba777-36e2-4353-b77c-ee8c071fb159	2026-01-18 05:40:00	cities	fire	ул. Гоголя, 89	Пожар в частном доме	Неисправность печного отопления	3	Частный дом	1	Алматы	Алматы	520.00	2	1	0	0	0	3	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	3.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
6969ae64-787a-4f14-bcd1-7b4db3bf4a1b	2026-01-17 18:25:00	cities	fire	ул. Жибек жолы, 45	Пожар на балконе	Детская шалость с огнем	6	Жилой дом	1	Алматы	Алматы	35.00	0	0	0	0	0	0	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	6.3	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
55ecb024-2b4d-4a06-85a7-ef9a2877b6cb	2026-01-16 12:00:00	cities	co_nofire	ул. Сейфуллина, 178	Отравление угарным газом	Неисправность дымохода	3	Частный дом	1	Алматы	Алматы	0.00	1	1	0	0	0	2	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	3.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
936a2af6-f8a0-4c92-ab85-ebc760e73659	2026-01-15 15:30:00	rural	steppe_fire	Илийский район, 15 км от с. Боралдай	Степной пожар на площади 50 га	Сельскохозяйственный пал	8	Степь	10	Алматы	Илийский район	250.00	0	0	0	0	0	0	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	8.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
f9aa9115-2a38-419e-9aa1-001db5e107f9	2026-01-14 09:00:00	rural	steppe_smolder	Карасайский район	Тление сухой травы на 10 га	Природное самовозгорание	8	Степь	10	Алматы	Карасайский район	15.00	0	0	0	0	0	0	0	0	0	0	0	0.00	district-3	c767788e-d1d0-4041-859c-9cf83618cda2	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	8.2	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
45ef1e90-3891-47d7-bc5b-fa20dacce91d	2026-01-20 08:00:00	cities	fire	пр. Абая, 150	Пожар в административном здании	Короткое замыкание	1	Админ. здание	2	Алматы	Алматы	680.00	0	0	0	0	0	2	0	0	0	0	0	0.00	dchs-almaty	6c2cc656-2c5f-4b99-8ac4-f1adbd4d73fd	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	1.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
f52ae68c-9382-4568-81db-5b1803823709	2026-01-19 21:30:00	cities	fire	пр. Туран, 88	Пожар в бизнес-центре	Неисправность системы кондиционирования	1	Бизнес-центр	2	Астана	Астана	890.00	0	0	0	0	0	1	0	0	0	0	0	0.00	dchs-astana	d1a8048f-3d2f-4998-bd77-06e3adfd59c0	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	1.4	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
ec45eccf-60ce-489f-ac61-aa463f1a8f1c	2026-01-18 13:15:00	cities	fire	ул. Бухар жырау, 67	Пожар на промышленном предприятии	Нарушение технологического процесса	5	Завод	4	Карагандинская область	Караганда	1500.00	0	0	0	0	0	4	0	0	0	0	0	0.00	dchs-karaganda	d1a8048f-3d2f-4998-bd77-06e3adfd59c0	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	5.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
3da15431-1e03-4ca0-8fa2-9efbaf79c48d	2026-01-17 06:45:00	rural	fire	с. Шахтинск, ул. Шахтеров, 12	Пожар в школе	Неисправность электропроводки	1	Школа	8	Карагандинская область	Шахтинск	780.00	0	0	0	0	0	0	0	0	0	0	0	0.00	dchs-karaganda	d1a8048f-3d2f-4998-bd77-06e3adfd59c0	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	resolved	1.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
70d1db3c-d226-45b7-b17f-3526bd568d43	2026-01-16 17:00:00	cities	fire	ул. Республики, 1	Пожар в здании государственного значения	Неустановленная	9	Госучреждение	2	Астана	Астана	2500.00	0	0	0	0	0	3	0	0	0	0	0	0.00	mchs-rk	c55b1e45-6ca5-4092-b73b-f03a6fe40a01	\N	2026-01-26 07:31:32.172147	2026-01-26 07:31:32.172147	investigating	9.1	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0	0	0	0	0	0	0	0.00	0.00	0	0	0	0	\N	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
1	1	user	привет	2026-01-26 12:05:21.943796
2	1	assistant	Здравствуйте!\n\nГотов помочь по любым вопросам пожарной безопасности в Республике Казахстан. Вы можете спросить о нормативных требованиях, расчетах количества огнетушителей, категорировании помещений, порядке организации противопожарных служб и многое другое.\n\nЕсли вам нужна точная ссылка на нормативно-правовой акт или разъяснение по конкретному пункту — просто уточните ваш вопрос.	2026-01-26 12:05:23.667741
3	1	user	расчитай кол-во огнетушителей для адм здания площадью 500 кв.м.	2026-01-26 12:05:46.620105
4	1	assistant	Для расчёта количества огнетушителей в административном здании площадью 500 м² необходимо руководствоваться Правилами пожарной безопасности Республики Казахстан (ППБ РК), утверждёнными Приказом МЧС №55 от 19.04.2022, а также СТ РК 1487-2006 «Огнетушители. Общие технические требования».\n\n**Алгоритм расчёта:**\n\n1. **Определяем минимальный тип огнетушителя**:\n   - Для административных зданий допустимо использование порошковых или углекислотных огнетушителей, как правило, ёмкостью не менее 5 кг/л.\n\n2. **Норма оснащения**:\n   - Согласно пункта 326 ППБ РК (ред. по Приказу №55 МЧС РК):  \n     *«В зданиях и помещениях административного назначения огнетушители должны размещаться из расчёта не менее одного огнетушителя на каждые 100 м² площади этажа, при этом расстояние между огнетушителями не должно превышать 40 м.»*\n\n3. **Расчет количества**:\n   - 500 м² / 100 м² = 5 огнетушителей\n   - Важно: огнетушители размещаются равномерно по этажу, чтобы радиус действия каждого перекрывал обслуживаемую зону (учитываем максимально допустимое расстояние).\n\n4. **Рекомендации по типу и характеристикам**:\n   - Порошковый огнетушитель ОП-5 или ОП-6 (5 или 6 кг), или углекислотный ОУ-5 (5 л).\n   - Разместить так, чтобы к ближайшему огнетушителю было не более 40 метров.\n\n---\n\n**Итого:**  \n**Для административного здания площадью 500 м² необходимо минимум 5 шт. огнетушителей ОП-5 или ОУ-5, равномерно распределённых по помещению.**\n\n---\n\n**Ссылки на НПА РК:**\n- ППБ РК, Приказ МЧС №55, пункт 326: [ППБ Республики Казахстан, 2022](https://adilet.zan.kz/rus/docs/V2200027385)\n- СТ РК 1487-2006 «Огнетушители. Общие технические требования»: [Текст стандарта](https://online.zakon.kz/Document/?doc_id=30354089)\n\nЕсли есть особенности здания (несколько этажей, зоны с повышенной опасностью), уточните – расчёт может меняться!	2026-01-26 12:05:51.791848
5	1	user	к какой чат gpt ты используешь?	2026-01-26 12:07:13.393979
6	1	assistant	Я — специализированный ИИ-ассистент, созданный на базе современных моделей OpenAI GPT-4 (версия 2024), с дополнительным обучением и настройкой для задач пожарной безопасности Республики Казахстан. Моя основная функция — дать точные ответы по нормативам, расчетам и практике МЧС РК, а не просто общий чат GPT для широкой публики.\n\nМои знания и ссылки основаны на актуальных нормативно-правовых актах РК, а ответы структурированы для профессионального применения в системе МЧС или на объектах, требующих пожарной безопасности.\n\nЕсли у вас есть технические вопросы по моделям GPT, могу кратко пояснить:\n- Работаю на основе OpenAI GPT-4 (2024).\n- Имею доступ только к релевантной правовой и технической информации, относящейся к Республике Казахстан.\n  \nГотов дальше отвечать по вашей теме!	2026-01-26 12:07:17.548072
7	1	user	Привет	2026-01-26 12:08:19.427122
8	1	assistant	Здравствуйте!  \nЧем могу помочь по вопросам пожарной безопасности Республики Казахстан?  \n\nМожно задать вопрос по:\n- расчету первичных средств пожаротушения,\n- требованиям к огнетушителям,\n- порядку категорирования помещений,\n- нормативам ППБ РК и другим аспектам.\n\nПожалуйста, уточните ваш запрос!	2026-01-26 12:08:20.571307
9	1	user	найди адрес мчс рк	2026-01-26 12:20:33.94528
10	1	user	:	2026-01-26 12:20:39.805625
11	1	user	найди адрес мчс РК	2026-01-26 12:20:48.740595
12	1	user	найди адрес мчс РК	2026-01-26 12:20:57.712356
13	1	user	найди адрес мчс РК	2026-01-26 12:23:02.761233
14	1	assistant	Министерство по чрезвычайным ситуациям Республики Казахстан (МЧС РК) находится по следующему адресу:\n\n**Город Нурсултан, улица Будённого, 34.**\n\nЕсли вам нужна дополнительная информация или контактные данные, дайте знать!	2026-01-26 12:23:04.035258
15	1	user	что за сведения))) откуда взято? дай ссылки откуа взял	2026-01-26 12:23:34.747284
16	1	assistant	Извините за недоразумение. Я не могу предоставить прямые ссылки на официальные сайты в данный момент. Однако информация о местоположении Министерства по чрезвычайным ситуациям Республики Казахстан можно найти на официальном сайте МЧС РК или в других государственных ресурсах.\n\nДля более точной информации рекомендую обратиться на официальный сайт МЧС РК по адресу: [www.gov.kz/mcs](http://www.gov.kz/mcs) или воспользоваться поиском для получения актуальных данных.\n\nЕсли у вас есть дополнительные вопросы по пожарной безопасности или другому аспекту, пожалуйста, сообщите!	2026-01-26 12:23:36.788567
17	2	user	адрес мчс рк	2026-01-26 12:29:40.708696
18	2	assistant	У меня нет актуальной информации по этому вопросу. Рекомендую обратиться на официальный сайт МЧС РК или позвонить на горячую линию для получения точной информации.	2026-01-26 12:29:41.660861
19	2	user	расчитай мне категорию взрыпожароопасности	2026-01-26 12:30:12.171012
20	2	assistant	Для определения категории взрывопожароопасности помещения необходимо определить его характеристики, такие как:\n\n1. Вид хранимых и использующихся веществ и материалов.\n2. Физико-химические свойства этих веществ.\n3. Процесс, происходящий в помещении (например, наличие открытого огня, тепловых источников).\n4. Конструкция и степень огнестойкости здания.\n\nНа основании этих данных вы можете определить категорию взрывопожароопасности, согласно классификации, принятой в Республике Казахстан. \n\nОсновные категории:\n- **А** – взрывчатые вещества, взрывоопасные.\n- **Б** – легковоспламеняющиеся жидкости и газы, обладающие высокой температурой вспышки.\n- **В1-В4** – горючие вещества различной степени опасности.\n- **Г** – слабо горючие вещества.\n- **Д** – негорючие материалы.\n\nЕсли у вас есть конкретные характеристики помещения и используемых веществ, пожалуйста, предоставьте их, и я помогу вам определить категорию.	2026-01-26 12:30:15.817248
21	2	user	Привет	2026-01-26 13:05:28.6054
22	2	assistant	Здравствуйте! Как я могу помочь вам сегодня?	2026-01-26 13:05:29.423273
23	3	user	найди этот пункт в каком НПА и каокй пункт - В зданиях с витражами высотой более 1 этажа нарушение конструкций дымонепроницаемых негорючих диафрагм, установленных в витражах на уровне каждого этажа, не допускается	2026-01-26 15:11:18.397862
24	3	assistant	У меня нет актуальной информации по этому вопросу. Рекомендую обратиться на официальный сайт МЧС РК или ознакомиться с нормативными правовыми актами, связанными с пожарной безопасностью, чтобы найти требуемый пункт.	2026-01-26 15:11:19.595968
25	3	user	что ты можешь вобще?	2026-01-26 15:11:39.95565
26	3	assistant	Я могу помочь вам с вопросами, связанными с пожарной безопасностью в Республике Казахстан, включая:\n\n1. Объяснение требований правил противопожарной безопасности (ППБ РК).\n2. Разъяснение стандартов, таких как СТ РК 1487-2006 и СП РК 2.02-101-2022.\n3. Расчеты первичных средств пожаротушения с использованием формул и методик.\n4. Определение категорий помещений (А, Б, В1-В4, Г, Д).\n5. Общие консультации по Закону "О гражданской защите".\n6. Требования Приказа МЧС №281, касающегося нормирования в области пожарной безопасности.\n7. Формулы и методики расчетов.\n\nЕсли у вас есть конкретные вопросы в этих областях, я с радостью помогу!	2026-01-26 15:11:43.125092
27	3	user	ну вот я прошу разьяснить этот пункт только не знаю откуда он	2026-01-26 15:12:13.194074
28	3	assistant	Понимаю ваш запрос, но, к сожалению, у меня нет доступа к актуальным нормативным правовым актам, чтобы точно указать, из какого документа взят этот пункт. Я рекомендую вам обратиться к официальным источникам, таким как веб-сайт МЧС РК, или ознакомиться с нормативными правовыми актами, регулирующими требования к строительству и противопожарной безопасности, чтобы найти точную информацию. Если у вас есть другие вопросы по пожарной безопасности, я буду рад помочь!	2026-01-26 15:12:15.288904
29	3	user	В зданиях с витражами высотой более 1 этажа нарушение конструкций дымонепроницаемых негорючих диафрагм, установленных в витражах на уровне каждого этажа, не допускается - разьясни этот пункт!	2026-01-26 15:12:31.80189
30	3	assistant	Данный пункт указывает на важные требования к конструктивным элементам зданий с витражами, которые имеют высоту более одного этажа. Вот пояснение:\n\n1. **Дымонепроницаемые диафрагмы**: Это защитные конструкции, которые предназначены для предотвращения проникновения дыма из одного помещения в другое в случае возникновения пожара. Они помогают локализовать распространение дыма и обеспечивать безопасность людей, находящихся в здании.\n\n2. **Негорючие материалы**: Диафрагмы должны быть изготовлены из негорючих материалов, чтобы избежать их непреднамеренного возгорания и обеспечить дополнительную защиту в случае пожара.\n\n3. **Размещение на уровне каждого этажа**: Установка таких диафрагм на каждом уровне между этажами критически важна для обеспечения эффективной защиты от дыма. Они должны быть непрерывными, чтобы не было "слабых" мест, через которые дым может проникать.\n\n4. **Запрещение нарушений**: Запрет на нарушение конструкций этих диафрагм акцентирует внимание на том, что любые изменения, которые могут повлиять на их целостность и эффективность, недопустимы. Это может включать в себя нарушения в проектировании, строительстве или изменениях внутри здания.\n\nТаким образом, данное требование направлено на обеспечение пожарной безопасности и минимизацию риска распространения дыма в зданиях с витражами, что является особенно важным в многоквартирных или общественных зданиях.	2026-01-26 15:12:36.819525
31	3	user	&	2026-01-30 06:34:49.358709
32	3	user	привет	2026-01-30 06:55:51.421454
33	3	assistant	Здравствуйте! Как я могу помочь вам сегодня?	2026-01-30 06:55:52.341622
34	4	user	что гласит пункт 11 ППБ РК?	2026-01-30 09:01:57.666001
35	4	assistant	К сожалению, у меня нет доступа к актуальным нормативным актам, включая пункты Пожарной безопасности (ППБ) Республики Казахстан. Однако я могу помочь вам с общими требованиями или объяснением концепций, связанных с пожарной безопасностью.\n\nРекомендую обратиться на официальный сайт МЧС РК или в соответствующие органы для получения точной информации о пункте 11 ППБ РК.	2026-01-30 09:01:59.475676
36	4	user	что гласит пункт 11 ППБ РК?	2026-01-30 09:11:28.777946
37	4	assistant	Пункт 11 Правил пожарной безопасности (ППБ) Республики Казахстан, утвержденных Приказом № 55, касается обязанностей должностных лиц, организаций и граждан по соблюдению требований пожарной безопасности.\n\nДля получения конкретного текста пункта 11 рекомендую обратиться непосредственно к документу по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:11:30.863392
38	4	user	процетий слово в слово	2026-01-30 09:12:08.109128
39	4	assistant	Извините, но я не могу предоставить текст пункта 11 ППБ РК слово в слово. Вы можете ознакомиться с полным текстом Правил пожарной безопасности по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:12:09.292548
40	4	user	процетий слово в слово пункт 11 ППБ РК	2026-01-30 09:12:46.506277
41	4	assistant	Извините, но я не могу предоставить текст пункта 11 Правил пожарной безопасности слово в слово. Вы можете ознакомиться с полным текстом документа по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:12:48.014348
42	4	user	процетий слово в слово пункт 11 ППБ РК	2026-01-30 09:15:30.769707
43	4	assistant	К сожалению, я не могу предоставить текст пункта 11 Правил пожарной безопасности (ППБ) Республики Казахстан слово в слово. Рекомендую вам ознакомиться с полным текстом документа по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867) для получения необходимой информации.	2026-01-30 09:15:32.366784
44	5	user	процетий слово в слово пункт 11 ППБ РК	2026-01-30 09:17:16.591417
45	5	assistant	Данный вопрос не регулируется загруженными в систему НПА. Рекомендую обратиться на официальный сайт МЧС РК.	2026-01-30 09:17:17.316249
46	5	user	как расчитать кол-во огнетушителей?	2026-01-30 09:17:38.936987
47	5	assistant	Для расчета количества огнетушителей необходимо учитывать следующие факторы:\n\n1. Площадь помещения.\n2. Класс пожара, который может возникнуть.\n3. Нормативные требования, указанные в Правилах пожарной безопасности.\n\nСогласно Приказу МЧС РК № 55 "Об утверждении Правил пожарной безопасности", количество огнетушителей определяется в зависимости от площади и назначения помещений. \n\nРекомендую ознакомиться с полными требованиями и расчетами в данном нормативном акте.\n\nСсылка на НПА: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867)\n\nДля полной информации перейдите по ссылке.	2026-01-30 09:17:41.248911
48	5	user	расчитай кол-во огнетушителей для адм здания площадью 500 кв.м.	2026-01-30 09:17:56.919619
49	5	assistant	Для расчета количества огнетушителей для административного здания площадью 500 кв.м. необходимо учитывать класс пожара и нормативные требования.\n\nСогласно Правилам пожарной безопасности (Приказ МЧС РК № 55), для административных зданий рекомендуется устанавливать огнетушители в зависимости от площади.\n\nОбычно, для помещений с площадью до 500 кв.м. требуется один огнетушитель на каждые 200 кв.м. площади. Таким образом, для здания площадью 500 кв.м. потребуется:\n\n- 500 кв.м. / 200 кв.м. = 2.5\n\nОкругляем до целого числа, получаем 3 огнетушителя.\n\nСсылка на НПА: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867)\n\nДля полной информации перейдите по ссылке.	2026-01-30 09:17:59.11415
50	5	user	найди в ппб какой это пункт - Трубопроводы в зависимости от транспортируемого по ним вещества обеспечиваются опознавательной окраской, цифровым обозначением и направлением движения продукта	2026-01-30 09:22:00.836668
51	5	assistant	В соответствии с Правилами пожарной безопасности (Приказ МЧС РК № 55), требования к трубопроводам, включая опознавательную окраску, цифровое обозначение и направление движения продукта, указаны в пункте 8.2.\n\nСсылка на НПА: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867)\n\nДля полной информации перейдите по ссылке.	2026-01-30 09:22:02.7458
52	5	user	найди в ппб какой это пункт - Трубопроводы в зависимости от транспортируемого по ним вещества обеспечиваются опознавательной окраской, цифровым обозначением и направлением движения продукта	2026-01-30 09:27:51.998862
53	5	assistant	В Правилах пожарной безопасности (Приказ МЧС РК № 55) требования к трубопроводам, включая опознавательную окраску, цифровое обозначение и направление движения продукта, указаны в пункте 8.5.\n\nСсылка на НПА: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867)\n\nДля полной информации перейдите по ссылке.	2026-01-30 09:27:53.943924
54	6	user	найди в ппб какой это пункт - Трубопроводы в зависимости от транспортируемого по ним вещества обеспечиваются опознавательной окраской, цифровым обозначением и направлением движения продукта	2026-01-30 09:28:06.926509
55	6	assistant	В Правилах пожарной безопасности Республики Казахстан (ППБ № 55), утвержденных приказом МЧС РК от 21.02.2022, информация о трубопроводах и их опознавательной окраске, цифровом обозначении и направлении движения продукта содержится в пункте 5.4. \n\nСогласно этому пункту, трубопроводы, в зависимости от транспортируемого по ним вещества, должны быть обеспечены опознавательной окраской, цифровым обозначением и указанием направления движения продукта. Это требование направлено на обеспечение безопасности и упрощение идентификации трубопроводов в случае возникновения аварийных ситуаций.\n\nДля более детальной информации вы можете ознакомиться с полным текстом ППБ № 55 по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:28:09.760091
56	6	user	а я нашел его под пунктом 849. - нука перепроверь	2026-01-30 09:28:49.954762
57	6	assistant	Вы правы, и я приношу извинения за путаницу. В Правилах пожарной безопасности Республики Казахстан (ППБ № 55) действительно указано, что трубопроводы в зависимости от транспортируемого по ним вещества должны обеспечиваться опознавательной окраской, цифровым обозначением и направлением движения продукта в пункте 849.\n\nЭто требование является частью более широких мер по обеспечению безопасности и предотвращению аварийных ситуаций, связанных с транспортировкой опасных веществ.\n\nСпасибо за ваше терпение и уточнение. Для получения дополнительной информации вы можете обратиться к полному тексту ППБ № 55 по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:28:52.610748
58	6	user	850 процетируй	2026-01-30 09:29:16.615882
59	6	assistant	В соответствии с Правилами пожарной безопасности Республики Казахстан (ППБ № 55), пункт 850 гласит:\n\n**"850. Трубопроводы, по которым транспортируются горючие и токсичные вещества, должны иметь опознавательную окраску, цифровое обозначение и указание направления движения продукта."**\n\nЭто требование направлено на обеспечение безопасности при эксплуатации трубопроводов, а также на предотвращение аварийных ситуаций, связанных с неправильной идентификацией транспортируемых веществ.\n\nДля более подробной информации вы можете ознакомиться с полным текстом ППБ № 55 по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:29:19.086544
60	6	user	расчитай кол-во огнетушителей для адм здания площадью 500 кв.м.	2026-01-30 09:49:21.166872
61	6	assistant	Для расчета количества огнетушителей в административном здании площадью 500 кв.м. необходимо учитывать требования, установленные в Правилах пожарной безопасности Республики Казахстан (ППБ № 55).\n\nСогласно пункту 5.7 ППБ № 55, количество огнетушителей определяется в зависимости от площади помещения и его назначения. В административных зданиях рекомендуется устанавливать огнетушители с учетом следующего:\n\n1. **Огнетушители общего назначения** (например, порошковые) устанавливаются с расчетом 1 огнетушитель на 200 кв.м. площади.\n\nДля вашего случая:\n- Площадь административного здания: 500 кв.м.\n- Расчетное количество огнетушителей: 500 кв.м. / 200 кв.м. = 2,5.\n\nТак как количество огнетушителей должно быть целым числом, округляем до 3. \n\nТаким образом, для административного здания площадью 500 кв.м. необходимо установить **3 огнетушителя**.\n\nДля более подробной информации вы можете ознакомиться с полным текстом ППБ № 55 по следующей ссылке: [ППБ № 55](https://adilet.zan.kz/rus/docs/V2200026867).	2026-01-30 09:49:24.818027
62	7	user	расчитай кол-во огнетушителей для адм здания площадью 500 кв.м.	2026-01-30 09:49:57.929257
63	7	assistant	Для расчета количества огнетушителей в административном здании площадью 500 кв.м. необходимо учитывать требования, установленные в Правилах пожарной безопасности (ППБ РК), утвержденных приказом МЧС № 55.\n\n### Основные требования:\nСогласно пункту 5.6 ППБ РК, огнетушители должны устанавливаться в зависимости от назначения помещений и их площади. \n\n1. **Общая площадь**: 500 кв.м.\n2. **Нормативное количество огнетушителей**: \n   - Для административных зданий (категория А, Б) рекомендуется устанавливать один огнетушитель на каждые 200 кв.м. площади.\n\n### Расчет:\n- Площадь здания: 500 кв.м.\n- Количество огнетушителей = Площадь / Нормативная площадь на один огнетушитель\n- Количество огнетушителей = 500 кв.м. / 200 кв.м. = 2.5\n\nТак как количество огнетушителей должно быть целым числом, округляем до большего целого:\n- **Итоговое количество огнетушителей**: 3.\n\n### Вывод:\nДля административного здания площадью 500 кв.м. необходимо установить **3 огнетушителя**.\n\n### Источник:\n- Правила пожарной безопасности (ППБ РК), приказ МЧС № 55, пункт 5.6. \n- [Ссылка на ППБ РК](https://adilet.zan.kz/rus/docs/V2200026867)	2026-01-30 09:50:01.539861
\.


--
-- Data for Name: normative_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.normative_documents (id, title, short_title, document_number, document_date, category, description, external_url, source, is_active, sort_order, created_by, created_at, updated_at) FROM stdin;
606834cd-10a4-411b-84f9-666466ffd074	Об утверждении технического регламента «Общие требования к пожарной безопасности»	ТР № 405	№ 405	17.08.2021	orders	Технический регламент, устанавливающий общие требования к пожарной безопасности	https://adilet.zan.kz/rus/docs/V2100024045	adilet	t	2	\N	2026-01-30 08:47:38.602496	2026-01-30 08:49:45.015
ebc7b3b2-d0b3-40e4-aac7-218975b9c1f7	Об утверждении Правил пожарной безопасности	ППБ № 55	№ 55	21.02.2022	orders	Основные правила пожарной безопасности в Республике Казахстан	https://adilet.zan.kz/rus/docs/V2200026867	adilet	t	1	\N	2026-01-30 08:47:38.602496	2026-01-30 08:50:11.147
8a312117-26aa-4329-8b8c-a3b15c297c19	Закон Республики Казахстан «О гражданской защите»	О гражданской защите	№ 188-V	11.04.2014	laws	Основной закон, регулирующий вопросы гражданской защиты, включая пожарную безопасность	https://adilet.zan.kz/rus/docs/Z1400000188	adilet	t	1	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
adc16b68-9a98-4780-93f7-b5f5326f9078	Об утверждении перечня организаций и объектов, на которых в обязательном порядке создается негосударственная противопожарная служба	НГПС № 281	№ 281	29.05.2023	orders	Перечень организаций и объектов для создания НГПС	https://adilet.zan.kz/rus/docs/V2300032631	adilet	t	7	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
8667d2e7-cb1d-4f50-bced-4a1337c18bba	Об утверждении Правил организации тушения пожаров	№ 446	№ 446	26.06.2017	orders	Правила организации тушения пожаров	https://adilet.zan.kz/rus/docs/V1700015430	adilet	t	4	\N	2026-01-30 08:47:38.602496	2026-01-30 08:50:37.275
8a2b22d2-fa6b-4f75-bf75-c9c444b1b046	Об утверждении Правил тушения степных пожаров, а также пожаров в населенных пунктах, в которых отсутствуют подразделения государственной противопожарной службы	№ 107	№ 107	11.02.2015	orders	Правила тушения степных пожаров и пожаров в населённых пунктах без подразделений ГПС	https://adilet.zan.kz/rus/docs/V15C0010433	adilet	t	5	\N	2026-01-30 08:47:38.602496	2026-01-30 08:50:43.98
e5c4fd6d-e71d-4719-bdff-a90194fad2a3	Об утверждении Устава службы противопожарной службы	Устав ПС	№ 445	26.06.2017	orders	Устав службы противопожарной службы	https://adilet.zan.kz/rus/docs/V1700015422	adilet	t	6	\N	2026-01-30 08:47:38.602496	2026-01-30 08:50:49.784
0002f659-aa91-442e-83a0-30c2a0b3c771	Об утверждении Правил осуществления деятельности негосударственных противопожарных служб	№ 782	№ 782	07.11.2014	orders	Правила осуществления деятельности НГПС	https://adilet.zan.kz/rus/docs/V14C0009931	adilet	t	8	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
41a218bf-8a8a-4fe9-a468-b480825d8179	Об утверждении разрешительных требований, предъявляемых к негосударственным противопожарным службам	№ 783	№ 783	07.11.2014	orders	Разрешительные требования к НГПС	https://adilet.zan.kz/rus/docs/V14C0009942	adilet	t	9	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
12413c5a-5528-411a-ba9a-e54ce7b3fa9a	Об утверждении Правил аттестации негосударственных противопожарных служб на право проведения работ по предупреждению и тушению пожаров	№ 514	№ 514	13.07.2018	orders	Правила аттестации НГПС	https://adilet.zan.kz/rus/docs/V1800017281	adilet	t	10	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
c5c131f0-0cd0-4d5f-98e2-6916fd502bcc	Об утверждении Программы курсов обучения по специальной подготовке специалистов негосударственных противопожарных служб	№ 48	№ 48	24.01.2015	orders	Программа курсов обучения специалистов НГПС	https://adilet.zan.kz/rus/docs/V15C0010382	adilet	t	11	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
25383c84-a3e0-4c17-adf4-a63e140a12d2	Об утверждении Правил проведения аудита в области пожарной безопасности	Аудит № 240	№ 240	03.04.2017	orders	Правила проведения аудита в области пожарной безопасности	https://adilet.zan.kz/rus/docs/V1700015099	adilet	t	12	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
c4599d04-70d6-4769-9bfd-c1c681d005db	Об утверждении разрешительных требований, предъявляемых к экспертным организациям	№ 110	№ 110	13.02.2015	orders	Разрешительные требования к экспертным организациям	https://adilet.zan.kz/rus/docs/V1500010496	adilet	t	13	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
bcd688ed-55ad-44d6-9acd-cd626d490eea	Об утверждении Правил аккредитации экспертных организаций	№ 112	№ 112	13.02.2015	orders	Правила аккредитации экспертных организаций	https://adilet.zan.kz/rus/docs/V1500010488	adilet	t	14	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
a94b85b8-aebb-4059-8bee-3c375b3e1322	Об утверждении Правил осуществления деятельности исследовательских испытательных пожарных лабораторий	№ 510	№ 510	27.07.2017	orders	Правила деятельности исследовательских испытательных пожарных лабораторий	https://adilet.zan.kz/rus/docs/V1700015540	adilet	t	15	\N	2026-01-30 08:47:38.602496	2026-01-30 08:47:38.602496
8e8c3358-b530-4cc3-b383-6e68d1b4b8ef	Об утверждении Правил выдачи разрешения на осуществление деятельности по монтажу, наладке и техническому обслуживанию систем пожарной автоматики	№ 372	№ 372	28.08.2025	orders	Правила выдачи разрешения на монтаж систем пожарной автоматики	https://adilet.zan.kz/rus/docs/V2500036734	adilet	t	16	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
5ece8d0f-967c-462c-a29b-6006eaa7533c	Об утверждении разрешительных требований, предъявляемых к ИП и юридическим лицам на осуществление деятельности по монтажу, наладке и техническому обслуживанию систем пожарной автоматики	№ 322	№ 322	14.08.2025	orders	Разрешительные требования к организациям по монтажу систем пожарной автоматики	https://adilet.zan.kz/rus/docs/V2500036640	adilet	t	17	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
ccab4bf4-eb3c-417d-87fb-751a5b0c1f3e	Об утверждении Правил выдачи заключения о соответствии объекта требованиям пожарной безопасности	№ 359	№ 359	26.08.2025	orders	Правила выдачи заключения о соответствии объекта требованиям ПБ	https://adilet.zan.kz/rus/docs/V2500036695	adilet	t	18	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
e5b77003-516b-4d20-aead-b320e28d454b	Об утверждении формы заключения о соответствии объекта требованиям пожарной безопасности перед приемкой его в эксплуатацию	№ 309	№ 309	06.08.2025	orders	Форма заключения о соответствии объекта требованиям ПБ	https://adilet.zan.kz/rus/docs/V2500036593	adilet	t	19	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
487d5ea9-798c-47aa-b8e3-a56f6407e92d	Об утверждении Правил обучения работников организаций и населения мерам пожарной безопасности и требования к содержанию учебных программ	№ 276	№ 276	09.06.2014	orders	Правила обучения работников и населения мерам пожарной безопасности	https://adilet.zan.kz/rus/docs/V1400009510	adilet	t	20	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
00484152-d13e-4560-940e-a50b9d499b24	Об утверждении квалификационных требований к специализированным учебным центрам в области пожарной безопасности	№ 926	№ 926	16.11.2015	orders	Квалификационные требования к учебным центрам по пожарной безопасности	https://adilet.zan.kz/rus/docs/V1500012478	adilet	t	21	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
99f17726-b806-407f-a617-f5cf159569a5	Об утверждении учебной программы первоначальной подготовки добровольных пожарных	№ 888	№ 888	07.11.2015	orders	Учебная программа подготовки добровольных пожарных	https://adilet.zan.kz/rus/docs/V1500012416	adilet	t	22	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
771352cd-6418-41f6-bd51-be8daf35fae6	Об утверждении Инструкции использования технических средств при осуществлении государственного контроля и надзора в области пожарной безопасности	№ 236	№ 236	20.06.2024	orders	Инструкция использования технических средств при госконтроле	https://adilet.zan.kz/rus/docs/V2400034540	adilet	t	23	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
5f863928-469c-43b1-bff7-78baac2688cc	Об утверждении критериев оценки степени риска и проверочных листов в области пожарной безопасности и гражданской обороны	№ 758/31	№ 758 и № 31	30.10.2018	orders	Критерии оценки степени риска и проверочные листы	https://adilet.zan.kz/rus/docs/V1800017647	adilet	t	24	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
50ed7da6-f1cc-41a1-acfe-2bb7abb687d7	Об утверждении формы акта о приостановлении деятельности или отдельных видов деятельности в области пожарной безопасности	№ 249	№ 249	27.06.2024	orders	Форма акта о приостановлении деятельности в области ПБ	https://adilet.zan.kz/rus/docs/V2400034610	adilet	t	25	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
288740d3-1e5e-470b-963c-1f166a219fd2	Об утверждении Правил создания местными исполнительными органами пожарных постов, их материально-технического оснащения	№ 746	№ 746	30.10.2014	orders	Правила создания пожарных постов местными исполнительными органами	https://adilet.zan.kz/rus/docs/V14C0009928	adilet	t	26	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
95698b8d-5e57-4d97-8661-4ce30d24fde7	Об утверждении Правил согласования специальных технических условий, отражающих специфику противопожарной защиты объектов	№ 351	№ 351	22.08.2025	orders	Правила согласования специальных технических условий	https://adilet.zan.kz/rus/docs/V2500036681	adilet	t	27	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
d6b12ea7-62de-46d4-89e1-f8dd30ba9b8a	Об утверждении форм, предназначенных для сбора административных данных «Сведения о пожарах»	№ 377	№ 377	28.08.2025	orders	Формы для сбора административных данных о пожарах	https://adilet.zan.kz/rus/docs/G25O0000377	adilet	t	28	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
5855ba46-f9b3-4fc6-bd2e-bc10dc7d64e2	Об утверждении Правил обеспечения питанием сотрудников и военнослужащих органов гражданской защиты при нахождении на казарменном положении	№ 373	№ 373	28.08.2025	orders	Правила обеспечения питанием сотрудников при казарменном положении	https://adilet.zan.kz/rus/docs/V2500036731	adilet	t	29	\N	2026-01-30 08:48:11.060839	2026-01-30 08:48:11.060839
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, data, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: org_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.org_units (id, type, name, parent_id, region_name, unit_name, is_active, created_at, updated_at, code) FROM stdin;
mchs-rk	MCHS	МЧС Республики Казахстан	\N			t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
dchs-astana	DCHS	ДЧС города Астана	mchs-rk	Астана	Астана	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
dchs-almaty	DCHS	ДЧС города Алматы	mchs-rk	Алматы	Алматы	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
dchs-karaganda	DCHS	ДЧС Карагандинской области	mchs-rk	Карагандинская область	Караганда	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
district-1	DISTRICT	РОЧС Сарыарка	dchs-astana	Астана	Сарыарка	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
district-2	DISTRICT	РОЧС Алматинский	dchs-astana	Астана	Алматинский	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
district-3	DISTRICT	РОЧС Бостандык	dchs-almaty	Алматы	Бостандык	t	2026-01-19 10:28:31.661565	2026-01-19 10:28:31.661565	\N
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, type, parent_id, code, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packages (id, period, organization_id, status, submitted_by, submitted_at, reviewed_by, reviewed_at, approved_by, approved_at, rejection_reason, created_at, updated_at, org_unit_id) FROM stdin;
\.


--
-- Data for Name: photo_albums; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photo_albums (id, subsection_id, title, slug, description, cover_image_url, author_id, tags, views, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photos (id, album_id, title, description, image_url, thumbnail_url, "order", created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, subsection_id, title, slug, excerpt, content, content_type, author_id, featured_image_url, tags, views, is_published, is_featured, published_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: presentations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presentations (id, subsection_id, title, slug, description, file_url, thumbnail_url, slide_count, author_id, tags, views, downloads, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, title, slug, description, icon, "order", is_active, created_at, updated_at) FROM stdin;
7f5cfe3f-d9a7-4329-beeb-35917e77c7bb	Нормативные документы	normative-documents	Нормативно-правовые акты по пожарной безопасности	fas fa-file-text	0	t	2025-12-17 16:50:41.891713	2025-12-17 16:50:41.891713
9068c2a6-46eb-4ede-aef4-591fd8801ff7	Образовательные материалы	educational-materials	Обучающие материалы и курсы	fas fa-book	0	t	2025-12-17 16:50:42.124088	2025-12-17 16:50:42.124088
0197d168-0422-4e30-9233-9f5e4a2c2e93	Новости	news	Новости пожарной безопасности	fas fa-newspaper	0	t	2025-12-17 16:50:42.353238	2025-12-17 16:50:42.353238
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
1ATkG5HU6FAebDAfasGf2MCDmNXJzw00	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-02T14:16:53.443Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "passport": {"user": "a9c96656-a033-448a-a2df-9ee4e2965313"}}	2026-02-03 08:58:19
\.


--
-- Data for Name: subsections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subsections (id, section_id, title, slug, description, "order", is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, full_name, region, district, role, organization_id, is_active, created_at, updated_at, email, first_name, last_name, profile_image_url, company_name, phone, auth_provider, telegram_id, city, rating, review_count, is_verified, bio, specializations, work_experience, service_area, documents, is_online, last_active_at, portfolio_items, org_unit_id, must_change_on_first_login, last_login_at) FROM stdin;
09947d97-b839-4678-a895-e38450711802	ochs_abay_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Аксуат	Область Абай	район Аксуат	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 10:48:29.69		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	2026-01-19 10:48:29.69
1cc5c9ff-afb0-4dc1-bebc-ab18affe35d2	dchs_karaganda	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Карагандинской области	Карагандинская область		DCHS	\N	t	2026-01-19 09:40:34.279305	2026-01-26 07:18:45.995		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	2026-01-26 07:18:45.995
e9423f41-3e08-4972-9a80-4843565a2dcd	uchs_almaty_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Алмалинского района	г. Алматы	Алмалинский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9b31aa9a-f8c0-43e5-8088-71df14a55156	uchs_almaty_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Ауэзовского района	г. Алматы	Ауэзовский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
08199167-74d3-4251-8d62-937e442ee54c	uchs_almaty_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Бостандыкского района	г. Алматы	Бостандыкский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
98c69327-2ff1-4a6b-a83c-290134c0bbe6	uchs_almaty_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Жетысуского района	г. Алматы	Жетысуский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
81bf91fd-aba1-440a-a0f9-a823b4bff20e	uchs_almaty_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Медеуского района	г. Алматы	Медеуский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3489ec79-da67-45e0-beca-42dbee387036	uchs_almaty_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Наурызбайского района	г. Алматы	Наурызбайский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
70fec1c1-9d55-41a3-adc6-55525319c105	uchs_almaty_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Турксибского района	г. Алматы	Турксибский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7df07c20-f8a6-4296-bab6-60a842657ee8	uchs_shymkent_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Абайского района	г. Шымкент	Абайский район	OCHS	\N	t	2026-01-19 09:40:33.397744	2026-01-19 09:40:33.397744		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d3b927ff-d8d5-4f8c-93d3-f82bdc508aab	uchs_shymkent_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Аль-Фарабийского района	г. Шымкент	Аль-Фарабийский район	OCHS	\N	t	2026-01-19 09:40:33.397744	2026-01-19 09:40:33.397744		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
56fe9f3f-85e7-4f17-8b1c-f18edf6a82d1	uchs_shymkent_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Енбекшинского района	г. Шымкент	Енбекшинский район	OCHS	\N	t	2026-01-19 09:40:33.397744	2026-01-19 09:40:33.397744		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0e0bee68-180c-49ef-8482-e1996bcb1136	uchs_shymkent_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Туранского района	г. Шымкент	Туранский район	OCHS	\N	t	2026-01-19 09:40:33.397744	2026-01-19 09:40:33.397744		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
95a61653-1cb2-4588-8a8b-a2798bd9792d	uchs_shymkent_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Каратау"	г. Шымкент	район Каратау	OCHS	\N	t	2026-01-19 09:40:33.397744	2026-01-19 09:40:33.397744		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f99a8caf-cfca-458c-b867-cf2083ba262e	dchs_akmola	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Акмолинской области	Акмолинская область		DCHS	\N	t	2026-01-19 09:40:33.458551	2026-01-19 09:40:33.458551		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f730a0a9-0384-45eb-8937-03996e76da22	uchs_akmola_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Кокшетау	Акмолинская область	город Кокшетау	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
dc70420d-e645-4966-be58-d2ddf191bc76	ochs_akmola_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жаркаинского района	Акмолинская область	Жаркаинский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
93c7a540-582b-4682-84fc-bde609e72cc7	ochs_akmola_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аккольского района	Акмолинская область	Аккольский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
dc8f32c7-768a-46ea-aec5-ff2f1966403a	ochs_akmola_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аршалинского района	Акмолинская область	Аршалинский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8cbbc059-8639-4e27-84f8-dba79ab72fa1	ochs_akmola_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Астраханского района	Акмолинская область	Астраханский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
18706598-4d81-46e2-b489-4af9e9766bca	ochs_akmola_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Атбасарского района	Акмолинская область	Атбасарский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6c1f9abe-3a45-4236-8324-01bec7114239	ochs_akmola_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Биржан сал	Акмолинская область	район Биржан сал	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
80270c14-94ad-4147-9773-2402721c72bc	ochs_akmola_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Буландынского района	Акмолинская область	Буландынский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
00dd8732-4557-41d8-b25c-2cf354321db4	ochs_akmola_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бурабайского района	Акмолинская область	Бурабайский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
22531c37-81dd-4fd4-a03f-3f267569326a	ochs_akmola_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Егиндыкольского района	Акмолинская область	Егиндыкольский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ecca6219-c429-4748-928d-bb0362a2c97e	ochs_akmola_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Ерейментауского района	Акмолинская область	Ерейментауский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b6244871-1ff0-44d7-abad-66af23bda90d	ochs_akmola_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Есильского района	Акмолинская область	Есильский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1c5600cb-a4c2-459f-84eb-d926caa8df37	ochs_akmola_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жаксынского района	Акмолинская область	Жаксынский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6dc1405f-179e-4a55-b7f9-006958327023	ochs_akmola_14	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Зерендинского района	Акмолинская область	Зерендинский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4dfaaee0-94a0-47bd-b6f4-29596f922403	ochs_akmola_15	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Коргалжынского района	Акмолинская область	Коргалжынский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
dae9abe0-7d55-41ad-810f-4edde9090805	ochs_akmola_16	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Косшы	Акмолинская область	город Косшы	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
665ab0ef-8e54-48cf-ab08-8909a7b2bc18	ochs_akmola_17	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сандыктауского района	Акмолинская область	Сандыктауский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
41fc465d-619b-42ad-8e04-c1a52678e542	uchs_akmola_18	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Степногорска	Акмолинская область	город Степногорск	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e76fd75f-fdde-4ee4-a480-9736c7afeb54	ochs_akmola_19	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Целиноградского района	Акмолинская область	Целиноградский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4c9c87aa-803b-4e83-9e44-828e4823d76f	ochs_akmola_20	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шортандинского района	Акмолинская область	Шортандинский район	OCHS	\N	t	2026-01-19 09:40:33.529335	2026-01-19 09:40:33.529335		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
21362001-0d66-4d56-9004-fc886ee54a75	dchs_aktobe	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Актюбинской области	Актюбинская область		DCHS	\N	t	2026-01-19 09:40:33.586964	2026-01-19 09:40:33.586964		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
307d72b6-eb00-498c-831b-2e00b8501fd7	uchs_aktobe_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Актобе	Актюбинская область	город Актобе	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7a838587-c3f6-4128-a829-634c17700fd8	ochs_aktobe_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Айтекебийского района	Актюбинская область	Айтекебийский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e74d58ba-464d-44dd-ad84-96aefe901099	ochs_aktobe_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Алгинского района	Актюбинская область	Алгинский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
eb3be441-1cb3-41af-87fd-ddadc1edab1f	ochs_aktobe_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Байганинского района	Актюбинская область	Байганинский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f0952f31-53d3-47d0-a8fb-5a48e9a69225	ochs_aktobe_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Иргизского района	Актюбинская область	Иргизский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ececff99-a3a9-4edf-92e6-ff861e3d0088	ochs_aktobe_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Каргалинского района	Актюбинская область	Каргалинский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a5180bd9-a7d9-488f-bf8c-4d93172d6b73	ochs_aktobe_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кобдинского района	Актюбинская область	Кобдинский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1c5c65d0-2c18-446c-9972-03bbdbb65428	ochs_aktobe_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мартукского района	Актюбинская область	Мартукский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b535f5b7-bab0-41ab-ae36-09bb1e1d3c04	ochs_aktobe_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мугалжарского района	Актюбинская область	Мугалжарский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0f1f6d55-ebf9-407e-8001-ab0d67e76346	ochs_aktobe_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Темирского района	Актюбинская область	Темирский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6d0616a6-f1c1-47ec-ac65-338258d972e1	ochs_aktobe_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Уилского района	Актюбинская область	Уилский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0cd047f2-83b5-433f-b177-5bf1753645e5	ochs_aktobe_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Хромтауского района	Актюбинская область	Хромтауский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
642f8dad-81fe-4bbf-aba5-ffddd2618b7f	ochs_aktobe_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шалкарского района	Актюбинская область	Шалкарский район	OCHS	\N	t	2026-01-19 09:40:33.645684	2026-01-19 09:40:33.645684		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
394bd9cb-0120-4635-a6c3-9ba204a0de57	dchs_almaty_obl	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Алматинской области	Алматинская область		DCHS	\N	t	2026-01-19 09:40:33.70191	2026-01-19 09:40:33.70191		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
62029c03-6a7e-4fa3-a182-e5ef272fa6ba	ochs_almaty_obl_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС г.Алатау	Алматинская область	г.Алатау	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a350e874-1052-4c03-8775-0ecd21760984	ochs_almaty_obl_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Карасайского района	Алматинская область	Карасайский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
78e478d8-3170-4a35-8e45-c750a41008ee	ochs_almaty_obl_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Талгарского района	Алматинская область	Талгарский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7f9d7584-418b-45e9-9a44-0d13e9a2fd82	ochs_almaty_obl_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Райымбекского района	Алматинская область	Райымбекский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
13639283-02e2-46f4-91be-015bd029ad99	ochs_almaty_obl_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жамбылского района	Алматинская область	Жамбылский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
54f5c624-d900-4697-b3b4-2bd9d37c32a5	ochs_almaty_obl_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Енбекшиказахского района	Алматинская область	Енбекшиказахский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
dd384d20-d6f6-4fae-8bb5-bd0ad1fc6238	ochs_almaty_obl_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Илийского района	Алматинская область	Илийский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2df5fe04-f604-44fc-bd85-9768f7ede199	ochs_almaty_obl_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кегенского района	Алматинская область	Кегенский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c23ee6c4-8324-4cfe-9a8a-26273a323703	ochs_almaty_obl_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Балхашского района	Алматинская область	Балхашский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
26a88843-0213-4f64-9c3e-bb15ca52874e	ochs_almaty_obl_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Уйгурского района	Алматинская область	Уйгурский район	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c6c6e96c-e239-47f3-91c5-b29f2d93fc1a	uchs_almaty_obl_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС г.Конаев	Алматинская область	г.Конаев	OCHS	\N	t	2026-01-19 09:40:33.758147	2026-01-19 09:40:33.758147		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c7a12d26-2609-4689-843a-9f4f7fdaad1f	dchs_atyrau	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Атырауской области	Атырауская область		DCHS	\N	t	2026-01-19 09:40:33.814501	2026-01-19 09:40:33.814501		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0bf6be75-3f45-41b3-a843-9a025e2e60bc	uchs_atyrau_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Атырау	Атырауская область	город Атырау	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8bc20f11-c211-4f20-bf39-c780123a4399	ochs_atyrau_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жылыойского района	Атырауская область	Жылыойский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
22b111cc-42ac-4177-80e6-9e6cf85a69d2	ochs_atyrau_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Индерского района	Атырауская область	Индерский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0d5deffa-7526-4dbc-af21-0be4108bbd6c	ochs_atyrau_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Исатайского района	Атырауская область	Исатайский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9aae0e3d-400a-464f-bc50-09a5f13e34c3	ochs_atyrau_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Курмангазинского района	Атырауская область	Курмангазинский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5819a32c-dab1-4cc2-980f-b8758fed20fa	ochs_atyrau_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кызылкогинского района	Атырауская область	Кызылкогинский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5aa6033c-1eb1-49cd-a0e1-ae44572d8d13	ochs_atyrau_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Макатского района	Атырауская область	Макатский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7c7c832c-429c-4f07-9ce2-9207ab42bde4	ochs_atyrau_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Махамбетского района	Атырауская область	Махамбетский район	OCHS	\N	t	2026-01-19 09:40:33.870689	2026-01-19 09:40:33.870689		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
99cdb802-12da-4125-8c87-a0194e55f0c0	dchs_vko	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС ВКО	Восточно-Казахстанская область		DCHS	\N	t	2026-01-19 09:40:33.927428	2026-01-19 09:40:33.927428		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ee891f61-cd4b-4960-b35f-a9b92f926ad9	uchs_vko_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Усть-Каменогорска	Восточно-Казахстанская область	город Усть-Каменогорск	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ca34b9b5-9329-4506-90bb-6208d3dee544	ochs_vko_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Глубоковского района	Восточно-Казахстанская область	Глубоковский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
85b2ffa5-9413-4698-97f1-688e3aee9228	ochs_vko_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Зайсанского района	Восточно-Казахстанская область	Зайсанский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9d5e0080-1568-4a1b-a574-48f87e94ddb1	ochs_vko_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Катон-Карагайского района	Восточно-Казахстанская область	Катон-Карагайский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5f1ab503-f2a7-47bc-bd20-443bff90c784	ochs_vko_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Курчумского района	Восточно-Казахстанская область	Курчумский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f20e7aa7-5980-4689-b0c8-78537bfeeb8c	ochs_vko_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Самар	Восточно-Казахстанская область	район Самар	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
cb8bf811-9c7e-4073-a4cb-be4f7d0d1937	ochs_vko_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Тарбагатайского района	Восточно-Казахстанская область	Тарбагатайский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b7c5e420-a56c-42bc-bdd5-e3269bb41d98	ochs_vko_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Уланского района	Восточно-Казахстанская область	Уланский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a04f6988-28ac-4158-8413-9c6a4e30f0cd	ochs_vko_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шемонаихинского района	Восточно-Казахстанская область	Шемонаихинский район	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5c76f6c6-1411-40b9-8544-aa7af0947636	uchs_vko_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Риддер	Восточно-Казахстанская область	город Риддер	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
01bd3b2f-4f75-42d2-bfb0-a2658659f772	uchs_vko_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района Алтай	Восточно-Казахстанская область	район Алтай	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0108c313-565f-4943-8127-e7daf5c730f1	ochs_vko_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Маркакел	Восточно-Казахстанская область	район Маркакел	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0249c257-857d-4d14-98df-8ae9254361b8	ochs_abay_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Курчатова	Область Абай	город Курчатов	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
66a7d7be-6598-4249-a70b-331def14449d	ochs_vko_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Улкен Нарын	Восточно-Казахстанская область	район Улкен Нарын	OCHS	\N	t	2026-01-19 09:40:33.986493	2026-01-19 09:40:33.986493		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a4ea3b61-a652-4ff7-b702-69a24ef78cc2	dchs_zhambyl	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Жамбылской области	Жамбылская область		DCHS	\N	t	2026-01-19 09:40:34.042961	2026-01-19 09:40:34.042961		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2015d875-7d05-476d-818a-3caf96de3943	uchs_zhambyl_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Тараз	Жамбылская область	город Тараз	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
77abdd0b-4e39-41e7-9d0d-73137c96852d	ochs_zhambyl_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Байзакского района	Жамбылская область	Байзакский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f1f88482-1fc6-4866-a39b-d1e66a9db3cc	ochs_zhambyl_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жамбылского района	Жамбылская область	Жамбылский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f1e54441-07ab-45a5-bed7-bd38c50d3551	ochs_zhambyl_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жуалынского района	Жамбылская область	Жуалынский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
de66e2b4-aef2-4630-bbbb-c7c5045c42dd	ochs_zhambyl_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кордайского района	Жамбылская область	Кордайский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d2c6c975-736f-4815-8d34-ae273a03c768	ochs_zhambyl_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Меркенского района	Жамбылская область	Меркенский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e54ecfa7-398a-4f51-8d60-18c643e2999a	ochs_zhambyl_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мойынкумского района	Жамбылская область	Мойынкумский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
886c1fa0-9588-41c5-ba5b-cf3c72b8d394	ochs_zhambyl_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Турара Рыскулова	Жамбылская область	район Турара Рыскулова	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0814aa7a-453a-4e59-870c-8683ea90d719	ochs_zhambyl_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сарысуского района	Жамбылская область	Сарысуский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c8681c78-f2cb-48c1-9bac-dfc1f4acdb57	ochs_zhambyl_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Таласского района	Жамбылская область	Таласский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
bb4f9224-87ad-490a-89e9-bb702273fe44	ochs_zhambyl_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шуского района	Жамбылская область	Шуский район	OCHS	\N	t	2026-01-19 09:40:34.099243	2026-01-19 09:40:34.099243		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
371727bb-fab8-4512-8071-841f0d7473e1	dchs_zko	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС ЗКО	Западно-Казахстанская область		DCHS	\N	t	2026-01-19 09:40:34.155371	2026-01-19 09:40:34.155371		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d70dd30b-de41-4de3-81bb-00cd1b36fbb7	uchs_zko_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Уральска	Западно-Казахстанская область	город Уральск	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
765d956c-c259-4297-acfb-2d4fec1658de	ochs_zko_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Акжаикского района	Западно-Казахстанская область	Акжаикский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
792e8152-5065-4b0a-9a34-4ec0b383921b	ochs_zko_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бокейординского района	Западно-Казахстанская область	Бокейординский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2f892b02-2cb2-44b6-9532-b56601214d38	ochs_zko_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жангалинского района	Западно-Казахстанская область	Жангалинский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
36a07ca1-5ce3-416a-9279-7cf84f05b3fe	ochs_zko_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жанибекского района	Западно-Казахстанская область	Жанибекский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4226efc3-0fc5-4dd9-a5b6-ebc6f6c55f51	ochs_zko_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Казталовского района	Западно-Казахстанская область	Казталовский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a773fa93-ddb0-4100-96fd-d8794f4425a8	ochs_zko_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Каратобинского района	Западно-Казахстанская область	Каратобинский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6676a9c6-c693-4af2-b491-bc275ecf9c7d	ochs_zko_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Байтерек	Западно-Казахстанская область	район Байтерек	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8d313a80-100b-4faf-b02c-b71d977335f4	ochs_zko_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сырымского района	Западно-Казахстанская область	Сырымский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d708c1c9-ba8e-4704-a87b-b8884f142a12	ochs_zko_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Таскалинского района	Западно-Казахстанская область	Таскалинский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b75b2817-82ef-49fc-bb06-9653dc1be79a	ochs_zko_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Теректинского района	Западно-Казахстанская область	Теректинский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5068ef38-1e47-4005-8877-6c39d73b85d8	ochs_zko_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Чингирлауского района	Западно-Казахстанская область	Чингирлауский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3bcbcb90-9b49-4e9c-8364-17cba180032d	uchs_karaganda_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Караганды	Карагандинская область	город Караганды	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
14b786c9-7594-4781-a005-b05ba0a8373c	ochs_karaganda_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Приозерска	Карагандинская область	город Приозерск	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
38962fa9-6251-4dbf-b1b0-cbec75e4bb3e	ochs_karaganda_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Абайского района	Карагандинская область	Абайский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7ab3381c-6c9f-4423-ac9a-2f33fa516cdc	ochs_karaganda_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Актогайского района	Карагандинская область	Актогайский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3bb0a923-c8b6-4680-adb6-490800e617bc	ochs_karaganda_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бухар-Жырауского района	Карагандинская область	Бухар-Жырауский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b208e190-fb73-40d2-b7d2-a355844a592a	ochs_karaganda_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Сарани	Карагандинская область	город Сарань	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e23cad54-d1ce-477d-ba5e-be6da2ef6620	ochs_karaganda_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Шахтинска	Карагандинская область	город Шахтинск	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a43ef634-ac1d-4140-82c7-d3d2ccb9b363	ochs_karaganda_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Каркаралинского района	Карагандинская область	Каркаралинский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
353473b6-551e-400e-97bf-8d399d294a38	ochs_karaganda_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Нуринского района	Карагандинская область	Нуринский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9e3a1008-f01e-4ce2-a9b0-cd40563407e8	ochs_karaganda_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Осакаровского района	Карагандинская область	Осакаровский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2471e02f-02db-4a87-b425-891ba6c112a6	ochs_karaganda_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шетского района	Карагандинская область	Шетский район	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1fee2ccc-f5d8-41dc-bb44-9239d64fecf6	ochs_karaganda_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Балхаша	Карагандинская область	город Балхаш	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2b1b70ca-4160-42aa-81a4-1022b4a86f59	uchs_karaganda_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Темиртау	Карагандинская область	город Темиртау	OCHS	\N	t	2026-01-19 09:40:34.335731	2026-01-19 09:40:34.335731		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e766b994-dd20-4e48-a62c-1e8f8328b89c	dchs_kostanay	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Костанайской области	Костанайская область		DCHS	\N	t	2026-01-19 09:40:34.392084	2026-01-19 09:40:34.392084		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0c735a75-c206-435d-af9a-1eb5a2a5d3c6	uchs_kostanay_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Костанай	Костанайская область	город Костанай	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3a4ad8bb-1f14-41db-9fe5-c7c63cab8e22	ochs_kostanay_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Узункольского района	Костанайская область	Узункольский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
84b6838d-e071-493b-963a-80ae0b56e64d	ochs_kostanay_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Алтынсаринского района	Костанайская область	Алтынсаринский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
88637cf7-735c-4430-ac29-62335215a7f6	ochs_abay_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Маканшы	Область Абай	район Маканшы	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ac571641-6e22-4425-852a-a06b7163bd1d	ochs_kostanay_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Амангельдинского района	Костанайская область	Амангельдинский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
84196246-4ecb-4a28-b493-3ed95bc39887	uchs_kostanay_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Аркалыка	Костанайская область	город Аркалык	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3ec574b8-292d-461e-8bed-e469bf7f050d	ochs_kostanay_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аулиекольского района	Костанайская область	Аулиекольский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
11780a76-1ec2-44c6-a126-7db774efe732	ochs_kostanay_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Денисовского района	Костанайская область	Денисовский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
02f7fa02-41ad-43cf-b1db-29b12ce8800d	ochs_kostanay_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жангельдинского района	Костанайская область	Жангельдинский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
699f2c9c-1571-4c89-81ac-947453da67ac	ochs_kostanay_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Житикаринского района	Костанайская область	Житикаринский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
26d4cdcc-2c07-4d44-8b48-3b57ee081a86	ochs_kostanay_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Камыстинского района	Костанайская область	Камыстинский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1c0ce19b-3915-452a-b7fe-611a417542dd	ochs_kostanay_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Карабалыкского района	Костанайская область	Карабалыкский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f6b30f31-ded5-46dd-9771-6cf700e6da20	ochs_kostanay_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Карасуского района	Костанайская область	Карасуский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
17bea585-6e04-4069-af64-96a61078d88d	ochs_kostanay_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Костанайского района	Костанайская область	Костанайский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
07320708-725d-458d-9abe-cdc52ec6ed01	ochs_kostanay_14	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Лисаковска	Костанайская область	город Лисаковск	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
16e4d38d-2ced-46fb-98ed-675dd71bc0db	ochs_kostanay_15	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Беимбета Майлина	Костанайская область	район Беимбета Майлина	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ade8d8e0-47c8-4131-afb1-1a59fd6c0937	ochs_kostanay_16	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мендыкаринского района	Костанайская область	Мендыкаринский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ed86931f-e665-4dda-a23c-6308ad49e809	ochs_kostanay_17	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Наурзумского района	Костанайская область	Наурзумский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e8e49bc8-8b14-4145-a9c2-2ae2dfec6f96	uchs_kostanay_18	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Рудный	Костанайская область	город Рудный	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
399cfc72-f4b4-49c4-826d-cca5fce386c0	ochs_kostanay_19	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сарыкольского района	Костанайская область	Сарыкольский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ee6ecade-a3dc-4444-944f-a36334d97dac	ochs_kostanay_20	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Федоровского района	Костанайская область	Федоровский район	OCHS	\N	t	2026-01-19 09:40:34.450838	2026-01-19 09:40:34.450838		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3618e9d3-d5f5-43eb-a00b-88f86cd31a8b	dchs_kyzylorda	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Кызылординской области	Кызылординская область		DCHS	\N	t	2026-01-19 09:40:34.507734	2026-01-19 09:40:34.507734		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4749abf3-4b9b-4317-8ad2-9473d13e42e5	uchs_kyzylorda_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Кызылорды	Кызылординская область	город Кызылорда	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
7223c9e1-3e0d-4a22-8d56-7ad6bcb919a3	ochs_kyzylorda_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аральского района	Кызылординская область	Аральский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
05c2e64e-08d0-49fd-b2c2-34cbe2f7aaba	ochs_kyzylorda_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жалагашского района	Кызылординская область	Жалагашский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
cbfac41e-592a-4d49-b239-5f0f54ecae46	ochs_kyzylorda_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жанакорганского района	Кызылординская область	Жанакорганский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8e0a804b-2bbb-4cb3-b523-b969fcd741e0	ochs_kyzylorda_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Казалинского района	Кызылординская область	Казалинский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
24e300f8-537e-40e9-ab6f-f54d61006beb	ochs_kyzylorda_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кармакшинского района	Кызылординская область	Кармакшинский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0629d418-0670-4ad2-abe6-581a9a643d92	ochs_kyzylorda_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сырдарьинского района	Кызылординская область	Сырдарьинский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
bc038525-af78-4472-a053-ee3c70c64119	ochs_kyzylorda_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шиелийского района	Кызылординская область	Шиелийский район	OCHS	\N	t	2026-01-19 09:40:34.564039	2026-01-19 09:40:34.564039		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
993cc2e1-fce5-4fb6-b032-74d72fed2ddb	dchs_mangystau	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Мангистауской области	Мангистауская область		DCHS	\N	t	2026-01-19 09:40:34.626445	2026-01-19 09:40:34.626445		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1aed3b30-70f8-486a-920e-d6e96b9c64ad	uchs_mangystau_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Актау	Мангистауская область	город Актау	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
46dd24b9-7d17-4545-a8cb-c7d9aec82b78	ochs_mangystau_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бейнеуского района	Мангистауская область	Бейнеуский район	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
df511360-a648-425a-8b23-06551e7f39e5	ochs_mangystau_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Жанаозен	Мангистауская область	город Жанаозен	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
758b3540-d48b-4a67-a789-6d4879401d58	ochs_mangystau_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Каракиянского района	Мангистауская область	Каракиянский район	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
78a344ea-3a8f-490a-8768-d1c0435b9b00	ochs_mangystau_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мангистауского района	Мангистауская область	Мангистауский район	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4f3847a6-af80-4ac8-a8b7-169a8d503c8b	ochs_mangystau_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мунайлинского района	Мангистауская область	Мунайлинский район	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
edbb8eeb-cce7-40c7-b847-3cdf3b3a72ad	ochs_mangystau_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Тупкараганского района	Мангистауская область	Тупкараганский район	OCHS	\N	t	2026-01-19 09:40:34.682827	2026-01-19 09:40:34.682827		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d1df98a6-2e59-4398-9b5f-9b885be71077	dchs_pavlodar	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Павлодарской области	Павлодарская область		DCHS	\N	t	2026-01-19 09:40:34.744843	2026-01-19 09:40:34.744843		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4c5d0597-deef-4208-9680-3eef67b982d9	uchs_pavlodar_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Павлодар	Павлодарская область	город Павлодар	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
75a9d8d0-3585-47b8-86ce-2f9c204a3ac3	ochs_pavlodar_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Актогайского района	Павлодарская область	Актогайский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
605867cc-e6a8-48d4-847b-5273265e7c25	ochs_pavlodar_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Баянаульского района	Павлодарская область	Баянаульский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0e06d242-b5d0-49da-8706-f6ce13f2cfd8	ochs_pavlodar_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Аксу	Павлодарская область	город Аксу	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f3bcb3d7-90a2-46e2-89a3-338073c8ef15	ochs_pavlodar_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Железинского района	Павлодарская область	Железинский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d067c4c8-d1f3-4977-b23d-be4d237279f2	ochs_pavlodar_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Иртышского района	Павлодарская область	Иртышский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1e692055-f0ee-4c35-8e82-07da5731571b	ochs_pavlodar_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Майского района	Павлодарская область	Майский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
3d9ffb77-5a4b-4746-b67c-219f57cb62b5	ochs_pavlodar_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Павлодарского района	Павлодарская область	Павлодарский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
75cbf11a-7f32-4fac-bfdb-b08e007bf484	ochs_pavlodar_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Аккулы	Павлодарская область	район Аккулы	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0373a36d-cf51-4e40-a7ec-efec23cadb8e	ochs_pavlodar_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Теренкел	Павлодарская область	район Теренкел	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
27570211-5fab-48b9-9998-dff386dc281a	ochs_pavlodar_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Успенского района	Павлодарская область	Успенский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
80a7ae6f-f5bc-4f0b-80ad-6b4bebdbba2a	ochs_pavlodar_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Щербактинского района	Павлодарская область	Щербактинский район	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
fd44f4e0-6a64-4e8c-9ed2-e5719bd4c24a	uchs_pavlodar_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Экибастуза	Павлодарская область	город Экибастуз	OCHS	\N	t	2026-01-19 09:40:34.801498	2026-01-19 09:40:34.801498		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9aa3c8bb-6916-4c77-b3da-9488e8ac1b91	dchs_sko	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС СКО	Северо-Казахстанская область		DCHS	\N	t	2026-01-19 09:40:34.859018	2026-01-19 09:40:34.859018		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
933564e7-d1c0-4170-a416-4bd34f3504cd	uchs_sko_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Петропавловск	Северо-Казахстанская область	город Петропавловск	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
21c53e74-f936-4a45-8c47-d4a5d1c110d2	ochs_sko_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Айыртауского района	Северо-Казахстанская область	Айыртауский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
675a4517-5a66-407f-9e53-847cfbf41d7f	ochs_sko_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Акжарского района	Северо-Казахстанская область	Акжарский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c6065013-3ece-4cd9-9cbc-993d6f60d3c0	ochs_sko_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аккайынского района	Северо-Казахстанская область	Аккайынский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2e29b0d2-7d82-45df-9cb2-8729d416b147	ochs_sko_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района имени Габита Мусрепова	Северо-Казахстанская область	район имени Габита Мусрепова	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
816bda3d-7553-4682-9ee8-830d232bb7f9	ochs_sko_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Есильского района	Северо-Казахстанская область	Есильский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
4982b165-e997-40d9-9a34-41757bba2329	ochs_sko_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жамбылского района	Северо-Казахстанская область	Жамбылский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
359d0bb3-a496-4d47-b4f3-2281a7b22017	ochs_sko_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Магжана Жумабаева	Северо-Казахстанская область	район Магжана Жумабаева	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d4401734-8d2c-4574-8e30-c279b4acbe83	uchs_astana_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Нура"	г. Астана	район Нура	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	district-1	f	\N
6af9072b-a776-4c28-8343-2683b5b95ded	uchs_astana_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Сарыарка"	г. Астана	район Сарыарка	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	district-2	f	\N
5ed8cd49-6293-4e09-bdcd-923b0b533211	dchs_astana	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС города Астана	г. Астана		DCHS	\N	t	2026-01-19 09:40:33.079738	2026-01-19 09:40:33.079738		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
aa8addd0-c77d-418a-8058-fb1d3a1effeb	uchs_astana_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Алматы"	г. Астана	район Алматы	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f2088840-b7e6-476c-8738-db6604eb3729	uchs_astana_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Байконыр"	г. Астана	район Байконыр	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6cb25774-9bde-44e4-a300-4f484876aacf	uchs_astana_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Есиль"	г. Астана	район Есиль	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
0c9a84bd-605d-43de-ae53-a1ff863c7cb7	ochs_sko_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кызылжарского района	Северо-Казахстанская область	Кызылжарский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9bcbd615-4ff4-44b9-aac5-b42c25a95ebe	ochs_sko_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мамлютского района	Северо-Казахстанская область	Мамлютский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
96211776-f735-4baf-8416-8736fa54c853	uchs_turkestan_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Туркестана	Туркестанская область	город Туркестан	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f82a3ab0-fb6a-404c-9e20-0bae25030ac5	ochs_turkestan_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Арысского района	Туркестанская область	Арысский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c767788e-d1d0-4041-859c-9cf83618cda2	uchs_astana_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС района "Сарайшык"	г. Астана	район Сарайшык	OCHS	\N	t	2026-01-19 09:40:33.165944	2026-01-19 09:40:33.165944		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	district-3	f	\N
6c2cc656-2c5f-4b99-8ac4-f1adbd4d73fd	dchs_almaty	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС города Алматы	г. Алматы		DCHS	\N	t	2026-01-19 09:40:33.222956	2026-01-19 09:40:33.222956		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	dchs-almaty	f	\N
d1a8048f-3d2f-4998-bd77-06e3adfd59c0	uchs_almaty_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Алатауского района	г. Алматы	Алатауский район	OCHS	\N	t	2026-01-19 09:40:33.282009	2026-01-19 09:40:33.282009		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	dchs-astana	f	\N
49a23a44-3d81-45c5-9b7c-6b06b653f955	ochs_turkestan_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Казыгуртского района	Туркестанская область	Казыгуртский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e8cb41d0-01be-4429-924d-96f3d7b5b938	dchs_shymkent	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС города Шымкент	г. Шымкент		DCHS	\N	t	2026-01-19 09:40:33.341474	2026-01-19 09:40:33.341474		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
c55b1e45-6ca5-4092-b73b-f03a6fe40a01	mchs	19bc14838e7b7105ff206be039d8ecabe0dd0b9c99e07100b0e441d48c39f37506ffa64db2196e17430d16c43eb3c0ceb2c2563aa98706012e6a8ae2d03dab3b.8da342df1e2d32afe85453f883e55750	МЧС Республики Казахстан			MCHS	\N	t	2026-01-19 09:40:33.017832	2026-01-26 09:29:22.143		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	mchs-rk	f	2026-01-26 09:29:22.143
1d1901cb-12b7-4d99-bac4-5d5765c99897	ochs_zko_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бурлинского района	Западно-Казахстанская область	Бурлинский район	OCHS	\N	t	2026-01-19 09:40:34.21264	2026-01-19 09:40:34.21264		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
af98190f-337d-420b-b370-d00c0192ce97	ochs_sko_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Тайыншинского района	Северо-Казахстанская область	Тайыншинский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a4f22f2a-1395-4aa6-9ece-27a5a415d6fc	ochs_sko_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Тимирязевского района	Северо-Казахстанская область	Тимирязевский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
9fb12b53-d5cb-4d18-9acd-da8b3dd1fb32	ochs_sko_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Уалихановского района	Северо-Казахстанская область	Уалихановский район	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
00e2ca7b-d491-4943-836a-d618821a0926	ochs_sko_14	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района имени Шал акына	Северо-Казахстанская область	район имени Шал акына	OCHS	\N	t	2026-01-19 09:40:34.915239	2026-01-19 09:40:34.915239		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
37e2a0ee-5f42-4116-b4ca-65031ffa44ac	dchs_turkestan	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС Туркестанской области	Туркестанская область		DCHS	\N	t	2026-01-19 09:40:34.971888	2026-01-19 09:40:34.971888		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
fa514dbf-4aab-48b0-be9c-a8c87bbbef9d	ochs_turkestan_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Келесского района	Туркестанская область	Келесский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
a9c96656-a033-448a-a2df-9ee4e2965313	admin	6c75de751d77b7481640d69991d8f28bfc347b3d355a10cde1832a79aac577cf10549a650549157788d9e083aa44e2df8d881d673c712f11aa9a652ec666ffeb.1dd74fbec083f59369e6762f13330272	Администратор системы			admin	\N	t	2026-01-19 09:40:32.940837	2026-02-01 14:16:53.435		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	2026-02-01 14:16:53.435
065708d0-f41d-4617-b5fd-07ab16fb32d1	ochs_turkestan_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Мактааральского района	Туркестанская область	Мактааральский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e4a37bd8-d29c-45ee-be97-8b6f8e8ce0c6	ochs_turkestan_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Ордабасинского района	Туркестанская область	Ордабасинский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
64efbd8f-677c-4f89-bebb-815c39ac498c	ochs_turkestan_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Отрарского района	Туркестанская область	Отрарский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
5a8727fa-867e-4cc5-9027-069a12bffa0f	ochs_turkestan_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Сауран	Туркестанская область	район Сауран	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
61b3aa3b-fb63-4d76-b82d-309b5261ef47	uchs_turkestan_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС Сайрамского района	Туркестанская область	Сайрамский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2818de6e-879f-425b-aceb-6a3647d75443	ochs_turkestan_13	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сарыагашского района	Туркестанская область	Сарыагашский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
73cb685e-757c-4433-b0de-30a1cc9b94ab	ochs_turkestan_14	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Созакского района	Туркестанская область	Созакский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1462785d-03cb-4724-9dea-bc69f8b98616	ochs_turkestan_15	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Толебийского района	Туркестанская область	Толебийский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1347dd6a-f5f9-490a-8585-7e613d2dcaae	ochs_turkestan_16	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Тюлькубасского района	Туркестанская область	Тюлькубасский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ee2582f9-7c2e-4207-b110-35c77b41a254	ochs_turkestan_17	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Шардаринского района	Туркестанская область	Шардаринский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e74cb863-3c60-4b7d-a28f-7c193e257ed7	dchs_abay	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС области Абай	Область Абай		DCHS	\N	t	2026-01-19 09:40:35.08608	2026-01-19 09:40:35.08608		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
83e38d10-4677-4aee-950e-7fefeb7bd1cc	uchs_abay_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Семей	Область Абай	город Семей	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8c64c36a-65a7-4cba-a433-a3a6ad37b678	ochs_abay_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Абайского района	Область Абай	Абайский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
6c0a4c0f-5f06-4195-b00a-bebc1cdfe1b1	ochs_abay_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аягозского района	Область Абай	Аягозский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
712eefa6-1eae-40c2-9355-eb5d6e5e4cd6	ochs_abay_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бескарагайского района	Область Абай	Бескарагайский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d2b160b3-989e-4baf-82ce-b423ecea9d08	ochs_abay_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Бородулихинского района	Область Абай	Бородулихинский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b695d9c4-d559-451d-8ee0-6453331f2006	ochs_abay_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жарминского района	Область Абай	Жарминский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
51b01dc3-9a0b-454d-a914-c3ee0e4bbdb8	ochs_abay_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кокпектинского района	Область Абай	Кокпектинский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1bb65e0f-c7af-4f7e-bd1d-cab4858d9c43	ochs_turkestan_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Байдибекского района	Туркестанская область	Байдибекский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
e1dc5e32-ec78-4458-8c19-c8e14415f4dd	ochs_turkestan_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Кентау	Туркестанская область	город Кентау	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
2a290c31-f8a0-48a2-926c-a73bb23852e4	ochs_zhetisu_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Аксуского района	Область Жетісу	Аксуский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
036a1c1a-11c6-4a75-a656-54ec72ff8645	ochs_zhetisu_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Алакольского района	Область Жетісу	Алакольский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
1911b228-5d51-4e7b-9e5e-38b5af570224	ochs_abay_11	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС района Жанасемей	Область Абай	район Жанасемей	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
946efd1c-51ea-4458-a922-1824926185b9	ochs_abay_12	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Урджарского района	Область Абай	Урджарский район	OCHS	\N	t	2026-01-19 09:40:35.142641	2026-01-19 09:40:35.142641		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
89d41485-f841-4b78-81bd-b9182be4ec6c	dchs_zhetisu	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС области Жетісу	Область Жетісу		DCHS	\N	t	2026-01-19 09:40:35.199695	2026-01-19 09:40:35.199695		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
62d0fdd6-a818-4ab6-9b12-8ecfda6d61b3	uchs_zhetisu_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Талдыкоргана	Область Жетісу	город Талдыкорган	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
18be13e3-0597-4727-8153-d4d70dbfddf0	ochs_zhetisu_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Текели	Область Жетісу	город Текели	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f90faea6-f0fd-4207-9964-38c45cbd69c5	ochs_zhetisu_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Ескельдинского района	Область Жетісу	Ескельдинский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
f3da3ae3-ba68-40a3-9582-fa4eb09b0add	ochs_zhetisu_6	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Каратальского района	Область Жетісу	Каратальский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
90664e96-31f2-4136-862b-66f6344d564e	ochs_zhetisu_7	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Кербулакского района	Область Жетісу	Кербулакский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
bc6edab8-f59c-4d89-aefa-a55357cc0d6b	ochs_zhetisu_8	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Коксуского района	Область Жетісу	Коксуский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
b090d514-6b3a-437e-a95c-9834ccfc67db	ochs_zhetisu_9	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Панфиловского района	Область Жетісу	Панфиловский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
15efee12-7343-4147-bb7c-ac511825aa27	ochs_zhetisu_10	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Сарканского района	Область Жетісу	Сарканский район	OCHS	\N	t	2026-01-19 09:40:35.256456	2026-01-19 09:40:35.256456		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
ec795719-de70-4daa-b122-50ee994f3f85	ochs_ulytau_2	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Караджала	Область Ұлытау	город Караджал	OCHS	\N	t	2026-01-19 09:40:35.368972	2026-01-19 09:40:35.368972		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
fe0373ff-a5a6-48d8-9d8c-bb54d5fe1272	ochs_turkestan_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жетысайского района	Туркестанская область	Жетысайский район	OCHS	\N	t	2026-01-19 09:40:35.029649	2026-01-19 09:40:35.029649		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
8f05b762-579b-40e4-b66b-9d9b2e61b9a6	ochs_ulytau_3	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС города Саттаева	Область Ұлытау	город Саттаев	OCHS	\N	t	2026-01-19 09:40:35.368972	2026-01-19 09:40:35.368972		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
35df3d9d-43df-4958-a81e-f0a91e83c39c	ochs_ulytau_4	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Ұлытауского района	Область Ұлытау	Ұлытауский район	OCHS	\N	t	2026-01-19 09:40:35.368972	2026-01-19 09:40:35.368972		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
59d6b9c1-c26a-4f81-ae6c-6d49905d217e	ochs_ulytau_5	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ОЧС Жанааркинского района	Область Ұлытау	Жанааркинский район	OCHS	\N	t	2026-01-19 09:40:35.368972	2026-01-19 09:40:35.368972		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
d5d65809-1746-4c9d-b993-81e36f94ef5b	dchs_ulytau	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	ДЧС области Ұлытау	Область Ұлытау		DCHS	\N	t	2026-01-19 09:40:35.312718	2026-01-19 10:14:06.061		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	2026-01-19 10:14:06.061
7656404e-67fe-44fe-a42e-da9d57e3c780	uchs_ulytau_1	07f4d625db72b549a81f5c4016614374c699239f64c34ab27a3f2a8b531f5c0812314c6b24b7072280d1a2411010d2e057c02eef7c8d5840ecc3a1a9179948e6.f6bd67d05eba26f6a9710cd681a6836a	УЧС города Жезказгана	Область Ұлытау	город Жезказган	OCHS	\N	t	2026-01-19 09:40:35.368972	2026-01-19 10:15:35.179		\N	\N	\N	\N	\N	local	\N	\N	0.00	0	f	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.videos (id, subsection_id, title, slug, description, video_url, thumbnail_url, duration, author_id, tags, views, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workflow_instances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_instances (id, workflow_id, entity_id, current_step, status, data, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflows (id, name, description, entity_type, steps, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 7, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 63, true);


--
-- Name: ad_categories ad_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_categories
    ADD CONSTRAINT ad_categories_pkey PRIMARY KEY (id);


--
-- Name: ad_categories ad_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_categories
    ADD CONSTRAINT ad_categories_slug_key UNIQUE (slug);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: ads ads_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_slug_key UNIQUE (slug);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: control_objects control_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.control_objects
    ADD CONSTRAINT control_objects_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: normative_documents normative_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.normative_documents
    ADD CONSTRAINT normative_documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: org_units org_units_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_code_key UNIQUE (code);


--
-- Name: org_units org_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_code_unique UNIQUE (code);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: photo_albums photo_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_pkey PRIMARY KEY (id);


--
-- Name: photo_albums photo_albums_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_slug_key UNIQUE (slug);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: presentations presentations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_pkey PRIMARY KEY (id);


--
-- Name: presentations presentations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_slug_key UNIQUE (slug);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: sections sections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_slug_key UNIQUE (slug);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: subsections subsections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subsections
    ADD CONSTRAINT subsections_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: videos videos_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_slug_key UNIQUE (slug);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: control_objects_org_unit_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX control_objects_org_unit_id_idx ON public.control_objects USING btree (org_unit_id);


--
-- Name: control_objects_region_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX control_objects_region_idx ON public.control_objects USING btree (region);


--
-- Name: control_objects_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX control_objects_status_idx ON public.control_objects USING btree (status);


--
-- Name: org_units_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX org_units_parent_id_idx ON public.org_units USING btree (parent_id);


--
-- Name: org_units_region_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX org_units_region_name_idx ON public.org_units USING btree (region_name);


--
-- Name: org_units_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX org_units_type_idx ON public.org_units USING btree (type);


--
-- Name: org_units_type_name_parent_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX org_units_type_name_parent_id_key ON public.org_units USING btree (type, name, parent_id);


--
-- Name: ads ads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ad_categories(id);


--
-- Name: ads ads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: normative_documents normative_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.normative_documents
    ADD CONSTRAINT normative_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: org_units org_units_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.org_units(id);


--
-- Name: photo_albums photo_albums_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: photo_albums photo_albums_subsection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_subsection_id_fkey FOREIGN KEY (subsection_id) REFERENCES public.subsections(id) ON DELETE CASCADE;


--
-- Name: photos photos_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.photo_albums(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: posts posts_subsection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_subsection_id_fkey FOREIGN KEY (subsection_id) REFERENCES public.subsections(id) ON DELETE CASCADE;


--
-- Name: presentations presentations_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: presentations presentations_subsection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_subsection_id_fkey FOREIGN KEY (subsection_id) REFERENCES public.subsections(id) ON DELETE CASCADE;


--
-- Name: subsections subsections_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subsections
    ADD CONSTRAINT subsections_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: users users_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES public.org_units(id);


--
-- Name: videos videos_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: videos videos_subsection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_subsection_id_fkey FOREIGN KEY (subsection_id) REFERENCES public.subsections(id) ON DELETE CASCADE;


--
-- Name: workflow_instances workflow_instances_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: workflow_instances workflow_instances_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflows workflows_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict s3r4rDrQUAE9Pkr9LAlkeObKLJ7eNC2bTdIBprQJCquJvuRyuQVCbauVkF6FeL6

