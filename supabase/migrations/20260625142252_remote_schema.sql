alter table "public"."producto" drop constraint "producto_tipo_id_fkey";

CREATE UNIQUE INDEX tipo_user_tipo_normalized_unique ON public.tipo USING btree (user_id, lower(btrim(tipo_de_producto)));

alter table "public"."producto" add constraint "producto_existencia_nonnegative" CHECK ((existencia >= 0)) not valid;

alter table "public"."producto" validate constraint "producto_existencia_nonnegative";

alter table "public"."producto" add constraint "producto_medida_max_length" CHECK (((medida IS NULL) OR (length(medida) <= 80))) not valid;

alter table "public"."producto" validate constraint "producto_medida_max_length";

alter table "public"."producto" add constraint "producto_modelo_max_length" CHECK (((modelo IS NULL) OR (length(modelo) <= 120))) not valid;

alter table "public"."producto" validate constraint "producto_modelo_max_length";

alter table "public"."producto" add constraint "producto_nombre_max_length" CHECK ((length(nombre) <= 160)) not valid;

alter table "public"."producto" validate constraint "producto_nombre_max_length";

alter table "public"."producto" add constraint "producto_nombre_not_blank" CHECK ((length(btrim(nombre)) > 0)) not valid;

alter table "public"."producto" validate constraint "producto_nombre_not_blank";

alter table "public"."producto" add constraint "producto_precio_proveedor_nonnegative" CHECK ((precio_proveedor >= (0)::numeric)) not valid;

alter table "public"."producto" validate constraint "producto_precio_proveedor_nonnegative";

alter table "public"."producto" add constraint "producto_precio_publico_nonnegative" CHECK ((precio_publico >= (0)::numeric)) not valid;

alter table "public"."producto" validate constraint "producto_precio_publico_nonnegative";

alter table "public"."tipo" add constraint "tipo_nombre_max_length" CHECK ((length(tipo_de_producto) <= 80)) not valid;

alter table "public"."tipo" validate constraint "tipo_nombre_max_length";

alter table "public"."tipo" add constraint "tipo_nombre_not_blank" CHECK ((length(btrim(tipo_de_producto)) > 0)) not valid;

alter table "public"."tipo" validate constraint "tipo_nombre_not_blank";

alter table "public"."producto" add constraint "producto_tipo_id_fkey" FOREIGN KEY (tipo_id) REFERENCES public.tipo(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."producto" validate constraint "producto_tipo_id_fkey";


