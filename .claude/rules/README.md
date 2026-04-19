# Rules inkloop

Ce répertoire ne contient **que les règles TypeScript spécifiques** au projet. Les règles communes (agents, git, testing, security, coding-style, hooks, patterns, performance, development-workflow) sont chargées globalement depuis `~/.claude/rules/common/` — ne pas les redupliquer ici.

## Fichiers

| Fichier | Portée |
|---|---|
| `typescript-coding-style.md` | Idiomes TS (immutabilité, types, erreurs) |
| `typescript-hooks.md` | Hooks Claude Code pour `.ts/.tsx` (format, lint, typecheck) |
| `typescript-patterns.md` | Patterns TS spécifiques (Result, discriminated unions…) |
| `typescript-security.md` | Secrets, validation `zod`, RLS Supabase, SSRF |
| `typescript-testing.md` | Vitest + Playwright + mocks Supabase |

## Où mettre quoi

- **Règle universelle (toute stack)** → proposer la modif dans `~/.claude/rules/common/*.md`.
- **Règle TypeScript** (code, tests, sécurité TS) → ici.
- **Règle inkloop** (RLS, charte IA, workflow campagne…) → `CLAUDE.md` racine du projet.

Les règles langage **surchargent** les règles communes en cas de conflit (précédence : common < language-specific < project CLAUDE.md).
