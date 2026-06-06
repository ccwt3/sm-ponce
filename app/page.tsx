import { Suspense } from "react";

import { InventoryDashboardClient } from "@/components/inventory/InventoryDashboardClient";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getProductsForDashboard } from "@/lib/products.server";
import { AuthRequiredError } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import type { Product } from "@/types";

async function InventoryDashboardServer() {
  let initialError: string | null = null;
  let initialProducts: Product[] = [];

  try {
    initialProducts = await getProductsForDashboard();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/auth/login");
    }

    initialError = "Error al obtener productos";
  }

  return (
    <InventoryDashboardClient
      initialError={initialError}
      initialProducts={initialProducts}
    />
  );
}

function InventoryDashboardFallback() {
  return (
    <main className="flex-1 p-6">
      <p className="py-12 text-center text-sm text-brand-text-muted">
        Cargando productos...
      </p>
    </main>
  );
}

export default function InventoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <Suspense fallback={<InventoryDashboardFallback />}>
        <InventoryDashboardServer />
      </Suspense>
      <Footer />
    </div>
  );
}
