---
date: 2026-04-19
status: accepted
---
# ADR-0004 : Architecture feature-first

## Contexte
Les projets Next.js classiques organisent par type technique (`components/`, `hooks/`, `utils/`). Cette organisation disperse une feature sur 4-5 répertoires, complique les revues de code et rend les extractions/suppressions difficiles.

## Décision
Organisation par domaine fonctionnel sous `src/features/<domain>/` :

```
src/features/
  campaigns/       ← tout ce qui concerne les campagnes
    components/    ← UI composants
    server/        ← server actions
    types.ts       ← types du domaine
  workspaces/      ← espaces de travail
  charters/        ← chartes éditoriales
  ai/              ← orchestration IA (côté feature, pas lib)
  publishing/      ← publication multi-réseaux
src/lib/           ← code réutilisable cross-features
  ai/              ← wrappers LLM (charter validator, prompt builder, etc.)
  supabase/        ← clients Supabase (server, client, admin)
  publishing/      ← intégrations Buffer/Hootsuite/n8n
```

## Conséquences
- ✅ Toute modification d'une feature = changements localisés dans un seul dossier
- ✅ `src/lib/` contient uniquement du code réutilisé par 2+ features
- ⚠️ Requiert discipline : résister à la tentation de mettre des composants "génériques" dans `src/features/`
- ⚠️ Les composants UI purement génériques (shadcn/ui) vont dans `src/components/ui/`, pas dans une feature

## Erreurs à ne pas répéter
- Ne pas créer `src/features/shared/` — c'est un fourre-tout. Si du code est partagé, il va dans `src/lib/`.
- Un composant ne doit pas importer depuis une autre feature (`campaigns` n'importe pas depuis `charters` directement) — passer par `src/lib/` ou via server actions.

## Références
- `src/features/` (structure active)
- `CLAUDE.md` (conventions de code)
- `.claude/rules/inkloop-conventions.md` (règle organisation fichiers)
