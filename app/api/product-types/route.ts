import { NextRequest, NextResponse } from "next/server";

import typesDatabase from "@/database/productTypes";
import { getCurrentUserId } from "@/lib/server-utils";

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
    const newProductType = await request.json();
    const userId = await getCurrentUserId();

    const newType = await typesDatabase.createTypeOfProduct({ newProductType, userId });

    return NextResponse.json({ data: newType });
  } catch (error) {
    console.error("Error creating product type:", error);
    return NextResponse.json(
      { error: "Error al crear tipo de producto" },
      { status: 500 },
    );
  }
}
