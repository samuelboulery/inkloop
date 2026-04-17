import type { GeneratedPost } from '@/lib/schemas/campaign'
import type { VocabularyRules, ContentRules } from '@/lib/schemas/charter'

export interface CharterRules {
  vocabularyRules: VocabularyRules
  contentRules: ContentRules
  toneGuidelines: string | null
}

export interface ValidationResult {
  passed: boolean
  violations: string[]
}

export function validatePost(post: GeneratedPost, rules: CharterRules): ValidationResult {
  const violations: string[] = []
  const text = `${post.caption} ${post.hashtags.join(' ')}`.toLowerCase()

  for (const forbidden of rules.vocabularyRules.forbidden) {
    if (text.includes(forbidden.toLowerCase())) {
      violations.push(`Mot interdit détecté : "${forbidden}"`)
    }
  }

  for (const topic of rules.contentRules.forbidden_topics) {
    if (text.includes(topic.toLowerCase())) {
      violations.push(`Sujet interdit mentionné : "${topic}"`)
    }
  }

  const captionLen = post.caption.length
  if (rules.contentRules.min_length && captionLen < rules.contentRules.min_length) {
    violations.push(`Caption trop courte (${captionLen} < ${rules.contentRules.min_length} caractères)`)
  }
  if (rules.contentRules.max_length && captionLen > rules.contentRules.max_length) {
    violations.push(`Caption trop longue (${captionLen} > ${rules.contentRules.max_length} caractères)`)
  }

  return { passed: violations.length === 0, violations }
}

export function validateAllPosts(
  content: Record<string, GeneratedPost>,
  rules: CharterRules,
): { passed: boolean; violations: Record<string, string[]> } {
  const violations: Record<string, string[]> = {}

  for (const [platform, post] of Object.entries(content)) {
    const result = validatePost(post, rules)
    if (!result.passed) {
      violations[platform] = result.violations
    }
  }

  return {
    passed: Object.keys(violations).length === 0,
    violations,
  }
}
