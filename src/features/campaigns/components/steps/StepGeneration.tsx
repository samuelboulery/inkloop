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
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-amber-400 text-sm font-medium">Contenu non généré</p>
          <p className="text-amber-300/70 text-xs mt-1">
            Le service IA n&apos;est pas encore configuré (Phase 5). La campagne sera sauvegardée
            sans contenu généré.
          </p>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button
            onClick={() => onSubmit({})}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Continuer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">
        Vérifiez et modifiez le contenu généré pour chaque réseau social.
      </p>

      <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
        {platforms.map((platform) => (
          <div key={platform} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/50 text-xs">
                {platform}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-gray-400 text-xs">Caption</Label>
                <Textarea
                  value={getCaption(platform)}
                  onChange={(e) => handleCaptionChange(platform, e.target.value)}
                  className="mt-1 bg-gray-900 border-gray-700 text-white text-sm resize-none"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-gray-400 text-xs">Hashtags</Label>
                <Textarea
                  value={getHashtags(platform)}
                  onChange={(e) => handleHashtagsChange(platform, e.target.value)}
                  placeholder="#association #impact #solidarité"
                  className="mt-1 bg-gray-900 border-gray-700 text-white text-sm resize-none font-mono"
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
        <Button
          onClick={() => onSubmit(edits)}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
