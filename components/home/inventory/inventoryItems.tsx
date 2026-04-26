import InventoryButtons from "./inventoryButtons";

export default function InventoryItems({ productos }: { productos: any[] }) {
  const badge = (existencia: number) => {
    if (existencia === 0)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
          0
        </span>
      );
    if (existencia < 5)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-medium">
          {existencia}
        </span>
      );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">
        {existencia}
      </span>
    );
  };

  return (
    <>
      {productos.map((p) => (
        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
          <td className="px-4 py-3 text-gray-500">{p.modelo}</td>
          <td className="px-4 py-3 text-gray-500">{p.medida}</td>
          <td className="px-4 py-3 text-gray-500">{p.tipo}</td>
          <td className="px-4 py-3">{badge(p.existencia)}</td>
          <td className="px-4 py-3 text-gray-700">
            ${p.precioProveedor.toLocaleString()}
          </td>
          <td className="px-4 py-3 text-gray-700">
            ${p.precioPublico.toLocaleString()}
          </td>
          <td className="px-4 py-3">
            <InventoryButtons />
          </td>
        </tr>
      ))}
    </>
  );
}
