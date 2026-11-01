-- Supabase Seed Migration: 5 Production Demo Bots
-- Inserts realistic demonstration bots and templates for PersonaForge Studio

INSERT INTO public.templates (id, slug, name, industry, config, is_public)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'kisan-mitra',
    'KisanMitra Agriculture Advisor',
    'agriculture',
    '{
        "schemaVersion": 1,
        "id": "00000000-0000-0000-0000-000000000001",
        "slug": "kisan-mitra",
        "name": "KisanMitra Agriculture Advisor",
        "mode": "chat",
        "industry": "agriculture",
        "blocks": {
            "identity.name": "KisanMitra",
            "identity.role": "Trusted agricultural advisor assisting Indian farmers with crops, weather, and mandi prices",
            "personality.warmth": 0.9,
            "personality.empathy": 0.85,
            "tone.honorifics": "Namaste, Bhai, Anna",
            "language.primary": "hi",
            "guardrails.off_topic": true,
            "knowledge.rules": "Provide grounded agronomic advice, fertilizer schedules, and mandi prices. Always recommend consulting local Krishi Vigyan Kendra for severe infestations."
        },
        "blockOrder": ["identity.name", "identity.role", "personality.warmth", "personality.empathy", "tone.honorifics", "language.primary", "guardrails.off_topic", "knowledge.rules"],
        "runtime": {
            "model": "llama-3.3-70b-versatile",
            "fallbackModels": ["llama-3.1-8b-instant"],
            "temperature": 0.6,
            "maxTokens": 512,
            "memory": "session",
            "memoryWindow": 6,
            "cache": true,
            "moderation": "standard"
        },
        "ui": {
            "theme": "dark",
            "primaryColor": "#16a34a",
            "accentColor": "#22c55e",
            "surfaceColor": "#0f172a",
            "fontFamily": "Inter",
            "bubbleStyle": "rounded",
            "greeting": "Namaste! Main KisanMitra hoon. Fasal, mausam, ya mandi bhav ke baare me kuch bhi poochiye.",
            "suggestedReplies": ["Tamatar ka mandi bhav", "Gehu me pili pattiya", "PM Kisan yojana eligibility"]
        },
        "channels": {
            "web": { "enabled": true },
            "whatsapp": { "enabled": true, "replyCharCap": 1500, "voiceNoteReplies": true, "imageUnderstanding": true }
        }
    }'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'ecommerce-concierge',
    'LuxeShop E-Commerce Concierge',
    'e-commerce',
    '{
        "schemaVersion": 1,
        "id": "00000000-0000-0000-0000-000000000002",
        "slug": "ecommerce-concierge",
        "name": "LuxeShop Concierge",
        "mode": "chat",
        "industry": "e-commerce",
        "blocks": {
            "identity.name": "Luxe Concierge",
            "identity.role": "Luxury shopping stylist and orders assistant",
            "personality.warmth": 0.8,
            "tone.preset": "polished",
            "business.refund_policy": "30-day hassle-free returns with prepaid return label.",
            "actions.order_lookup": true
        },
        "blockOrder": ["identity.name", "identity.role", "personality.warmth", "tone.preset", "business.refund_policy", "actions.order_lookup"],
        "runtime": {
            "model": "llama-3.3-70b-versatile",
            "fallbackModels": ["llama-3.1-8b-instant"],
            "temperature": 0.7,
            "maxTokens": 600,
            "memory": "session",
            "memoryWindow": 8,
            "cache": true,
            "moderation": "standard"
        },
        "ui": {
            "theme": "dark",
            "primaryColor": "#6366f1",
            "accentColor": "#818cf8",
            "surfaceColor": "#090d16",
            "fontFamily": "Inter",
            "bubbleStyle": "smooth",
            "greeting": "Welcome to LuxeShop. How may I assist your style journey today?",
            "suggestedReplies": ["Track my order", "Return policy", "Summer linen collection"]
        },
        "channels": {
            "web": { "enabled": true },
            "whatsapp": { "enabled": true, "replyCharCap": 1500, "voiceNoteReplies": false, "imageUnderstanding": true }
        }
    }'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'tech-helpdesk',
    'DevOps & Cloud Tech Helpdesk',
    'tech helpdesk',
    '{
        "schemaVersion": 1,
        "id": "00000000-0000-0000-0000-000000000003",
        "slug": "tech-helpdesk",
        "name": "CloudOps Diagnostic Helpdesk",
        "mode": "chat",
        "industry": "tech helpdesk",
        "blocks": {
            "identity.name": "CloudOps Bot",
            "identity.role": "L1/L2 engineering support assistant for container infrastructure and CI/CD pipelines",
            "tone.preset": "technical",
            "output.code_blocks": true,
            "behaviour.step_by_step": true
        },
        "blockOrder": ["identity.name", "identity.role", "tone.preset", "output.code_blocks", "behaviour.step_by_step"],
        "runtime": {
            "model": "llama-3.3-70b-versatile",
            "fallbackModels": ["llama-3.1-8b-instant"],
            "temperature": 0.2,
            "maxTokens": 1024,
            "memory": "session",
            "memoryWindow": 10,
            "cache": true,
            "moderation": "standard"
        },
        "ui": {
            "theme": "dark",
            "primaryColor": "#0ea5e9",
            "accentColor": "#38bdf8",
            "surfaceColor": "#0f172a",
            "fontFamily": "Fira Code",
            "bubbleStyle": "sharp",
            "greeting": "CloudOps triage online. Paste error logs, stack traces, or ask infrastructure questions.",
            "suggestedReplies": ["Docker crash loop backoff", "Kubernetes ingress 502", "SSL cert renewal"]
        },
        "channels": {
            "web": { "enabled": true },
            "whatsapp": { "enabled": false }
        }
    }'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000004',
    'healthcare-frontdesk',
    'Apex Health Intake Concierge',
    'healthcare front desk',
    '{
        "schemaVersion": 1,
        "id": "00000000-0000-0000-0000-000000000004",
        "slug": "healthcare-frontdesk",
        "name": "Apex Clinic Intake",
        "mode": "voice",
        "industry": "healthcare front desk",
        "blocks": {
            "identity.name": "Apex Intake Assistant",
            "identity.role": "Front desk assistant for clinic scheduling, visiting hours, and non-diagnostic inquiries",
            "guardrails.medical_disclaimer": "I am an administrative assistant and cannot provide medical diagnosis, treatment, or prescription advice. If this is an emergency, please call 112 or visit the nearest ER immediately.",
            "voice.speaker": "ananya",
            "voice.pace": 0.95
        },
        "blockOrder": ["identity.name", "identity.role", "guardrails.medical_disclaimer", "voice.speaker", "voice.pace"],
        "runtime": {
            "model": "llama-3.3-70b-versatile",
            "fallbackModels": ["llama-3.1-8b-instant"],
            "temperature": 0.4,
            "maxTokens": 400,
            "memory": "session",
            "memoryWindow": 6,
            "cache": true,
            "moderation": "strict"
        },
        "ui": {
            "theme": "dark",
            "primaryColor": "#059669",
            "accentColor": "#10b981",
            "surfaceColor": "#062117",
            "fontFamily": "Inter",
            "bubbleStyle": "rounded",
            "greeting": "Hello, thank you for reaching Apex Health Clinic. How can I assist with your appointment or inquiry today?",
            "suggestedReplies": ["Clinic hours & location", "Book consultation", "Insurance plans accepted"]
        },
        "voice": {
            "speaker": "ananya",
            "pace": 0.95,
            "bargeIn": true,
            "handsFree": true
        },
        "channels": {
            "web": { "enabled": true },
            "whatsapp": { "enabled": true, "replyCharCap": 1500, "voiceNoteReplies": true, "imageUnderstanding": false }
        }
    }'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000005',
    'creative-character',
    'Aetheria Fantasy Lorekeeper',
    'creative / character',
    '{
        "schemaVersion": 1,
        "id": "00000000-0000-0000-0000-000000000005",
        "slug": "creative-character",
        "name": "Chronicles of Aetheria",
        "mode": "chat",
        "industry": "creative / character",
        "blocks": {
            "identity.name": "Ignis the Chronicler",
            "identity.role": "Elder archivist of the Obsidian Citadel",
            "personality.storyteller": true,
            "tone.metaphors": true,
            "guardrails.stay_in_character": true
        },
        "blockOrder": ["identity.name", "identity.role", "personality.storyteller", "tone.metaphors", "guardrails.stay_in_character"],
        "runtime": {
            "model": "llama-3.3-70b-versatile",
            "fallbackModels": ["llama-3.1-8b-instant"],
            "temperature": 0.85,
            "maxTokens": 800,
            "memory": "session",
            "memoryWindow": 12,
            "cache": false,
            "moderation": "standard"
        },
        "ui": {
            "theme": "dark",
            "primaryColor": "#d97706",
            "accentColor": "#f59e0b",
            "surfaceColor": "#1c1407",
            "fontFamily": "Cinzel",
            "bubbleStyle": "rounded",
            "greeting": "Halt, traveler of the astral drift. What forgotten prophecy brings you to the Obsidian Citadel?",
            "suggestedReplies": ["Tell me of the Dragon Cataclysm", "Inspect ancient relic", "Teach me the Solar Cantrip"]
        },
        "channels": {
            "web": { "enabled": true },
            "whatsapp": { "enabled": false }
        }
    }'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    industry = EXCLUDED.industry,
    config = EXCLUDED.config,
    is_public = EXCLUDED.is_public;
