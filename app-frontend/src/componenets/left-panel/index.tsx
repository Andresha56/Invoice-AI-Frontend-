import { useState } from "react";
import { FileText, ArrowRight, Lightbulb } from "lucide-react";
import { ADD_ONS, type AddOn } from "@/archetype/add-on";
import { MaxTextLength as maxLength, SamplePrompts } from "@/constant";
import { AddOnButtons } from "../Add-on";

export const LeftPanel = () => {
  const [description, setDescription] = useState("");

  const handleAddOnClick = (addOn: AddOn) => {
    if (!addOn.text) return;

    const block = addOn.text;

    setDescription((prev) => {
      const combined = prev.trim() ? `${prev.trimEnd()}\n\n${block}` : block;
      return combined.slice(0, maxLength);
    });
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
              onChange={(e) =>
                setDescription(e.target.value.slice(0, maxLength))
              }
              maxLength={maxLength}
              rows={7}
              placeholder={`Enter invoice details here...\n\ne.g. Create an invoice for ABC Ltd for website development, 1 service, ₹25,000, 18% GST, due in 15 days...`}
              className="w-full resize-none rounded-lg placeholder:text-slate-400 focus:outline-none"
            />
            <span className="absolute bottom-0 right-0 text-xs font-medium text-slate-500">
              {description.length}/{maxLength}
            </span>
          </div>
        </div>

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
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <FileText className="h-4 w-4" />
            Generate Invoice
            <ArrowRight className="h-4 w-4" />
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
