---
date: 2026-04-19
status: accepted
---
# ADR-0007 : Page dédiée plutôt que modal pour l'édition de campagne

## Contexte
Deux approches ont été envisagées pour afficher/éditer une campagne :
- **Option A (abandonnée)** : `CampaignViewDialog` — modal plein-écran ouvert depuis la liste
- **Option B (retenue)** : Page dédiée `/campaigns/[campaignId]` avec route Next.js

Les deux plans existent dans `docs/superpowers/plans/` pour traçabilité.

## Décision
Page dédiée (`/campaigns/[campaignId]`) via App Router. Le modal a été supprimé (`CampaignViewDialog.tsx` supprimé en commit `52b6380`).

Raisons du choix :
1. **UX** : L'édition de campagne (wizard 6 étapes + génération IA) est trop complexe pour un modal — nécessite scroll, focus, et navigation entre étapes sans perte d'état
2. **URL partageable** : Une URL dédiée permet de revenir sur une campagne spécifique via lien
3. **Back button** : La navigation navigateur fonctionne naturellement
4. **SEO/SSR** : La page peut être rendue côté serveur avec metadata dynamique

## Conséquences
- ✅ Expérience d'édition complète sans contraintes de modal
- ✅ URL dédiée et navigable
- ✅ Simplifie le state management (pas de modal state dans le parent)
- ⚠️ Nécessite gestion de la navigation retour vers la liste (`router.back()` ou lien explicite)

## Erreurs à ne pas répéter
- Ne pas réintroduire de modal pour les campagnes — la décision est ferme, le modal a été retiré.
- Si une nouvelle feature nécessite une vue "rapide" d'une campagne, utiliser un drawer ou un panel latéral, pas un modal plein-écran.

## Références
- `src/app/(workspace)/campaigns/[campaignId]/` (route dédiée)
- Plan adopté : `docs/superpowers/plans/2026-04-18-campaign-dedicated-page.md`
- Plan abandonné : `docs/superpowers/plans/2026-04-18-campaign-view-dialog.md`
- Commit de suppression : `52b6380` (`chore: supprimer CampaignViewDialog`)
