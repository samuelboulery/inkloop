---
date: 2026-04-19
status: accepted
---
# ADR-0003 : Charte éditoriale comme contrainte dure (non contournable)

## Contexte
Inkloop génère du contenu via LLM pour le compte de workspaces (associations, profils). Chaque workspace a une charte éditoriale (ton, vocabulaire interdit, règles de brand). Exposer du contenu non validé est un risque réputationnel direct.

## Décision
**Toute réponse LLM est bloquée avant affichage utilisateur** jusqu'à validation contre la charte du workspace. Cette règle s'applique sans exception :

1. Le prompt inclut toujours la charte éditoriale du workspace (`buildContentPrompt()` avec `charterBlock()`)
2. La réponse passe par `charter_validator.validatePost()` avant rendu
3. Si invalide : re-génération automatique via `regenerateUntilValid()` (max N tentatives)
4. Jamais de bypass, même en dev ou pour le contenu "de test"

Implémentation : `src/lib/ai/index.ts` → `generateContent()` + `src/lib/ai/regenerate-until-valid.ts`

## Conséquences
- ✅ Garantie contractuelle : aucun contenu non conforme n'atteint l'utilisateur
- ✅ Traçabilité : chaque appel LLM est loggé avec `logAICall()`
- ⚠️ Latence : validation + éventuelle re-génération ajoute du temps
- ⚠️ Coût tokens : une re-génération = appel LLM supplémentaire

## Erreurs à ne pas répéter
- Ne JAMAIS appeler un wrapper LLM (`generateContent`, `generateEditorialSkeleton`, etc.) sans passer le charter du workspace courant. Si le charter n'est pas chargé = erreur à lancer, pas à ignorer silencieusement.
- `validatePost()` doit recevoir le **même charter** que celui utilisé pour le prompt — ne pas les charger séparément (risque de désynchronisation si le charter est mis à jour entre les deux appels).

## Références
- `src/lib/ai/index.ts`
- `src/lib/ai/regenerate-until-valid.ts`
- `src/lib/ai/charter-validator.ts`
- `src/lib/ai/prompt-builder.ts`
- `.claude/rules/inkloop-conventions.md` (règle IA et chartes)
