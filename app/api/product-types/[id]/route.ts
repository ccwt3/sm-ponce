import { getCurrentUserId } from "@/lib/server-utils";
import { NextResponse, NextRequest } from "next/server";
import productTypesDatabase from "@/database/productTypes";
import { errorResponse } from "@/lib/api-errors";
import { validateSupabaseTableId } from "@/lib/validation/ids";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const idValidation = validateSupabaseTableId(rawId);

    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 },
      );
    }

    const { id } = idValidation;
    const userId = await getCurrentUserId();

    const deleted = await productTypesDatabase.deleteTypeOfProduct(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Tipo de producto no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: `Tipo de producto con ID ${id} eliminado`,
    });
  } catch (error) {
    console.error("Error al eliminar tipo de producto:", error);
    return errorResponse(error, "Error al eliminar tipo de producto");
  }
}
