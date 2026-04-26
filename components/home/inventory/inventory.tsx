import InventoryHeader from "./inventoryHeader";
import InventoryFields from "./inventoryFields";
import InventoryItems from "./inventoryItems";

export default function Inventory() {
  //todo Estos elementos estan simulando las llamadas de la API
  const productos = [
    {
      id: 1,
      nombre: "Cámara de seguridad",
      modelo: "CS-400X",
      medida: '1/2"',
      tipo: "Domo",
      existencia: 12,
      precioProveedor: 850,
      precioPublico: 1200,
    },
    {
      id: 2,
      nombre: "Cable UTP Cat6",
      modelo: "UTP-C6",
      medida: "305m",
      tipo: "Red",
      existencia: 3,
      precioProveedor: 420,
      precioPublico: 680,
    },
    {
      id: 3,
      nombre: "Switch 8 puertos",
      modelo: "SW-8P",
      medida: "—",
      tipo: "Red",
      existencia: 0,
      precioProveedor: 310,
      precioPublico: 520,
    },
    {
      id: 4,
      nombre: "DVR 8 canales",
      modelo: "DVR-8CH",
      medida: "—",
      tipo: "Grabador",
      existencia: 7,
      precioProveedor: 1100,
      precioPublico: 1800,
    },
    {
      id: 5,
      nombre: "Fuente de poder 12V",
      modelo: "FP-12V5A",
      medida: "5A",
      tipo: "Eléctrico",
      existencia: 2,
      precioProveedor: 95,
      precioPublico: 160,
    },
  ];

  const fields = [
    "Nombre",
    "Modelo",
    "Medida",
    "Tipo",
    "Existencia",
    "Precio proveedor",
    "Precio público",
    "Acciones",
  ];

  //? To show this on the main page, we will be paginating the database
  //? Each 20 items will be a page, we only will be fetching 20 items
  //?

  return (
    <div className="p-4">
      <InventoryHeader />

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <InventoryFields fields={fields} />
          </thead>
          <tbody className="divide-y divide-gray-100">
            <InventoryItems productos={productos} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
