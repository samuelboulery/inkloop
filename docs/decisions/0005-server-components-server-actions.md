---
date: 2026-04-19
status: accepted
---
# ADR-0005 : Server Components et Server Actions (pas de couche API REST)

## Contexte
Next.js 15+ (App Router) permet de coloquer la logique serveur avec les composants. Une couche API REST traditionnelle (`/api/...`) est possible mais ajoute de la friction (fetch côté client, gestion d'erreurs réseau, serialization).

## Décision
- **Par défaut : Server Components.** Pas de `"use client"` sauf si interactivité strictement nécessaire.
- **Mutations via Server Actions** (`"use server"`) — pas de routes `/api/` pour les opérations CRUD internes.
- Les routes `/api/` sont réservées aux **webhooks externes** (Buffer, Hootsuite, n8n) et aux **jobs** nécessitant une URL publique.
- Accès Supabase : `createServerClient()` (server-side) ou `createClient()` (client-side). Ne jamais utiliser le service role côté browser.

## Conséquences
- ✅ Credentials sécurisées (jamais exposées côté client)
- ✅ Réduction du bundle JS client
- ✅ Typage end-to-end sans génération de code
- ⚠️ Les Server Actions ne supportent pas le streaming SSE (utiliser route handler pour ça)
- ⚠️ Revalidation après mutation : appeler `revalidatePath()` ou `revalidateTag()` dans chaque Server Action

## Erreurs à ne pas répéter
- Ne pas appeler `createServerClient()` dans un composant marqué `"use client"` — erreur runtime.
- Ne pas oublier `revalidatePath()` après une Server Action qui modifie des données affichées — sinon le cache Next.js ne se met pas à jour.
- Les Server Actions ne peuvent pas retourner des objets non-sérialisables (pas de classes, pas de Date native — utiliser ISO string).

## Références
- `src/lib/supabase/server.ts` → `createServerClient()`
- `src/lib/supabase/client.ts` → `createClient()`
- `src/features/*/server/` → toutes les server actions
- `CLAUDE.md` (contraintes)
- `node_modules/next/dist/docs/` (lire avant toute modification Next.js)
