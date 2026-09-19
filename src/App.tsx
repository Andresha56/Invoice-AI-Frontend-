import { useState } from "react";
import Header from "@/componenets/header";
import { LeftPanel } from "@/componenets/left-panel";
import { RightPanel } from "@/componenets/right-panel";
import type { Invoice, InvoiceAddons, MissingFieldInfo } from "@/types/invoice";

export const App = () => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<Record<string, string>>(
    {},
  );
  const [missingDetails, setMissingDetails] = useState<
    MissingFieldInfo[] | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAssetUploaded = (addOnId: string, base64: string) => {
    setUploadedAssets((prev) => ({
      ...prev,
      [addOnId]: base64,
    }));
  };

  const handleGenerateInvoice = async (
    prompt: string,
    addons: InvoiceAddons,
    allowDefaults: boolean = false,
  ) => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // First try relative URL via Vite proxy, fallback to direct port 5000
      let response: Response;
      const requestPayload = { prompt, addons, allowDefaults };

      try {
        response = await fetch("/api/invoice/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });
      } catch {
        response = await fetch("http://localhost:5000/api/invoice/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });
      }

      const result = await response.json();

      if (result.requiresClarification && result.missingDetails) {
        setMissingDetails(result.missingDetails);
      } else if (result.success && result.data) {
        setInvoice(result.data);
        setMissingDetails(null);
      } else {
        throw new Error(result.error || "Failed to generate invoice");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to connect to backend server.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearInvoice = () => {
    setInvoice(null);
    setMissingDetails(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="print:hidden">
        <Header />
      </div>

      {errorMessage && (
        <div className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 sm:mx-8 print:hidden flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Prompts & Add-ons */}
        <div className="w-full lg:w-[50%] xl:w-[48%] border-r border-slate-200 bg-white print:hidden">
          <LeftPanel
            onGenerate={handleGenerateInvoice}
            isGenerating={isGenerating}
            uploadedAssets={uploadedAssets}
            onAssetUploaded={handleAssetUploaded}
            missingDetails={missingDetails}
            onClearMissingDetails={() => setMissingDetails(null)}
          />
        </div>

        {/* Right Side: Live Invoice Preview */}
        <div className="w-full lg:w-[50%] xl:w-[52%] bg-slate-100/50 print:bg-white print:w-full">
          <RightPanel
            invoice={invoice}
            isGenerating={isGenerating}
            onClear={handleClearInvoice}
          />
        </div>
      </main>
    </div>
  );
};
