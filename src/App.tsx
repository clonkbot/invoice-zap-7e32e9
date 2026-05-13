import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Auth Component
function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <svg className="w-7 h-7 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-xl font-medium tracking-tight text-neutral-900">Invoice Zap</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 mb-2">
              {flow === "signIn" ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-neutral-500 text-sm">
              {flow === "signIn"
                ? "Sign in to manage your invoices"
                : "Create an account to start invoicing"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : flow === "signIn" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              {flow === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-neutral-400">or</span>
            </div>
          </div>

          <button
            onClick={() => signIn("anonymous")}
            className="mt-6 w-full py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Dashboard
function Dashboard() {
  const { signOut } = useAuthActions();
  const stats = useQuery(api.invoices.getStats);
  const invoices = useQuery(api.invoices.list, {});
  const clients = useQuery(api.clients.list);
  const dueReminders = useQuery(api.reminders.getDueReminders);

  const [view, setView] = useState<"dashboard" | "invoices" | "clients" | "new-invoice" | "new-client">("dashboard");
  const [editingInvoice, setEditingInvoice] = useState<Id<"invoices"> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const NavItem = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={() => { onClick(); setMobileMenuOpen(false); }}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-neutral-100 text-neutral-900 font-medium"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="font-medium text-neutral-900">Invoice Zap</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-neutral-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"} />
            </svg>
          </button>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="px-4 pb-4 border-t border-neutral-100">
            <nav className="mt-2 space-y-1">
              <NavItem label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
              <NavItem label="Invoices" active={view === "invoices"} onClick={() => setView("invoices")} />
              <NavItem label="Clients" active={view === "clients"} onClick={() => setView("clients")} />
            </nav>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <button
                onClick={() => signOut()}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 border-r border-neutral-200 bg-neutral-50/50 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <svg className="w-6 h-6 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="font-medium text-neutral-900">Invoice Zap</span>
          </div>

          <nav className="space-y-1">
            <NavItem label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
            <NavItem label="Invoices" active={view === "invoices"} onClick={() => setView("invoices")} />
            <NavItem label="Clients" active={view === "clients"} onClick={() => setView("clients")} />
          </nav>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <button
              onClick={() => signOut()}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {/* Reminders Alert */}
          {dueReminders && dueReminders.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Payment reminders due</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You have {dueReminders.length} invoice{dueReminders.length > 1 ? "s" : ""} that need attention.
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === "dashboard" && (
            <div>
              <h1 className="text-xl md:text-2xl font-medium text-neutral-900 mb-6 md:mb-8">Overview</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
                <div className="p-4 md:p-5 border border-neutral-200 rounded-lg">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-medium text-neutral-900 mt-1">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
                </div>
                <div className="p-4 md:p-5 border border-neutral-200 rounded-lg">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Pending</p>
                  <p className="text-xl md:text-2xl font-medium text-amber-600 mt-1">{formatCurrency(stats?.pendingAmount ?? 0)}</p>
                </div>
                <div className="p-4 md:p-5 border border-neutral-200 rounded-lg">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Overdue</p>
                  <p className="text-xl md:text-2xl font-medium text-red-600 mt-1">{formatCurrency(stats?.overdueAmount ?? 0)}</p>
                </div>
                <div className="p-4 md:p-5 border border-neutral-200 rounded-lg">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Invoices</p>
                  <p className="text-xl md:text-2xl font-medium text-neutral-900 mt-1">{stats?.total ?? 0}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12">
                <button
                  onClick={() => setView("new-invoice")}
                  className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Create invoice
                </button>
                <button
                  onClick={() => setView("new-client")}
                  className="px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
                >
                  Add client
                </button>
              </div>

              {/* Recent Invoices */}
              <div>
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">Recent Invoices</h2>
                {invoices === undefined ? (
                  <p className="text-sm text-neutral-500">Loading...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-neutral-500">No invoices yet. Create your first one!</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.slice(0, 5).map((invoice: { _id: Id<"invoices">; invoiceNumber: string; status: string; total: number; currency: string; dueDate: number; client: { name: string } | null }) => (
                      <div
                        key={invoice._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-neutral-900">{invoice.invoiceNumber}</span>
                            <StatusBadge status={invoice.status} />
                          </div>
                          <p className="text-sm text-neutral-500 mt-1 truncate">{invoice.client?.name ?? "Unknown"}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="text-sm font-medium text-neutral-900">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Due {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "invoices" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-medium text-neutral-900">Invoices</h1>
                <button
                  onClick={() => setView("new-invoice")}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  New invoice
                </button>
              </div>

              {invoices === undefined ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">No invoices yet</p>
                  <button
                    onClick={() => setView("new-invoice")}
                    className="text-sm text-neutral-700 underline hover:text-neutral-900"
                  >
                    Create your first invoice
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice: { _id: Id<"invoices">; invoiceNumber: string; status: string; total: number; currency: string; dueDate: number; client: { name: string } | null }) => (
                    <InvoiceRow
                      key={invoice._id}
                      invoice={invoice}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onEdit={() => setEditingInvoice(invoice._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "clients" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-medium text-neutral-900">Clients</h1>
                <button
                  onClick={() => setView("new-client")}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Add client
                </button>
              </div>

              {clients === undefined ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : clients.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">No clients yet</p>
                  <button
                    onClick={() => setView("new-client")}
                    className="text-sm text-neutral-700 underline hover:text-neutral-900"
                  >
                    Add your first client
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {clients.map((client: { _id: Id<"clients">; name: string; email: string; company?: string }) => (
                    <ClientRow key={client._id} client={client} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "new-invoice" && (
            <InvoiceForm
              clients={clients ?? []}
              onCancel={() => setView("invoices")}
              onSuccess={() => setView("invoices")}
            />
          )}

          {view === "new-client" && (
            <ClientForm
              onCancel={() => setView("clients")}
              onSuccess={() => setView("clients")}
            />
          )}

          {editingInvoice && (
            <InvoiceDetailModal
              invoiceId={editingInvoice}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onClose={() => setEditingInvoice(null)}
            />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    overdue: "bg-red-50 text-red-700",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

// Invoice Row
function InvoiceRow({
  invoice,
  formatCurrency,
  formatDate,
  onEdit
}: {
  invoice: {
    _id: Id<"invoices">;
    invoiceNumber: string;
    status: string;
    total: number;
    currency: string;
    dueDate: number;
    client: { name: string } | null;
  };
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (timestamp: number) => string;
  onEdit: () => void;
}) {
  return (
    <div
      onClick={onEdit}
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-neutral-900">{invoice.invoiceNumber}</span>
          <StatusBadge status={invoice.status} />
        </div>
        <p className="text-sm text-neutral-500 mt-1 truncate">{invoice.client?.name ?? "Unknown"}</p>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="text-sm font-medium text-neutral-900">
          {formatCurrency(invoice.total, invoice.currency)}
        </span>
        <span className="text-xs text-neutral-400">
          Due {formatDate(invoice.dueDate)}
        </span>
      </div>
    </div>
  );
}

// Client Row
function ClientRow({ client }: { client: { _id: Id<"clients">; name: string; email: string; company?: string } }) {
  const removeClient = useMutation(api.clients.remove);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{client.name}</p>
        <p className="text-sm text-neutral-500 truncate">{client.email}</p>
        {client.company && <p className="text-xs text-neutral-400 truncate">{client.company}</p>}
      </div>
      <button
        onClick={() => removeClient({ id: client._id })}
        className="text-xs text-neutral-400 hover:text-red-600 transition-colors self-end sm:self-center"
      >
        Remove
      </button>
    </div>
  );
}

// Invoice Form
function InvoiceForm({
  clients,
  onCancel,
  onSuccess,
}: {
  clients: { _id: Id<"clients">; name: string }[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const createInvoice = useMutation(api.invoices.create);
  const [items, setItems] = useState([{ description: "", quantity: 1, rate: 0 }]);
  const [clientId, setClientId] = useState<Id<"clients"> | "">("");
  const [tax, setTax] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setLoading(true);
    try {
      await createInvoice({
        clientId: clientId as Id<"clients">,
        items: items.filter((i) => i.description && i.rate > 0),
        tax,
        currency,
        dueDate: new Date(dueDate).getTime(),
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-medium text-neutral-900 mb-6 md:mb-8">New Invoice</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Client Select */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Client
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value as Id<"clients">)}
            required
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Line Items */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Items
          </label>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-neutral-50 rounded-md">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    min="1"
                    className="w-20 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  />
                  <input
                    type="number"
                    value={item.rate || ""}
                    onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                    placeholder="Rate"
                    min="0"
                    step="0.01"
                    className="w-28 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-neutral-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            + Add item
          </button>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Tax (%)
            </label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-none"
            placeholder="Payment terms, thank you message, etc."
          />
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Tax ({tax}%)</span>
            <span className="text-neutral-900">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-medium pt-2 border-t border-neutral-100">
            <span className="text-neutral-900">Total</span>
            <span className="text-neutral-900">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !clientId}
            className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Client Form
function ClientForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const createClient = useMutation(api.clients.create);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createClient({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        company: (formData.get("company") as string) || undefined,
        address: (formData.get("address") as string) || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-medium text-neutral-900 mb-6 md:mb-8">Add Client</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Name *
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            placeholder="john@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Company
          </label>
          <input
            name="company"
            type="text"
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300"
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Address
          </label>
          <textarea
            name="address"
            rows={2}
            className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-none"
            placeholder="123 Main St, City, State 12345"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Client"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Invoice Detail Modal
function InvoiceDetailModal({
  invoiceId,
  formatCurrency,
  formatDate,
  onClose,
}: {
  invoiceId: Id<"invoices">;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (timestamp: number) => string;
  onClose: () => void;
}) {
  const invoice = useQuery(api.invoices.get, { id: invoiceId });
  const sendInvoice = useMutation(api.invoices.send);
  const markPaid = useMutation(api.invoices.markPaid);
  const markOverdue = useMutation(api.invoices.markOverdue);
  const removeInvoice = useMutation(api.invoices.remove);

  if (!invoice) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-4 md:p-6 border-b border-neutral-200">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-medium text-neutral-900">{invoice.invoiceNumber}</h2>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="text-sm text-neutral-500 mt-1 truncate">{invoice.client?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Items */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Items</p>
            <div className="space-y-2">
              {invoice.items.map((item: { description: string; quantity: number; rate: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-700">{item.description} x{item.quantity}</span>
                  <span className="text-neutral-900">{formatCurrency(item.quantity * item.rate, invoice.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-neutral-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Tax ({invoice.tax}%)</span>
              <span className="text-neutral-900">{formatCurrency(invoice.total - invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-base font-medium pt-2 border-t border-neutral-100">
              <span className="text-neutral-900">Total</span>
              <span className="text-neutral-900">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex justify-between text-sm pt-2">
            <span className="text-neutral-500">Due Date</span>
            <span className="text-neutral-900">{formatDate(invoice.dueDate)}</span>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-2">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-neutral-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 md:p-6 border-t border-neutral-200 flex flex-wrap gap-2">
          {invoice.status === "draft" && (
            <button
              onClick={() => sendInvoice({ id: invoiceId })}
              className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors"
            >
              Send Invoice
            </button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <button
              onClick={() => markPaid({ id: invoiceId })}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Mark as Paid
            </button>
          )}
          {invoice.status === "sent" && (
            <button
              onClick={() => markOverdue({ id: invoiceId })}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Mark Overdue
            </button>
          )}
          <button
            onClick={async () => {
              await removeInvoice({ id: invoiceId });
              onClose();
            }}
            className="px-4 py-2 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-4 px-6 border-t border-neutral-100">
      <p className="text-center text-xs text-neutral-400">
        Requested by @web-user · Built by @clonkbot
      </p>
    </footer>
  );
}

// Main App
export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <AuthScreen />;
}
