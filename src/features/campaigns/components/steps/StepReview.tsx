'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import {
  VocabularyRulesSchema,
  ContentRulesSchema,
  type VocabularyRules,
  type ContentRules,
} from '@/lib/schemas/charter'
import { validateAllPosts, type CharterRules } from '@/lib/ai/charter-validator'
import { getCharter } from '@/features/charters/server/getCharter'
import { CheckCircleIcon, AlertTriangleIcon } from 'lucide-react'

interface Props {
  campaignId: string | undefined
  campaignName: string
  workspaceId: string
  skeleton: EditorialSkeleton | undefined
  generatedContent: Record<string, GeneratedPost>
  finalEdits: Record<string, Partial<GeneratedPost>>
  onSubmit: () => void
  onSubmitAndPublish: () => void
  onBack: () => void
  isLoading: boolean
}

function mergedPost(
  platform: string,
  generated: Record<string, GeneratedPost>,
  edits: Record<string, Partial<GeneratedPost>>,
): GeneratedPost {
  const base = generated[platform]
  const override = edits[platform] ?? {}
  return {
    caption: override.caption ?? base.caption,
    hashtags: override.hashtags ?? base.hashtags,
    platform: override.platform ?? base.platform,
    image_url: override.image_url ?? base.image_url ?? null,
  }
}

function parseCharterRules(charter: {
  vocabulary_rules: unknown
  content_rules: unknown
  tone_guidelines: string | null
}): CharterRules {
  const vocabularyRules: VocabularyRules = VocabularyRulesSchema.parse(
    charter.vocabulary_rules ?? { forbidden: [], preferred: {} },
  )
  const contentRules: ContentRules = ContentRulesSchema.parse(
    charter.content_rules ?? { allowed_topics: [], forbidden_topics: [] },
  )
  return {
    vocabularyRules,
    contentRules,
    toneGuidelines: charter.tone_guidelines,
  }
}

export function StepReview({
  campaignName,
  workspaceId,
  skeleton,
  generatedContent,
  finalEdits,
  onSubmit,
  onSubmitAndPublish,
  onBack,
  isLoading,
}: Props) {
  const platforms = Object.keys(generatedContent)
  const [violations, setViolations] = useState<Record<string, string[]>>({})
  const [charterChecked, setCharterChecked] = useState(false)
  const [charterError, setCharterError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const charter = await getCharter(workspaceId)
        if (cancelled) return
        if (!charter) {
          setViolations({})
          setCharterChecked(true)
          return
        }
        const rules = parseCharterRules(charter)
        const posts: Record<string, GeneratedPost> = {}
        for (const platform of platforms) {
          posts[platform] = mergedPost(platform, generatedContent, finalEdits)
        }
        const result = validateAllPosts(posts, rules)
        if (cancelled) return
        setViolations(result.violations)
        setCharterChecked(true)
      } catch (err) {
        if (cancelled) return
        setCharterError(err instanceof Error ? err.message : 'Charte indisponible')
        setCharterChecked(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [workspaceId, generatedContent, finalEdits, platforms])

  const violationCount = Object.values(violations).reduce((acc, v) => acc + v.length, 0)
  const hasViolations = violationCount > 0

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Campaign summary */}
      <div className="rounded-lg p-4 space-y-2 bg-surface-1 border border-border">
        <p className="text-meta text-muted-foreground">Campagne</p>
        <p className="font-medium text-foreground">{campaignName}</p>

        {skeleton && (
          <div className="mt-3 space-y-1 text-sm">
            {skeleton.angle && (
              <p className="text-foreground/80">
                <span className="text-muted-foreground/70">Angle :</span> {skeleton.angle}
              </p>
            )}
            {skeleton.content_type && (
              <p className="text-foreground/80">
                <span className="text-muted-foreground/70">Type :</span> {skeleton.content_type}
              </p>
            )}
            {skeleton.tone && (
              <p className="text-foreground/80">
                <span className="text-muted-foreground/70">Ton :</span> {skeleton.tone}
              </p>
            )}
            {skeleton.key_messages.length > 0 && (
              <div className="mt-2">
                <p className="text-xs mb-1 text-muted-foreground/70">Messages clés :</p>
                <ul className="space-y-0.5">
                  {skeleton.key_messages.map((msg, i) => (
                    <li
                      key={i}
                      className="text-sm pl-3 border-l-2 border-border text-foreground/80"
                    >
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charter validation */}
      {charterChecked && !charterError && (
        hasViolations ? (
          <div className="rounded-lg p-4 space-y-2 bg-destructive/5 border border-destructive/20 animate-scale-in">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <p className="text-xs font-semibold">
                {violationCount} violation{violationCount > 1 ? 's' : ''} de la charte éditoriale
              </p>
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(violations).map(([platform, list]) => (
                <div key={platform}>
                  <p className="font-medium text-destructive">{platform}</p>
                  <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-destructive/80">
                    {list.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[11px] pt-1 text-muted-foreground/70">
              Vous pouvez tout de même finaliser — les violations seront enregistrées pour revue.
            </p>
          </div>
        ) : (
          <div className="rounded-lg px-4 py-2.5 text-xs flex items-center gap-2 bg-status-ready/10 border border-status-ready/30 text-status-ready animate-scale-in">
            <CheckCircleIcon className="w-4 h-4 shrink-0" />
            Contenu conforme à la charte éditoriale
          </div>
        )
      )}
      {charterError && (
        <div className="rounded-lg px-4 py-2 text-xs bg-status-progress/10 border border-status-progress/25 text-foreground">
          Validation charte indisponible : {charterError}
        </div>
      )}

      {/* Post previews */}
      {platforms.length > 0 ? (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {platforms.map((platform) => {
            const post = mergedPost(platform, generatedContent, finalEdits)
            const platformViolations = violations[platform] ?? []
            return (
              <div
                key={platform}
                className={`rounded-lg p-4 bg-surface-1 border ${
                  platformViolations.length > 0 ? 'border-destructive/25' : 'border-border'
                }`}
              >
                <Badge variant="outline" className="text-meta mb-3">
                  {platform}
                </Badge>
                {post.caption && (
                  <p className="text-sm whitespace-pre-wrap text-foreground">{post.caption}</p>
                )}
                {post.hashtags.length > 0 && (
                  <p className="text-xs mt-2 font-mono text-muted-foreground/70">
                    {post.hashtags.join(' ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground/70">
          Aucun contenu généré — la campagne sera sauvegardée en statut Brouillon.
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Enregistrement…' : 'Enregistrer en brouillon'}
          </Button>
          <Button
            onClick={onSubmitAndPublish}
            disabled={isLoading || platforms.length === 0}
            className="active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Finalisation…
              </span>
            ) : (
              'Finaliser & publier'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
