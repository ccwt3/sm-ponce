"use client";

async function handleEdit() {
  //Logica para editar el producto
  const response = await fetch("/api/items");
  const data = await response.json();
  return console.log(data.instruments);
}

function handleDelete() {
  //Logica para borrar el producto
  return console.log("borrando");
}

export default function InventoryButtons() {
  return (
    <div className="flex gap-2">
      <button
        className="text-xs border border-gray-200 rounded-md px-3 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
        onClick={handleEdit}
      >
        Editar
      </button>
      <button
        className="text-xs border border-red-200 rounded-md px-3 py-1 text-red-500 hover:bg-red-50 transition-colors"
        onClick={handleDelete}
      >
        Borrar
      </button>
    </div>
  );
}
