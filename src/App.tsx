import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FloatingCTA } from "@/components/ui/FloatingCTA";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOrderOTP from "./pages/VerifyOrderOTP";
import NotFound from "./pages/NotFound";


// Lazy load non-critical pages for better initial load performance
const Products = lazy(() => import("./pages/Products"));
const Configure = lazy(() => import("./pages/Configure"));
const ConfigureByHash = lazy(() => import("./pages/ConfigureByHash"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const SaleOrder = lazy(() => import("./pages/SaleOrder"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminDropdowns = lazy(() => import("./pages/admin/AdminDropdowns"));
const AdminJobCards = lazy(() => import("./pages/admin/AdminJobCards"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDiscountCodes = lazy(() => import("./pages/admin/AdminDiscountCodes"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Lazy load staff pages
const StaffDashboard = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffOrders = lazy(() => import("./pages/staff/StaffOrders"));
const StaffSaleOrders = lazy(() => import("./pages/staff/StaffSaleOrders"));
const StaffSaleOrderDetail = lazy(() => import("./pages/staff/StaffSaleOrderDetail"));
const StaffOrderDetail = lazy(() => import("./pages/staff/StaffOrderDetail"));
const StaffJobCards = lazy(() => import("./pages/staff/StaffJobCards"));
const StaffJobCardDetail = lazy(() => import("./pages/staff/StaffJobCardDetail"));

// Lazy load order confirmation and payment pages
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));

// Lazy load production pages
const ProductionJobCard = lazy(() => import("./pages/production/ProductionJobCard"));

// Configure QueryClient with optimized performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced retries for faster failure
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: true,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased cache time
      gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data longer
      structuralSharing: true, // Enable structural sharing for better performance
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Products />
                    </Suspense>
                  } />
                  <Route path="/configure/:category/:productId" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Configure />
                    </Suspense>
                  } />
                  <Route path="/c/:hash" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ConfigureByHash />
                    </Suspense>
                  } />
                  <Route path="/cart" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Cart />
                    </Suspense>
                  } />
                  <Route path="/checkout" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="customer">
                        <Checkout />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/orders" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="customer">
                        <Orders />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/sale-order/:orderId" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <SaleOrder />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/sale-order/:orderId/:itemId" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <SaleOrder />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-order/:id" element={<VerifyOrderOTP />} />
                  <Route path="/dashboard" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="customer">
                        <Dashboard />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/orders/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="customer">
                        <OrderDetail />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/order-confirmation/:saleOrderId" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="customer">
                        <OrderConfirmation />
                      </ProtectedRoute>
                    </Suspense>
                  } />

                  {/* Admin Routes - Protected */}
                  <Route path="/admin/dashboard" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/products" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminProducts />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/dropdowns" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminDropdowns />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/job-cards" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminJobCards />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/orders" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminOrders />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/users" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminUsers />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/discount-codes" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminDiscountCodes />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/admin/settings" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="admin">
                        <AdminSettings />
                      </ProtectedRoute>
                    </Suspense>
                  } />

                  {/* Staff Routes - Protected */}
                  <Route path="/staff/dashboard" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffDashboard />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/orders" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffOrders />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/orders/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffOrderDetail />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/sale-orders" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffSaleOrders />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/sale-orders/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffSaleOrderDetail />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/job-cards" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffJobCards />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/staff/job-cards/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute requiredRole="staff">
                        <StaffJobCardDetail />
                      </ProtectedRoute>
                    </Suspense>
                  } />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="/production/job-card/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProductionJobCard />
                    </Suspense>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                {/* Floating CTA - only on customer-facing pages */}
                <FloatingCTA />
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
