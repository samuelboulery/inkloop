---
date: 2026-04-19
status: accepted
---
# ADR-0002 : Machine à états des statuts de campagne

## Contexte
Les campagnes passent par plusieurs états éditoriaux avant publication. Une implémentation naïve (boolean `isPublished`) ne capture pas les états intermédiaires nécessaires à la validation et à la revue.

## Décision
Utiliser une machine à états stricte :

```
Draft → InProgress → Ready → Sent
```

- `Draft` : création initiale, pas encore travaillée
- `InProgress` : en cours d'édition (modification après Mark Ready repasse en InProgress)
- `Ready` : validée, prête à planifier
- `Sent` : publiée — **état final immuable**

Transitions autorisées :
- Draft → InProgress : à la première sauvegarde
- InProgress → Ready : via bouton "Mark Ready"
- Ready → InProgress : toute modification du contenu
- Tout état non-Sent → Ready : via "Mark Ready"
- Sent : aucune transition possible

Implémentation : `src/features/campaigns/components/CampaignContent.tsx` → `computeNextStatus()`

## Conséquences
- ✅ Audit trail clair de chaque campagne
- ✅ Prévient la re-publication accidentelle (Sent est terminal)
- ✅ UX cohérente : le bouton affiché correspond toujours au prochain état possible
- ⚠️ Toute modification UI qui touche au contenu DOIT appeler `computeNextStatus()` — sinon régression

## Erreurs à ne pas répéter
- **Bug corrigé :** Ready → InProgress ne se déclenchait pas sur certaines modifications textarea. La cause : certains handlers `onChange` appelaient `setState` directement sans passer par `computeNextStatus()`. Règle : toute modification de contenu passe OBLIGATOIREMENT par `handleCaptionChange` ou équivalent.
- Ne jamais hardcoder un statut string (`"ready"`) — utiliser les constantes du type `CampaignStatus`.
- Les textareas doivent rester éditables en état `InProgress` ET `Ready` — ne pas bloquer par status (sauf `Sent`).

## Références
- `src/features/campaigns/components/CampaignContent.tsx`
- `src/features/campaigns/components/CampaignResults.tsx`
- Spec : `docs/superpowers/specs/2026-04-18-campaign-view-dialog-design.md`
