/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  X, 
  RotateCcw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

import { Item, Transaction, TransactionType, ItemSummary } from './types';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS } from './initialData';
import { calculateItemSummaries, getTodayDateString, getDistinctMonths } from './utils';
import { exportToExcel } from './exportUtils';

import StatsCards from './components/StatsCards';
import ItemFormModal from './components/ItemFormModal';
import TransactionFormModal from './components/TransactionFormModal';
import PrintReport from './components/PrintReport';
import AdminLoginModal from './components/AdminLoginModal';
import ConfirmModal from './components/ConfirmModal';
import { Lock, Unlock, LogOut, ShieldCheck } from 'lucide-react';

export default function App() {
  // --- Live Time and Date State ---
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, [currentTime]);

  // --- Admin Authentication State & Helpers ---
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('ga_semarang_is_admin') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string>('');

  // --- Confirmation Dialog State ---
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      ...options,
    });
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('ga_semarang_is_admin', 'true');
    showToast('Berhasil login sebagai Administrator!', 'success');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('ga_semarang_is_admin');
    showToast('Berhasil keluar dari mode Administrator.', 'info');
  };

  const requireAdmin = (reason: string, callback: () => void) => {
    if (isAdmin) {
      callback();
    } else {
      setLoginReason(reason);
      setIsAdminLoginOpen(true);
    }
  };

  // --- Core State ---
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('ga_semarang_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ga_semarang_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // --- Filtering & UI State ---
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions'>('summary');
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'consumable' | 'asset'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Generate list of distinct months from transactions
  const availableMonths = useMemo(() => {
    const months = getDistinctMonths(transactions);
    const currentMonth = new Date().toISOString().substring(0, 7);
    if (!months.includes(currentMonth)) {
      months.push(currentMonth);
    }
    return months.sort();
  }, [transactions]);

  // Handle month filter change and automatically map to startDate and endDate
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month === 'all') {
      setStartDate('');
      setEndDate('');
    } else {
      const [year, monthStr] = month.split('-');
      const lastDay = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
      setStartDate(`${month}-01`);
      setEndDate(`${month}-${String(lastDay).padStart(2, '0')}`);
    }
  };
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Modals State ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);
  const [preselectedItemId, setPreselectedItemId] = useState<string | null>(null);
  const [preselectedType, setPreselectedType] = useState<TransactionType | null>(null);

  // --- Print View Trigger State ---
  const [isPrintViewActive, setIsPrintViewActive] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('ga_semarang_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('ga_semarang_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Toast self-dismiss helper
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // --- Data Calculations ---
  
  // Calculate distinct categories currently in catalog
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => cats.add(item.category));
    return ['Semua', ...Array.from(cats)];
  }, [items]);

  // Compute item summaries dynamically (incorporates historical dating for Stok Awal/Akhir if filtered)
  const summaries = useMemo(() => {
    return calculateItemSummaries(items, transactions, startDate, endDate);
  }, [items, transactions, startDate, endDate]);

  // Total transactions currently filtered by date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isAfterStart = !startDate || tx.date >= startDate;
      const isBeforeEnd = !endDate || tx.date <= endDate;
      const item = items.find((i) => i.id === tx.itemId);
      const matchesClassification = classificationFilter === 'all' || (item && item.classification === classificationFilter);
      
      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const itemName = item ? item.name.toLowerCase() : '';
        const notes = tx.notes.toLowerCase();
        const pic = (tx.pic || '').toLowerCase();
        matchesSearch = itemName.includes(query) || notes.includes(query) || pic.includes(query);
      }

      return isAfterStart && isBeforeEnd && matchesClassification && matchesSearch;
    });
  }, [transactions, items, startDate, endDate, searchQuery, classificationFilter]);

  // Filtered summaries for the items table
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      const matchesCategory = selectedCategory === 'Semua' || s.item.category === selectedCategory;
      const matchesClassification = classificationFilter === 'all' || s.item.classification === classificationFilter;
      
      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const name = s.item.name.toLowerCase();
        const category = s.item.category.toLowerCase();
        matchesSearch = name.includes(query) || category.includes(query);
      }

      return matchesCategory && matchesClassification && matchesSearch;
    });
  }, [summaries, selectedCategory, searchQuery, classificationFilter]);

  // Calculations for Stats (Based on current period-filtered data)
  const periodTotalIn = useMemo(() => {
    return summaries.reduce((sum, s) => sum + s.totalIn, 0);
  }, [summaries]);

  const periodTotalOut = useMemo(() => {
    return summaries.reduce((sum, s) => sum + s.totalOut, 0);
  }, [summaries]);

  // Active month items movement summary
  const monthMovementSummary = useMemo(() => {
    if (selectedMonth === 'all') return null;
    
    // Filter transactions to only those in the selected month
    const monthTxs = transactions.filter(tx => tx.date.startsWith(selectedMonth));
    
    // Find item movements
    const itemMovements: { 
      itemId: string; 
      name: string; 
      unit: string;
      category: string;
      classification: string;
      monthIn: number; 
      monthOut: number;
      avgIn: number;
      avgOut: number;
      endStock: number;
    }[] = [];

    // Map each item
    items.forEach(item => {
      const itemMonthTxs = monthTxs.filter(tx => tx.itemId === item.id);
      const mIn = itemMonthTxs.filter(tx => tx.type === 'in').reduce((sum, tx) => sum + tx.quantity, 0);
      const mOut = itemMonthTxs.filter(tx => tx.type === 'out').reduce((sum, tx) => sum + tx.quantity, 0);
      
      if (mIn > 0 || mOut > 0) {
        // Find corresponding summary for average and end-of-month stock
        const s = summaries.find(x => x.item.id === item.id);
        itemMovements.push({
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          classification: item.classification,
          monthIn: mIn,
          monthOut: mOut,
          avgIn: s ? s.monthlyAverageIn : 0,
          avgOut: s ? s.monthlyAverageOut : 0,
          endStock: s ? s.currentStock : 0
        });
      }
    });

    return {
      activeItemsCount: itemMovements.length,
      movements: itemMovements,
      totalMonthIn: itemMovements.reduce((sum, m) => sum + m.monthIn, 0),
      totalMonthOut: itemMovements.reduce((sum, m) => sum + m.monthOut, 0)
    };
  }, [selectedMonth, transactions, items, summaries]);

  // --- CRUD Handlers ---
  
  // Reset application to standard original example data
  const handleResetToDefaults = () => {
    requireAdmin('Otorisasi Admin diperlukan untuk mengatur ulang seluruh data.', () => {
      triggerConfirm({
        title: 'Atur Ulang Aplikasi?',
        message: 'Apakah Anda yakin ingin mengatur ulang data aplikasi ke data contoh bawaan? Semua data transaksi Anda saat ini akan hilang secara permanen.',
        confirmText: 'Ya, Atur Ulang',
        cancelText: 'Batal',
        type: 'warning',
        onConfirm: () => {
          setItems(INITIAL_ITEMS);
          setTransactions(INITIAL_TRANSACTIONS);
          localStorage.removeItem('ga_semarang_items');
          localStorage.removeItem('ga_semarang_transactions');
          showToast('Aplikasi berhasil diatur ulang ke data contoh!', 'info');
        }
      });
    });
  };

  // Add or edit item metadata
  const handleItemSubmit = (itemData: Omit<Item, 'id'> & { id?: string }) => {
    requireAdmin('Otorisasi Admin diperlukan untuk mengubah data barang.', () => {
      if (itemData.id) {
        // Editing existing item
        setItems((prev) =>
          prev.map((i) => (i.id === itemData.id ? { ...i, ...itemData, id: itemData.id! } : i))
        );
        showToast(`Barang "${itemData.name}" berhasil diperbarui!`, 'success');
      } else {
        // Creating new item
        const newItem: Item = {
          id: `item-${Date.now()}`,
          name: itemData.name,
          category: itemData.category,
          unit: itemData.unit,
          initialStock: itemData.initialStock,
          classification: itemData.classification || 'consumable',
        };
        setItems((prev) => [...prev, newItem]);
        showToast(`Barang baru "${itemData.name}" berhasil ditambahkan!`, 'success');
      }
    });
  };

  // Delete item and its related transactions
  const handleItemDelete = (itemId: string, itemName: string) => {
    requireAdmin('Otorisasi Admin diperlukan untuk menghapus barang.', () => {
      triggerConfirm({
        title: 'Hapus Barang?',
        message: `Apakah Anda yakin ingin menghapus barang "${itemName}"? Seluruh riwayat transaksi terkait barang ini juga akan ikut terhapus secara permanen.`,
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal',
        type: 'danger',
        onConfirm: () => {
          setItems((prev) => prev.filter((i) => i.id !== itemId));
          setTransactions((prev) => prev.filter((tx) => tx.itemId !== itemId));
          showToast(`Barang "${itemName}" dan riwayat transaksinya telah dihapus!`, 'error');
        }
      });
    });
  };

  // Add or edit transaction logs
  const handleTransactionSubmit = (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    requireAdmin('Otorisasi Admin diperlukan untuk mengubah transaksi.', () => {
      if (txData.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === txData.id ? { ...t, ...txData, id: txData.id! } : t))
        );
        showToast('Transaksi berhasil diperbarui!', 'success');
      } else {
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          ...txData,
        };
        setTransactions((prev) => [newTx, ...prev]);
        showToast('Transaksi baru berhasil dicatat!', 'success');
      }
    });
  };

  // Delete specific transaction log
  const handleTransactionDelete = (txId: string) => {
    requireAdmin('Otorisasi Admin diperlukan untuk menghapus catatan transaksi.', () => {
      triggerConfirm({
        title: 'Hapus Transaksi?',
        message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini secara permanen?',
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal',
        type: 'danger',
        onConfirm: () => {
          setTransactions((prev) => prev.filter((t) => t.id !== txId));
          showToast('Catatan transaksi berhasil dihapus!', 'error');
        }
      });
    });
  };

  // Quick record transaction (+/- from items table list)
  const handleQuickTransaction = (itemId: string, type: TransactionType) => {
    const item = items.find((i) => i.id === itemId);
    const itemName = item ? item.name : 'barang';
    requireAdmin(`Otorisasi Admin diperlukan untuk mencatat stok ${type === 'in' ? 'masuk' : 'keluar'} "${itemName}".`, () => {
      setPreselectedItemId(itemId);
      setPreselectedType(type);
      setEditTx(null);
      setDuplicateTx(null);
      setIsTxModalOpen(true);
    });
  };

  // Duplicate a transaction (re-record same item, type, pic, and notes)
  const handleDuplicateTransaction = (tx: Transaction) => {
    const item = items.find((i) => i.id === tx.itemId);
    const itemName = item ? item.name : 'barang';
    requireAdmin(`Otorisasi Admin diperlukan untuk mencatat transaksi ulang "${itemName}" dari riwayat.`, () => {
      setDuplicateTx(tx);
      setEditTx(null);
      setPreselectedItemId(null);
      setPreselectedType(null);
      setIsTxModalOpen(true);
    });
  };

  // Helper triggers for opening modals from UI
  const handleOpenAddItemModal = () => {
    requireAdmin('Otorisasi Admin diperlukan untuk menambah barang baru.', () => {
      setEditItem(null);
      setIsItemModalOpen(true);
    });
  };

  const handleOpenEditItemModal = (item: Item) => {
    requireAdmin(`Otorisasi Admin diperlukan untuk mengedit barang "${item.name}".`, () => {
      setEditItem(item);
      setIsItemModalOpen(true);
    });
  };

  const handleOpenAddTxModal = () => {
    requireAdmin('Otorisasi Admin diperlukan untuk mencatat transaksi baru.', () => {
      setEditTx(null);
      setDuplicateTx(null);
      setPreselectedItemId(null);
      setPreselectedType(null);
      setIsTxModalOpen(true);
    });
  };

  const handleOpenEditTxModal = (tx: Transaction) => {
    requireAdmin('Otorisasi Admin diperlukan untuk mengedit catatan transaksi.', () => {
      setEditTx(tx);
      setDuplicateTx(null);
      setPreselectedItemId(null);
      setPreselectedType(null);
      setIsTxModalOpen(true);
    });
  };

    // --- Export Actions ---

  // Export Excel
  const handleExportExcel = () => {
    let dateFilterText = '';
    if (startDate && endDate) {
      dateFilterText = `${startDate}_sd_${endDate}`;
    } else if (startDate) {
      dateFilterText = `mulai_${startDate}`;
    } else if (endDate) {
      dateFilterText = `hingga_${endDate}`;
    }
    
    exportToExcel(summaries, transactions, dateFilterText);
    showToast('Berhasil mengunduh dokumen Excel (.xlsx)!', 'success');
  };

  // Export to PDF / Print Trigger
  const handlePrint = () => {
    setIsPrintViewActive(true);
  };

  // Wait for print layout to render, then trigger native print
  useEffect(() => {
    if (isPrintViewActive) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrintViewActive(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintViewActive]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('all');
    showToast('Filter pencarian dibersihkan.', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 selection:bg-blue-500/10 print:bg-white print:text-black">
      {/* 1. TOAST ALERTS */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-lg animate-in slide-in-from-top-4 duration-300">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1.5 p-0.5 text-gray-400 hover:text-white rounded-md transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. PRINT OVERLAY INDICATION */}
      {isPrintViewActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white print:hidden">
          <div className="bg-slate-800 p-6 rounded-2xl max-w-sm text-center border border-slate-700 shadow-2xl space-y-4">
            <Printer className="w-12 h-12 text-blue-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold">Mempersiapkan Laporan Cetak</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kami sedang memformat halaman cetak GA Semarang. Jendela sistem pencetakan browser akan segera terbuka otomatis.
            </p>
            <div className="text-[10px] bg-slate-900/60 p-3 rounded-lg text-slate-400 border border-slate-800 leading-normal text-left">
              <strong>Tips Cetak/PDF:</strong> Pada kolom <strong>Destination / Tujuan</strong> printer di browser Anda, pilih <strong>Save as PDF</strong> untuk menyimpan dalam bentuk berkas PDF digital.
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE PRINT VIEW RENDER (Invisible on screen, only visible on @media print) */}
      <PrintReport 
        summaries={summaries} 
        transactions={filteredTransactions} 
        startDate={startDate || undefined} 
        endDate={endDate || undefined} 
      />

      {/* 4. MAIN INTERACTIVE APP (Hidden during print view) */}
      <div className="flex-1 flex flex-col print:hidden" id="main-app-content">
        
        {/* TOP HERO BANNER / NAVIGATION BAR */}
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/15 border border-blue-500/20 rounded-xl">
                <Package className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">GA Semarang</h1>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">Aktif</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">Sistem Pengelolaan Stok & Keluar Masuk Barang General Affair (GA)</p>
              </div>
            </div>

            {/* LIVE DATE AND TIME BADGE */}
            <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 font-sans">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
              <div className="h-4 w-[1px] bg-white/15" />
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="whitespace-nowrap">{formattedTime} WIB</span>
              </div>
            </div>

            {/* QUICK ACTIONS & EXPORT GROUP */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
                id="btn-print"
                title="Cetak format cetak resmi"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                Cetak Laporan
              </button>
              
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
                id="btn-export-pdf"
                title="Unduh laporan dalam format PDF"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                Ekspor PDF
              </button>

              <button 
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/10 hover:shadow-lg cursor-pointer"
                id="btn-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Ekspor Excel (.xlsx)
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">
          
          {/* CONTROL SECTION: DATE FILTER & SEARCH */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="filter-section">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              
              {/* Month-based Filter Selection */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto" id="filter-month-container">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Saring Bulan:
                </div>
                
                <div className="relative">
                  <select
                    className="pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-gray-100 transition-colors cursor-pointer appearance-none"
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    id="filter-month-select"
                    title="Saring berdasarkan Bulan"
                  >
                    <option value="all">Semua Bulan</option>
                    {availableMonths.map((m) => {
                      const [year, monthStr] = m.split('-');
                      const monthNames = [
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ];
                      const name = `${monthNames[parseInt(monthStr) - 1]} ${year}`;
                      return (
                        <option key={m} value={m}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                {selectedMonth !== 'all' && (
                  <div className="bg-indigo-50 text-indigo-700 text-[10px] px-2.5 py-1 rounded-md font-bold border border-indigo-100 flex items-center gap-1">
                    Aktif: {(() => {
                      const [year, monthStr] = selectedMonth.split('-');
                      const monthNames = [
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ];
                      return `${monthNames[parseInt(monthStr) - 1]} ${year}`;
                    })()}
                  </div>
                )}
              </div>

              {/* General Search & Category Selector */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                {/* Admin Authentication Status Button */}
                {isAdmin ? (
                  <button
                    onClick={handleLogout}
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-500/20"
                    title="Logout dari Mode Administrator"
                    id="btn-admin-status"
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin: Aktif</span>
                    <LogOut className="w-3 h-3 ml-0.5 text-emerald-500/60" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLoginReason('Silakan masukkan sandi admin untuk mengaktifkan mode edit dan tambah data.');
                      setIsAdminLoginOpen(true);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/5"
                    title="Login sebagai Administrator"
                    id="btn-admin-status"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Mode: Lihat Saja</span>
                  </button>
                )}

                {/* Category Dropdown (only makes sense in Summary tab, but shown as useful preset) */}
                {activeTab === 'summary' && (
                  <select
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    id="filter-category"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        Kategori: {cat}
                      </option>
                    ))}
                  </select>
                )}

                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder={activeTab === 'summary' ? 'Cari nama barang...' : 'Cari keterangan, PIC, barang...'}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="filter-search-input"
                  />
                </div>

                {/* Reset Filters Buttons */}
                {(searchQuery || selectedCategory !== 'Semua' || startDate || endDate || classificationFilter !== 'all') && (
                  <button
                    onClick={() => {
                      handleResetFilters();
                      setClassificationFilter('all');
                    }}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors cursor-pointer"
                    title="Reset semua filter"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

            {/* Classification Filters Row */}
            <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-500" />
                  Klasifikasi Barang:
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setClassificationFilter('all')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      classificationFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    Semua ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassificationFilter('consumable')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      classificationFilter === 'consumable'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${classificationFilter === 'consumable' ? 'bg-white' : 'bg-blue-500'}`} />
                    Consumable (Habis Pakai) ({items.filter(i => i.classification !== 'asset').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassificationFilter('asset')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      classificationFilter === 'asset'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${classificationFilter === 'asset' ? 'bg-white' : 'bg-amber-500'}`} />
                    Aset Tetap ({items.filter(i => i.classification === 'asset').length})
                  </button>
                </div>
              </div>
              
              <div className="text-[11px] text-gray-400 font-medium">
                {classificationFilter === 'all' && 'Menampilkan seluruh barang consumable & aset tetap.'}
                {classificationFilter === 'consumable' && 'Menampilkan barang habis pakai (contoh: Kertas, Kopi, Tisu).'}
                {classificationFilter === 'asset' && 'Menampilkan aset/inventaris tetap kantor (contoh: Kursi, Printer).'}
              </div>
            </div>
          </section>

          {/* DYNAMIC STATISTIC PANEL */}
          <StatsCards 
            summaries={summaries} 
            totalInCount={periodTotalIn} 
            totalOutCount={periodTotalOut} 
          />

          {/* MONTH SUMMARY SECTION (visible only when filtered by month) */}
          {selectedMonth !== 'all' && monthMovementSummary && (
            <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-md mb-6" id="month-activity-summary-section">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Rangkuman Konsumsi & Distribusi Bulanan
                  </h3>
                  <h2 className="text-lg font-bold mt-1 text-slate-100">
                    Bulan: {(() => {
                      const [year, monthStr] = selectedMonth.split('-');
                      const monthNames = [
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ];
                      return `${monthNames[parseInt(monthStr) - 1]} ${year}`;
                    })()}
                  </h2>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800/60 px-3 py-1.5 rounded-xl border border-white/5">
                    Periode: <strong className="text-blue-400">{selectedMonth}-01</strong> s/d <strong className="text-blue-400">{selectedMonth}-{new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate()}</strong>
                  </span>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Barang Bergerak</div>
                  <div className="text-xl font-black text-indigo-400 mt-1">{monthMovementSummary.activeItemsCount} Item</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Memiliki transaksi masuk/keluar bulan ini</div>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Barang Masuk</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">+{monthMovementSummary.totalMonthIn}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Total pasokan kuantitas masuk bulan ini</div>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Barang Keluar (Konsumsi)</div>
                  <div className="text-xl font-black text-rose-400 mt-1">-{monthMovementSummary.totalMonthOut}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Total kuantitas habis pakai / didistribusikan</div>
                </div>
              </div>

              {/* TABLE LIST OF ITEMS WITH ACTIVITY */}
              <div className="bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Rincian Pergerakan & Rerata Konsumsi Barang</span>
                  <span className="text-[9px] text-slate-500">Menampilkan item yang aktif saja</span>
                </div>
                {monthMovementSummary.movements.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic">
                    Tidak ada transaksi masuk atau keluar yang tercatat pada bulan ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-900/10">
                          <th className="py-2.5 px-4 text-center w-12">No</th>
                          <th className="py-2.5 px-3">Nama Barang</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3 text-right text-emerald-400">Masuk Bulan Ini</th>
                          <th className="py-2.5 px-3 text-right text-rose-400">Keluar Bulan Ini</th>
                          <th className="py-2.5 px-3 text-center text-emerald-300/80">Rerata Masuk / Bln</th>
                          <th className="py-2.5 px-3 text-center text-rose-300/80">Rerata Keluar / Bln</th>
                          <th className="py-2.5 px-4 text-right text-indigo-300">Stok Akhir Bulan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {monthMovementSummary.movements.map((m, idx) => (
                          <tr key={m.itemId} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-100">{m.name}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 bg-slate-850 text-slate-300 rounded text-[9px] font-bold">
                                {m.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                              {m.monthIn > 0 ? `+${m.monthIn}` : '0'} <span className="text-[9px] text-slate-500 font-sans font-normal">{m.unit}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                              {m.monthOut > 0 ? `-${m.monthOut}` : '0'} <span className="text-[9px] text-slate-500 font-sans font-normal">{m.unit}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-300">{m.avgIn} <span className="text-[9px] text-slate-500 font-sans font-normal">/{m.unit}</span></td>
                            <td className="py-2 px-3 text-center font-mono text-slate-300">{m.avgOut} <span className="text-[9px] text-slate-500 font-sans font-normal">/{m.unit}</span></td>
                            <td className="py-2 px-4 text-right font-mono font-black text-indigo-300">{m.endStock} <span className="text-[9px] text-slate-500 font-sans font-normal">{m.unit}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* DOUBLE TABLE CONTAINER SECTION WITH TABS */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden" id="tables-container">
            
            {/* TABS SELECTOR */}
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-1 bg-gray-200/60 p-1 rounded-xl w-fit">
                <button
                  onClick={() => {
                    setActiveTab('summary');
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'summary'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  id="tab-summary"
                >
                  <Package className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Ringkasan Stok & Master Barang
                </button>
                <button
                  onClick={() => {
                    setActiveTab('transactions');
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'transactions'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  id="tab-transactions"
                >
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Rincian Transaksi per Tanggal
                </button>
              </div>

              {/* TAB SPECIFIC ADD BUTTON */}
              <div>
                {activeTab === 'summary' ? (
                  <button
                    onClick={handleOpenAddItemModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    id="btn-add-item"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Barang Baru
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditTx(null);
                      setPreselectedItemId(null);
                      setPreselectedType(null);
                      setIsTxModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    id="btn-add-tx"
                  >
                    <Plus className="w-4 h-4" />
                    Catat Transaksi Baru
                  </button>
                )}
              </div>
            </div>

            {/* TAB CONTENT: RINGKASAN STOK BARANG */}
            {activeTab === 'summary' && (
              <div className="space-y-6 pb-6">
                
                {/* QUICK DUPLICATE HISTORICAL INPUTS */}
                <div className="px-5 pt-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          ⚡ Penginputan Cepat dari Riwayat Terakhir
                        </h4>
                        <p className="text-[10.5px] text-gray-500 mt-0.5 font-medium">
                          Klik tombol <strong>"Input Lagi"</strong> pada barang yang sama (misal: plastik coin, kertas) untuk mencatat masuk/keluar baru dengan tipe, keterangan, dan PIC yang sama tanpa perlu mengetik ulang!
                        </p>
                      </div>
                    </div>
                    
                    {transactions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                        Belum ada riwayat input untuk pencatatan cepat. Silakan catat transaksi pertama Anda!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {transactions.slice(0, 4).map((tx) => {
                          const item = items.find((i) => i.id === tx.itemId);
                          if (!item) return null;
                          return (
                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black leading-none uppercase ${
                                    item.classification === 'asset'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {item.classification === 'asset' ? 'Asset' : 'Consumable'}
                                  </span>
                                  <span className="text-[9px] font-mono text-gray-400">{tx.date}</span>
                                </div>
                                <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                                  {item.name}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`text-[10px] font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {tx.type === 'in' ? 'Masuk' : 'Keluar'}: {tx.quantity} {item.unit}
                                  </span>
                                </div>
                                {tx.notes && (
                                  <p className="text-[9.5px] text-gray-500 mt-1 truncate" title={tx.notes}>
                                    Ket: {tx.notes}
                                  </p>
                                )}
                                {tx.pic && (
                                  <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">
                                    PIC: {tx.pic}
                                  </p>
                                )}
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDuplicateTransaction(tx)}
                                className="w-full py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-blue-100/50"
                              >
                                ⚡ Input Lagi (Sama)
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto" id="table-summary-container">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
                      <th className="py-3.5 px-5 text-center w-12">No</th>
                      <th className="py-3.5 px-4">Nama Barang</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4 text-center">Satuan</th>
                      <th className="py-3.5 px-4 text-right bg-slate-50/50">Stok Awal</th>
                      <th className="py-3.5 px-4 text-right text-emerald-600 bg-slate-50/50">Masuk (+)</th>
                      <th className="py-3.5 px-4 text-right text-rose-600 bg-slate-50/50">Keluar (-)</th>
                      <th className="py-3.5 px-4 text-right font-bold text-slate-800 bg-blue-50/20">Sisa Barang</th>
                      <th className="py-3.5 px-4 text-center text-emerald-700 bg-emerald-50/10 font-bold uppercase tracking-wider text-[10px]">
                        <div className="flex items-center justify-center gap-1">
                          Rerata Masuk/Bln
                          <div className="group relative cursor-help">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-[9px] p-2 rounded-lg leading-normal font-normal z-20 normal-case">
                              Rerata kuantitas barang masuk per bulan secara keseluruhan (suplai).
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center text-rose-700 bg-rose-50/10 font-bold uppercase tracking-wider text-[10px]">
                        <div className="flex items-center justify-center gap-1">
                          Rerata Keluar/Bln
                          <div className="group relative cursor-help">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-[9px] p-2 rounded-lg leading-normal font-normal z-20 normal-case">
                              Rerata kuantitas barang keluar per bulan secara keseluruhan (tingkat konsumsi).
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="py-3.5 px-5 text-center w-40">Aksi Penginputan & Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-gray-400 text-xs italic">
                          Belum ada barang terdaftar atau tidak cocok dengan pencarian kata kunci.
                        </td>
                      </tr>
                    ) : (
                      filteredSummaries.map((s, index) => {
                        const isLowStock = s.currentStock <= 3;
                        return (
                          <tr key={s.item.id} className="hover:bg-gray-50/30 transition-colors group">
                            {/* No */}
                            <td className="py-3 px-5 text-center font-mono text-xs text-gray-400">
                              {index + 1}
                            </td>
                            {/* Nama Barang */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900 text-xs">{s.item.name}</div>
                              {isLowStock && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md mt-1 border border-amber-100">
                                  <AlertCircle className="w-2.5 h-2.5" /> Stok Rendah
                                </span>
                              )}
                            </td>
                            {/* Kategori & Klasifikasi */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold w-fit">
                                  {s.item.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black w-fit leading-none ${
                                  s.item.classification === 'asset'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {s.item.classification === 'asset' ? 'Aset Tetap' : 'Consumable'}
                                </span>
                              </div>
                            </td>
                            {/* Satuan */}
                            <td className="py-3 px-4 text-center text-xs font-medium text-gray-500">
                              {s.item.unit}
                            </td>
                            {/* Stok Awal */}
                            <td className="py-3 px-4 text-right font-mono text-xs text-gray-600 bg-slate-50/30">
                              {s.initialStock}
                            </td>
                            {/* Barang Masuk */}
                            <td className="py-3 px-4 text-right font-mono text-xs font-bold text-emerald-600 bg-slate-50/30">
                              {s.totalIn > 0 ? `+${s.totalIn}` : '0'}
                            </td>
                            {/* Barang Keluar */}
                            <td className="py-3 px-4 text-right font-mono text-xs font-bold text-rose-500 bg-slate-50/30">
                              {s.totalOut > 0 ? `-${s.totalOut}` : '0'}
                            </td>
                            {/* Sisa Barang */}
                            <td className={`py-3 px-4 text-right font-mono text-xs font-black bg-blue-50/10 ${isLowStock ? 'text-amber-700 font-black' : 'text-slate-900'}`}>
                              {s.currentStock}
                            </td>
                            {/* Rerata Masuk & Keluar Bulanan */}
                            <td className="py-3 px-4 text-center font-mono text-xs text-emerald-600 font-semibold bg-emerald-50/5">
                              {s.monthlyAverageIn} <span className="text-[10px] text-gray-400 font-normal">/{s.item.unit}</span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs text-rose-600 font-semibold bg-rose-50/5">
                              {s.monthlyAverageOut} <span className="text-[10px] text-gray-400 font-normal">/{s.item.unit}</span>
                            </td>
                            {/* Actions */}
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Quick Transaction Buttons */}
                                <button
                                  onClick={() => handleQuickTransaction(s.item.id, 'in')}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-100 text-[10px] font-bold px-2 flex items-center gap-0.5 cursor-pointer"
                                  title="Catat barang masuk baru"
                                >
                                  + Masuk
                                </button>
                                <button
                                  onClick={() => handleQuickTransaction(s.item.id, 'out')}
                                  className="p-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors border border-rose-100 text-[10px] font-bold px-2 flex items-center gap-0.5 cursor-pointer"
                                  title="Catat barang keluar / didistribusikan"
                                >
                                  - Keluar
                                </button>
                                
                                {/* Edit & Delete Icons */}
                                <span className="w-px h-4 bg-gray-200 mx-1" />
                                <button
                                  onClick={() => handleOpenEditItemModal(s.item)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  title="Edit detail barang"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleItemDelete(s.item.id, s.item.name)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus barang"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            )}

            {/* TAB CONTENT: RINCIAN TRANSAKSI PER TANGGAL */}
            {activeTab === 'transactions' && (
              <div className="overflow-x-auto" id="table-transactions-container">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
                      <th className="py-3.5 px-5 text-center w-12">No</th>
                      <th className="py-3.5 px-4 w-32">Tanggal</th>
                      <th className="py-3.5 px-4">Nama Barang</th>
                      <th className="py-3.5 px-4 text-center w-36">Tipe Transaksi</th>
                      <th className="py-3.5 px-4 text-right w-24">Kuantitas</th>
                      <th className="py-3.5 px-4">Keterangan / Kebutuhan</th>
                      <th className="py-3.5 px-4 w-40">PIC / Penerima</th>
                      <th className="py-3.5 px-5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 text-xs italic">
                          Belum ada catatan transaksi keluar masuk untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, index) => {
                        const targetItem = items.find((i) => i.id === t.itemId);
                        const itemName = targetItem ? targetItem.name : 'Barang Terhapus';
                        const unit = targetItem ? targetItem.unit : '-';

                        return (
                          <tr key={t.id} className="hover:bg-gray-50/30 transition-colors group">
                            {/* No */}
                            <td className="py-3 px-5 text-center font-mono text-xs text-gray-400">
                              {index + 1}
                            </td>
                            {/* Tanggal */}
                            <td className="py-3 px-4 font-mono text-xs text-gray-600">
                              {t.date}
                            </td>
                            {/* Nama Barang */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900 text-xs">{itemName}</div>
                              {targetItem && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] text-gray-400 font-semibold">{targetItem.category}</span>
                                  <span className="text-[9px] text-gray-400">•</span>
                                  <span className={`text-[9px] font-bold ${
                                    targetItem.classification === 'asset' ? 'text-amber-600' : 'text-blue-600'
                                  }`}>
                                    {targetItem.classification === 'asset' ? 'Aset Tetap' : 'Consumable'}
                                  </span>
                                </div>
                              )}
                            </td>
                            {/* Tipe Transaksi */}
                            <td className="py-3 px-4 text-center">
                              {t.type === 'in' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                                  <ArrowUpRight className="w-3 h-3" /> Barang Masuk
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100">
                                  <ArrowDownRight className="w-3 h-3" /> Barang Keluar
                                </span>
                              )}
                            </td>
                            {/* Kuantitas */}
                            <td className={`py-3 px-4 text-right font-mono text-xs font-bold ${t.type === 'in' ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {t.type === 'in' ? '+' : '-'}{t.quantity} <span className="text-[10px] text-gray-400 font-normal">{unit}</span>
                            </td>
                            {/* Keterangan */}
                            <td className="py-3 px-4 text-xs text-gray-600 leading-relaxed max-w-xs truncate" title={t.notes}>
                              {t.notes || '-'}
                            </td>
                            {/* PIC */}
                            <td className="py-3 px-4 font-semibold text-xs text-gray-700">
                              {t.pic || '-'}
                            </td>
                            {/* Actions */}
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditTx(t);
                                    setPreselectedItemId(null);
                                    setPreselectedType(null);
                                    setIsTxModalOpen(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  title="Edit catatan transaksi"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleTransactionDelete(t.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus catatan transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* BACKUP & SEED ACTION UTILITIES (at bottom for ease of administration) */}
          <section className="bg-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200/50">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">Administrasi Data LocalStorage</p>
                <p className="text-[10px] text-slate-500">Seluruh data pencatatan Anda saat ini tersimpan otomatis di browser lokal Anda.</p>
              </div>
            </div>
            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Setel Ulang Data ke Contoh
            </button>
          </section>

        </main>

        {/* BOTTOM FOOOTER */}
        <footer className="bg-white border-t border-gray-100 py-5 text-center text-xs text-gray-400 font-medium">
          <p>© 2026 GA Semarang - Sistem Informasi Inventaris Keluar Masuk Barang</p>
        </footer>
      </div>

      {/* 5. INPUT MODALS */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        editItem={editItem}
      />

      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        items={items}
        editTransaction={editTx}
        preselectedItemId={preselectedItemId}
        preselectedType={preselectedType}
        duplicateTransaction={duplicateTx}
      />

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        reason={loginReason}
      />

      {/* CONFIRMATION DIALOG MODAL */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </div>
  );
}
