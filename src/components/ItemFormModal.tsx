import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Item } from '../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Omit<Item, 'id'> & { id?: string }) => void;
  editItem: Item | null;
}

const CATEGORIES = [
  'Alat Tulis Kantor',
  'Pantry / Konsumsi',
  'Alat & Bahan Kebersihan',
  'Alat Kesehatan (P3K)',
  'Fasilitas & Listrik',
  'Umum & Lainnya'
];

const UNITS = [
  'Pcs',
  'Rim',
  'Lusin',
  'Pack',
  'Kotak',
  'Kg',
  'Botol',
  'Pouch',
  'Roll',
  'Unit'
];

export default function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  editItem,
}: ItemFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState(UNITS[0]);
  const [initialStock, setInitialStock] = useState(0);
  const [classification, setClassification] = useState<'consumable' | 'asset'>('consumable');

  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setClassification(editItem.classification || 'consumable');
      
      if (CATEGORIES.includes(editItem.category)) {
        setCategory(editItem.category);
        setIsCustomCategory(false);
      } else {
        setCategory('custom');
        setCustomCategory(editItem.category);
        setIsCustomCategory(true);
      }

      if (UNITS.includes(editItem.unit)) {
        setUnit(editItem.unit);
        setIsCustomUnit(false);
      } else {
        setUnit('custom');
        setCustomUnit(editItem.unit);
        setIsCustomUnit(true);
      }

      setInitialStock(editItem.initialStock);
    } else {
      // Reset form
      setName('');
      setCategory(CATEGORIES[0]);
      setUnit(UNITS[0]);
      setInitialStock(0);
      setClassification('consumable');
      setCustomCategory('');
      setIsCustomCategory(false);
      setCustomUnit('');
      setIsCustomUnit(false);
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    const finalUnit = isCustomUnit ? customUnit.trim() : unit;

    if (!finalCategory) {
      alert('Kategori tidak boleh kosong');
      return;
    }
    if (!finalUnit) {
      alert('Satuan tidak boleh kosong');
      return;
    }

    onSubmit({
      id: editItem?.id,
      name: name.trim(),
      category: finalCategory,
      unit: finalUnit,
      initialStock: Number(initialStock),
      classification,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" id="item-form-modal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {editItem ? 'Edit Barang' : 'Tambah Barang Baru'}
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
          {/* Nama Barang */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kertas A4, Kopi, Tisu, dll."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="input-item-name"
            />
          </div>

          {/* Klasifikasi Barang */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Klasifikasi Barang <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setClassification('consumable')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  classification === 'consumable'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
                id="btn-class-consumable"
              >
                Consumable (Habis Pakai)
              </button>
              <button
                type="button"
                onClick={() => setClassification('asset')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  classification === 'asset'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
                id="btn-class-asset"
              >
                Aset Tetap
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Kategori Barang <span className="text-red-500">*</span>
            </label>
            {!isCustomCategory ? (
              <div className="flex gap-2">
                <select
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  id="select-item-category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="custom">+ Tulis Kategori Kustom</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan Kategori Kustom"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    id="input-custom-category"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCategory(CATEGORIES[0]);
                    }}
                    className="px-3 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Satuan & Stok Awal */}
          <div className="grid grid-cols-2 gap-4">
            {/* Satuan */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Satuan <span className="text-red-500">*</span>
              </label>
              {!isCustomUnit ? (
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={unit}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomUnit(true);
                    } else {
                      setUnit(e.target.value);
                    }
                  }}
                  id="select-item-unit"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="custom">+ Kustom</option>
                </select>
              ) : (
                <div className="flex gap-1.5 flex-col">
                  <input
                    type="text"
                    required
                    placeholder="Lainnya"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    id="input-custom-unit"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      setUnit(UNITS[0]);
                    }}
                    className="text-left text-[10px] text-blue-600 hover:underline"
                  >
                    Gunakan daftar preset
                  </button>
                </div>
              )}
            </div>

            {/* Stok Awal */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Stok Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={initialStock}
                onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                id="input-item-initial-stock"
                disabled={!!editItem} // Stok awal tidak dapat diedit langsung karena mengacaukan riwayat, disarankan menggunakan penyesuaian transaksi barang masuk/keluar
              />
              {editItem && (
                <p className="text-[10px] text-gray-400 mt-1">Stok awal dikunci. Gunakan catat transaksi jika ingin merubah stok.</p>
              )}
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
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all text-sm"
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
