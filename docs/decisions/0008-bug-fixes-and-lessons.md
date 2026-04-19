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
