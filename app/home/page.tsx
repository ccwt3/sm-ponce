import { Suspense } from "react";

import { InventoryDashboardClient } from "@/components/inventory/InventoryDashboardClient";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { TermsAcceptanceGate } from "@/components/terms/TermsAcceptanceGate";
import { getProductsForDashboard } from "@/lib/products.server";
import {
  DEFAULT_PRODUCT_PAGE,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products.pagination";
import { AuthRequiredError } from "@/lib/server-utils";
import { TermsRequiredError } from "@/lib/terms.service";
import { redirect } from "next/navigation";
import type { ProductPage } from "@/types";

async function InventoryDashboardServer() {
  let initialError: string | null = null;
  let initialPage: ProductPage = {
    products: [],
    page: DEFAULT_PRODUCT_PAGE,
    pageSize: PRODUCT_PAGE_SIZE,
    hasNextPage: false,
  };

  try {
    initialPage = await getProductsForDashboard();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/auth/login");
    }

    if (error instanceof TermsRequiredError) {
      return <TermsAcceptanceGate />;
    }

    initialError = "Error al obtener productos";
  }

  return (
    <InventoryDashboardClient
      initialError={initialError}
      initialPage={initialPage}
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
