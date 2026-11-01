-- Supabase Schema Migration: PersonaForge Production Database
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bots
CREATE TABLE IF NOT EXISTS public.bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'voice')),
    industry TEXT NOT NULL DEFAULT 'general',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    compiled_hash TEXT,
    version INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    public_token_hash TEXT,
    whatsapp_code TEXT UNIQUE,
    retention_days INT NOT NULL DEFAULT 30 CHECK (retention_days IN (7, 30, 90)),
    logging_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bot Versions (Snapshots)
CREATE TABLE IF NOT EXISTS public.bot_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    version INT NOT NULL,
    config JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bot_id, version)
);

-- 4. Knowledge Sources
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('text', 'faq', 'pdf', 'url')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Knowledge Chunks
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('web', 'whatsapp', 'voice')),
    session_hash TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 7. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    latency_ms INT,
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    feedback SMALLINT CHECK (feedback IN (-1, 0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WhatsApp Bindings
CREATE TABLE IF NOT EXISTS public.whatsapp_bindings (
    phone_hash TEXT PRIMARY KEY,
    bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Templates
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    config JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Key Events (Admin Telemetry - No Secrets)
CREATE TABLE IF NOT EXISTS public.key_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_alias TEXT NOT NULL,
    status TEXT NOT NULL,
    model TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bots_owner ON public.bots(owner_id);
CREATE INDEX IF NOT EXISTS idx_bots_slug ON public.bots(slug);
CREATE INDEX IF NOT EXISTS idx_bots_whatsapp_code ON public.bots(whatsapp_code);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_session ON public.conversations(bot_id, session_hash);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_bot ON public.knowledge_chunks(bot_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Bots: Owners have full access; public can read basic info if published
CREATE POLICY "Owners have full access to bots" ON public.bots
    FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Public read published bots" ON public.bots
    FOR SELECT USING (status = 'published');

-- Bot Versions: Owners have full access
CREATE POLICY "Owners have full access to bot versions" ON public.bot_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = bot_versions.bot_id AND bots.owner_id = auth.uid()
        )
    );

-- Knowledge Sources & Chunks: Owners have full access
CREATE POLICY "Owners have full access to knowledge sources" ON public.knowledge_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = knowledge_sources.bot_id AND bots.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners have full access to knowledge chunks" ON public.knowledge_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = knowledge_chunks.bot_id AND bots.owner_id = auth.uid()
        )
    );

-- Conversations & Messages: Owners can view analytics; service role can insert
CREATE POLICY "Owners view conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = conversations.bot_id AND bots.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            JOIN public.bots ON bots.id = conversations.bot_id
            WHERE conversations.id = messages.conversation_id AND bots.owner_id = auth.uid()
        )
    );

-- Leads: Owners can view leads
CREATE POLICY "Owners view leads" ON public.leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = leads.bot_id AND bots.owner_id = auth.uid()
        )
    );

-- Templates: Public templates readable by everyone; authors can manage their own
CREATE POLICY "Public read public templates" ON public.templates
    FOR SELECT USING (is_public = true);
CREATE POLICY "Authors manage templates" ON public.templates
    FOR ALL USING (auth.uid() = author_id);

-- Key Events: Admins only
CREATE POLICY "Admins view key events" ON public.key_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Retention Auto-Purge Procedure
CREATE OR REPLACE FUNCTION purge_expired_conversations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Purge messages and conversations older than the bot's configured retention_days
    DELETE FROM public.conversations c
    USING public.bots b
    WHERE c.bot_id = b.id
      AND c.last_at < (NOW() - (b.retention_days || ' days')::INTERVAL);
END;
$$;
