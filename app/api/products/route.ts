import { NextRequest, NextResponse } from "next/server";

import {
  createProduct,
  getProductsForDashboard,
  ProductServiceError,
} from "@/lib/products.service";

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
    const product = await createProduct(rawBody);

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 },
    );
  }
}
