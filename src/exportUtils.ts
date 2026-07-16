import * as XLSX from 'xlsx';
import { ItemSummary, Transaction } from './types';

export function exportToExcel(
  summaries: ItemSummary[],
  transactions: Transaction[],
  dateFilterText: string = ''
) {
  // 1. Map Summaries to beautiful Indonesian columns
  const summaryRows = summaries.map((s, index) => ({
    'No': index + 1,
    'Nama Barang': s.item.name,
    'Kategori': s.item.category,
    'Satuan': s.item.unit,
    'Stok Awal': s.initialStock,
    'Barang Masuk (Total)': s.totalIn,
    'Barang Keluar (Total)': s.totalOut,
    'Sisa Barang (Stok Akhir)': s.currentStock,
    'Rata-rata Kebutuhan Bulanan': s.monthlyAverageNeed,
  }));

  // 2. Map Transactions to beautiful Indonesian columns
  // Sort transactions by date descending
  const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const transactionRows = sortedTxs.map((t, index) => {
    const itemSummary = summaries.find((s) => s.item.id === t.itemId);
    const itemName = itemSummary ? itemSummary.item.name : 'Barang Terhapus';
    const unit = itemSummary ? itemSummary.item.unit : '-';
    
    return {
      'No': index + 1,
      'Tanggal': t.date,
      'Nama Barang': itemName,
      'Tipe Transaksi': t.type === 'in' ? 'Barang Masuk' : 'Barang Keluar',
      'Jumlah (Qty)': t.quantity,
      'Satuan': unit,
      'Keterangan': t.notes || '-',
      'Penanggung Jawab / PIC': t.pic || '-',
    };
  });

  // Create workbook and worksheets
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Ringkasan Stok
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  // Adjust column widths
  const summaryCols = [
    { wch: 5 },  // No
    { wch: 35 }, // Nama Barang
    { wch: 20 }, // Kategori
    { wch: 10 }, // Satuan
    { wch: 12 }, // Stok Awal
    { wch: 20 }, // Barang Masuk
    { wch: 20 }, // Barang Keluar
    { wch: 22 }, // Sisa Barang
    { wch: 26 }, // Rata-rata Kebutuhan Bulanan
  ];
  wsSummary['!cols'] = summaryCols;
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Stok');

  // Sheet 2: Detail Transaksi
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  // Adjust column widths
  const txCols = [
    { wch: 5 },  // No
    { wch: 15 }, // Tanggal
    { wch: 35 }, // Nama Barang
    { wch: 18 }, // Tipe Transaksi
    { wch: 12 }, // Jumlah
    { wch: 10 }, // Satuan
    { wch: 30 }, // Keterangan
    { wch: 25 }, // PIC
  ];
  wsTransactions['!cols'] = txCols;
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Detail Transaksi Keluar Masuk');

  // Generate filename with date
  const today = new Date().toISOString().slice(0, 10);
  const filterSuffix = dateFilterText ? `_${dateFilterText.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `Laporan_GA_Semarang_${today}${filterSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
