import { NextRequest, NextResponse } from "next/server";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/products.service";
import { errorResponse } from "@/lib/api-errors";
import { validateSupabaseTableId } from "@/lib/validation/ids";

export async function GET(
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
    const product = await getProductById(id);

    return NextResponse.json({ data: product });
  } catch (error) {
    return errorResponse(error, "Error al obtener producto");
  }
}

export async function PUT(
  req: NextRequest,
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
    const rawBody = await req.json().catch(() => null);
    const product = await updateProduct(id, rawBody);

    return NextResponse.json({ data: product });
  } catch (error) {
    return errorResponse(error, "Error al actualizar producto");
  }
}

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
    const deletedId = await deleteProduct(id);

    return NextResponse.json({ data: { id: deletedId } });
  } catch (error) {
    return errorResponse(error, "Error al eliminar producto");
  }
}
