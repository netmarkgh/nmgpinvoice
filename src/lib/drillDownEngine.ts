export interface TransactionDetailRow {
  invoiceNo: string;
  date: string;
  clientName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  salesPerson: string;
  category: string;
}

export interface DrillDownSummary {
  totalTransactions: number;
  totalQty: number;
  totalRevenue: number;
  averagePrice: number;
}

/**
 * Categorizes product descriptions into realistic segments for rich reporting
 */
export function getProductCategory(description: string): string {
  const desc = (description || '').toLowerCase();
  if (desc.includes('cap') && !desc.includes('capsule')) return 'Accessories';
  if (desc.includes('glass') || desc.includes('bottle') || desc.includes('jar')) return 'Packaging';
  if (desc.includes('yog') || desc.includes('vanilla') || desc.includes('strawberry')) return 'Dairy Product';
  if (desc.includes('capsule') || desc.includes('pill') || desc.includes('supplement')) return 'Supplements';
  if (desc.includes('drink') || desc.includes('water') || desc.includes('juice')) return 'Beverages';
  return 'General Merchandise';
}

/**
 * Processes filtered user sales records to extract matching transaction rows.
 * Null-safe, case-insensitive, and robust.
 */
export function generateDrilldownDetails(
  filteredData: any[],
  type: 'item' | 'client' | 'category',
  targetValue: string
): TransactionDetailRow[] {
  if (!filteredData || !targetValue) return [];

  const target = targetValue.trim().toLowerCase();
  const rows: TransactionDetailRow[] = [];

  filteredData.forEach(r => {
    const itemDesc = (r.description || '').trim();
    const invoice = r.invoices || {};
    const clientName = (invoice.client_name || r.client || r.customerName || 'Unknown Client').trim();
    const categoryName = getProductCategory(itemDesc);

    let isMatch = false;

    if (type === 'item') {
      isMatch = itemDesc.toLowerCase() === target;
    } else if (type === 'client') {
      isMatch = clientName.toLowerCase() === target;
    } else if (type === 'category') {
      isMatch = categoryName.toLowerCase() === target;
    }

    if (isMatch) {
      // Formulate transactional row
      rows.push({
        invoiceNo: invoice.inv_number || 'N/A',
        date: invoice.inv_date || invoice.created_at || r.createdAt || 'N/A',
        clientName,
        itemName: itemDesc,
        quantity: r.quantity || 0,
        unitPrice: r.unit_price || 0,
        lineTotal: r.amount || 0,
        salesPerson: invoice.user_id ? `UserID (${invoice.user_id.substring(0, 5)})` : 'Staff Admin',
        category: categoryName
      });
    }
  });

  return rows;
}

/**
 * Computes top level aggregates inside the drill-down summary headers.
 */
export function calculateDrilldownSummary(rows: TransactionDetailRow[]): DrillDownSummary {
  const totalTransactions = rows.length;
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.lineTotal, 0);
  const averagePrice = totalQty > 0 ? totalRevenue / totalQty : 0;

  return {
    totalTransactions,
    totalQty,
    totalRevenue,
    averagePrice
  };
}
