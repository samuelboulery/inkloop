const FENCED_BLOCK = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i
const RAW_JSON = /\{[\s\S]*\}|\[[\s\S]*\]/

/**
 * Parcourt le JSON caractère par caractère et :
 * - échappe les caractères de contrôle bruts (< 0x20) dans les strings
 * - échappe les guillemets doubles non-échappés à l'intérieur des strings
 *   (heuristique : un `"` suivi d'autre chose que `,`, `}`, `]`, `:` ou fin de texte)
 */
function sanitizeJsonStrings(s: string): string {
  let result = ''
  let inString = false
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (inString) {
      if (ch === '\\') {
        result += ch + (s[i + 1] ?? '')
        i += 2
        continue
      }
      if (ch === '"') {
        let j = i + 1
        while (j < s.length && (s[j] === ' ' || s[j] === '\t')) j++
        const next = s[j]
        if (next === undefined || next === ',' || next === '}' || next === ']' || next === ':') {
          inString = false
          result += ch
        } else {
          result += '\\"'
        }
      } else {
        const code = ch.charCodeAt(0)
        if (code < 0x20) {
          switch (code) {
            case 0x0a:
              result += '\\n'
              break
            case 0x0d:
              result += '\\r'
              break
            case 0x09:
              result += '\\t'
              break
            default:
              result += `\\u${code.toString(16).padStart(4, '0')}`
          }
        } else {
          result += ch
        }
      }
    } else {
      if (ch === '"') inString = true
      result += ch
    }
    i++
  }
  return result
}

function structuralClean(s: string): string {
  return s
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

function tryParse(s: string): unknown {
  // 1. Brut
  try {
    return JSON.parse(s)
  } catch {
    // continue
  }
  // 2. Sanitize strings (contrôles + guillemets non-échappés) + nettoyage structurel
  try {
    return JSON.parse(structuralClean(sanitizeJsonStrings(s)))
  } catch {
    // continue
  }
  // 3. JSON doublement échappé : {\"key\": \"val\"} → {"key": "val"}
  try {
    return JSON.parse(s.replace(/\\"/g, '"'))
  } catch {
    // continue
  }
  // 4. Les deux combinés
  return JSON.parse(structuralClean(sanitizeJsonStrings(s.replace(/\\"/g, '"'))))
}

export function safeParseJson(raw: string): unknown {
  const fencedMatch = raw.match(FENCED_BLOCK)
  if (fencedMatch) {
    const inner = fencedMatch[1].trim()
    if (inner.length > 0) {
      try {
        return tryParse(inner)
      } catch {
        // fence invalide même après réparation : on continue
      }
    }
  }

  const trimmed = raw.trim()
  if (trimmed.length > 0) {
    try {
      return tryParse(trimmed)
    } catch {
      // pas un JSON complet : on tombe sur l'extraction regex
    }
  }

  const match = raw.match(RAW_JSON)
  if (!match) throw new Error('Aucun JSON trouvé dans la réponse IA')
  return tryParse(match[0])
}
