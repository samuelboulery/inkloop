import type { Campaign } from '@/types/database'

export const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
}

export function getCharLimit(platform: string): number {
  return CHAR_LIMITS[platform.toLowerCase()] ?? 2000
}

export function computeNextStatus(
  current: Campaign['status'],
  action: 'save' | 'markReady',
): Campaign['status'] {
  if (action === 'markReady') return 'Ready'
  if (current === 'Draft' || current === 'Ready') return 'InProgress'
  return current
}
