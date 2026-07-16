import React from 'react';
import { ItemSummary, Transaction } from '../types';

interface PrintReportProps {
  summaries: ItemSummary[];
  transactions: Transaction[];
  startDate?: string;
  endDate?: string;
}

export default function PrintReport({
  summaries,
  transactions,
  startDate,
  endDate,
}: PrintReportProps) {
  // Sort transactions by date ascending for official logs
  const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Formatted date string
  const getPeriodString = () => {
    if (startDate && endDate) {
      return `${formatIndonesianDate(startDate)} s.d. ${formatIndonesianDate(endDate)}`;
    } else if (startDate) {
      return `Mulai ${formatIndonesianDate(startDate)}`;
    } else if (endDate) {
      return `Hingga ${formatIndonesianDate(endDate)}`;
    }
    return 'Semua Periode';
  };

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
    } catch {
      return dateStr;
    }
  };

  const printDate = formatIndonesianDate(new Date().toISOString().substring(0, 10));

  return (
    <div className="bg-white text-black p-8 font-serif text-xs max-w-5xl mx-auto hidden print:block" id="print-report-layout">
      {/* Header Laporan */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">GA SEMARANG</h1>
        <h2 className="text-md font-semibold tracking-wide text-gray-700 uppercase mt-0.5">SISTEM PENCATATAN KELUAR MASUK BARANG INVENTARIS</h2>
        <p className="text-xs text-gray-500 mt-1 italic font-sans">
          Kantor Cabang Semarang • Tanggal Cetak: {printDate}
        </p>
        <div className="mt-2 text-sm font-sans font-semibold bg-gray-100 py-1.5 px-4 rounded-md inline-block">
          Periode Laporan: {getPeriodString()}
        </div>
      </div>

      {/* BAB I: RINGKASAN STOK BARANG */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase font-sans border-b border-black pb-1 mb-3">
          I. Ringkasan & Kalkulasi Stok Barang
        </h3>
        <table className="w-full border-collapse border border-black text-left font-sans text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
              <th className="border border-black px-2 py-1.5">Nama Barang</th>
              <th className="border border-black px-2 py-1.5">Kategori</th>
              <th className="border border-black px-2 py-1.5 text-center w-14">Satuan</th>
              <th className="border border-black px-2 py-1.5 text-center w-16">Stok Awal</th>
              <th className="border border-black px-2 py-1.5 text-center w-16">Barang Masuk</th>
              <th className="border border-black px-2 py-1.5 text-center w-16">Barang Keluar</th>
              <th className="border border-black px-2 py-1.5 text-center w-16">Sisa Barang</th>
              <th className="border border-black px-2 py-1.5 text-center w-20">Rerata Kebutuhan / Bln</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, index) => (
              <tr key={s.item.id} className="even:bg-gray-50/50">
                <td className="border border-black px-2 py-1 text-center font-mono">{index + 1}</td>
                <td className="border border-black px-2 py-1 font-semibold">{s.item.name}</td>
                <td className="border border-black px-2 py-1 text-gray-600">{s.item.category}</td>
                <td className="border border-black px-2 py-1 text-center">{s.item.unit}</td>
                <td className="border border-black px-2 py-1 text-center font-mono">{s.initialStock}</td>
                <td className="border border-black px-2 py-1 text-center text-emerald-700 font-mono">+{s.totalIn}</td>
                <td className="border border-black px-2 py-1 text-center text-rose-700 font-mono">-{s.totalOut}</td>
                <td className="border border-black px-2 py-1 text-center font-bold font-mono">{s.currentStock}</td>
                <td className="border border-black px-2 py-1 text-center font-mono">{s.monthlyAverageNeed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BAB II: RINCIAN TRANSAKSI */}
      <div className="mb-8 page-break-before">
        <h3 className="text-sm font-bold uppercase font-sans border-b border-black pb-1 mb-3">
          II. Rincian Historis Transaksi Keluar Masuk Barang
        </h3>
        {sortedTransactions.length === 0 ? (
          <p className="text-gray-500 italic font-sans text-center py-4 border border-dashed border-black">
            Tidak ada pencatatan transaksi masuk/keluar untuk periode ini.
          </p>
        ) : (
          <table className="w-full border-collapse border border-black text-left font-sans text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
                <th className="border border-black px-2 py-1.5 w-24">Tanggal</th>
                <th className="border border-black px-2 py-1.5">Nama Barang</th>
                <th className="border border-black px-2 py-1.5 text-center w-24">Tipe</th>
                <th className="border border-black px-2 py-1.5 text-center w-14">Jumlah</th>
                <th className="border border-black px-2 py-1.5">Keterangan / Kebutuhan</th>
                <th className="border border-black px-2 py-1.5 w-24">PIC / Penerima</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t, index) => {
                const itemSummary = summaries.find((s) => s.item.id === t.itemId);
                const itemName = itemSummary ? itemSummary.item.name : 'Barang Terhapus';
                const unit = itemSummary ? itemSummary.item.unit : '-';

                return (
                  <tr key={t.id} className="even:bg-gray-50/50">
                    <td className="border border-black px-2 py-1 text-center font-mono">{index + 1}</td>
                    <td className="border border-black px-2 py-1 text-center font-mono">{t.date}</td>
                    <td className="border border-black px-2 py-1">{itemName}</td>
                    <td className="border border-black px-2 py-1 text-center font-semibold">
                      {t.type === 'in' ? (
                        <span className="text-emerald-700">[+] Barang Masuk</span>
                      ) : (
                        <span className="text-rose-700">[-] Barang Keluar</span>
                      )}
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-bold font-mono">
                      {t.quantity} {unit}
                    </td>
                    <td className="border border-black px-2 py-1 text-gray-700">{t.notes || '-'}</td>
                    <td className="border border-black px-2 py-1 font-semibold">{t.pic || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* BAB III: VERIFIKASI & TANDA TANGAN */}
      <div className="mt-12 grid grid-cols-2 gap-8 text-center font-sans" style={{ pageBreakInside: 'avoid' }}>
        <div>
          <p className="font-semibold text-gray-500 mb-14">Dibuat & Dilaporkan Oleh,</p>
          <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
            GA Officer Semarang
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">General Affair (GA)</p>
        </div>
        <div>
          <p className="font-semibold text-gray-500 mb-14">Disetujui & Diverifikasi Oleh,</p>
          <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
            GA Manager / Supervisor
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">General Affair Head</p>
        </div>
      </div>
    </div>
  );
}
