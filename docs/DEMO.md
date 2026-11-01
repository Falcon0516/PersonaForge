# PersonaForge — 3-Minute Product Demonstration Walkthrough

> **Video Demo Title**: *Building, Testing, and Publishing Production AI Agents with PersonaForge*  
> **Target Run Time**: 3 Minutes (180 Seconds)  
> **Speaker/Presenter**: Engineering Product Lead  

---

## Demo Timeline Overview

```
[0:00 - 0:45] Phase 1: Studio Builder & Real-Time Prompt Compilation
[0:45 - 1:30] Phase 2: Conflict Engine, 1-Click Fixes & Deterministic Scorer
[1:30 - 2:15] Phase 3: Magic Box Prompt Generation & Multi-Channel Voice Orb
[2:15 - 3:00] Phase 4: Publish Everywhere (Hosted Page, Standalone HTML & Multi-Tenant WhatsApp)
```

---

## Segment-by-Segment Execution Script

### Act 1: The Studio Builder & Real-Time Compilation (0:00 – 0:45)

#### [0:00 – 0:15] Visual Opening & Palette Selection
- **Screen View**: PersonaForge Studio (`/builder/new`) displaying the responsive 3-pane layout: Block Palette (left), Canvas (center), Right Panel tabs (right).
- **Narration**:  
  *"Welcome to PersonaForge. Today, we're building an enterprise-grade AI assistant without writing a single line of manual prompt engineering or backend glue code. On our left, we have a palette of over 120 modular behavioral blocks across 15 categories—ranging from identity and tone to security guardrails and voice rules."*
- **Action**:  
  Click on **Templates** in the header. Select the **"KisanMitra Agriculture Advisor"** preset.
- **Visual Result**:  
  Canvas populates with 8 core blocks organized by compiler section: `identity.name`, `identity.role`, `personality.warmth`, `tone.honorifics`, `guardrails.off_topic`, etc.

#### [0:15 – 0:45] Inline Customization & Line-Level Traceability
- **Narration**:  
  *"Every block features an inline parameter editor. Let's adjust the warmth slider to 0.9, set our primary language to Hindi/English bilingual, and drag an Off-Topic Guardrail into the Canvas using accessible drag-and-drop. Now watch the Prompt tab on the right."*
- **Action**:  
  - Adjust slider on `personality.warmth`.
  - Drag an extra block from the palette: `guardrails.no_hallucination`.
  - Click the **Prompt** tab in the right panel. Hover cursor over Line 14 (*"Always recommend consulting local Krishi Vigyan Kendra..."*).
- **Visual Result**:  
  The prompt updates instantly with zero latency (sub-millisecond pure TypeScript compilation). Hovering over Line 14 highlights `knowledge.rules` on the Canvas with a visual trace tag. The token budget gauge shows `482 / 2048 tokens (23%)`.

---

### Act 2: Conflict Engine, 1-Click Healing & Scorer (0:45 – 1:30)

#### [0:45 – 1:10] Inducing a Prompt Contradiction
- **Narration**:  
  *"The biggest flaw in traditional prompt crafting is silent contradictions. Watch what happens when I drag a 'Gen-Z Slang' block into our agricultural advisor while 'Formal Tone' is already active."*
- **Action**:  
  From the Palette, search for "Slang" and drag `tone.slang` into the Canvas.
- **Visual Result**:  
  A glowing amber warning banner and badge immediately trigger on both blocks:  
  `[Conflict]: Contradictory tone detected: Formal Tone conflicts with Gen-Z Slang.`  
  An **Auto-Fix** button appears.
- **Narration**:  
  *"PersonaForge's offline conflict engine catches this immediately. The Quality Score drops to 68/100. With a single click on 'Auto-Fix', the contradiction is resolved, removing the incompatible block, and our score rebounds to 95/100."*
- **Action**:  
  Click **Fix Conflict**. The slang block is cleanly patched out. The radial Score gauge animates to 95/100 with green checkmarks across all 9 deterministic criteria.

#### [1:10 – 1:30] Live Preview Streaming
- **Action**:  
  Switch to the **Preview** tab in the right panel. Type: *"Tamatar ka aaj ka mandi bhav kya hai?"* and press Enter.
- **Visual Result**:  
  The message streams seamlessly via SSE from the Groq Key Pool. The LLM responds in warm, honorific Hindi/Hinglish with accurate agricultural market advice. Token latency badge reads: `38ms TTFT • 142 tokens/sec`.

---

### Act 3: Magic Box & Multi-Channel Voice Orb (1:30 – 2:15)

#### [1:30 – 1:55] Magic Box: Natural Language to Block Graph
- **Narration**:  
  *"What if you don't want to assemble blocks manually? Click the Magic Box. Type a simple natural language prompt: 'Create an empathetic healthcare front desk assistant that schedules appointments and never provides medical diagnoses.' Let's generate."*
- **Action**:  
  Click **Magic Box** (`Cmd+K` -> Magic Box). Paste prompt and click **Generate Bot**.
- **Visual Result**:  
  The JSON catalog validator constructs a valid configuration: injecting `identity.role`, `guardrails.medical_disclaimer`, and voice parameters.

#### [1:55 – 2:15] Voice Agent with Animated VoiceOrb & Barge-In
- **Narration**:  
  *"Let's test this in Voice Mode. We switch our channel preview to Voice. PersonaForge connects Sarvam AI's saarika:v2.5 speech-to-text and bulbul:v3 speech synthesis."*
- **Action**:  
  Click the microphone button to launch the **Voice Agent Modal**. The animated 3D `VoiceOrb` pulses with dynamic audio amplitude. Say: *"Hello, what are your clinic hours?"*
- **Visual Result**:  
  The orb shifts from blue (Listening) to amber (Thinking) to emerald (Speaking). Streaming sentence audio begins playing without lag.  
- **Action**:  
  Speak over the audio: *"Wait, do you accept insurance?"*
- **Visual Result**:  
  **Instant Barge-In**: The audio playback immediately terminates, aborts in-flight requests, captures the new speech stream, and replies with insurance details.

---

### Act 4: Publish Everywhere (2:15 – 3:00)

#### [2:15 – 2:35] Standalone HTML Exporter (Zero Secrets Guarantee)
- **Narration**:  
  *"Now we publish. PersonaForge gives you four instant deployment targets: Hosted Page, Embed Widget, Downloadable Single-File HTML, and WhatsApp."*
- **Action**:  
  Click **Publish** -> **Download HTML**. Select **Hosted Mode**.
- **Narration**:  
  *"Our standalone HTML export is a single file with zero external dependencies. In Hosted Mode, it connects securely via public API tokens—zero system prompts, zero backend credentials, and zero keys are ever exposed in client code. For full offline privacy, BYOK mode allows users to paste their personal Groq key into client localStorage."*
- **Action**:  
  Open the downloaded `.html` file locally in a new browser tab. Type a greeting. It streams instantaneously.

#### [2:35 – 2:50] Embeddable Widget & Hosted Page
- **Action**:  
  Switch back to Publish modal -> **Embed Widget**. Copy `<script src="/embed.js?bot=kisan-mitra"></script>`. Show live floating launcher preview in the bottom-right corner.
- **Narration**:  
  *"One script tag embeds your branded bot onto any Shopify, WordPress, or custom web property."*

#### [2:50 – 3:00] Multi-Tenant WhatsApp Gateway
- **Action**:  
  Switch to the **WhatsApp** tab. Display the generated QR code and short command: `/use kisan1`.
- **Narration**:  
  *"Finally, multi-tenant WhatsApp. Multiple bots run through a single Twilio number. Text '/use kisan1' from any phone to route immediately to this assistant with phone hashing, image vision, and audio note synthesis. That is PersonaForge—modular, verifiable, production-ready AI agents in under three minutes."*
- **Closing Shot**:  
  Wide view of PersonaForge Studio, Telemetry dashboard, and the running bots across Web, Mobile, and WhatsApp.
