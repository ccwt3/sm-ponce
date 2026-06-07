import { NextRequest, NextResponse } from "next/server";

import {
  createProduct,
  getProductsForDashboard,
} from "@/lib/products.service";
import { errorResponse } from "@/lib/api-errors";
import { parseProductPage } from "@/lib/products.pagination";
import { parseProductSearch } from "@/lib/products.search";

export async function GET(req: NextRequest) {
  try {
    const page = parseProductPage(req.nextUrl.searchParams.get("page"));
    const search = parseProductSearch(req.nextUrl.searchParams.get("q"));

    if (page === null || search === null) {
      return NextResponse.json(
        { error: "Parametros de busqueda invalidos" },
        { status: 400 },
      );
    }

    const productPage = await getProductsForDashboard({ page, search });

    return NextResponse.json({ data: productPage });
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
