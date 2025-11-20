import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Configure from "./pages/Configure";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OrderDetail from "./pages/OrderDetail";
import StaffOrders from "./pages/staff/StaffOrders";
import AdminDiscountCodes from "./pages/admin/AdminDiscountCodes";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminDropdowns from "./pages/admin/AdminDropdowns";
import AdminJobCards from "./pages/admin/AdminJobCards";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffJobCards from "./pages/staff/StaffJobCards";
import StaffJobCardDetail from "./pages/staff/StaffJobCardDetail";
import SaleOrder from "./pages/SaleOrder";
import NotFound from "./pages/NotFound";
import { FloatingCTA } from "@/components/ui/FloatingCTA";

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
          <BrowserRouter>
            <ErrorBoundary>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/configure/:category/:productId" element={<Configure />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute requiredRole="customer">
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute requiredRole="customer">
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/sale-order/:orderId" element={
            <ProtectedRoute requiredRole="staff">
              <SaleOrder />
            </ProtectedRoute>
          } />
          <Route path="/sale-order/:orderId/:itemId" element={
            <ProtectedRoute requiredRole="staff">
              <SaleOrder />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="customer">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute requiredRole="customer">
              <OrderDetail />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requiredRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/dropdowns" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDropdowns />
            </ProtectedRoute>
          } />
          <Route path="/admin/job-cards" element={
            <ProtectedRoute requiredRole="admin">
              <AdminJobCards />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requiredRole="admin">
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/discount-codes" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDiscountCodes />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          } />
          
          {/* Staff Routes - Protected */}
          <Route path="/staff/dashboard" element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/orders" element={
            <ProtectedRoute requiredRole="staff">
              <StaffOrders />
            </ProtectedRoute>
          } />
          <Route path="/staff/job-cards" element={
            <ProtectedRoute requiredRole="staff">
              <StaffJobCards />
            </ProtectedRoute>
          } />
          <Route path="/staff/job-cards/:id" element={
            <ProtectedRoute requiredRole="staff">
              <StaffJobCardDetail />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
