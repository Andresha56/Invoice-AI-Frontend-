import type { FC, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps {
  handleSave: () => void;
  type: "button" | "submit";
  label: string;
  children?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",

  secondary: "bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]",

  danger: "bg-[var(--danger)] hover:bg-[var(--danger-hover)]",

  success: "bg-[var(--success)] hover:bg-[var(--success-hover)]",
};

export const Button: FC<ButtonProps> = ({
  handleSave,
  type,
  label,
  children,
  disabled = false,
  variant = "primary",
}) => {
  return (
    <button
      type={type}
      onClick={handleSave}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]}`}
    >
      {children}
      {label}
    </button>
  );
};
