import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText } from 'lucide-react';
import { Item, Transaction, TransactionType } from '../types';
import { getTodayDateString } from '../utils';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (txData: Omit<Transaction, 'id'> & { id?: string }) => void;
  items: Item[];
  editTransaction: Transaction | null;
  preselectedItemId: string | null;
  preselectedType: TransactionType | null;
  duplicateTransaction?: Transaction | null;
}

const COMMON_NOTES_IN = ['Pembelian rutin supplier', 'Restocking inventaris', 'Sisa pengembalian acara', 'Donasi / Hibah'];
const COMMON_NOTES_OUT = ['Kebutuhan rutin pantry staff', 'Permintaan operasional divisi', 'Kebutuhan ruang rapat tamu', 'Kegiatan bulanan GA', 'Pembersihan & maintenance'];

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  items,
  editTransaction,
  preselectedItemId,
  preselectedType,
  duplicateTransaction,
}: TransactionFormModalProps) {
  const [itemId, setItemId] = useState('');
  const [type, setType] = useState<TransactionType>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [pic, setPic] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Synchronize state when open/edit changes
  useEffect(() => {
    setItemSearchQuery('');
    if (editTransaction) {
      setItemId(editTransaction.itemId);
      setType(editTransaction.type);
      setQuantity(editTransaction.quantity);
      setDate(editTransaction.date);
      setNotes(editTransaction.notes);
      setPic(editTransaction.pic || '');
    } else if (duplicateTransaction) {
      setItemId(duplicateTransaction.itemId);
      setType(duplicateTransaction.type);
      setQuantity(duplicateTransaction.quantity);
      setDate(getTodayDateString()); // default to today
      setNotes(duplicateTransaction.notes);
      setPic(duplicateTransaction.pic || '');
    } else {
      // Default / preselected mode
      setItemId(preselectedItemId || (items.length > 0 ? items[0].id : ''));
      setType(preselectedType || 'in');
      setQuantity(1);
      setDate(getTodayDateString());
      setNotes('');
      setPic('');
    }
  }, [editTransaction, duplicateTransaction, isOpen, preselectedItemId, preselectedType, items]);

  if (!isOpen) return null;

  // Filter items based on itemSearchQuery
  const filteredSelectItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(itemSearchQuery.toLowerCase());
    const isSelected = item.id === itemId;
    return matchesSearch || isSelected;
  });

  const selectedItem = items.find((i) => i.id === itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      alert('Silakan pilih barang terlebih dahulu.');
      return;
    }
    if (quantity <= 0) {
      alert('Jumlah barang harus lebih besar dari 0.');
      return;
    }

    onSubmit({
      id: editTransaction?.id,
      itemId,
      type,
      quantity: Number(quantity),
      date,
      notes: notes.trim(),
      pic: pic.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" id="transaction-form-modal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {editTransaction ? 'Edit Transaksi' : 'Catat Barang Masuk/Keluar'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipe Transaksi (Segmented Control) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Jenis Transaksi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  type === 'in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                id="btn-tx-type-in"
              >
                <span className={`w-2 h-2 rounded-full ${type === 'in' ? 'bg-white' : 'bg-emerald-500'}`} />
                Barang Masuk
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  type === 'out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                id="btn-tx-type-out"
              >
                <span className={`w-2 h-2 rounded-full ${type === 'out' ? 'bg-white' : 'bg-rose-500'}`} />
                Barang Keluar
              </button>
            </div>
          </div>

          {/* Pilih Barang */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Pilih Barang <span className="text-red-500">*</span>
            </label>
            
            {/* Search filter input inside modal */}
            {!editTransaction && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Ketik nama/kategori untuk menyaring..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-semibold"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  id="input-modal-search-item"
                />
              </div>
            )}

            <select
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              required
              disabled={!!editTransaction} // Disable editing the item during update to avoid core logic conflicts
              id="select-tx-item"
            >
              <option value="" disabled>-- Pilih Barang --</option>
              {filteredSelectItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit}) - {item.category}
                </option>
              ))}
            </select>
            {editTransaction && (
              <p className="text-[10px] text-gray-400 mt-1">Guna menjaga integritas riwayat, barang transaksi terpilih dikunci.</p>
            )}
          </div>

          {/* Jumlah & Tanggal */}
          <div className="grid grid-cols-2 gap-4">
            {/* Jumlah */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  id="input-tx-qty"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium select-none">
                  {selectedItem?.unit || 'Qty'}
                </span>
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-4 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  id="input-tx-date"
                />
              </div>
            </div>
          </div>

          {/* PIC */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Penanggung Jawab / Penerima (PIC)
            </label>
            <input
              type="text"
              placeholder="Contoh: Santi (HR), Budi (GA), dll."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              id="input-tx-pic"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Keterangan
            </label>
            <textarea
              placeholder="Berikan keterangan tambahan jika diperlukan..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm h-16 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="input-tx-notes"
            />
            
            {/* Shortcut templates */}
            <div className="mt-2">
              <p className="text-[10px] text-gray-400 mb-1.5">Rekomendasi cepat:</p>
              <div className="flex flex-wrap gap-1.5">
                {(type === 'in' ? COMMON_NOTES_IN : COMMON_NOTES_OUT).map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setNotes(note)}
                    className="text-[10px] px-2.5 py-1 bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors font-medium border border-gray-200/50"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 text-white rounded-xl font-semibold shadow-md transition-all text-sm ${
                type === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10 hover:shadow-emerald-500/15'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10 hover:shadow-rose-500/15'
              }`}
            >
              {editTransaction ? 'Simpan Perubahan' : type === 'in' ? 'Simpan Barang Masuk' : 'Simpan Barang Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
