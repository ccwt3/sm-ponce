import { NextRequest, NextResponse } from "next/server";
import type { Product, UpdateProductInput } from "@/types";
import ItemsDatabase from "@/database/items";
import typesDatabase from "@/database/productTypes";

// ─── GET /api/products/:id ───────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const product = await ItemsDatabase.getProductById(id); // 👈 reemplazar con query real

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    const productType = product.tipo_id
      ? await typesDatabase.findType(product.tipo_id)
      : null;
    const responseProduct: Product = {
      ...product,
      tipo_id: productType?.tipo_de_producto ?? product.tipo_id,
    };

    return NextResponse.json({ data: responseProduct });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 },
    );
  }
}

// ─── PUT /api/products/:id ───────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateProductInput> = await req.json();
    const productType = body.tipo_id
      ? await typesDatabase.findType(body.tipo_id)
      : null;

    if (body.tipo_id && !productType) {
      return NextResponse.json(
        { error: "Tipo de producto no encontrado" },
        { status: 400 },
      );
    }

    const updated = await ItemsDatabase.updateProduct({
      ...body,
      id,
      ...(productType ? { tipo_id: productType.id } : {}),
    });
    const responseType =
      productType ??
      (updated.tipo_id
        ? await typesDatabase.findType(updated.tipo_id)
        : null);
    const product: Product = {
      ...updated,
      tipo_id: responseType?.tipo_de_producto ?? updated.tipo_id,
    };

    return NextResponse.json({ data: product });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/products/:id ────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("Eliminando producto con ID:", id);

    const deletedId = await ItemsDatabase.deleteProduct(id);
    
    return NextResponse.json({ data: { id: deletedId } });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 },
    );
  }
}
