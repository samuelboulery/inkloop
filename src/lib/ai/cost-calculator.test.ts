import { describe, it, expect } from 'vitest'
import { computeCost, type ModelPricing } from './cost-calculator'

const pricing: ModelPricing = {
  inputCostPer1M: 3,
  outputCostPer1M: 15,
}

describe('computeCost', () => {
  it('calcule coût input + output à partir des tokens et du pricing par million', () => {
    const result = computeCost({ inputTokens: 1_000_000, outputTokens: 500_000, pricing })
    expect(result.inputCostUsd).toBe(3)
    expect(result.outputCostUsd).toBe(7.5)
  })

  it('gère les valeurs fractionnaires sans arrondir prématurément', () => {
    const result = computeCost({ inputTokens: 1234, outputTokens: 5678, pricing })
    expect(result.inputCostUsd).toBeCloseTo((1234 / 1_000_000) * 3, 10)
    expect(result.outputCostUsd).toBeCloseTo((5678 / 1_000_000) * 15, 10)
  })

  it('retourne zéro quand input/output tokens sont nuls', () => {
    const result = computeCost({ inputTokens: 0, outputTokens: 0, pricing })
    expect(result.inputCostUsd).toBe(0)
    expect(result.outputCostUsd).toBe(0)
  })

  it('retourne null quand pricing est null (modèle inconnu)', () => {
    const result = computeCost({ inputTokens: 100, outputTokens: 100, pricing: null })
    expect(result.inputCostUsd).toBeNull()
    expect(result.outputCostUsd).toBeNull()
  })

  it('retourne null quand les tokens sont null (provider sans usage)', () => {
    const result = computeCost({ inputTokens: null, outputTokens: null, pricing })
    expect(result.inputCostUsd).toBeNull()
    expect(result.outputCostUsd).toBeNull()
  })

  it('gère le cas où seul input est null', () => {
    const result = computeCost({ inputTokens: null, outputTokens: 1_000_000, pricing })
    expect(result.inputCostUsd).toBeNull()
    expect(result.outputCostUsd).toBe(15)
  })

  it('refuse un pricing négatif comme invalide et retourne null', () => {
    const bogus: ModelPricing = { inputCostPer1M: -1, outputCostPer1M: 15 }
    const result = computeCost({ inputTokens: 1000, outputTokens: 1000, pricing: bogus })
    expect(result.inputCostUsd).toBeNull()
    expect(result.outputCostUsd).toBeNull()
  })
})
