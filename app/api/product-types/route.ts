import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import {
  createProductType,
  getProductTypes,
} from "@/lib/product-types.service";

export async function GET() {
  try {
    const types = await getProductTypes();

    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Error al obtener tipos de producto:", error);

    return errorResponse(error, "Error al obtener tipos de productos");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const newType = await createProductType(rawBody);

    return NextResponse.json({ data: newType });
  } catch (error) {
    console.error("Error al crear tipo de producto:", error);
    return errorResponse(error, "Error al crear tipo de producto");
  }
}
