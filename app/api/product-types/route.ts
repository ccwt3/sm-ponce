import { NextRequest, NextResponse } from "next/server";

import typesDatabase from "@/database/productTypes";
import { errorResponse } from "@/lib/api-errors";
import { getCurrentUserId } from "@/lib/server-utils";
import { validateProductTypeInput } from "@/lib/validation/productTypes";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const types = await typesDatabase.getAllTypesOfProducts(userId);

    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Error al obtener tipos de producto:", error);

    return errorResponse(error, "Error al obtener tipos de productos");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const validation = validateProductTypeInput(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const newProductType = validation.data;
    const userId = await getCurrentUserId();
    const existingType = await typesDatabase.findType(newProductType, userId);

    if (existingType) {
      return NextResponse.json({ data: existingType });
    }

    const newType = await typesDatabase.createTypeOfProduct({
      newProductType,
      userId,
    });

    return NextResponse.json({ data: newType });
  } catch (error) {
    console.error("Error al crear tipo de producto:", error);
    return errorResponse(error, "Error al crear tipo de producto");
  }
}
