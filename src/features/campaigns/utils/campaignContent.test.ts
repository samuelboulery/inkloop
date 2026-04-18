import { describe, it, expect } from 'vitest'
import { computeNextStatus, getCharLimit } from './campaignContent'

describe('getCharLimit', () => {
  it('retourne 280 pour twitter', () => {
    expect(getCharLimit('twitter')).toBe(280)
  })
  it('retourne 3000 pour linkedin', () => {
    expect(getCharLimit('linkedin')).toBe(3000)
  })
  it('retourne 2000 pour plateforme inconnue', () => {
    expect(getCharLimit('tiktok')).toBe(2000)
  })
  it('est insensible à la casse', () => {
    expect(getCharLimit('Twitter')).toBe(280)
    expect(getCharLimit('LINKEDIN')).toBe(3000)
  })
})

describe('computeNextStatus', () => {
  it('Draft + save → InProgress', () => {
    expect(computeNextStatus('Draft', 'save')).toBe('InProgress')
  })
  it('InProgress + save → InProgress', () => {
    expect(computeNextStatus('InProgress', 'save')).toBe('InProgress')
  })
  it('Ready + save → InProgress (modification détectée)', () => {
    expect(computeNextStatus('Ready', 'save')).toBe('InProgress')
  })
  it('Draft + markReady → Ready', () => {
    expect(computeNextStatus('Draft', 'markReady')).toBe('Ready')
  })
  it('InProgress + markReady → Ready', () => {
    expect(computeNextStatus('InProgress', 'markReady')).toBe('Ready')
  })
  it('Sent + save → Sent (cas impossible, lecture seule)', () => {
    expect(computeNextStatus('Sent', 'save')).toBe('Sent')
  })
})
