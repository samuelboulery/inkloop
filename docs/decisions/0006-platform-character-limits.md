---
date: 2026-04-19
status: accepted
---
# ADR-0006 : Limites de caractères par plateforme sociale

## Contexte
Chaque réseau social impose des limites différentes sur la longueur des posts. Le dépasser cause des échecs de publication silencieux ou des troncatures automatiques côté plateforme.

## Décision
Limites officielles implémentées dans `getCharLimit()` :

| Plateforme | Limite |
|-----------|--------|
| Twitter/X | 280 |
| LinkedIn | 3 000 |
| Facebook | 63 206 |
| Instagram | 2 200 |
| Default | 2 000 |

Ces valeurs sont **constantes** — ne pas les passer en prop ou en config dynamique (elles ne changent pas par workspace). La validation se fait côté client (counter temps réel) ET côté server action (blocage si dépassement).

## Conséquences
- ✅ Validation double (client + serveur) évite les publications invalides
- ✅ Counter visuel en temps réel guide l'utilisateur
- ⚠️ Twitter compte les URLs comme 23 caractères (t.co) — ne pas compter les URLs brutes

## Erreurs à ne pas répéter
- Ne pas utiliser `content.length` pour Twitter si le contenu contient des URLs — sous-estime le décompte réel.
- La limite `default` (2000) s'applique aux plateformes non reconnues, pas aux plateformes futures — mettre à jour `getCharLimit()` si on ajoute un réseau.

## Références
- `src/features/campaigns/components/CampaignContent.tsx` → `getCharLimit()`
- `src/features/campaigns/components/steps/StepGeneration.tsx`
- Spec originale : `docs/superpowers/specs/2026-04-18-campaign-view-dialog-design.md`
