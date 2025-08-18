'use client';

interface Payment {
  id: number;
  userId: string;
  planId: string;
  amount: number;
  status: string;
  providerToken: string;
  createdAt: string;
}

interface DashboardStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Admin - At-Taqwa</h1>
      <p>Dashboard en cours de création...</p>
    </div>
  );
} 
 
 
 