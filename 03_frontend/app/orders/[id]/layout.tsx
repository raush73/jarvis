"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Order Context Layout
 * 
 * Enforces order-scoped routing for all /orders/[id]/* routes.
 * Ensures navigation stays within order context and handles invalid routes.
 * 
 * UI Shell only — no data fetching, no permissions, no backend.
 */

// Valid sub-routes within order context (matching OrderNav tabs)
const VALID_ORDER_SUBROUTES = [
  "", // Overview at /orders/[id]
  "vetting",
  "dispatch-order",
  "time",
  "invoicing",
  "documents",
  "recruiting", // Legacy redirect handled by its own page
];

export default function OrderContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const orderId = params?.id as string;

  useEffect(() => {
    // Extract the sub-route from the current pathname
    const basePath = `/orders/${orderId}`;
    const remainingPath = pathname.replace(basePath, "").replace(/^\//, "");
    
    // Get the first segment of the remaining path (the sub-route)
    const subRoute = remainingPath.split("/")[0] || "";
    
    // Check if the sub-route is valid
    const isValidRoute = VALID_ORDER_SUBROUTES.includes(subRoute);
    
    // If invalid route, redirect to order overview
    if (!isValidRoute && orderId) {
      router.replace(`/orders/${orderId}`);
    }
  }, [pathname, orderId, router]);

  return <>{children}</>;
}

