import { NextResponse, NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { deleteProductType } from "@/lib/product-types.service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deletedId = await deleteProductType(id);

    return NextResponse.json({
      message: `Tipo de producto con ID ${deletedId} eliminado`,
    });
  } catch (error) {
    console.error("Error al eliminar tipo de producto:", error);
    return errorResponse(error, "Error al eliminar tipo de producto");
  }
}
