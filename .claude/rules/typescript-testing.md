---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Testing

> Étend [common/testing.md](../common/testing.md) pour Vitest + Playwright + Supabase.

## Stack

- **Unit / intégration** : Vitest (pas Jest).
- **E2E** : Playwright (`@playwright/test`).
- **Co-location** : `Component.tsx` + `Component.test.tsx` dans le même dossier.

## Vitest — unit

```typescript
import { describe, it, expect } from 'vitest'
import { validateCaption } from './validateCaption'

describe('validateCaption', () => {
  it('rejette si longueur > limite plateforme', () => {
    expect(() => validateCaption('x'.repeat(3001), 'linkedin')).toThrow(/limit/)
  })
})
```

Config recommandée (`vitest.config.ts`) : `environment: 'jsdom'` pour les composants React, `setupFiles` pour charger `@testing-library/jest-dom`.

## React Testing Library

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignContent } from './CampaignContent'

it('bloque le bouton Publier si la longueur dépasse', async () => {
  render(<CampaignContent initial="..." platform="twitter" />)
  await userEvent.type(screen.getByRole('textbox'), 'x'.repeat(300))
  expect(screen.getByRole('button', { name: /publier/i })).toBeDisabled()
})
```

Privilégier `getByRole` / `getByLabelText` à `getByTestId` (accessibilité).

## Supabase — intégration

- Tests d'intégration → Supabase **local** (`pnpm supabase start`), pas de mock du client.
- Reset entre tests : `pnpm supabase db reset` ou transaction rollback par test.
- RLS actif en test : créer un utilisateur via `auth.signInWithPassword` pour obtenir un JWT valide, puis exécuter la requête. Tester le chemin "user hors du workspace voit 0 ligne" pour chaque table.

## Playwright — E2E

Flows critiques à couvrir :
- Création workspace → invitation membre → connexion membre.
- Matière première → brief → génération IA → validation charte → approbation.
- Campagne `Ready` → modification contenu → retour en `InProgress` (voir ADR-0002).
- Planification (Buffer/n8n) → webhook retour → statut `Sent`.

```typescript
// e2e/campaign-ready-edit.spec.ts
import { test, expect } from '@playwright/test'

test('éditer un post Ready fait repasser en InProgress', async ({ page }) => {
  await page.goto('/campaigns/test-campaign')
  await page.getByRole('button', { name: /mark ready/i }).click()
  await expect(page.getByText(/ready/i)).toBeVisible()
  await page.getByRole('textbox').fill('nouveau contenu')
  await expect(page.getByText(/in progress/i)).toBeVisible()
})
```

## Coverage

- Seuil minimum 80 % — configuré via `vitest --coverage` (`v8` provider).
- Les Server Actions, wrappers IA et validateurs de charte doivent être à 100 %.

## Agents

- **tdd-guide** — rédige les tests en premier (RED → GREEN → refactor).
- **e2e-runner** — génère / maintient les specs Playwright.
