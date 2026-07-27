-- Guardrails for public.shared_plans.
--
-- The insert policy on this table is intentionally open (anon, WITH CHECK
-- true) so anyone can generate a share link without signing in. That also
-- means anyone with the public API key, which is meant to be public, it's
-- in every page load, can call the REST API directly and insert arbitrary
-- rows, bypassing the app UI entirely. There was previously no size limit on
-- any column, so a single malicious insert could dump megabytes of junk into
-- a free-tier database, or content the app's rendering path wasn't built to
-- expect.
--
-- This does not lock the table down (that would break the intended
-- no-login sharing feature), it just bounds how large a row can be, on
-- top of the client-side validation now enforced by src/lib/schema.ts.

ALTER TABLE public.shared_plans
  ADD CONSTRAINT shared_plans_goal_length CHECK (char_length(goal) <= 500);

ALTER TABLE public.shared_plans
  ADD CONSTRAINT shared_plans_pillars_size CHECK (pg_column_size(pillars) <= 20000);

ALTER TABLE public.shared_plans
  ADD CONSTRAINT shared_plans_high_impact_size CHECK (pg_column_size(high_impact) <= 5000);

ALTER TABLE public.shared_plans
  ADD CONSTRAINT shared_plans_completed_tasks_size CHECK (pg_column_size(completed_tasks) <= 5000);
