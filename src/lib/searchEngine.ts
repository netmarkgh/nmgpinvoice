import { getProductCategory } from './drillDownEngine';
import { getStoredStocks } from './inventoryEngine';

export interface SearchQueryInfo {
  rawQuery: string;
  tags: {
    client?: string;
    invoice?: string;
    item?: string;
    category?: string;
    status?: string;
    payment?: string;
    phone?: string;
    salesperson?: string;
    date?: string;
    amount?: string;
    inventory?: string;
  };
  generalQuery: string;
}

export interface SearchResultMetadata {
  totalMatches: number;
  query: string;
  matchedFields: string[];
}

export interface SmartSearchEngineResult {
  results: any[];             // Filtered rows matching search
  suggestions: string[];       // Autocomplete suggestions (max 10)
  metadata: SearchResultMetadata;
}

/**
 * Intelligent keyword-based parser for query strings like client:vivian status:paid
 */
export function parseSearchQuery(query: string): SearchQueryInfo {
  const trimmed = query.trim();
  const info: SearchQueryInfo = {
    rawQuery: trimmed,
    tags: {},
    generalQuery: ''
  };

  // Matches tag:value or tag:"value with space"
  const regex = /(\w+):(?:"([^"]+)"|([^\s]+))/g;
  let match;
  let processedQuery = trimmed;

  while ((match = regex.exec(trimmed)) !== null) {
    const tag = match[1].toLowerCase();
    const value = match[2] || match[3] || '';

    const validTags = ['client', 'invoice', 'item', 'category', 'status', 'payment', 'phone', 'salesperson', 'date', 'amount', 'inventory'];
    if (validTags.includes(tag)) {
      info.tags[tag as keyof typeof info.tags] = value;
      // Remove match details from processed general query
      processedQuery = processedQuery.replace(match[0], '');
    }
  }

  info.generalQuery = processedQuery.replace(/\s+/g, ' ').trim();
  return info;
}

/**
 * Normalizes phone numbers for robust checking (e.g. removing +, spaces, dashes)
 */
function normalizePhone(num: string | null | undefined): string {
  if (!num) return '';
  return num.replace(/[^\d]/g, '');
}

/**
 * Checks if a date string matches a friendly search like 'May 22' or '2026-05-22'
 */
function matchDateFriendly(dateStr: string | null | undefined, query: string): boolean {
  if (!dateStr) return false;
  const normalizedDate = dateStr.toLowerCase();
  const q = query.toLowerCase().trim();

  if (normalizedDate.includes(q)) return true;

  // Try parsing to date for friendly month checks (e.g., "May")
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const monthName = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
      const day = d.getDate();
      const year = d.getFullYear();

      if (monthName.includes(q) || monthShort.includes(q) || String(day).includes(q) || String(year).includes(q)) {
        return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Core Search Engine Logic
 */
export function generateSmartSearchEngine(
  filteredData: any[],
  searchQuery: string,
  userId: string = 'default'
): SmartSearchEngineResult {
  if (!filteredData || !filteredData.length) {
    return { results: [], suggestions: [], metadata: { totalMatches: 0, query: searchQuery, matchedFields: [] } };
  }

  const query = searchQuery.trim();
  if (!query) {
    return { 
      results: filteredData, 
      suggestions: [], 
      metadata: { totalMatches: filteredData.length, query: '', matchedFields: [] } 
    };
  }

  const parsed = parseSearchQuery(query);
  const matchedFieldsSet = new Set<string>();

  // Fetch stocks to determine item-level inventory status
  const stocks = getStoredStocks(userId);

  // Filter Data matching parsed tags and general search query
  const results = filteredData.filter(r => {
    const itemDesc = (r.description || '').trim();
    const invoice = r.invoices || {};
    const clientName = (invoice.client_name || r.client || r.customerName || 'Unknown Client').trim();
    const clientPhone = invoice.client_phone || r.phone || r.mobile || '';
    const invoiceNo = invoice.inv_number || r.invoiceRef || r.invoiceNo || '';
    const reference = invoice.reference || '';
    const categoryName = getProductCategory(itemDesc);
    const salesperson = invoice.user_id ? `UserID (${invoice.user_id.substring(0, 5)})` : 'Staff Admin';
    const payMethod = invoice.pay_method || '';
    const payStatus = invoice.status || 'draft';
    const invoiceDate = invoice.inv_date || invoice.created_at || r.createdAt || '';
    const amount = r.amount || 0;
    const notes = invoice.note || '';

    // Calculate inventory status
    const stockQuantity = stocks[itemDesc] !== undefined ? stocks[itemDesc] : 100; // default 100
    const qtySold = r.quantity || 0;
    const remaining = stockQuantity - qtySold;
    let inventoryStatus = 'healthy';
    if (remaining < 0) inventoryStatus = 'oversold';
    else if (remaining === 0) inventoryStatus = 'critical';
    else if (remaining <= 10) inventoryStatus = 'low stock';

    // 1. Tag Filtering Safeguard
    // If any specified tag fails to match, the whole record is discarded
    const { tags } = parsed;

    if (tags.client && !clientName.toLowerCase().includes(tags.client.toLowerCase())) return false;
    if (tags.invoice && !invoiceNo.toLowerCase().includes(tags.invoice.toLowerCase()) && !reference.toLowerCase().includes(tags.invoice.toLowerCase())) return false;
    if (tags.item && !itemDesc.toLowerCase().includes(tags.item.toLowerCase())) return false;
    if (tags.category && !categoryName.toLowerCase().includes(tags.category.toLowerCase())) return false;
    if (tags.status && !payStatus.toLowerCase().includes(tags.status.toLowerCase())) return false;
    if (tags.payment && !payMethod.toLowerCase().includes(tags.payment.toLowerCase())) return false;
    if (tags.phone && !normalizePhone(clientPhone).includes(normalizePhone(tags.phone))) return false;
    if (tags.salesperson && !salesperson.toLowerCase().includes(tags.salesperson.toLowerCase())) return false;
    if (tags.date && !matchDateFriendly(invoiceDate, tags.date)) return false;
    if (tags.amount && !String(amount).includes(tags.amount) && !String(invoice.total || '').includes(tags.amount)) return false;
    if (tags.inventory && !inventoryStatus.toLowerCase().includes(tags.inventory.toLowerCase())) return false;

    // Track which tag fields matched
    Object.keys(tags).forEach(k => matchedFieldsSet.add(k));

    // 2. General Query Match (Or pattern across remaining search)
    if (parsed.generalQuery) {
      const gq = parsed.generalQuery.toLowerCase();
      
      const matchClient = clientName.toLowerCase().includes(gq);
      const matchInvoice = invoiceNo.toLowerCase().includes(gq) || reference.toLowerCase().includes(gq);
      const matchItem = itemDesc.toLowerCase().includes(gq);
      const matchCategory = categoryName.toLowerCase().includes(gq);
      const matchPhone = normalizePhone(clientPhone).includes(normalizePhone(gq));
      const matchSalesperson = salesperson.toLowerCase().includes(gq);
      const matchPayMethod = payMethod.toLowerCase().includes(gq);
      const matchPayStatus = payStatus.toLowerCase().includes(gq);
      const matchDate = matchDateFriendly(invoiceDate, gq);
      const matchAmount = String(amount).includes(gq) || String(invoice.total || '').includes(gq);
      const matchNotes = notes.toLowerCase().includes(gq);
      const matchInventory = inventoryStatus.toLowerCase().includes(gq);

      if (matchClient) matchedFieldsSet.add('client');
      if (matchInvoice) matchedFieldsSet.add('invoice');
      if (matchItem) matchedFieldsSet.add('item');
      if (matchCategory) matchedFieldsSet.add('category');
      if (matchPhone) matchedFieldsSet.add('phone');
      if (matchSalesperson) matchedFieldsSet.add('salesperson');
      if (matchPayMethod) matchedFieldsSet.add('payment');
      if (matchPayStatus) matchedFieldsSet.add('status');
      if (matchDate) matchedFieldsSet.add('date');
      if (matchAmount) matchedFieldsSet.add('amount');
      if (matchNotes) matchedFieldsSet.add('note');
      if (matchInventory) matchedFieldsSet.add('inventory');

      const passGeneral = (
        matchClient || matchInvoice || matchItem || matchCategory ||
        matchPhone || matchSalesperson || matchPayMethod || matchPayStatus ||
        matchDate || matchAmount || matchNotes || matchInventory
      );

      return passGeneral;
    }

    return true;
  });

  // 3. Autocomplete Search Suggestions Generator
  const suggestions = generateSearchSuggestions(filteredData, query, userId);

  return {
    results,
    suggestions,
    metadata: {
      totalMatches: results.length,
      query: searchQuery,
      matchedFields: Array.from(matchedFieldsSet)
    }
  };
}

/**
 * Autocomplete Generator to yield smart matching suggestions
 */
export function generateSearchSuggestions(
  filteredData: any[],
  query: string,
  userId: string = 'default'
): string[] {
  if (!query || query.includes(':')) return [];

  const q = query.toLowerCase().trim();
  const suggestionsSet = new Set<string>();

  const stocks = getStoredStocks(userId);

  for (const r of filteredData) {
    if (suggestionsSet.size >= 10) break;

    const itemDesc = (r.description || '').trim();
    const invoice = r.invoices || {};
    const clientName = (invoice.client_name || r.client || r.customerName || 'Unknown Client').trim();
    const invoiceNo = invoice.inv_number || r.invoiceRef || r.invoiceNo || '';
    const categoryName = getProductCategory(itemDesc);

    // Matching Client
    if (clientName.toLowerCase().startsWith(q) || clientName.toLowerCase().includes(' ' + q)) {
      suggestionsSet.add(clientName);
    }
    // Matching Item Product
    if (itemDesc.toLowerCase().startsWith(q) || itemDesc.toLowerCase().includes(' ' + q)) {
      suggestionsSet.add(itemDesc);
    }
    // Matching Invoice ID
    if (invoiceNo.toLowerCase().startsWith(q)) {
      suggestionsSet.add(invoiceNo);
    }
    // Matching Category
    if (categoryName.toLowerCase().startsWith(q)) {
      suggestionsSet.add(categoryName);
    }
  }

  // Fallback default suggestions for empty/short queries or tags
  if (suggestionsSet.size === 0) {
    const defaultTags = ['client:', 'invoice:', 'item:', 'category:', 'status:', 'payment:', 'phone:', 'salesperson:', 'date:', 'amount:', 'inventory:'];
    defaultTags.forEach(tag => {
      if (tag.startsWith(q)) {
        suggestionsSet.add(tag);
      }
    });
  }

  return Array.from(suggestionsSet).slice(0, 10);
}
