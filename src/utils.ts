import { Item, Transaction, ItemSummary } from './types';

// Helper to format Date to YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get all distinct months (YYYY-MM) from transactions
export function getDistinctMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.date) {
      months.add(tx.date.substring(0, 7)); // Get YYYY-MM
    }
  });
  return Array.from(months).sort();
}

// Count number of months between earliest and latest transaction, minimum 1
export function getActiveMonthsCount(transactions: Transaction[]): number {
  if (transactions.length === 0) return 1;
  const months = getDistinctMonths(transactions);
  return Math.max(1, months.length);
}

/**
 * Calculates item summaries.
 * Supports date filtering.
 * If startDate and endDate are provided, it dynamically calculates:
 * - Stok Awal: originalInitialStock + (ins before startDate) - (outs before startDate)
 * - Barang Masuk: total ins in [startDate, endDate]
 * - Barang Keluar: total outs in [startDate, endDate]
 * - Sisa Barang: Stok Awal + Barang Masuk - Barang Keluar
 */
export function calculateItemSummaries(
  items: Item[],
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): ItemSummary[] {
  // Get overall distinct months for average consumption calculation
  const totalMonths = getActiveMonthsCount(transactions);

  return items.map((item) => {
    let initialStock = item.initialStock;
    let totalIn = 0;
    let totalOut = 0;

    // Filter transactions for this specific item
    const itemTxs = transactions.filter((tx) => tx.itemId === item.id);

    if (startDate || endDate) {
      // 1. Calculate stock level BEFORE the start date (running balance)
      let stockBeforePeriod = item.initialStock;
      
      itemTxs.forEach((tx) => {
        if (startDate && tx.date < startDate) {
          if (tx.type === 'in') {
            stockBeforePeriod += tx.quantity;
          } else {
            stockBeforePeriod -= tx.quantity;
          }
        }
      });

      initialStock = stockBeforePeriod;

      // 2. Sum transactions inside the period
      itemTxs.forEach((tx) => {
        const isAfterStart = !startDate || tx.date >= startDate;
        const isBeforeEnd = !endDate || tx.date <= endDate;

        if (isAfterStart && isBeforeEnd) {
          if (tx.type === 'in') {
            totalIn += tx.quantity;
          } else {
            totalOut += tx.quantity;
          }
        }
      });
    } else {
      // No date filter - standard overall calculation
      itemTxs.forEach((tx) => {
        if (tx.type === 'in') {
          totalIn += tx.quantity;
        } else {
          totalOut += tx.quantity;
        }
      });
    }

    const currentStock = initialStock + totalIn - totalOut;

    // Rata-rata Kebutuhan Bulanan (based on OUT transactions)
    // We calculate total outgoing of this item divided by the active months
    const totalOutOverall = itemTxs
      .filter((tx) => tx.type === 'out')
      .reduce((sum, tx) => sum + tx.quantity, 0);
    
    const totalInOverall = itemTxs
      .filter((tx) => tx.type === 'in')
      .reduce((sum, tx) => sum + tx.quantity, 0);
    
    const monthlyAverageNeed = Number((totalOutOverall / totalMonths).toFixed(2));
    const monthlyAverageIn = Number((totalInOverall / totalMonths).toFixed(2));
    const monthlyAverageOut = Number((totalOutOverall / totalMonths).toFixed(2));

    return {
      item,
      initialStock,
      totalIn,
      totalOut,
      currentStock,
      monthlyAverageNeed,
      monthlyAverageIn,
      monthlyAverageOut,
    };
  });
}
