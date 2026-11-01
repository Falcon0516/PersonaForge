/**
 * Token Estimation Heuristic (Documented & Zero-Dependency)
 *
 * For English and code: ~4 characters per token.
 * For Indic scripts (Devanagari, Kannada, etc.) and multibyte characters:
 * Unicode codepoints outside Latin-1 are tokenized with higher byte fragmentation,
 * roughly 1.5 - 2 characters per token.
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;

  let totalWeight = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // ASCII / Latin-1: standard 1 weight
    if (code <= 0x00ff) {
      totalWeight += 1;
    } else {
      // Non-latin multibyte codepoints (Indic, CJK, Emojis): ~2.5x byte weight
      totalWeight += 2.5;
    }
  }

  // Baseline ~4 chars per token for Latin text
  return Math.ceil(totalWeight / 4);
}
