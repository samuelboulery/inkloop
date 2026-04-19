---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Security

> Étend [common/security.md](../common/security.md) pour TypeScript/Next.js/Supabase.

## Secrets

```typescript
// ❌ JAMAIS
const apiKey = "sk-proj-xxxxx"

// ✅ TOUJOURS — via process.env, avec fail-fast au boot
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

- `NEXT_PUBLIC_*` → exposé au browser (uniquement anon key Supabase et URLs publiques).
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` → **server-side only**. Ne jamais les importer dans un Client Component ni les passer en props sérialisables.

## Validation zod (frontières obligatoires)

```typescript
import { z } from 'zod'

const CreateCampaignSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  raw_material: z.string().max(50_000),
})

// Server Action / API route / webhook
export async function createCampaign(input: unknown) {
  const data = CreateCampaignSchema.parse(input) // throw si invalide
  // …
}
```

Valider **aussi** les réponses IA avant de les persister :

```typescript
const AIResponseSchema = z.object({
  posts: z.array(z.object({ network: z.enum(['linkedin','instagram','twitter']), body: z.string() })),
})
const parsed = AIResponseSchema.safeParse(JSON.parse(llmRaw))
if (!parsed.success) throw new AIValidationError(parsed.error)
```

## Supabase RLS

- **Toute** table a `ENABLE ROW LEVEL SECURITY` + au moins une policy.
- Policy minimale : appartenance au workspace via table `memberships`.

```sql
-- Exemple de policy (à adapter)
create policy "member can read campaigns"
on campaigns for select
using (
  exists (
    select 1 from memberships m
    where m.workspace_id = campaigns.workspace_id
      and m.user_id = auth.uid()
  )
);
```

- Côté serveur Next : créer deux clients distincts (`createServerClient` avec cookies = anon+user ; `createServiceRoleClient` = admin, **jamais** exposé au browser).
- Jamais d'appel `service_role` depuis un Client Component ou un fichier sans `"use server"`.

## SSRF / fetch externe

- Pas de `fetch(userProvidedURL)` sans whitelist de domaine.
- Les webhooks entrants (Buffer, n8n) doivent vérifier une signature HMAC si le provider en offre une.

## XSS

- `dangerouslySetInnerHTML` uniquement sur du contenu passé par `DOMPurify` (ou équivalent) **et** issu d'une source approuvée (pas de contenu utilisateur direct).
- Préférer le rendu React natif.

## Agents

- **security-reviewer** — à invoquer avant tout commit touchant auth, clés API, RLS, webhooks, ou génération IA.
