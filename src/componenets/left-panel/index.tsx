import { useState, type FC } from "react";
import {
  FileText,
  ArrowRight,
  Lightbulb,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { ADD_ONS, type AddOn } from "@/constant/add-on";
import { MaxTextLength as maxLength, SamplePrompts } from "@/constant";
import { AddOnButtons } from "../Add-on";
import type { InvoiceAddons, MissingFieldInfo } from "@/types/invoice";

interface LeftPanelProps {
  onGenerate: (
    prompt: string,
    addons: InvoiceAddons,
    allowDefaults?: boolean,
  ) => void;
  isGenerating: boolean;
  uploadedAssets: Record<string, string>;
  onAssetUploaded: (addOnId: string, base64: string) => void;
  missingDetails: MissingFieldInfo[] | null;
  onClearMissingDetails: () => void;
}

export const LeftPanel: FC<LeftPanelProps> = ({
  onGenerate,
  isGenerating,
  uploadedAssets,
  onAssetUploaded,
  missingDetails,
  onClearMissingDetails,
}) => {
  const [description, setDescription] = useState("");

  const handleAddOnClick = (addOn: AddOn) => {
    if (!addOn.text) return;

    const block = addOn.text;

    setDescription((prev) => {
      const combined = prev.trim() ? `${prev.trimEnd()}\n\n${block}` : block;
      return combined.slice(0, maxLength);
    });
  };

  const handleGenerate = (allowDefaults = false) => {
    onClearMissingDetails();

    if (!description.trim()) {
      setDescription(SamplePrompts[0]);
      onGenerate(
        SamplePrompts[0],
        {
          logoBase64: uploadedAssets["logo"],
          qrBase64: uploadedAssets["qr"],
          stampBase64: uploadedAssets["stamp"],
        },
        allowDefaults,
      );
      return;
    }

    onGenerate(
      description,
      {
        logoBase64: uploadedAssets["logo"],
        qrBase64: uploadedAssets["qr"],
        stampBase64: uploadedAssets["stamp"],
      },
      allowDefaults,
    );
  };

  const handleAppendSuggestion = (suggestion: string) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      return `${trimmed} ${suggestion}`.slice(0, maxLength);
    });
    onClearMissingDetails();
  };

  return (
    <section className="px-4 py-4 lg:px-8">
      <>
        <p className="mt-1 text-sm text-slate-600">
          Enter your invoice details below. You can also add optional elements
          like logo, bank details, QR code and more.
        </p>

        {/* Manual entry card */}
        <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value.slice(0, maxLength));
                if (missingDetails) onClearMissingDetails();
              }}
              maxLength={maxLength}
              rows={7}
              placeholder={`Enter invoice details here...\n\ne.g. Create an invoice for ABC Ltd for website development, 1 service, ₹25,000, 18% GST, due in 15 days...`}
              className="w-full resize-none rounded-lg placeholder:text-slate-400 focus:outline-none text-slate-800"
            />
            <span className="absolute bottom-0 right-0 text-xs font-medium text-slate-500">
              {description.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Missing Details Interactive Clarification Card */}
        {missingDetails && missingDetails.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">
                  Missing Required Invoice Details
                </h4>
                <p className="mt-0.5 text-xs text-amber-700">
                  To generate an accurate invoice, please specify the following
                  details or click a quick-suggestion below:
                </p>

                <div className="mt-3 space-y-2.5">
                  {missingDetails.map((detail) => (
                    <div
                      key={detail.field}
                      className="rounded-xl border border-amber-200/80 bg-white p-3 text-xs shadow-xs"
                    >
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        {detail.label}
                      </div>
                      <p className="text-slate-500 mt-0.5">{detail.message}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-400">
                          Quick Add:
                        </span>
                        {detail.quickSuggestions.map((sugg) => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => handleAppendSuggestion(sugg)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-3">
                  <span className="text-[11px] text-amber-700">
                    Need a test draft anyway?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerate(true)}
                    className="cursor-pointer text-xs font-bold text-amber-900 underline hover:text-amber-950"
                  >
                    Proceed with Draft Defaults &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add-ons */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-slate-900">
            Add to Invoice{" "}
            <span className="font-medium text-slate-500">(Optional)</span>
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Include additional elements to make your invoice more professional.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ADD_ONS.map((addOn) => (
              <AddOnButtons
                key={addOn.id}
                addOn={addOn}
                handleAddOnClick={handleAddOnClick}
                onUpload={onAssetUploaded}
                uploadedAssets={uploadedAssets}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all ${
              isGenerating
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Invoice with RAG...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Invoice
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </>

      {/* Examples */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Lightbulb className="h-4 w-4 text-slate-500" />
          Try these examples
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {SamplePrompts.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setDescription(example);
                if (missingDetails) onClearMissingDetails();
              }}
              className="flex items-start justify-between gap-2 rounded-xl border border-slate-300 bg-white p-3.5 text-left text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50"
            >
              <span>{example}</span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
