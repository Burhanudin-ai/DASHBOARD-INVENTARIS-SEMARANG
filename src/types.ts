/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Item {
  id: string;
  name: string;
  category: string;
  unit: string; // e.g. Pcs, Rim, Pack, Dus
  initialStock: number;
  classification: 'consumable' | 'asset'; // Consumable (Habis Pakai) vs Asset Tetap
}

export type TransactionType = 'in' | 'out';

export interface Transaction {
  id: string;
  itemId: string;
  type: TransactionType;
  quantity: number;
  date: string; // YYYY-MM-DD
  notes: string; // Keterangan (e.g. Pembelian, Dipakai divisi umum)
  pic?: string; // Penanggung Jawab / Penerima
}

export interface ItemSummary {
  item: Item;
  initialStock: number;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  monthlyAverageNeed: number;
  monthlyAverageIn: number;
  monthlyAverageOut: number;
}
