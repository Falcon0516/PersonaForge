import { BotConfig } from "../schemas/bot.js";
import { Check, ScoreResult } from "../schemas/sections.js";
import { detectConflicts } from "../conflicts/conflicts.js";

export function scorePrompt(config: BotConfig): ScoreResult {
  const checks: Check[] = [];
  let totalScore = 0;

  // Check 1: Role & Identity Defined (15 pts)
  const hasName = Boolean(config.name && config.name.trim().length > 0);
  const roleVal = config.blocks?.["identity.role"] as string | undefined;
  const hasRole = Boolean(roleVal && roleVal.trim().length > 0);
  const rolePassed = hasName && hasRole;
  checks.push({
    id: "role_defined",
    title: "Clear Persona & Role Definition",
    description: "The bot has a defined name and assigned professional role.",
    passed: rolePassed,
    scoreDelta: 15,
    actionHint: rolePassed ? undefined : "Add a descriptive role/title in the Identity category.",
  });
  if (rolePassed) totalScore += 15;

  // Check 2: Core Safety Guardrails (15 pts)
  const leakProt = config.blocks?.["guardrails.prompt_leak_protection"];
  const jailbreakRes = config.blocks?.["guardrails.jailbreak_resistance"];
  const guardrailsPassed = leakProt !== false && jailbreakRes !== false;
  checks.push({
    id: "guardrails_active",
    title: "Prompt Confidentiality & Jailbreak Guardrails",
    description: "System instructions and sensitive parameters are protected from injection attacks.",
    passed: guardrailsPassed,
    scoreDelta: 15,
    actionHint: guardrailsPassed ? undefined : "Enable Prompt Leak Protection and Jailbreak Resistance in Guardrails.",
  });
  if (guardrailsPassed) totalScore += 15;

  // Check 3: Unknown Answer Fallback Protocol (10 pts)
  const unknownAns = config.blocks?.["knowledge.unknown_answer"] as string | undefined;
  const fallbackPassed = Boolean(unknownAns && unknownAns.length > 0);
  checks.push({
    id: "unknown_fallback",
    title: "Explicit Fallback for Unknown Answers",
    description: "Defines explicit behavior when requested data is unavailable.",
    passed: fallbackPassed,
    scoreDelta: 10,
    actionHint: fallbackPassed ? undefined : "Configure 'Unknown Answer Behaviour' in the Knowledge category.",
  });
  if (fallbackPassed) totalScore += 10;

  // Check 4: Language Policy Established (10 pts)
  const primaryLang = config.blocks?.["language.primary"] as string | undefined;
  const allowedLangs = config.blocks?.["language.allowed"] as string[] | undefined;
  const langPassed = Boolean(primaryLang || (allowedLangs && allowedLangs.length > 0));
  checks.push({
    id: "language_policy",
    title: "Language & Locale Directives",
    description: "Clear guidelines on primary language, multilingual support, and translation.",
    passed: langPassed,
    scoreDelta: 10,
    actionHint: langPassed ? undefined : "Define Primary Language in the Language category.",
  });
  if (langPassed) totalScore += 10;

  // Check 5: Domain & Business Context (10 pts)
  const industry = config.industry;
  const companyDesc = config.blocks?.["business.description"] as string | undefined;
  const domainPassed = (Boolean(industry) && industry !== "general") || Boolean(companyDesc && companyDesc.trim());
  checks.push({
    id: "business_or_domain",
    title: "Domain or Business Grounding",
    description: "Grounded within an industry sector, company mission, or operational background.",
    passed: domainPassed,
    scoreDelta: 10,
    actionHint: domainPassed ? undefined : "Set an industry template or enter a Company Overview in Business Context.",
  });
  if (domainPassed) totalScore += 10;

  // Check 6: Output Length & Constraint Sanity (10 pts)
  const charCap = config.blocks?.["output.max_characters"] as number | undefined;
  const replyLength = config.blocks?.["behaviour.reply_length"] as string | undefined;
  const lengthPassed = Boolean((charCap && charCap >= 200 && charCap <= 3000) || replyLength);
  checks.push({
    id: "length_sanity",
    title: "Response Length Budgeting",
    description: "Specifies a bounded length budget preventing unbounded generative loops.",
    passed: lengthPassed,
    scoreDelta: 10,
    actionHint: lengthPassed ? undefined : "Configure Character Cap in Output Format or Reply Length Target.",
  });
  if (lengthPassed) totalScore += 10;

  // Check 7: Boundaries & Refusal Style (10 pts)
  const refusalStyle = config.blocks?.["behaviour.refusal_style"] as string | undefined;
  const offtopic = config.blocks?.["guardrails.offtopic_redirect"] as string | undefined;
  const boundariesPassed = Boolean(refusalStyle || (offtopic && offtopic.trim()));
  checks.push({
    id: "refusal_boundaries",
    title: "Off-Topic Boundaries & Refusal Style",
    description: "Clear instructions for politely redirecting out-of-scope inquiries.",
    passed: boundariesPassed,
    scoreDelta: 10,
    actionHint: boundariesPassed ? undefined : "Set an Off-Topic Redirection message in Guardrails.",
  });
  if (boundariesPassed) totalScore += 10;

  // Check 8: Factual Grounding & Hallucination Defense (10 pts)
  const noHal = config.blocks?.["guardrails.no_hallucination"];
  const strictGrounding = config.blocks?.["knowledge.strict_grounding"];
  const groundingPassed = noHal !== false || Boolean(strictGrounding);
  checks.push({
    id: "grounding_defense",
    title: "Factual Grounding & Zero-Hallucination Policy",
    description: "Prohibits fabricating figures, policies, or dates when unverified.",
    passed: groundingPassed,
    scoreDelta: 10,
    actionHint: groundingPassed ? undefined : "Enable Zero-Hallucination Policy in Guardrails.",
  });
  if (groundingPassed) totalScore += 10;

  // Check 9: Zero Contradictory Instructions (10 pts)
  const conflicts = detectConflicts(config);
  const noConflictsPassed = conflicts.length === 0;
  checks.push({
    id: "no_contradictions",
    title: "Absence of Opposing Directives",
    description: "Prompt is free of mutually exclusive instructions (e.g. Formal + Slang).",
    passed: noConflictsPassed,
    scoreDelta: 10,
    actionHint: noConflictsPassed
      ? undefined
      : `Resolve ${conflicts.length} detected conflict${conflicts.length > 1 ? "s" : ""} on canvas.`,
  });
  if (noConflictsPassed) totalScore += 10;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    checks,
  };
}
