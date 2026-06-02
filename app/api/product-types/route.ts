import { NextRequest, NextResponse } from "next/server";

import typesDatabase from "@/database/productTypes";
import { getCurrentUserId } from "@/lib/server-utils";
import { validateProductTypeInput } from "@/lib/validation/productTypes";

export async function GET() {
  try {
    const types = await typesDatabase.getAllTypesOfProducts();
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Error fetching product types:", error);

    return NextResponse.json(
      { error: "Error al obtener tipos de productos" },
      { status: 500 },
    );
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
    console.error("Error creating product type:", error);
    return NextResponse.json(
      { error: "Error al crear tipo de producto" },
      { status: 500 },
    );
  }
}
