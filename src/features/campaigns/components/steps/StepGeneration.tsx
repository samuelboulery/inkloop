'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { GeneratedPost } from '@/lib/schemas/campaign'

interface Props {
  generatedContent: Record<string, GeneratedPost>
  onSubmit: (finalEdits: Record<string, Partial<GeneratedPost>>) => void
  onBack: () => void
}

export function StepGeneration({ generatedContent, onSubmit, onBack }: Props) {
  const platforms = Object.keys(generatedContent)
  const [edits, setEdits] = useState<Record<string, Partial<GeneratedPost>>>({})

  function getCaption(platform: string): string {
    return edits[platform]?.caption ?? generatedContent[platform]?.caption ?? ''
  }

  function getHashtags(platform: string): string {
    const tags = edits[platform]?.hashtags ?? generatedContent[platform]?.hashtags ?? []
    return tags.join(' ')
  }

  function handleCaptionChange(platform: string, value: string) {
    setEdits((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], caption: value },
    }))
  }

  function handleHashtagsChange(platform: string, value: string) {
    const tags = value
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
    setEdits((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], hashtags: tags },
    }))
  }

  if (platforms.length === 0) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="rounded-lg px-4 py-3 bg-status-progress/10 border border-status-progress/25 animate-scale-in">
          <p className="text-sm font-medium text-foreground">Contenu non généré</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Le service IA n&apos;est pas encore configuré (Phase 5). La campagne sera sauvegardée
            sans contenu généré.
          </p>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button onClick={() => onSubmit({})} className="active:scale-[0.98]">
            Continuer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-sm text-muted-foreground">
        Vérifiez et modifiez le contenu généré pour chaque réseau social.
      </p>

      <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
        {platforms.map((platform) => (
          <div
            key={platform}
            className="rounded-lg p-4 bg-surface-1 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-meta">
                {platform}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground/70">Caption</Label>
                <Textarea
                  value={getCaption(platform)}
                  onChange={(e) => handleCaptionChange(platform, e.target.value)}
                  className="mt-1 text-sm resize-none bg-background border-border text-foreground transition-colors duration-200"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground/70">Hashtags</Label>
                <Textarea
                  value={getHashtags(platform)}
                  onChange={(e) => handleHashtagsChange(platform, e.target.value)}
                  placeholder="#association #impact #solidarité"
                  className="mt-1 text-sm resize-none font-mono bg-background border-border text-foreground transition-colors duration-200"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button onClick={() => onSubmit(edits)} className="active:scale-[0.98]">
          Continuer
        </Button>
      </div>
    </div>
  )
}
