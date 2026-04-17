---
description: Lance lint + typecheck + tests + build dans l'ordre, stop au premier échec.
---

# /verify

Cette commande vérifie que le code est prêt pour commit / PR. Exécuter dans l'ordre, s'arrêter à la **première** erreur :

1. **Lint** : `pnpm lint`
   - Si échec : montrer l'erreur et proposer un fix. Ne pas lancer les autres étapes.

2. **Typecheck** : `pnpm typecheck` (`tsc --noEmit`)
   - Si échec : résoudre les erreurs de types avant de continuer.

3. **Tests unitaires** : `pnpm test -- --run`
   - Si échec : diagnostiquer, corriger et relancer uniquement le(s) test(s) en échec.

4. **Build** : `pnpm build`
   - Si échec : analyser l'erreur Next.js et corriger.

5. **E2E** (optionnel, uniquement si demandé explicitement) : `pnpm test:e2e`

Résumer à la fin : quelles étapes sont passées, quelles ont échoué, et ce qui a été corrigé.
