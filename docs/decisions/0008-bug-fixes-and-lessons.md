---
date: 2026-04-19
status: living-document
---
# ADR-0008 : Bugs corrigés et leçons apprises

> Document vivant — à enrichir après chaque bug significatif.

## Format d'entrée

```
### [Date] — [Titre court du bug]
**Symptôme :** Ce que l'utilisateur observait
**Cause racine :** Ce qui le provoquait dans le code
**Fix :** Comment c'est résolu
**Règle à retenir :** Ce qu'il ne faut plus jamais faire
**Fichiers concernés :** paths
```

---

### 2026-04 — Régression Ready → InProgress non déclenchée

**Symptôme :** Modifier le texte d'un post après "Mark Ready" ne repassait pas le statut en `InProgress`, laissant une campagne marquée "prête" avec un contenu modifié non revalidé.

**Cause racine :** Certains handlers `onChange` des textareas appelaient `setState` directement au lieu de passer par `handleCaptionChange()` — contournant ainsi `computeNextStatus()`.

**Fix :** Tous les onChange de contenu passent par les handlers centralisés (`handleCaptionChange`, `handleHashtagsChange`) qui appellent `computeNextStatus()`.

**Règle à retenir :** Ne JAMAIS modifier le contenu d'un post directement via `setState`. Toujours passer par le handler centralisé qui calcule le nouveau statut.

**Fichiers concernés :** `src/features/campaigns/components/CampaignResults.tsx`

---

### 2026-04 — Textarea bloquée en état Ready

**Symptôme :** Les textareas devenaient non-éditables quand le statut était `Ready`, empêchant les corrections de dernière minute.

**Cause racine :** La propriété `disabled` était conditionnée sur `status === 'ready' || status === 'sent'` au lieu de uniquement `status === 'sent'`.

**Fix :** `disabled={campaign.status === 'sent'}` uniquement.

**Règle à retenir :** Seul l'état `Sent` rend le contenu immuable. `Ready` est "approuvé mais encore modifiable". Voir ADR-0002.

**Fichiers concernés :** `src/features/campaigns/components/CampaignContent.tsx`

---

### 2026-04 — Validation du contenu côté serveur uniquement

**Symptôme :** Erreurs de validation affichées après un round-trip réseau complet, mauvaise UX.

**Cause racine :** La validation de longueur (character limit) n'était faite que dans la server action.

**Fix :** Validation déplacée côté client (counter temps réel + blocage du bouton si dépassement) + validation serveur conservée comme filet de sécurité.

**Règle à retenir :** Les validations UX (longueur, format visible) doivent être côté client. Les validations de sécurité (permissions, charter) restent côté serveur.

**Fichiers concernés :** `src/features/campaigns/components/CampaignContent.tsx`, `src/features/campaigns/server/`

---

### 2026-04-19 — Cleanup setup Claude + graphify

**Symptôme :** ~70 000 tokens redondants chargés à chaque session (9 règles dupliquées byte-for-byte entre `~/.claude/rules/common/` et `.claude/rules/`, `AGENTS.md` subsumé par `CLAUDE.md`, `inkloop-conventions.md` à 70 % chevauchant avec `CLAUDE.md`), et 921 KB de `graphify-out/` versionnés (diff moyen +8 000 lignes par commit touchant le code).

**Cause racine :** Accumulation historique : copies manuelles de règles communes dans le projet + `.gitignore` graphify incomplet (seuls 3 des 10 outputs étaient ignorés) + `settings.local.json` "sticky" accumulant 47 permissions dont des UUIDs Supabase de session.

**Fix :**
- Supprimé `AGENTS.md`, `inkloop-conventions.md`, et les 9 règles dupliquées de `.claude/rules/`.
- Fusionné le contenu unique d'`inkloop-conventions.md` (workflow IA + RLS policy) dans `CLAUDE.md`.
- Élagué `CLAUDE.md` de 156 → 89 lignes (délégation architecture aux ADR-0004/0005, env vars à `.env.example`).
- Aligné la section graphify avec la réalité du hook (post-commit = extraction incrémentale seule, refresh complet via `/graphify . --update`).
- Étendu `.gitignore` aux 10 outputs graphify + `git rm --cached` pour 921 KB retirés du suivi.
- Nettoyé `settings.local.json` de 47 → 12 permissions stables.
- Enrichi `typescript-security.md` et `typescript-testing.md` avec exemples Vitest/Playwright/RLS.
- Créé `.claude/rules/README.md` expliquant la séparation common / project / TS-specific.

**Règle à retenir :**
1. **Ne jamais dupliquer les règles communes** dans `.claude/rules/` du projet — elles sont déjà chargées globalement depuis `~/.claude/rules/common/`. Précédence : common < TS-specific < `CLAUDE.md` du projet.
2. **Tout output généré reproductible** (graphify, build, types générés) doit être `.gitignore`'d — pas de versionnement de blobs.
3. **`settings.local.json`** ne doit contenir que des catégories stables (git, pnpm, supabase, tsc…), pas des chemins session-spécifiques.

**Fichiers concernés :** `CLAUDE.md`, `.gitignore`, `.claude/settings.local.json`, `.claude/rules/*.md`, `.claude/rules/README.md` (nouveau), `docs/decisions/0008-bug-fixes-and-lessons.md`.
