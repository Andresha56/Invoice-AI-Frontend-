import type { AddOn } from "@/archetype/add-on";

export const FileHeader = ({
  addOn,
  handleCancel,
}: {
  addOn: AddOn;
  handleCancel: () => void;
}) => {
  const Icon = addOn.icon;
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${addOn.iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{addOn.label}</h2>

          <p className="text-xs text-zinc-500">{addOn.description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCancel}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 6l12 12M18 6L6 18"
          />
        </svg>
      </button>
    </div>
  );
};
