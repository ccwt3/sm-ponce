import { getCurrentUserId } from "@/lib/server-utils";
import { NextResponse, NextRequest } from "next/server";
import productTypesDatabase from "@/database/productTypes";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();

    await productTypesDatabase.deleteTypeOfProduct(id, userId);

    return NextResponse.json({
      message: `Tipo de producto con ID ${id} eliminado`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar tipo de producto" },
      { status: 500 },
    );
  }
}
