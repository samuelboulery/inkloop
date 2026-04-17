# inkloop — Règles always-on

Ces règles s'appliquent à **chaque** session Claude sur ce projet. Aucune exception.

## Ce que Claude ne doit JAMAIS faire

- ❌ Installer une nouvelle dépendance npm/pnpm sans demander explicitement.
- ❌ Exécuter une requête SQL / Supabase bypass la RLS (pas d'utilisation de `service_role` côté browser).
- ❌ Exposer une réponse IA brute à l'utilisateur final sans passage par le validateur de charte éditoriale du workspace.
- ❌ Coder une clé API en dur — uniquement via `process.env.*`.
- ❌ Éditer une migration Supabase déjà appliquée — toujours créer une nouvelle migration.
- ❌ Croiser ou mélanger des données entre workspaces — tout accès doit filtrer par `workspace_id`.
- ❌ Push direct sur `main` — toujours par branche + PR.
- ❌ Commit sans avoir fait passer `pnpm lint && pnpm typecheck`.

## Organisation des fichiers

- Architecture **feature-first** : `src/features/<domain>/` (ex. `workspaces`, `campaigns`, `charters`, `ai`, `publishing`).
- Composants React : un composant par fichier, PascalCase, co-localiser les tests (`Button.tsx` + `Button.test.tsx`).
- Server Components par défaut. `"use client"` uniquement lorsque strictement requis.
- Wrappers pour services externes sous `src/lib/{ai,supabase,publishing}/`.
- Types Supabase auto-générés sous `types/supabase.ts` (ne pas éditer à la main).

## Style de code

- TypeScript strict — pas de `any`, pas de `@ts-ignore` sans commentaire justifiant.
- Validation à toutes les frontières avec `zod` (forms, API routes, réponses IA, webhooks).
- Immutabilité par défaut — pas de mutation d'objets existants.
- Gestion d'erreurs explicite à chaque niveau : jamais d'`catch` silencieux.
- Fichiers < 400 lignes, fonctions < 50 lignes.

## Langue

- **Code et identifiants** : anglais.
- **Commentaires dans le code** : français, mais uniquement si le "pourquoi" n'est pas évident.
- **Commits** : Conventional Commits en français (`feat: ajouter la planification Buffer`).
- **Copy UI / messages utilisateur** : français.
- **Documentation (`CLAUDE.md`, `README.md`, ADRs)** : français.

## IA et chartes éditoriales

Chaque génération IA doit :
1. Partir d'un prompt qui inclut la charte éditoriale du workspace concerné.
2. Passer par le wrapper central dans `src/lib/ai/` (log + cache + tracking coûts).
3. Être validée contre les règles de la charte **avant** d'être affichée à l'utilisateur.
4. Indiquer le modèle utilisé (Claude / OpenAI / Ollama) dans les métadonnées stockées.

## Supabase et RLS

- **Toute** nouvelle table a RLS activée et au minimum une policy `workspace_id = auth.jwt() ->> 'workspace_id'` (ou équivalent via membership).
- Les migrations vont dans `supabase/migrations/` — une migration = un changement atomique.
- Les seeds de dev sous `supabase/seed.sql`.
- `pnpm supabase gen types typescript --local > types/supabase.ts` après chaque migration.

## Tests

- Couverture minimum **80%** — voir règle commune `testing.md`.
- Unit : Vitest. E2E : Playwright.
- Tout flow critique (création workspace, génération IA + validation charte, planification post) doit avoir un test E2E.
- TDD obligatoire pour toute logique métier (validateur de charte, calcul de planification).

## Workflow

Avant toute feature non-triviale : utiliser l'agent `planner` pour poser un plan.
Après chaque chunk de code : utiliser l'agent `code-reviewer`.
Avant tout commit touchant l'auth / Supabase / clés API : utiliser `security-reviewer`.
