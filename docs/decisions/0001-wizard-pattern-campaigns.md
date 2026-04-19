---
date: 2026-04-19
status: accepted
---
# ADR-0001 : Wizard pattern pour les campagnes

## Contexte
Une campagne multi-réseaux nécessite une séquence d'étapes guidées : matière première → clarification → squelette éditorial → génération → validation charte → planification. Exposer toutes les options en une fois surcharge l'utilisateur et augmente le risque d'erreurs de validation.

## Décision
La page campagne utilise un wizard à 6 étapes (mode `wizard`) qui bascule en mode `results` une fois la génération terminée. L'état du wizard est géré via `WizardActions` (server actions) et persisté en base via Supabase. Le mode est déterminé par `campaign.status`.

Implémentation principale : `src/features/campaigns/components/steps/`

## Conséquences
- ✅ Validation forcée à chaque étape avant de progresser
- ✅ Workflow traçable (statut = position dans le wizard)
- ✅ UX guidée, erreurs évitées en amont
- ⚠️ Complexité de state management : WizardActions doit être synchronisé avec le statut campagne
- ⚠️ Navigation inter-étapes nécessite de conserver l'état (pas de rechargement naïf)

## Erreurs à ne pas répéter
- Ne pas appeler `toJson()` de WizardActions et de CharterActions séparément — ils partagent un état commun, utiliser le wrapper unifié
- Le mode `wizard` vs `results` est dérivé de `campaign.status`, ne jamais le passer comme prop explicite (risque de désynchronisation)

## Références
- `src/features/campaigns/` (feature principale)
- `src/features/campaigns/server/wizardActions.ts`
- Plan original : `docs/superpowers/plans/2026-04-18-campaign-dedicated-page.md`
- `~/.claude/plans/mission-tu-es-recursive-starlight.md` (MVP phases 4-5)
