revoke delete on table "public"."terms_acceptance" from "anon";

revoke insert on table "public"."terms_acceptance" from "anon";

revoke references on table "public"."terms_acceptance" from "anon";

revoke select on table "public"."terms_acceptance" from "anon";

revoke trigger on table "public"."terms_acceptance" from "anon";

revoke truncate on table "public"."terms_acceptance" from "anon";

revoke update on table "public"."terms_acceptance" from "anon";

revoke delete on table "public"."terms_acceptance" from "authenticated";

revoke references on table "public"."terms_acceptance" from "authenticated";

revoke trigger on table "public"."terms_acceptance" from "authenticated";

revoke truncate on table "public"."terms_acceptance" from "authenticated";

revoke update on table "public"."terms_acceptance" from "authenticated";

alter table "public"."terms_acceptance" drop constraint "terms_acceptance_user_id_key";

drop index if exists "public"."terms_acceptance_user_id_key";

CREATE UNIQUE INDEX terms_acceptance_user_version_key ON public.terms_acceptance USING btree (user_id, terms_version);

alter table "public"."terms_acceptance" add constraint "terms_acceptance_user_version_key" UNIQUE using index "terms_acceptance_user_version_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;


