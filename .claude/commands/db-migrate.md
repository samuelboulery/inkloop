---
description: Créer une nouvelle migration Supabase et regénérer les types TypeScript.
---

# /db-migrate

Flow pour toute modification du schéma Supabase.

**Arguments attendus** : nom descriptif de la migration (ex. `add_charter_rules_table`).

## Étapes

1. **Vérifier l'état** :
   ```bash
   pnpm supabase status
   ```
   Confirmer que Supabase local tourne. Sinon : `pnpm supabase start`.

2. **Créer la migration** :
   ```bash
   pnpm supabase migration new <nom>
   ```
   Ouvrir le fichier généré sous `supabase/migrations/` et y ajouter le SQL.

3. **Appliquer localement** :
   ```bash
   pnpm supabase db reset
   ```
   (Reset complet + rejoue toutes les migrations + seeds.)

4. **Vérifier RLS** : toute nouvelle table DOIT avoir :
   - `ALTER TABLE <nom> ENABLE ROW LEVEL SECURITY;`
   - Au moins une `CREATE POLICY` scopée sur `workspace_id`.

5. **Regénérer les types** :
   ```bash
   pnpm supabase gen types typescript --local > types/supabase.ts
   ```

6. **Commit** :
   ```
   feat(db): <description courte>
   ```
   Inclure : le fichier de migration + `types/supabase.ts` mis à jour.

## Contraintes

- **Jamais** modifier une migration déjà mergée sur `main` — créer une nouvelle migration à la place.
- **Jamais** activer une table sans RLS.
- **Jamais** `DROP` une colonne/table sans stratégie de rollback documentée.
