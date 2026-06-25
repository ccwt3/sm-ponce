drop policy "usuario edita sus productos" on "public"."producto";

drop policy "usuario ve sus productos" on "public"."producto";

revoke delete on table "public"."producto" from "anon";

revoke insert on table "public"."producto" from "anon";

revoke references on table "public"."producto" from "anon";

revoke select on table "public"."producto" from "anon";

revoke trigger on table "public"."producto" from "anon";

revoke truncate on table "public"."producto" from "anon";

revoke update on table "public"."producto" from "anon";

revoke references on table "public"."producto" from "authenticated";

revoke trigger on table "public"."producto" from "authenticated";

revoke truncate on table "public"."producto" from "authenticated";

revoke delete on table "public"."tipo" from "anon";

revoke insert on table "public"."tipo" from "anon";

revoke references on table "public"."tipo" from "anon";

revoke select on table "public"."tipo" from "anon";

revoke trigger on table "public"."tipo" from "anon";

revoke truncate on table "public"."tipo" from "anon";

revoke update on table "public"."tipo" from "anon";

revoke references on table "public"."tipo" from "authenticated";

revoke trigger on table "public"."tipo" from "authenticated";

revoke truncate on table "public"."tipo" from "authenticated";

alter table "public"."producto" drop constraint "producto_tipo_id_fkey";

CREATE UNIQUE INDEX tipo_id_user_id_unique ON public.tipo USING btree (id, user_id);

alter table "public"."producto" add constraint "producto_tipo_id_user_id_fkey" FOREIGN KEY (tipo_id, user_id) REFERENCES public.tipo(id, user_id) ON UPDATE CASCADE ON DELETE SET NULL (tipo_id) not valid;

alter table "public"."producto" validate constraint "producto_tipo_id_user_id_fkey";

alter table "public"."tipo" add constraint "tipo_id_user_id_unique" UNIQUE using index "tipo_id_user_id_unique";


  create policy "usuario edita sus productos"
  on "public"."producto"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "usuario ve sus productos"
  on "public"."producto"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



