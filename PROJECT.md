# PersonaForge — Product Narrative & Specification

> **The No-Code AI Persona & Voice Bot Studio**
> *Assemble from blocks, watch the system prompt compile live, test in real-time, and ship everywhere.*

---

## 1. Product Vision

Every business, creator, and service provider needs a tailored AI conversational agent — whether as a customer service widget, an interactive voice concierge, a hosted web persona, or an automated WhatsApp assistant.

However, crafting effective system prompts today is brittle, trial-and-error manual engineering:
- People hardcode huge blocks of instructions that conflict with each other.
- Guardrails are either completely forgotten or easily bypassed.
- Tone and personality oscillate wildly.
- Moving from a web prototype to WhatsApp or an embeddable widget requires rewriting the prompt and rebuilding the backend.

**PersonaForge** transforms prompt engineering into visual block assembly:
1. **Assemble**: Pick from 120+ tested behavioral blocks (Identity, Personality, Tone, Guardrails, Knowledge, Actions, Channel Overrides).
2. **Observe**: The system prompt compiles deterministically in real time with line-level traceability.
3. **Score & Heal**: Real-time quality scoring and conflict detection flag opposing instructions (e.g. *Formal Tone* + *Gen-Z Slang*) with 1-click fixes.
4. **Publish Everywhere**:
   - **Hosted Page** (`/b/[slug]`): Fully responsive, branded web app with voice and chat.
   - **Embeddable Widget** (`/embed.js`): Single `<script>` tag drop-in for any website.
   - **Downloadable Single-File HTML**: Standalone HTML with zero dependencies, supporting both Hosted and BYOK (Bring Your Own Key) offline modes.
   - **Multi-Tenant WhatsApp**: Run hundreds of custom bots through a single Twilio WhatsApp number with `/use <code>`.

---

## 2. Target Industries & Shipped Templates

PersonaForge ships with 12 battle-tested templates:
1. **Agriculture Advisor (KisanMitra)**: Grounded agricultural advice, crop diagnosis, mandi rates, multi-language support (Hindi, Kannada, English) with warm honorifics.
2. **E-Commerce Concierge**: Product recommendations, order tracking, returns policy, and upsell rules.
3. **Business Support**: SaaS customer success agent with ticket escalation, SLA reminders, and calendar booking.
4. **Tech Helpdesk**: Diagnostic troubleshooting, step-by-step guidance, code snippet formatting, and logs collection.
5. **Healthcare Front Desk**: Non-diagnostic intake, appointment scheduling, insurance verification FAQs, and emergency disclaimers.
6. **Education & Tutoring**: Socratic inquiry method, age-graded explanations, quiz generation, and concept reinforcement.
7. **Finance FAQ**: Regulatory disclaimers, loan eligibility guidelines, branch hours, and fraud reporting instructions.
8. **HR Assistant**: Benefits overview, PTO policies, onboarding checklists, and confidential ethics escalation.
9. **Travel & Hospitality**: Itinerary planning, local recommendations, room amenities, and booking links.
10. **Real Estate**: Property matchmaking, mortgage calculators, neighborhood insights, and viewing appointments.
11. **Government Services**: Public scheme eligibility, required documentation guides, office locations, and grievance routing.
12. **Creative & Character Bots**: Distinctive backstory, catchphrases, creative constraints, and immersive persona storytelling.

---

## 3. The 3-Minute Demo Script

1. **Minute 0:00 – 0:45 (Assemble & Compile)**
   - Open PersonaForge Studio. Select the "Agriculture Advisor" or "E-Commerce Concierge" template.
   - In the Canvas, toggle on *Honorifics*, set *Empathy* slider to 0.9, and add an *Off-Topic Redirect* guardrail.
   - Watch the Prompt pane compile the 11 sections in real time with line-to-block highlighting.
2. **Minute 0:45 – 1:30 (Conflict Resolution & Live Preview)**
   - Add *Formal Tone* alongside *Gen-Z Slang*. Notice the Conflict Badge pop up.
   - Click "Fix Conflict" to auto-align the tone blocks. Watch the Quality Score jump from 72 to 94.
   - In the Preview tab, send a message in Hindi or English and stream the response via Groq.
3. **Minute 1:30 – 2:15 (Customize UI & Voice)**
   - Switch to the UI Customizer tab. Change the primary color, bubble geometry, and avatar.
   - Switch channel view to "Voice Mode" — watch the animated audio orb pulse and trigger Sarvam TTS.
4. **Minute 2:15 – 3:00 (Publish Everywhere)**
   - Click **Publish**.
   - Download the **Standalone HTML (Hosted & BYOK)**: open it locally in Chrome — it streams immediately.
   - View the **Embed Widget code** and test it on a sample page.
   - View the **WhatsApp Tab**: inspect the generated `/use <shortcode>` and scan the QR code.
