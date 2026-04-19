# inkloop

Plateforme web interne de type **Content Factory** assistée par IA. Elle transforme des informations brutes en campagnes multi-réseaux respectant la charte éditoriale du workspace, via un workflow guidé (matière → brief → génération IA → revue charte → planification → publication).

> ⚠️ **Next.js 16.2.4** — APIs App Router / server actions peuvent différer des connaissances pré-entraînées. Consulter `node_modules/next/dist/docs/` avant d'écrire du code Next.js.
>
> **Dépendances non encore installées** : `vitest`, `@playwright/test`, `prettier`, `supabase` CLI, `zod`, `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `openai`. **Toujours demander avant d'installer.**

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 (shadcn/ui) / Supabase (Postgres, Auth, RLS, Storage) / Anthropic + OpenAI + Ollama / Buffer / Hootsuite / n8n pour la programmation / pnpm.

Détails architecture : `docs/decisions/0004-feature-first-architecture.md` + `0005-server-components-server-actions.md`. Variables d'env : `.env.example`.

## Concepts métier

| Concept | Description |
|---|---|
| **Workspace** | Espace isolé (asso ou perso). Tout est scopé par `workspace_id`. |
| **Charte éditoriale** | Ton, vocabulaire, interdits du workspace. Aucune génération IA n'est exposée sans validation vs la charte. |
| **Matière première** | Info brute entrante (notes, URLs, docs). |
| **Campagne** | Posts multi-réseaux dérivés d'une même matière première. |

## Commandes

```bash
pnpm dev | pnpm build | pnpm start | pnpm lint | pnpm typecheck
# après install des deps : pnpm test (Vitest), pnpm test:e2e (Playwright), pnpm format (Prettier)
# Supabase : pnpm supabase start | db reset | migration new <nom> | gen types typescript --local > types/supabase.ts
```

## Conventions

- **Langue** : code/identifiants en anglais ; commentaires, commits, copy UI, docs en français.
- **Structure** : feature-first sous `src/features/<domain>/`. Wrappers externes sous `src/lib/{ai,supabase,publishing}/`.
- **Composants** : PascalCase, un par fichier, `Component.tsx` + `Component.test.tsx` co-localisés.
- **Server vs Client** : Server Components par défaut. `"use client"` uniquement si interactivité requise.
- **TypeScript strict** : pas de `any`, pas de `@ts-ignore` sans justification commentée.
- **Validation `zod`** à toutes les frontières (forms, API, réponses IA, webhooks).
- **Immutabilité** par défaut. Fichiers < 400 lignes, fonctions < 50 lignes.
- **IA** : tout appel LLM via wrapper `src/lib/ai/` (log + cache + coûts + modèle dans métadonnées).
- **Supabase** : RLS activée sur toute table, policy minimale `workspace_id = auth.jwt() ->> 'workspace_id'` (ou via membership). Une migration = un changement atomique. Types auto-générés (ne pas éditer).
- **Tests** : TDD pour toute logique métier. Couverture ≥ 80 %. Flows critiques (workspace, IA+charte, planification) → E2E.
- **Commits** : Conventional Commits en français (`feat:`, `fix:`, `docs:`, etc.).

## Contraintes (NE JAMAIS faire)

- ❌ Installer une dépendance sans demander.
- ❌ Bypass RLS (pas de `service_role` côté client/browser).
- ❌ Exposer une réponse IA brute sans validation charte.
- ❌ Coder une clé API en dur — uniquement `process.env.*`.
- ❌ Modifier une migration déjà appliquée — en créer une nouvelle.
- ❌ Croiser des workspaces — toujours filtrer par `workspace_id` + RLS.
- ❌ Push direct sur `main` — toujours branche + PR.
- ❌ Commit sans `pnpm lint && pnpm typecheck`.

## Workflow

1. Branche `feat/<nom>` ou `fix/<nom>`.
2. Feature non-triviale → agent `planner`. Logique métier → TDD.
3. Après chunk de code → agent `code-reviewer`. Touche auth/Supabase/clés → `security-reviewer`.
4. PR en français + checklist tests. Merge si CI verte.

## graphify

Graphe de connaissance dans `graphify-out/` (non versionné — reconstruit localement).

### Consulter avant

**Architecture / codebase :** `graphify-out/GRAPH_REPORT.md` puis `graphify-out/wiki/index.md` si présent, sinon `/graphify query "<question>"`.

**Feature ou bug :** lire les ADRs pertinents dans `docs/decisions/` — ADR-0002 (statuts), 0003 (charte), 0005 (server actions), 0008 (bugs connus).

### Mettre à jour

| Événement | Action |
|-----------|--------|
| Commit touchant `.ts/.tsx` | Hook `post-commit` → extraction code incrémentale seulement |
| Checkout de branche | Hook `post-checkout` → idem |
| Ajout/modif docs, ADRs, nouvelle feature | **Manuel : `/graphify . --update`** (relabeling, communautés, wiki, HTML) |

Les hooks ne font que l'extraction incrémentale. Un refresh complet (wiki, communautés, HTML) nécessite `/graphify . --update` explicite.

### Process ADR (obligatoire)

- Bug significatif corrigé → entrée dans `docs/decisions/0008-bug-fixes-and-lessons.md`
- Décision architecturale → nouveau `docs/decisions/XXXX-<sujet>.md` (template : `0001-wizard-pattern-campaigns.md`)
- Contrainte importante → l'ajouter dans l'ADR concerné
