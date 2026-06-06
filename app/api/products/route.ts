import { NextRequest, NextResponse } from "next/server";

import {
  createProduct,
  getProductsForDashboard,
} from "@/lib/products.service";
import { errorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    const products = await getProductsForDashboard();

    return NextResponse.json({ data: products });
  } catch (error) {
    return errorResponse(error, "Error al obtener productos");
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const product = await createProduct(rawBody);

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Error al crear producto");
  }
}
