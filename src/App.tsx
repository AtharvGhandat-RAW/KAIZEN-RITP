import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CACHE_TIME, STALE_TIME } from "@/lib/cache";

// Home page loaded eagerly so intro shows immediately
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Refund = lazy(() => import("./pages/Refund"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Events = lazy(() => import("./pages/admin/Events"));
const Registrations = lazy(() => import("./pages/admin/Registrations"));
const RegistrationDetails = lazy(() => import("./pages/admin/RegistrationDetails"));
const Queries = lazy(() => import("./pages/admin/Queries"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Register = lazy(() => import("./pages/Register"));

import { MaintenanceGuard } from "@/components/MaintenanceGuard";

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.MEDIUM, // 1 minute
      gcTime: CACHE_TIME.LONG, // 30 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Enable background refetching
      refetchOnMount: 'always',
      // Network mode for better offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-red-500/60">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Performance monitoring and optimizations */}
        <PerformanceOptimizer />
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <MaintenanceGuard>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/register" element={<Register />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/events" element={<Events />} />
                <Route path="/admin/registrations" element={<Registrations />} />
                <Route path="/admin/registrations/:id" element={<RegistrationDetails />} />
                <Route path="/admin/queries" element={<Queries />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<Settings />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;