import { useState, type FC } from "react";
import type { Invoice } from "@/types/invoice";
import {
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
  FileText,
  ShieldCheck,
  CreditCard,
  QrCode as QrIcon,
} from "lucide-react";

interface RightPanelProps {
  invoice: Invoice | null;
  isGenerating: boolean;
  onClear: () => void;
}

export const RightPanel: FC<RightPanelProps> = ({
  invoice,
  isGenerating,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);
  const [showInferences, setShowInferences] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJson = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(JSON.stringify(invoice, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Loading State
  if (isGenerating) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Generating Invoice with AI & RAG...
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Extracting prompt entities, querying client directory and service
          catalog, and computing exact tax mathematics.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Extracting entities with minimal LLM
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            Enriching from Local RAG Knowledge Store
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Compiling pixel-perfect printable layout
          </span>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!invoice) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Live Invoice Preview
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Enter your invoice prompt on the left and click{" "}
          <span className="font-semibold text-slate-700">
            "Generate Invoice"
          </span>{" "}
          to see the live preview here.
        </p>

        <div className="mt-8 grid w-full max-w-sm gap-3 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <Sparkles className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Lightweight Intent Extraction
              </p>
              <p className="text-[11px] text-slate-500">
                Understands quantities, taxes, currencies, and due dates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <Building2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                RAG Knowledge Retrieval
              </p>
              <p className="text-[11px] text-slate-500">
                Auto-links client tax IDs and catalog standard rates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                100% Deterministic Math
              </p>
              <p className="text-[11px] text-slate-500">
                All subtotals, GST, and totals verified by pure calculation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rendered Active Invoice View
  const logo = invoice.addons?.logoBase64;
  const qr = invoice.addons?.qrBase64;
  const stamp = invoice.addons?.stampBase64;

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            RAG Enriched
          </span>
          {invoice.metadata?.generatedWith === "llm" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
              <Sparkles className="h-3 w-3" />
              Gemini 3.6 Flash (AI)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              ⚡ Heuristic Engine
            </span>
          )}
          <span className="text-xs text-slate-500">
            {invoice.metadata?.clientMatched
              ? "Client verified"
              : "Ad-hoc client"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied JSON
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy JSON
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Inference Transparency & Telemetry Panel */}
      {invoice.inferences && invoice.inferences.length > 0 && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-4 print:hidden shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                i
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Inference Transparency & Audit
                </h4>
                <p className="text-[10px] text-slate-500">
                  Shows which details were stated in your prompt vs. enriched by
                  RAG or defaulted.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInferences(!showInferences)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {showInferences ? "Hide Details" : "Show Details"}
            </button>
          </div>

          {showInferences && (
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs pt-2 border-t border-indigo-100">
              {invoice.inferences.map((inf) => {
                let badgeClass = "bg-amber-100 text-amber-800 border-amber-200";
                let badgeText = "Default Inferred";

                if (inf.source === "explicit_prompt") {
                  badgeClass =
                    "bg-emerald-100 text-emerald-800 border-emerald-200";
                  badgeText = "Explicit in Prompt";
                } else if (inf.source === "rag_catalog") {
                  badgeClass =
                    "bg-indigo-100 text-indigo-800 border-indigo-200";
                  badgeText = "Catalog Standard Rate";
                } else if (inf.source === "rag_client") {
                  badgeClass = "bg-teal-100 text-teal-800 border-teal-200";
                  badgeText = "Directory Verified";
                }

                return (
                  <div
                    key={inf.field}
                    className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {inf.label}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-900 font-semibold">
                      {inf.value}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                      {inf.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* The Printable Invoice Document */}
      <div
        id="invoice-document"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 text-slate-800 print:border-none print:shadow-none print:p-0"
      >
        {/* Header: Company & Logo */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            {logo ? (
              <img
                src={logo}
                alt="Company Logo"
                className="h-14 w-14 object-contain rounded-lg border border-slate-100"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
                {invoice.sender.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {invoice.sender.name}
              </h2>
              <p className="text-xs text-slate-500">{invoice.sender.tagline}</p>
              <p className="mt-1 text-xs text-slate-600 max-w-xs">
                {invoice.sender.address}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                GSTIN: <span className="font-mono">{invoice.sender.taxId}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              Tax Invoice
            </span>
            <p className="mt-2 text-base font-bold text-slate-900 font-mono">
              {invoice.invoiceNumber}
            </p>
            <div className="mt-1 text-xs text-slate-500 space-y-0.5">
              <p>
                Date:{" "}
                <span className="text-slate-800 font-medium">
                  {invoice.date}
                </span>
              </p>
              <p>
                Due:{" "}
                <span className="text-slate-800 font-medium">
                  {invoice.dueDate}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Billed To
          </p>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">
                  {invoice.client.companyName || invoice.client.name}
                </p>
                {invoice.metadata?.clientMatched && (
                  <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[9px] font-bold text-teal-800">
                    Directory Matched
                  </span>
                )}
              </div>

              {invoice.client.name !== invoice.client.companyName && (
                <p className="text-xs text-slate-600">
                  Attn: {invoice.client.name}
                </p>
              )}
              <p className="text-xs text-slate-500 max-w-sm">
                {invoice.client.address}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600">
              <p>{invoice.client.email}</p>
              {invoice.client.phone && <p>{invoice.client.phone}</p>}
              {invoice.client.taxId && (
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  Tax ID: {invoice.client.taxId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-1">Description</th>
                <th className="pb-3 text-center">HSN/SAC</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Tax (%)</th>
                <th className="pb-3 pr-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3 pl-1 font-medium text-slate-900">
                    <div>{item.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.priceSource === "rag_catalog" && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-700">
                          Catalog standard rate
                        </span>
                      )}
                      {item.priceSource === "explicit_prompt" && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
                          Prompt price
                        </span>
                      )}
                      {item.priceSource === "default_inferred" && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                          Default rate
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center font-mono text-slate-500">
                    {item.hsnSacCode || "—"}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right font-mono">
                    {invoice.currencySymbol}
                    {item.unitPrice.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500">
                    {item.taxRate}%
                  </td>
                  <td className="py-3 pr-1 text-right font-mono font-semibold text-slate-900">
                    {invoice.currencySymbol}
                    {item.total.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-100 pt-4">
          <div className="max-w-xs space-y-2 text-xs text-slate-600">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Amount in Words
            </p>
            <p className="font-medium text-slate-800 italic">
              {invoice.amountInWords}
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">
                {invoice.currencySymbol}
                {invoice.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({invoice.discountPercentage}%):</span>
                <span className="font-mono">
                  - {invoice.currencySymbol}
                  {invoice.discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>GST / Tax:</span>
              <span className="font-mono">
                {invoice.currencySymbol}
                {invoice.taxTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-indigo-600">
                {invoice.currencySymbol}
                {invoice.grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Add-ons & Footer Information */}
        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 text-xs">
          {/* Bank Details */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Bank & Payment Details
            </div>
            <div className="mt-2 font-mono text-[11px] space-y-1 text-slate-600">
              <p>A/C Name: {invoice.sender.bankDetails.accountName}</p>
              <p>A/C Number: {invoice.sender.bankDetails.accountNumber}</p>
              <p>IFSC: {invoice.sender.bankDetails.ifscCode}</p>
              <p>Bank: {invoice.sender.bankDetails.bankName}</p>
            </div>
          </div>

          {/* Payment QR / Stamp & Signature */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <QrIcon className="h-4 w-4 text-emerald-600" />
                Payment QR
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Scan to pay via UPI or NetBanking
              </p>
            </div>

            {qr ? (
              <img
                src={qr}
                alt="Payment QR"
                className="h-16 w-16 object-contain rounded-md border border-slate-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-slate-300 text-[10px] text-slate-400">
                UPI QR
              </div>
            )}
          </div>
        </div>

        {/* Terms and Notes */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-500 space-y-2">
          {invoice.notes && (
            <p>
              <span className="font-semibold text-slate-700">Note: </span>
              {invoice.notes}
            </p>
          )}
          {invoice.terms && (
            <div>
              <p className="font-semibold text-slate-700">
                Terms & Conditions:
              </p>
              <p className="whitespace-pre-line mt-0.5">{invoice.terms}</p>
            </div>
          )}
        </div>

        {/* Signature / Stamp line if present */}
        {stamp && (
          <div className="mt-6 flex justify-end">
            <div className="text-center">
              <img
                src={stamp}
                alt="Company Stamp"
                className="h-14 w-14 object-contain mx-auto"
              />
              <p className="mt-1 border-t border-slate-200 pt-1 text-[10px] font-medium text-slate-500">
                Authorized Signatory
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
