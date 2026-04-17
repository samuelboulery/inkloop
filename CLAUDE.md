@AGENTS.md

# inkloop

Plateforme web interne de type **Content Factory** assistée par IA. Structurée en espaces de travail (associations ou profils personnels), elle transforme des informations brutes en campagnes multi-réseaux prêtes à être programmées, tout en garantissant le respect strict des chartes éditoriales via un workflow guidé de la conception à l'automatisation.

> ⚠️ **Next.js 16.2.4** (récent, peut différer des connaissances pré-entraînées). Voir `AGENTS.md` + `node_modules/next/dist/docs/` avant d'écrire du code Next.js. Les API App Router, server actions, et conventions peuvent avoir changé.
>
> **Dépendances encore à installer** : `vitest`, `@playwright/test`, `prettier`, `supabase` CLI, `zod`, `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `openai`. Toujours demander avant d'installer.

## Architecture

Architecture cible (full-stack Next.js + Supabase) :

```
┌──────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router, TS) — UI + Server Actions      │
│  ├─ app/(workspace)/...     espaces de travail          │
│  ├─ app/(auth)/...          login / onboarding          │
│  └─ app/api/...             webhooks + jobs             │
└────────────┬─────────────────────────────────────────────┘
             │
      ┌──────┴──────┐      ┌─────────────────────────┐
      │  Supabase   │      │  Services IA            │
      │  Postgres   │      │  ├─ Anthropic (Claude)  │
      │  + Auth     │      │  ├─ OpenAI              │
      │  + Storage  │      │  └─ Ollama (local)      │
      │  + RLS      │      └─────────────────────────┘
      └──────┬──────┘
             │
      ┌──────┴────────────────┐
      │  Scheduler externe    │
      │  (Buffer / Hootsuite  │
      │   / n8n via webhook)  │
      └───────────────────────┘
```

**Stack technique :**
- **Frontend / Backend** : Next.js 16.2.4 (App Router) + React 19 + TypeScript
- **UI** : Tailwind CSS 4 (shadcn/ui recommandé)
- **Base de données + Auth** : Supabase (Postgres + RLS + Auth + Storage)
- **IA** : Anthropic Claude API, OpenAI API, Ollama (modèles locaux)
- **Programmation multi-réseaux** : Buffer / Hootsuite / n8n (via API + webhooks)
- **Gestionnaire de paquets** : pnpm

## Concepts métier clés

| Concept | Description |
|---|---|
| **Workspace** | Espace de travail isolé (association ou profil perso). Toute donnée doit être scopée par `workspace_id`. |
| **Charte éditoriale** | Règles de ton, vocabulaire, interdits propres à chaque workspace. Aucune génération IA ne doit être exposée sans validation vs la charte. |
| **Matière première** | Info brute entrante (notes, URLs, docs) qui alimente la génération. |
| **Campagne** | Ensemble de posts multi-réseaux dérivés d'une même matière première. |
| **Workflow guidé** | Étapes : matière → brief → génération IA → revue charte → planification → publication. |

## Commandes principales

```bash
# Disponible maintenant
pnpm dev                    # serveur Next.js local
pnpm build                  # build production
pnpm start                  # serveur production (après build)
pnpm lint                   # ESLint
pnpm typecheck              # tsc --noEmit

# À activer (scripts/deps pas encore installés — demander avant d'installer)
pnpm test                   # Vitest (tests unitaires)
pnpm test:e2e               # Playwright (tests E2E)
pnpm format                 # Prettier

# Supabase (après `pnpm add -D supabase` + `pnpm dlx supabase init`)
pnpm supabase start         # Supabase local (Docker)
pnpm supabase db reset      # reset + migrations + seed
pnpm supabase migration new <nom>
pnpm supabase gen types typescript --local > types/supabase.ts
```

## Conventions de code

- **Langue** : code et identifiants en anglais ; commentaires, commits et copy UI en français.
- **Structure** : feature-first sous `src/features/<domain>/` (workspaces, campaigns, charters, ai, publishing).
- **Composants React** : PascalCase, un composant par fichier, co-localiser `Component.tsx` + `Component.test.tsx`.
- **Server vs Client** : par défaut Server Components. Marquer `"use client"` uniquement si interactivité requise.
- **Accès BDD** : toujours via helpers Supabase typés, jamais de SQL brut côté client. RLS obligatoire sur toute table.
- **Validation** : `zod` à toutes les frontières (formulaires, API routes, réponses IA). Pas de `any`.
- **IA** : tout appel LLM passe par un wrapper dans `src/lib/ai/` qui logge, met en cache et applique la charte éditoriale du workspace.
- **Commits** : Conventional Commits en français — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Contraintes (ce que Claude ne doit JAMAIS faire)

- ❌ Installer une nouvelle dépendance sans demander d'abord.
- ❌ Écrire une requête qui bypass la RLS Supabase (pas de `service_role` côté client/browser).
- ❌ Exposer de réponse IA directement à l'utilisateur sans passage par le validateur de charte éditoriale.
- ❌ Mettre une clé API en dur — toujours via `process.env.*` et `.env.local` (jamais commité).
- ❌ Modifier une migration Supabase déjà appliquée — créer une nouvelle migration.
- ❌ Mélanger les workspaces : toute requête doit filtrer par `workspace_id` + RLS.
- ❌ Push direct sur `main` — toujours via branche + PR.

## Variables d'environnement

Voir `.env.example`. Les clés requises :

| Variable | Requis | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clé publique (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clé admin (server-side uniquement) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API |
| `OPENAI_API_KEY` | ✅ | OpenAI API |
| `OLLAMA_BASE_URL` | ⬜ | Endpoint Ollama local (défaut : `http://localhost:11434`) |
| `BUFFER_ACCESS_TOKEN` | ⬜ | Planification via Buffer |
| `HOOTSUITE_ACCESS_TOKEN` | ⬜ | Planification via Hootsuite |
| `N8N_WEBHOOK_URL` | ⬜ | Planification via n8n |

## Équipe & process

Petite équipe (2-5 collaborateurs). Workflow attendu :
1. Une branche par feature (`feat/<nom>`) ou fix (`fix/<nom>`).
2. TDD lorsque pertinent — voir le skill `tdd-workflow`.
3. Revue de code via l'agent `code-reviewer` avant PR.
4. PR avec description en français + checklist de tests.
5. Merge uniquement si CI verte.
