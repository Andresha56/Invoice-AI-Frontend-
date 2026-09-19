import { useCallback, type FC } from "react";
import { ADD_ON_Type, type AddOn } from "@/constant/add-on";
import { Plus, Check } from "lucide-react";

interface ButtonAddOnProps {
  addOn: AddOn;
  handleAddOnTextClick?: (addOn: AddOn) => void;
  handleFileClick?: () => void;
  isUploaded?: boolean;
}

export const AddOnButton: FC<ButtonAddOnProps> = ({
  addOn,
  handleAddOnTextClick,
  handleFileClick,
  isUploaded,
}) => {
  const Icon = addOn.icon;
  const handleClick = useCallback(() => {
    if (addOn.type === ADD_ON_Type.Text) {
      handleAddOnTextClick?.(addOn);
    } else {
      handleFileClick?.();
    }
  }, [addOn, handleAddOnTextClick, handleFileClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex cursor-pointer items-start justify-between gap-2 rounded-xl border p-3.5 text-left shadow-sm transition-colors ${
        isUploaded
          ? "border-emerald-400 bg-emerald-50/40"
          : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${addOn.iconClass}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-800">
              {addOn.label}
            </p>
            {isUploaded && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                Added
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-slate-500">{addOn.description}</p>
        </div>
      </div>

      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isUploaded
            ? "bg-emerald-100 text-emerald-700"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        {isUploaded ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
};
