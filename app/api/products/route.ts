import { NextRequest, NextResponse } from "next/server";

import itemsDatabase from "@/database/items";
import typesDatabase from "@/database/productTypes";
import { getProductsForDashboard } from "@/lib/products.server";
import { getCurrentUserId } from "@/lib/server-utils";
import { validateCreateProductInput } from "@/lib/validation/products";
import type { Product } from "@/types";

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
    const rawBody = await req.json().catch(() => null);
    const validation = validateCreateProductInput(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const body = validation.data;
    const userId = await getCurrentUserId();

    const productType = await typesDatabase.findType(body.tipo_id, userId);
    if (!productType) {
      return NextResponse.json(
        { error: "Tipo de producto no encontrado" },
        { status: 400 },
      );
    }

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
