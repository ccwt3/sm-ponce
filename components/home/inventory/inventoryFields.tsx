export default function InventoryFields({fields}: {fields: string[]}) {
  return (
    <tr>
      {fields.map((field) => (
        <th key={field} className="px-4 py-3 font-medium text-gray-500 text-xs">
          {field}
        </th>
      ))}
    </tr>
  )
}