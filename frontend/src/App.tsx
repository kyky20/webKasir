import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OwnerLayout } from '@/layouts/OwnerLayout';
import { EmployeeLayout } from '@/layouts/EmployeeLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { PosPage } from '@/pages/pos/PosPage';
import { TransactionsPage } from '@/pages/transactions/TransactionsPage';
import { MyTransactionsPage } from '@/pages/transactions/MyTransactionsPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { PurchasesPage } from '@/pages/purchases/PurchasesPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { EmployeesPage } from '@/pages/employees/EmployeesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ReceiptPage } from '@/pages/pos/ReceiptPage';
import { PrintReportPage } from '@/pages/reports/PrintReportPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import { DemoPage } from '@/pages/demo/DemoPage';
import { ActivityLogsPage } from '@/pages/activityLogs/ActivityLogsPage';

const PosRouteWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'employee') {
    return (
      <EmployeeLayout />
    );
  }

  return (
    <OwnerLayout />
  );
};

const DashboardRouteWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'employee') {
    return (
      <EmployeeLayout />
    );
  }

  return (
    <OwnerLayout />
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard Route (Accessible by both Owner and Employee) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['owner', 'employee']}>
                  <DashboardRouteWrapper />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* POS Route (Accessible by both Owner and Employee) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['owner', 'employee']}>
                  <PosRouteWrapper />
                </ProtectedRoute>
              }
            >
              <Route path="/pos" element={<PosPage />} />
            </Route>

            {/* Activity Logs & Notifications (Accessible by both Owner and Employee) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['owner', 'employee']}>
                  <DashboardRouteWrapper />
                </ProtectedRoute>
              }
            >
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
            </Route>

            {/* Standalone Thermal Receipt Page (Dedicated for print & receipt view) */}
            <Route
              path="/receipt/:id"
              element={
                <ProtectedRoute allowedRoles={['owner', 'employee']}>
                  <ReceiptPage />
                </ProtectedRoute>
              }
            />

            {/* Standalone Business Report Print Page (Dedicated for formal print & PDF) */}
            <Route
              path="/reports/print"
              element={
                <ProtectedRoute allowedRoles={['owner', 'employee']}>
                  <PrintReportPage />
                </ProtectedRoute>
              }
            />

            {/* Employee Only Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/my-transactions" element={<MyTransactionsPage />} />
            </Route>

            {/* Owner Only Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
