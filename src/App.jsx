import React, { useState } from "react";
import {
  Users,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Plane
} from "lucide-react";

// ============================================================================
// 1. CONFIGURATION: PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// ============================================================================
const GOOGLE_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbyNOcHKUvAg6AQSzRJyvooZ1Sao-nwmpyGUVIjjq-tRluKHHqk_k8NzxOisxj4Lfiej/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("booking"); // 'client', 'booking', 'payment'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial State Data
  const [clients, setClients] = useState([
    {
      id: "CL-0001",
      name: "Juan Dela Cruz",
      phone: "09171234567",
      email: "juan@example.com",
      type: "Individual",
      contact: "Viber",
      source: "Facebook",
      remarks: "VIP Client",
      status: "Active"
    },
    {
      id: "CL-0002",
      name: "Maria Santos",
      phone: "09189876543",
      email: "maria@example.com",
      type: "Family",
      contact: "WhatsApp",
      source: "Referral",
      remarks: "Repeat customer",
      status: "Active"
    },
    {
      id: "CL-0003",
      name: "Antonio Reyes",
      phone: "09195554321",
      email: "antonio@example.com",
      type: "Corporate",
      contact: "Email",
      source: "Website",
      remarks: "Corporate Account",
      status: "Active"
    }
  ]);

  const [bookings, setBookings] = useState([
    {
      id: "BK-0001",
      date: "2026-10-01",
      clientId: "CL-0001",
      clientName: "Juan Dela Cruz",
      travelStart: "2026-11-10",
      travelEnd: "2026-11-15",
      package: "Bangkok 5D4N Deluxe",
      operator: "BANGKOK TRAVELS",
      type: "Group Tour",
      salesAmount: 45000,
      costAmount: 35000,
      status: "READY / FOR TRAVEL"
    },
    {
      id: "BK-0002",
      date: "2026-10-05",
      clientId: "CL-0002",
      clientName: "Maria Santos",
      travelStart: "2026-12-01",
      travelEnd: "2026-12-05",
      package: "Tokyo Express 4D3N",
      operator: "GFT",
      type: "Customized",
      salesAmount: 85000,
      costAmount: 68000,
      status: "WITH PENDING"
    },
    {
      id: "BK-0003",
      date: "2026-10-10",
      clientId: "CL-0003",
      clientName: "Antonio Reyes",
      travelStart: "2026-11-20",
      travelEnd: "2026-11-25",
      package: "Bali Leisure 6D5N",
      operator: "BLESS",
      type: "Group Tour",
      salesAmount: 62000,
      costAmount: 48000,
      status: "READY / FOR TRAVEL"
    }
  ]);

  const [payments, setPayments] = useState([
    {
      id: "PAY-0001",
      bookingId: "BK-0001",
      clientId: "CL-0001",
      date: "2026-10-02",
      amount: 45000,
      direction: "Client → Us",
      method: "GCash",
      refNo: "REF123456",
      type: "Full Payment",
      remarks: "Paid in full"
    },
    {
      id: "PAY-0002",
      bookingId: "BK-0001",
      clientId: "CL-0001",
      date: "2026-10-03",
      amount: 35000,
      direction: "Us → Operator",
      method: "Bank Transfer",
      refNo: "REF654321",
      type: "Full Payment",
      remarks: "Paid operator"
    },
    {
      id: "PAY-0003",
      bookingId: "BK-0002",
      clientId: "CL-0002",
      date: "2026-10-06",
      amount: 40000,
      direction: "Client → Us",
      method: "Credit Card",
      refNo: "REF789012",
      type: "Down Payment",
      remarks: "Initial DP"
    }
  ]);

  // Form Field States
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Individual",
    contact: "Viber",
    source: "Facebook",
    remarks: ""
  });

  const [bookingForm, setBookingForm] = useState({
    clientId: "",
    travelStart: "",
    travelEnd: "",
    package: "",
    operator: "BANGKOK TRAVELS",
    type: "Group Tour",
    salesAmount: "",
    costAmount: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    date: "",
    amount: "",
    direction: "Client → Us",
    method: "GCash",
    refNo: "",
    type: "Full Payment",
    remarks: ""
  });

  // Updated Helper Function: Send Data to Google Sheet with no-cors mode
  const sendToGoogleSheet = async (payload) => {
    if (
      !GOOGLE_WEBHOOK_URL ||
      GOOGLE_WEBHOOK_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")
    ) {
      console.warn("Google Webhook URL not set. Data saved locally only.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Using mode: "no-cors" prevents browser CORS blocks on Google Apps Script redirects
      await fetch(GOOGLE_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      alert("✅ Request sent to Google Sheet!");
    } catch (error) {
      console.error("Error pushing to Google Sheet:", error);
      alert("❌ Network error sending data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit Handlers
  const handleClientSubmit = (e) => {
    e.preventDefault();
    const newId = `CL-${String(clients.length + 1).padStart(4, "0")}`;
    const newClient = { id: newId, ...clientForm, status: "Active" };
    setClients([...clients, newClient]);
    sendToGoogleSheet({ action: "ADD_CLIENT", ...newClient });
    setClientForm({
      name: "",
      phone: "",
      email: "",
      type: "Individual",
      contact: "Viber",
      source: "Facebook",
      remarks: ""
    });
    setIsModalOpen(false);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const newId = `BK-${String(bookings.length + 1).padStart(4, "0")}`;
    const client = clients.find((c) => c.id === bookingForm.clientId);
    const newBooking = {
      id: newId,
      date: new Date().toISOString().split("T")[0],
      clientName: client ? client.name : "",
      ...bookingForm,
      salesAmount: Number(bookingForm.salesAmount),
      costAmount: Number(bookingForm.costAmount),
      status: "READY / FOR TRAVEL"
    };
    setBookings([...bookings, newBooking]);
    sendToGoogleSheet({ action: "ADD_BOOKING", ...newBooking });
    setBookingForm({
      clientId: "",
      travelStart: "",
      travelEnd: "",
      package: "",
      operator: "BANGKOK TRAVELS",
      type: "Group Tour",
      salesAmount: "",
      costAmount: ""
    });
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const newId = `PAY-${String(payments.length + 1).padStart(4, "0")}`;
    const booking = bookings.find((b) => b.id === paymentForm.bookingId);
    const newPayment = {
      id: newId,
      clientId: booking ? booking.clientId : "",
      ...paymentForm,
      amount: Number(paymentForm.amount)
    };
    setPayments([...payments, newPayment]);
    sendToGoogleSheet({ action: "ADD_PAYMENT", ...newPayment });
    setPaymentForm({
      bookingId: "",
      date: "",
      amount: "",
      direction: "Client → Us",
      method: "GCash",
      refNo: "",
      type: "Full Payment",
      remarks: ""
    });
    setIsModalOpen(false);
  };

  // KPI Calculations
  const totalSales = bookings.reduce((sum, b) => sum + (b.salesAmount || 0), 0);
  const totalClientPaid = payments
    .filter((p) => p.direction === "Client → Us")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalSales - totalClientPaid);
  const totalProfit = bookings.reduce(
    (sum, b) => sum + ((b.salesAmount || 0) - (b.costAmount || 0)),
    0
  );

  // Search Filters
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.package.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">Travel Master</h1>
              <p className="text-xs text-slate-400 mt-1">Operations Hub</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === "clients"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Users className="w-5 h-5" /> Clients Database
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === "bookings"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-5 h-5" /> Bookings
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === "payments"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-5 h-5" /> Payments
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Google Sheet Sync Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-900 p-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab} Overview</h2>
            <p className="text-sm text-slate-400">
              Manage real-time travel bookings and sync with Google Drive.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-sm text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-48 md:w-64"
              />
            </div>
            <button
              onClick={() => {
                setModalType(activeTab === "dashboard" ? "booking" : activeTab.slice(0, -1));
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Add New Record
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  ₱{totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Collected Payments</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  ₱{totalClientPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  ₱{totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  ₱{totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Active Bookings</h3>
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Booking ID</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Package</th>
                    <th className="px-6 py-3">Sales Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredBookings.slice(-5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 font-mono text-blue-400">{b.id}</td>
                      <td className="px-6 py-4 font-medium text-white">{b.clientName}</td>
                      <td className="px-6 py-4">{b.package}</td>
                      <td className="px-6 py-4 font-semibold text-white">
                        ₱{b.salesAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === "READY / FOR TRAVEL"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Client ID</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono text-blue-400">{c.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                    <td className="px-6 py-4">{c.phone}</td>
                    <td className="px-6 py-4">{c.email}</td>
                    <td className="px-6 py-4">{c.type}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-semibold">{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Travel Dates</th>
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Operator</th>
                  <th className="px-6 py-3">Sales Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono text-blue-400">{b.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{b.clientName}</td>
                    <td className="px-6 py-4">
                      {b.travelStart} to {b.travelEnd}
                    </td>
                    <td className="px-6 py-4">{b.package}</td>
                    <td className="px-6 py-4">{b.operator}</td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ₱{b.salesAmount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Payment ID</th>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Direction</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono text-blue-400">{p.id}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{p.bookingId}</td>
                    <td className="px-6 py-4">{p.date}</td>
                    <td className="px-6 py-4">{p.direction}</td>
                    <td className="px-6 py-4">{p.method}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      ₱{p.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Popup Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add New Record</h3>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setModalType("client")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  modalType === "client" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setModalType("booking")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  modalType === "booking" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                Booking
              </button>
              <button
                type="button"
                onClick={() => setModalType("payment")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  modalType === "payment" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                Payment
              </button>
            </div>

            {modalType === "client" && (
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Full Name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  required
                  type="text"
                  placeholder="Phone Number"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    {isSubmitting ? "Saving..." : "Save Client"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "booking" && (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <select
                  required
                  value={bookingForm.clientId}
                  onChange={(e) => setBookingForm({ ...bookingForm, clientId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="text"
                  placeholder="Package Name"
                  value={bookingForm.package}
                  onChange={(e) => setBookingForm({ ...bookingForm, package: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="date"
                    value={bookingForm.travelStart}
                    onChange={(e) => setBookingForm({ ...bookingForm, travelStart: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    required
                    type="date"
                    value={bookingForm.travelEnd}
                    onChange={(e) => setBookingForm({ ...bookingForm, travelEnd: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="number"
                    placeholder="Sales Amount"
                    value={bookingForm.salesAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, salesAmount: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Cost Amount"
                    value={bookingForm.costAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, costAmount: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    {isSubmitting ? "Saving..." : "Save Booking"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "payment" && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <select
                  required
                  value={paymentForm.bookingId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Booking</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.clientName}
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  required
                  type="number"
                  placeholder="Payment Amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    {isSubmitting ? "Saving..." : "Save Payment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
