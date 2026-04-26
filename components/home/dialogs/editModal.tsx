export default function FormModal() {
  return (
    <dialog open={false} className="editModal p-3">
      <h2 className="asd text-2xl font-bold mb-4 ">Editar Producto</h2>

      <form className="flex flex-col flex-wrap items-center">
        <div className="dialogItem">
          <label
            htmlFor="name"
            className="block text-sm font-medium"
          >
            Nombre del Producto:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="mt-1 text-black p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </form>
    </dialog>
  );
}
