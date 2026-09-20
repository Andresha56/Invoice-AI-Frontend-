export interface ClientRecord {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  address: string;
  taxId?: string; // GSTIN / VAT
}

export interface CatalogItem {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  unitPrice: number;
  unit: string;
  defaultTaxRate: number; // e.g. 18 for 18%
  hsnSacCode?: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  taxId: string; // GSTIN
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  defaultTerms: string[];
  defaultNotes: string;
}

export interface ExtractedEntities {
  clientQuery?: string;
  items: Array<{
    queryName: string;
    quantity: number;
    explicitUnitPrice?: number;
    explicitTaxRate?: number;
  }>;
  currency?: string;
  currencySymbol?: string;
  taxOverride?: number;
  discountPercentage?: number;
  dueDays?: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSacCode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  fromCatalog?: boolean;
  priceSource: "explicit_prompt" | "rag_catalog" | "default_inferred";
}

export interface InvoiceAddons {
  bankDetails?: string;
  terms?: string;
  notes?: string;
  discount?: string;
  logoBase64?: string;
  qrBase64?: string;
  stampBase64?: string;
  signature?: string;
}

export interface InferenceDetail {
  field: string;
  label: string;
  value: string | number;
  source: "explicit_prompt" | "rag_catalog" | "rag_client" | "default_inferred";
  explanation: string;
}

export interface MissingFieldInfo {
  field: string;
  label: string;
  message: string;
  quickSuggestions: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  sender: BusinessProfile;
  client: ClientRecord;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxTotal: number;
  grandTotal: number;
  amountInWords: string;
  addons: InvoiceAddons;
  notes?: string;
  terms?: string;
  inferences: InferenceDetail[];
  metadata: {
    generatedWith: "llm" | "heuristic";
    ragEnrichedItems: number;
    clientMatched: boolean;
    timestamp: string;
  };
}

export interface GenerateInvoiceRequest {
  prompt: string;
  addons?: InvoiceAddons;
  allowDefaults?: boolean;
}

export interface GenerateInvoiceResponse {
  success: boolean;
  requiresClarification?: boolean;
  missingDetails?: MissingFieldInfo[];
  data?: Invoice;
  error?: string;
}
