'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'

interface Props {
  campaignName: string
  skeleton: EditorialSkeleton | undefined
  generatedContent: Record<string, GeneratedPost>
  finalEdits: Record<string, Partial<GeneratedPost>>
  onSubmit: () => void
  onBack: () => void
  isLoading: boolean
}

function mergedPost(
  platform: string,
  generated: Record<string, GeneratedPost>,
  edits: Record<string, Partial<GeneratedPost>>,
): Partial<GeneratedPost> {
  return { ...generated[platform], ...edits[platform] }
}

export function StepReview({
  campaignName,
  skeleton,
  generatedContent,
  finalEdits,
  onSubmit,
  onBack,
  isLoading,
}: Props) {
  const platforms = Object.keys(generatedContent)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-4 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Campagne</p>
        <p className="text-white font-medium">{campaignName}</p>

        {skeleton && (
          <div className="mt-3 space-y-1 text-sm">
            {skeleton.angle && (
              <p className="text-gray-300">
                <span className="text-gray-500">Angle :</span> {skeleton.angle}
              </p>
            )}
            {skeleton.content_type && (
              <p className="text-gray-300">
                <span className="text-gray-500">Type :</span> {skeleton.content_type}
              </p>
            )}
            {skeleton.tone && (
              <p className="text-gray-300">
                <span className="text-gray-500">Ton :</span> {skeleton.tone}
              </p>
            )}
            {skeleton.key_messages.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-500 text-xs mb-1">Messages clés :</p>
                <ul className="space-y-0.5">
                  {skeleton.key_messages.map((msg, i) => (
                    <li key={i} className="text-gray-300 text-sm pl-3 border-l border-gray-700">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {platforms.length > 0 ? (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {platforms.map((platform) => {
            const post = mergedPost(platform, generatedContent, finalEdits)
            return (
              <div key={platform} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <Badge variant="outline" className="text-indigo-400 border-indigo-500/50 text-xs mb-3">
                  {platform}
                </Badge>
                {post.caption && (
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.caption}</p>
                )}
                {post.hashtags && post.hashtags.length > 0 && (
                  <p className="text-indigo-400 text-xs mt-2 font-mono">
                    {post.hashtags.join(' ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          Aucun contenu généré — la campagne sera sauvegardée en statut Brouillon.
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Finalisation…
            </span>
          ) : (
            'Finaliser la campagne'
          )}
        </Button>
      </div>
    </div>
  )
}
