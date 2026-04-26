"use client";

import { MouseEvent } from "react";

function addProductHandler(e: MouseEvent<HTMLButtonElement>) {
  const target = e.target;
  console.log("elemento clickeado: ", target);
}

export default function InventoryHeader() {
  return (
    <div className="flex gap-2 m-1">
      <search>
        <input
          type="text"
          placeholder="Buscar"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400"
        />
      </search>

      {/*TODO add the functionality */}
      <button
        className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        onClick={addProductHandler}
      >
        Agregar
      </button>
    </div>
  );
}
