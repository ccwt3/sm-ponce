CREATE UNIQUE INDEX terms_acceptance_user_id_key ON public.terms_acceptance USING btree (user_id);

alter table "public"."terms_acceptance" add constraint "terms_acceptance_user_id_key" UNIQUE using index "terms_acceptance_user_id_key";


