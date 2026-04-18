export interface ModelPricing {
  inputCostPer1M: number
  outputCostPer1M: number
}

export interface ComputeCostInput {
  inputTokens: number | null
  outputTokens: number | null
  pricing: ModelPricing | null
}

export interface ComputeCostResult {
  inputCostUsd: number | null
  outputCostUsd: number | null
}

const TOKENS_PER_MILLION = 1_000_000

function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate >= 0
}

function tokenCost(tokens: number | null, ratePer1M: number): number | null {
  if (tokens === null) return null
  return (tokens / TOKENS_PER_MILLION) * ratePer1M
}

export function computeCost(input: ComputeCostInput): ComputeCostResult {
  const { inputTokens, outputTokens, pricing } = input

  if (!pricing || !isValidRate(pricing.inputCostPer1M) || !isValidRate(pricing.outputCostPer1M)) {
    return { inputCostUsd: null, outputCostUsd: null }
  }

  return {
    inputCostUsd: tokenCost(inputTokens, pricing.inputCostPer1M),
    outputCostUsd: tokenCost(outputTokens, pricing.outputCostPer1M),
  }
}
