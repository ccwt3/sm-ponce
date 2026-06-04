import { NextRequest, NextResponse } from "next/server";
import {
  deleteProduct,
  getProductById,
  ProductServiceError,
  updateProduct,
} from "@/lib/products.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    return NextResponse.json({ data: product });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rawBody = await req.json().catch(() => null);
    const product = await updateProduct(id, rawBody);

    return NextResponse.json({ data: product });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deletedId = await deleteProduct(id);

    return NextResponse.json({ data: { id: deletedId } });
  } catch (error) {
    
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 },
    );
  }
}
