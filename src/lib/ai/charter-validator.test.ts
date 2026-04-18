import { describe, it, expect } from 'vitest'
import { validatePost, validateAllPosts, type CharterRules } from './charter-validator'
import type { GeneratedPost } from '@/lib/schemas/campaign'

function post(overrides: Partial<GeneratedPost> = {}): GeneratedPost {
  return {
    caption: "Ceci est une super campagne pour l'association.",
    hashtags: ['#solidarité', '#asso'],
    image_url: null,
    platform: 'instagram',
    ...overrides,
  }
}

function rules(overrides: Partial<CharterRules> = {}): CharterRules {
  return {
    vocabularyRules: { forbidden: [], preferred: {} },
    contentRules: { allowed_topics: [], forbidden_topics: [] },
    toneGuidelines: null,
    ...overrides,
  }
}

describe('validatePost', () => {
  it('passe quand aucune règle ne s’applique', () => {
    const result = validatePost(post(), rules())
    expect(result.passed).toBe(true)
    expect(result.violations).toEqual([])
  })

  it('détecte un mot interdit dans la caption', () => {
    const result = validatePost(
      post({ caption: 'Campagne avec un mot merde dedans' }),
      rules({ vocabularyRules: { forbidden: ['merde'], preferred: {} } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('Mot interdit détecté : "merde"')
  })

  it('détecte un mot interdit insensible à la casse', () => {
    const result = validatePost(
      post({ caption: 'Campagne avec MERDE' }),
      rules({ vocabularyRules: { forbidden: ['merde'], preferred: {} } }),
    )
    expect(result.passed).toBe(false)
  })

  it('détecte un mot interdit dans les hashtags', () => {
    const result = validatePost(
      post({ hashtags: ['#gratuit', '#promo'] }),
      rules({ vocabularyRules: { forbidden: ['gratuit'], preferred: {} } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.includes('gratuit'))).toBe(true)
  })

  it('détecte un sujet interdit', () => {
    const result = validatePost(
      post({ caption: 'Parlons politique aujourd’hui' }),
      rules({ contentRules: { allowed_topics: [], forbidden_topics: ['politique'] } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.includes('politique'))).toBe(true)
  })

  it('rejette une caption trop courte', () => {
    const result = validatePost(
      post({ caption: 'court' }),
      rules({ contentRules: { allowed_topics: [], forbidden_topics: [], min_length: 50 } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.includes('trop courte'))).toBe(true)
  })

  it('rejette une caption trop longue', () => {
    const result = validatePost(
      post({ caption: 'a'.repeat(200) }),
      rules({ contentRules: { allowed_topics: [], forbidden_topics: [], max_length: 100 } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.includes('trop longue'))).toBe(true)
  })

  it('accepte une caption dans la plage autorisée', () => {
    const result = validatePost(
      post({ caption: 'a'.repeat(75) }),
      rules({
        contentRules: { allowed_topics: [], forbidden_topics: [], min_length: 50, max_length: 100 },
      }),
    )
    expect(result.passed).toBe(true)
  })

  describe('word-boundary matching', () => {
    it('ne matche pas un mot interdit quand il est préfixe d’un mot plus long', () => {
      const result = validatePost(
        post({ caption: 'Nous faisons du testing intensif' }),
        rules({ vocabularyRules: { forbidden: ['test'], preferred: {} } }),
      )
      expect(result.passed).toBe(true)
    })

    it('ne matche pas un mot interdit quand il est inclus au milieu d’un autre mot', () => {
      const result = validatePost(
        post({ caption: 'Voici une attestation officielle' }),
        rules({ vocabularyRules: { forbidden: ['test'], preferred: {} } }),
      )
      expect(result.passed).toBe(true)
    })

    it('matche le mot interdit isolé dans la phrase', () => {
      const result = validatePost(
        post({ caption: 'Ceci est un test final.' }),
        rules({ vocabularyRules: { forbidden: ['test'], preferred: {} } }),
      )
      expect(result.passed).toBe(false)
      expect(result.violations).toContain('Mot interdit détecté : "test"')
    })

    it('échappe les caractères spéciaux regex dans le terme interdit', () => {
      const result = validatePost(
        post({ caption: 'Nous aimons C++ beaucoup' }),
        rules({ vocabularyRules: { forbidden: ['C++'], preferred: {} } }),
      )
      expect(result.passed).toBe(false)
    })

    it('applique le word-boundary aussi aux sujets interdits', () => {
      const result = validatePost(
        post({ caption: 'Nous parlons de politiquement correct' }),
        rules({
          contentRules: { allowed_topics: [], forbidden_topics: ['politique'] },
        }),
      )
      expect(result.passed).toBe(true)
    })
  })

  it('accumule plusieurs violations en une seule passe', () => {
    const result = validatePost(
      post({ caption: 'court' }),
      rules({
        vocabularyRules: { forbidden: ['court'], preferred: {} },
        contentRules: { allowed_topics: [], forbidden_topics: [], min_length: 100 },
      }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations.length).toBeGreaterThanOrEqual(2)
  })
})

describe('validateAllPosts', () => {
  it('passe quand tous les posts passent', () => {
    const content = {
      instagram: post(),
      linkedin: post({ platform: 'linkedin' }),
    }
    const result = validateAllPosts(content, rules())
    expect(result.passed).toBe(true)
    expect(result.violations).toEqual({})
  })

  it('rapporte uniquement les plateformes en violation', () => {
    const content = {
      instagram: post({ caption: 'caption normale' }),
      linkedin: post({ caption: 'mot interdit', platform: 'linkedin' }),
    }
    const result = validateAllPosts(
      content,
      rules({ vocabularyRules: { forbidden: ['interdit'], preferred: {} } }),
    )
    expect(result.passed).toBe(false)
    expect(result.violations).toHaveProperty('linkedin')
    expect(result.violations).not.toHaveProperty('instagram')
  })

  it('gère un contenu vide', () => {
    const result = validateAllPosts({}, rules())
    expect(result.passed).toBe(true)
    expect(result.violations).toEqual({})
  })
})
