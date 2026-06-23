import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SEED_USER_ID;
const shouldDeletePreviousData =
  process.env.SEED_DELETE_PREVIOUS_DATA === "true";
const hasDeleteConfirmation = process.env.CONFIRM_SEED_DELETE === "true";
const isProduction = process.env.NODE_ENV === "production";
const seedRunId = Date.now().toString(36);

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
}

if (!serviceRoleKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

if (!userId) {
  throw new Error("Falta SEED_USER_ID en .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const PRODUCTS_TO_CREATE = 300;

interface SeedProductType {
  id: number;
  tipo_de_producto: string;
  user_id: string;
}

const tiposDeProducto = [
  "Aceites",
  "Llantas",
  "Cámaras",
  "Bujías",
  "Filtros",
  "Cadenas",
  "Balatas",
  "Baterías",
  "Espejos",
  "Faros",
  "Amortiguadores",
  "Manubrios",
  "Cables",
  "Chicotes",
  "Cascos",
];

const nombresBase = [
  "Aceite 4T",
  "Aceite sintético",
  "Llanta delantera",
  "Llanta trasera",
  "Cámara reforzada",
  "Bujía estándar",
  "Bujía iridium",
  "Filtro de aire",
  "Filtro de aceite",
  "Cadena reforzada",
  "Kit de arrastre",
  "Balatas delanteras",
  "Balatas traseras",
  "Batería seca",
  "Batería de gel",
  "Espejo izquierdo",
  "Espejo derecho",
  "Faro delantero",
  "Direccional delantera",
  "Direccional trasera",
  "Amortiguador trasero",
  "Manubrio universal",
  "Chicote de clutch",
  "Chicote de acelerador",
  "Cable de freno",
  "Casco abatible",
  "Casco integral",
];

const marcas = [
  "Italika",
  "Honda",
  "Yamaha",
  "Suzuki",
  "Bajaj",
  "Vento",
  "Dinamo",
  "Carabela",
  "Kurazai",
  "Veloci",
  "TVS",
  "Hero",
];

const modelos = [
  "FT150",
  "FT125",
  "DM200",
  "DM150",
  "AT110",
  "Cargo 150",
  "GL150",
  "XR150",
  "YBR125",
  "FZ16",
  "GN125",
  "Pulsar NS200",
  "Boxer 150",
  "Rocketman 250",
  "Universal",
];

const medidas = [
  "Universal",
  "CH",
  "M",
  "G",
  "12V",
  "90/90-18",
  "80/90-17",
  "2.75-18",
  "3.00-17",
  "428H",
  "520H",
  "10W-40",
  "20W-50",
  "1L",
  "500ml",
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function assertDeleteIsAllowed() {
  if (!shouldDeletePreviousData) {
    return;
  }

  if (isProduction) {
    throw new Error(
      "Seed destructivo bloqueado: NODE_ENV=production no permite borrar datos",
    );
  }

  if (!hasDeleteConfirmation) {
    throw new Error(
      "Seed destructivo bloqueado: define CONFIRM_SEED_DELETE=true para borrar datos existentes",
    );
  }
}

function productName(nombreBase: string, marca: string, index: number): string {
  const sequence = index + 1;

  if (shouldDeletePreviousData) {
    return `${nombreBase} ${marca} ${sequence}`;
  }

  return `${nombreBase} ${marca} ${seedRunId}-${sequence}`;
}

async function deletePreviousData() {
  console.log("Borrando productos anteriores del usuario...");

  const { error: productosError } = await supabase
    .from("producto")
    .delete()
    .eq("user_id", userId);

  if (productosError) {
    console.error(productosError);
    throw new Error("Error borrando productos anteriores");
  }

  console.log("Borrando tipos anteriores del usuario...");

  const { error: tiposError } = await supabase
    .from("tipo")
    .delete()
    .eq("user_id", userId);

  if (tiposError) {
    console.error(tiposError);
    throw new Error("Error borrando tipos anteriores");
  }
}

async function getExistingTipos(): Promise<SeedProductType[]> {
  const { data, error } = await supabase
    .from("tipo")
    .select("id, tipo_de_producto, user_id")
    .eq("user_id", userId)
    .in("tipo_de_producto", tiposDeProducto);

  if (error) {
    console.error(error);
    throw new Error("Error consultando tipos de producto existentes");
  }

  return data ?? [];
}

function existingTypeByName(types: SeedProductType[]) {
  return new Map(types.map((type) => [type.tipo_de_producto, type]));
}

async function createTipos() {
  console.log("Preparando tipos de producto...");

  const tiposPorNombre = existingTypeByName(await getExistingTipos());
  const tiposFaltantes = tiposDeProducto.filter(
    (tipo) => !tiposPorNombre.has(tipo),
  );

  if (tiposFaltantes.length === 0) {
    console.log("Todos los tipos base ya existen para el usuario.");
    return tiposDeProducto.map((tipo) => tiposPorNombre.get(tipo)!);
  }

  console.log(`Creando tipos faltantes: ${tiposFaltantes.length}`);

  const tiposParaInsertar = tiposFaltantes.map((tipo) => ({
    tipo_de_producto: tipo,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("tipo")
    .insert(tiposParaInsertar)
    .select("id, tipo_de_producto, user_id");

  if (error) {
    console.error(error);
    throw new Error("Error creando tipos de producto");
  }

  if (!data || data.length === 0) {
    throw new Error("No se crearon tipos de producto");
  }

  console.log(`Tipos creados: ${data.length}`);

  data.forEach((type) => tiposPorNombre.set(type.tipo_de_producto, type));

  return tiposDeProducto.map((tipo) => tiposPorNombre.get(tipo)!);
}

async function createProductos(tipos: SeedProductType[]) {
  console.log(`Creando ${PRODUCTS_TO_CREATE} productos...`);

  const productos = Array.from({ length: PRODUCTS_TO_CREATE }, (_, index) => {
    const precioProveedor = randomPrice(35, 1200);
    const ganancia = randomPrice(1.25, 1.65);
    const precioPublico = Number((precioProveedor * ganancia).toFixed(2));

    const nombreBase = randomItem(nombresBase);
    const marca = randomItem(marcas);
    const modelo = randomItem(modelos);
    const medida = randomItem(medidas);
    const tipo = randomItem(tipos);

    return {
      nombre: productName(nombreBase, marca, index),
      modelo,
      medida,
      tipo_id: tipo.id,
      existencia: randomNumber(0, 100),
      precio_proveedor: precioProveedor,
      precio_publico: precioPublico,
      user_id: userId,
    };
  });

  const { error } = await supabase.from("producto").insert(productos);

  if (error) {
    console.error(error);
    throw new Error("Error creando productos");
  }

  console.log(`Productos creados: ${productos.length}`);
}

async function main() {
  console.log("Iniciando seed...");

  console.log("Usuario objetivo del seed:");
  console.log(userId);
  console.log(
    `Modo destructivo: ${shouldDeletePreviousData ? "activado" : "desactivado"}`,
  );

  assertDeleteIsAllowed();

  if (shouldDeletePreviousData) {
    await deletePreviousData();
  }

  const tipos = await createTipos();

  await createProductos(tipos);

  console.log("Seed completado correctamente.");
}

main().catch((error) => {
  console.error("Seed falló:");
  console.error(error);
  process.exit(1);
});
