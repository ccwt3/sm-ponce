/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  /api/products/route.ts  —  Next.js Route Handler
 *
 *  📌 PUNTO DE ENTRADA SERVIDOR (el más importante)
 *  ──────────────────────────────────────────────────
 *  Este archivo es donde el servidor de Next.js habla directamente con tu DB.
 *  Aquí debes importar tu ORM o cliente de base de datos:
 *
 *  Opciones comunes:
 *    - Prisma:    import { prisma } from "@/lib/prisma"
 *    - Drizzle:   import { db } from "@/lib/drizzle"
 *    - Supabase:  import { supabase } from "@/lib/supabase"
 *    - MySQL2:    import pool from "@/lib/mysql"
 *
 *  Las líneas marcadas con  🔌  son exactamente donde conectas la DB.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import type { Product, CreateProductInput } from "@/types";
import itemsDatabase from "@/database/items";

// ─── GET /api/products ───────────────────────────────────────────────────────
export async function GET() {
  try {
    //todo Remplazar con mi query real de prisma (agregar paginacion)

    const products: Product[] = await itemsDatabase.getAllProducts();

    // respuesta que debe dar
    return NextResponse.json({ data: products });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 },
    );
  }
}

// ─── POST /api/products ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: CreateProductInput = await req.json();

    // Validación básica
    if (!body.nombre || !body.modelo) {
      return NextResponse.json(
        { error: "nombre y modelo son requeridos" },
        { status: 400 },
      );
    }

    // 🔌 REEMPLAZA ESTO con tu insert real:
    //
    //   Prisma:   const product = await prisma.product.create({ data: body })
    //   Drizzle:  const [product] = await db.insert(productsTable).values(body).returning()
    //   Supabase: const { data: product } = await supabase.from("products").insert(body).select().single()

    const product: Product = { id: "REPLACE_WITH_DB_ID", ...body }; // 👈 reemplazar

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 },
    );
  }
}
