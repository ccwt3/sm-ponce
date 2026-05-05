import { NextRequest, NextResponse } from "next/server";
import type { UpdateProductInput } from "@/types";
import ItemsDatabase from "@/database/items";

// ─── GET /api/products/:id ───────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const product = await ItemsDatabase.getProductById(id); // 👈 reemplazar con query real

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: product });
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

    // 🔌 Prisma:   await prisma.product.update({ where: { id }, data: body })
    // 🔌 Drizzle:  await db.update(productsTable).set(body).where(eq(productsTable.id, id))
    // 🔌 Supabase: await supabase.from("products").update(body).eq("id", id).select().single()

    console.log(body);

    const updated = await ItemsDatabase.updateProduct({ ...body, id });
    console.log(updated);

    return NextResponse.json({ data: updated });
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
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // 🔌 Prisma:   await prisma.product.delete({ where: { id } })
    // 🔌 Drizzle:  await db.delete(productsTable).where(eq(productsTable.id, id))
    // 🔌 Supabase: await supabase.from("products").delete().eq("id", id)

    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 },
    );
  }
}
