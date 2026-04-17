import type { AIMessage } from './providers'
import type { ClarificationQA, EditorialSkeleton } from '@/lib/schemas/campaign'

interface CharterContext {
  toneGuidelines: string | null
  forbiddenWords: string[]
  forbiddenTopics: string[]
  allowedTopics: string[]
  brandGuidelines: string | null
}

interface ClarificationsPromptInput {
  campaignName: string
  templateName: string
  rawData: Record<string, unknown>
  charter: CharterContext
}

interface SkeletonPromptInput {
  campaignName: string
  rawData: Record<string, unknown>
  clarifications: ClarificationQA[]
  charter: CharterContext
  platforms: string[]
}

interface ContentPromptInput {
  campaignName: string
  skeleton: EditorialSkeleton
  platforms: string[]
  charter: CharterContext
}

function charterBlock(charter: CharterContext): string {
  const lines: string[] = []
  if (charter.toneGuidelines) lines.push(`Ton et style : ${charter.toneGuidelines}`)
  if (charter.brandGuidelines) lines.push(`Charte de marque : ${charter.brandGuidelines}`)
  if (charter.forbiddenWords.length > 0)
    lines.push(`Mots interdits : ${charter.forbiddenWords.join(', ')}`)
  if (charter.forbiddenTopics.length > 0)
    lines.push(`Sujets interdits : ${charter.forbiddenTopics.join(', ')}`)
  if (charter.allowedTopics.length > 0)
    lines.push(`Sujets autorisés : ${charter.allowedTopics.join(', ')}`)
  if (lines.length === 0) return ''
  return `\n\nCHARTE ÉDITORIALE :\n${lines.join('\n')}`
}

export function buildClarificationsPrompt(input: ClarificationsPromptInput): AIMessage[] {
  const system = `Tu es un expert en communication et content marketing. Tu aides à clarifier les besoins pour créer une campagne de communication multi-réseaux percutante.${charterBlock(input.charter)}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{"questions": [{"question": "...", "category": "tone|structure|audience|other"}, ...]}`

  const rawSummary = Object.entries(input.rawData)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const user = `Campagne : "${input.campaignName}" (template : ${input.templateName})

Données brutes :
${rawSummary}

Génère 3 à 5 questions de clarification pertinentes pour mieux comprendre les besoins et créer du contenu optimal.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function buildSkeletonPrompt(input: SkeletonPromptInput): AIMessage[] {
  const system = `Tu es un stratège en contenu. Tu crées des squelettes éditoriaux structurés pour des campagnes de communication multi-réseaux.${charterBlock(input.charter)}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{"angle": "...", "key_messages": ["...", "...", "..."], "content_type": "...", "tone": "..."}`

  const rawSummary = Object.entries(input.rawData)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const qaSummary = input.clarifications
    .filter((qa) => qa.answer.trim())
    .map((qa) => `Q: ${qa.question}\nR: ${qa.answer}`)
    .join('\n\n')

  const platformsList = input.platforms.join(', ') || 'LinkedIn, Instagram'

  const user = `Campagne : "${input.campaignName}"
Réseaux cibles : ${platformsList}

Données brutes :
${rawSummary}

${qaSummary ? `Clarifications :\n${qaSummary}` : ''}

Crée un squelette éditorial avec un angle fort, des messages clés, le type de contenu et le ton.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function buildContentPrompt(input: ContentPromptInput): AIMessage[] {
  const system = `Tu es un expert en rédaction de contenu pour les réseaux sociaux. Tu crées des posts adaptés à chaque plateforme, percutants et conformes à la charte éditoriale.${charterBlock(input.charter)}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "Platform1": {"caption": "...", "hashtags": ["#tag1", "#tag2"], "platform": "Platform1"},
  "Platform2": {"caption": "...", "hashtags": ["#tag1", "#tag2"], "platform": "Platform2"}
}
Les clés doivent correspondre exactement aux noms de plateformes demandés.`

  const keyMessagesList = input.skeleton.key_messages.map((m) => `- ${m}`).join('\n')

  const user = `Campagne : "${input.campaignName}"
Angle : ${input.skeleton.angle}
Type de contenu : ${input.skeleton.content_type}
${input.skeleton.tone ? `Ton : ${input.skeleton.tone}` : ''}

Messages clés :
${keyMessagesList}

Génère des posts pour ces réseaux : ${input.platforms.join(', ')}

Adapte le format, la longueur et le style à chaque réseau. Les hashtags doivent commencer par #.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function buildValidationPrompt(
  content: string,
  charter: CharterContext,
  violation: string,
): AIMessage[] {
  const system = `Tu es un expert en communication. Tu corriges du contenu pour le rendre conforme à une charte éditoriale.${charterBlock(charter)}

Réponds avec le contenu corrigé au même format JSON que l'entrée.`

  const user = `Ce contenu viole la charte : "${violation}"

Contenu à corriger :
${content}

Corrige le contenu en respectant strictement la charte.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
