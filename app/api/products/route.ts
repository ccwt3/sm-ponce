import { NextRequest, NextResponse } from "next/server";

import itemsDatabase from "@/database/items";
import typesDatabase from "@/database/productTypes";
import { getProductsForDashboard } from "@/lib/products.server";
import { getCurrentUserId } from "@/lib/server-utils";
import type { CreateProductInput, Product } from "@/types";

export async function GET() {
  try {
    const products = await getProductsForDashboard();

    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateProductInput = await req.json();

    if (!body.nombre || !body.modelo) {
      return NextResponse.json(
        { error: "nombre y modelo son requeridos" },
        { status: 400 },
      );
    }

    const productType = await typesDatabase.findType(body.tipo_id);
    if (!productType) {
      return NextResponse.json(
        { error: "Tipo de producto no encontrado" },
        { status: 400 },
      );
    }

    const userId = await getCurrentUserId();
    const backedProduct = await itemsDatabase.createProduct({
      ...body,
      user_id: userId,
      tipo_id: productType.id,
    });

    const product: Product = {
      id: backedProduct.id,
      ...body,
      tipo_id: productType.tipo_de_producto,
      user_id: userId,
    };

    return NextResponse.json({ data: product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 },
    );
  }
}
