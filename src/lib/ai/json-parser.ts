/**
 * Extrait et parse du JSON depuis une réponse LLM.
 *
 * Ordre de priorité :
 *   1. Bloc fenced markdown ```json ... ``` (ou ```JSON``` ou ``` sans tag).
 *   2. Parse direct `JSON.parse(raw.trim())` si la chaîne entière est du JSON.
 *   3. Extraction par regex du premier `{…}` ou `[…]`.
 *
 * On privilégie le fence car certains modèles (Claude, GPT) emballent
 * systématiquement leur JSON dedans, parfois avec du contexte autour.
 */
const FENCED_BLOCK = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i
const RAW_JSON = /\{[\s\S]*\}|\[[\s\S]*\]/

export function safeParseJson(raw: string): unknown {
  const fencedMatch = raw.match(FENCED_BLOCK)
  if (fencedMatch) {
    const inner = fencedMatch[1].trim()
    if (inner.length > 0) {
      try {
        return JSON.parse(inner)
      } catch {
        // fence présent mais contenu invalide : on retombe sur les autres stratégies
      }
    }
  }

  const trimmed = raw.trim()
  if (trimmed.length > 0) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // pas un JSON complet : on tombe sur l'extraction regex
    }
  }

  const match = raw.match(RAW_JSON)
  if (!match) throw new Error('Aucun JSON trouvé dans la réponse IA')
  return JSON.parse(match[0])
}
