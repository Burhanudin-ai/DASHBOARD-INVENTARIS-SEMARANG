import React from 'react';
import { Package, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { ItemSummary } from '../types';

interface StatsCardsProps {
  summaries: ItemSummary[];
  totalInCount: number;
  totalOutCount: number;
}

export default function StatsCards({
  summaries,
  totalInCount,
  totalOutCount,
}: StatsCardsProps) {
  const totalItems = summaries.length;
  const lowStockCount = summaries.filter((s) => s.currentStock <= 3).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Jenis Barang */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-total-items">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Item</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalItems}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Jenis barang terdaftar</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
      </div>

      {/* Total Barang Masuk */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-barang-masuk">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Barang Masuk</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">+{totalInCount}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Total Qty restocking</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <ArrowUpRight className="w-6 h-6" />
        </div>
      </div>

      {/* Total Barang Keluar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-barang-keluar">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Barang Keluar</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">-{totalOutCount}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Total Qty didistribusikan</p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
          <ArrowDownRight className="w-6 h-6" />
        </div>
      </div>

      {/* Alarm Stok Rendah */}
      <div 
        className={`rounded-xl border p-5 shadow-xs flex items-center justify-between transition-colors ${
          lowStockCount > 0 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-white border-gray-100 text-gray-800'
        }`}
        id="stat-stok-rendah"
      >
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Peringatan Stok</p>
          <h3 className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-800'}`}>
            {lowStockCount}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Item butuh restock (≤ 3)</p>
        </div>
        <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
