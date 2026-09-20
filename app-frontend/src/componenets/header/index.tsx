import logo from "@/assets/logo.png";
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo + title + tagline */}
        <div className="flex items-center">
          <img
            src={logo}
            alt="AI Invoice Generator logo"
            className="h-10 w-10 shrink-0 rounded-md object-contain "
          />
          <h1 className="text-lg tracking-tight text-slate-900">InvoiceAI</h1>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            U
          </span>
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Hello, User
          </span>
        </div>
      </div>
    </header>
  );
}
