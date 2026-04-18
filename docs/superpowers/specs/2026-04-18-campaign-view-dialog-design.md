# Spec : Modal vue campagne

**Date :** 2026-04-18
**Statut :** Approuvé

---

## Contexte

Le dashboard workspace affiche la liste des campagnes existantes. Cliquer sur une campagne n'ouvre rien (`handleOpenCampaign` est vide). Cette spec couvre l'implémentation d'une modal permettant de consulter, modifier et publier une campagne.

---

## Architecture

### Nouveau composant

`src/features/campaigns/components/CampaignViewDialog.tsx`

- Client component (`"use client"`)
- Utilise `Dialog` de Radix UI (même pattern que `CampaignWizard` et `PublishingDialog`)
- Props : `campaign: Campaign | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onCampaignUpdated: (updated: Campaign) => void`

### Modifications existantes

**`WorkspaceDashboard`** (`src/features/workspaces/components/WorkspaceDashboard.tsx`) :
- Ajoute state `selectedCampaign: Campaign | null`
- `handleOpenCampaign(id)` trouve la campagne dans le tableau `campaigns` déjà chargé (pas de fetch)
- Rend `<CampaignViewDialog>` en bas du composant
- `onCampaignUpdated` met à jour le tableau local `campaigns` via `useState`

**`src/features/campaigns/server/wizardActions.ts`** :
- Ajoute `updateCampaignContent(campaignId, content, newStatus)` — server action qui met à jour `generated_content` et `status` en DB

---

## Interface de la modal

### Header
- Nom de la campagne (texte, non éditable)
- Badge statut coloré (même config que `CampaignHistory`)
- Bouton fermer (×)

### Body
Pour chaque plateforme dans `generated_content` (ordre alphabétique) :
- Label : nom de la plateforme (ex. "twitter", "linkedin")
- `<textarea>` éditable avec le texte du post
- Compteur de caractères (courant / max selon plateforme — voir tableau ci-dessous)
- Si statut `Sent` : textarea en lecture seule (`readOnly`)

Limites de caractères par plateforme :
| Plateforme | Max |
|---|---|
| twitter | 280 |
| linkedin | 3000 |
| facebook | 63206 |
| instagram | 2200 |
| default | 2000 |

### Footer
- **Sauvegarder** — appelle `updateCampaignContent`, spinner pendant l'appel
- **Marquer comme prêt** — visible si statut ≠ `Ready` et ≠ `Sent` ; appelle `updateCampaignContent` avec `status: 'Ready'`
- **Publier** — visible si statut `Ready` ou `InProgress` ; ouvre `PublishingDialog` (existant)

---

## Transitions de statut automatiques

| Action | Statut avant | Statut après |
|---|---|---|
| Sauvegarder | `Draft` | `InProgress` |
| Sauvegarder | `InProgress` | `InProgress` (inchangé) |
| Sauvegarder | `Ready` | `InProgress` (modification détectée) |
| Sauvegarder | `Sent` | impossible (lecture seule) |
| Marquer comme prêt | tout sauf `Sent` | `Ready` |

---

## Server action

```ts
// src/features/campaigns/server/wizardActions.ts
export async function updateCampaignContent(
  campaignId: string,
  content: Record<string, GeneratedPost>,
  newStatus: Campaign['status'],
): Promise<Campaign>
```

- Valide `campaignId` (non vide)
- Update `generated_content` + `status` dans Supabase
- RLS : la policy existante sur `campaigns` garantit le scope workspace
- Retourne la campagne mise à jour
- Erreur si campagne au statut `Sent`

---

## Gestion d'erreurs

- Erreur réseau / Supabase : toast d'erreur, état local non modifié
- Validation échoue (zod) : toast d'erreur avec message
- Après sauvegarde réussie : `onCampaignUpdated` met à jour la liste en mémoire (pas de rechargement de page)

---

## Tests

- Unit : `updateCampaignContent` — transitions de statut, cas `Sent` en erreur
- Unit : logique compteur de caractères
- E2E (Playwright) : ouvrir une campagne → modifier un post → sauvegarder → vérifier le nouveau statut affiché
