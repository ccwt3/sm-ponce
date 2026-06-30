drop policy "usuario elimina sus productos" on "public"."producto";


  create table "public"."terms_acceptance" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "terms_version" character varying(50) not null,
    "accepted_at" timestamp with time zone default now(),
    "ip_address" inet
      );


alter table "public"."terms_acceptance" enable row level security;

CREATE UNIQUE INDEX terms_acceptance_pkey ON public.terms_acceptance USING btree (id);

alter table "public"."terms_acceptance" add constraint "terms_acceptance_pkey" PRIMARY KEY using index "terms_acceptance_pkey";

alter table "public"."terms_acceptance" add constraint "terms_acceptance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."terms_acceptance" validate constraint "terms_acceptance_user_id_fkey";

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

grant delete on table "public"."terms_acceptance" to "anon";

grant insert on table "public"."terms_acceptance" to "anon";

grant references on table "public"."terms_acceptance" to "anon";

grant select on table "public"."terms_acceptance" to "anon";

grant trigger on table "public"."terms_acceptance" to "anon";

grant truncate on table "public"."terms_acceptance" to "anon";

grant update on table "public"."terms_acceptance" to "anon";

grant delete on table "public"."terms_acceptance" to "authenticated";

grant insert on table "public"."terms_acceptance" to "authenticated";

grant references on table "public"."terms_acceptance" to "authenticated";

grant select on table "public"."terms_acceptance" to "authenticated";

grant trigger on table "public"."terms_acceptance" to "authenticated";

grant truncate on table "public"."terms_acceptance" to "authenticated";

grant update on table "public"."terms_acceptance" to "authenticated";

grant delete on table "public"."terms_acceptance" to "service_role";

grant insert on table "public"."terms_acceptance" to "service_role";

grant references on table "public"."terms_acceptance" to "service_role";

grant select on table "public"."terms_acceptance" to "service_role";

grant trigger on table "public"."terms_acceptance" to "service_role";

grant truncate on table "public"."terms_acceptance" to "service_role";

grant update on table "public"."terms_acceptance" to "service_role";


  create policy "Users can insert their own terms acceptance"
  on "public"."terms_acceptance"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can view their own terms acceptance"
  on "public"."terms_acceptance"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "usuario elimina sus productos"
  on "public"."producto"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



