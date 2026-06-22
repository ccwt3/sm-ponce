import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SEED_USER_ID;

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

const DELETE_PREVIOUS_DATA = true;
const PRODUCTS_TO_CREATE = 300;

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

async function createTipos() {
  console.log("Creando tipos de producto...");

  const tiposParaInsertar = tiposDeProducto.map((tipo) => ({
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

  return data;
}

async function createProductos(
  tipos: {
    id: number;
    tipo_de_producto: string;
    user_id: string;
  }[],
) {
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
      nombre: `${nombreBase} ${marca} ${index + 1}`,
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

  console.log("Usuario usado para seed:");
  console.log(userId);

  if (DELETE_PREVIOUS_DATA) {
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
