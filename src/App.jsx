import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  X
} from 'lucide-react';

// ==========================================
// CONFIGURATION & INITIAL MOCK DATA
// ==========================================

// Paste your Google Apps Script Web App URL from Step 3 here:
const GOOGLE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxm7CADEI8B0rL6AqH1uEC2RM4IjTUNFgtJlmKy1t9FVC6ZtnXSX0HyB0W0mVxigwsLKg/exec";

const INITIAL_CLIENTS = [
  { clientId: "CL-0001", clientName: "Juan Dela Cruz", contactNo: "09171234567", email: "juan@example.com", clientType: "VIP", prefContact: "WhatsApp", clientSource: "Facebook", remarks: "Prefers window seats" },
  { clientId: "CL-0002", clientName: "Maria Santos", contactNo: "09189876543", email: "maria@example.com", clientType: "Regular", prefContact: "Email", clientSource: "Referral", remarks: "Vegetarian meal preference" },
  { clientId: "CL-0003", clientName: "Corporate Acme Corp", contactNo: "0281234567", email: "travel@acme.com", clientType: "Corporate", prefContact: "Phone", clientSource: "Website", remarks: "Requires official receipts" }
];

const INITIAL_BOOKINGS = [
  {
    bookingId: "BK-0001",
    bookingDate: "2026-09-01",
    clientId: "CL-0001",
    clientName: "Juan Dela Cruz",
    travelStart: "2026-10-05",
    travelEnd: "2026-10-10",
    package: "Tokyo 5D4N Autumn Tour",
    operator: "GFT Tours",
    bookingType: "Group Tour",
    salesAmount: 65000,
    costAmount: 48000,
    invoice: "Done",
    ticket: "Done",
    voucher: "Done",
    baggage: "Done",
    briefing: "Pending",
    otherPending: "",
    overallStatus: "Confirmed",
    remarks: "Passport copies received"
  },
  {
    bookingId: "BK-0002",
    bookingDate: "2026-09-10",
    clientId: "CL-0002",
    clientName: "Maria Santos",
    travelStart: "2026-09-28",
    travelEnd: "2026-10-02",
    package: "Seoul 5D4N Express",
    operator: "Asia Travel Ltd",
    bookingType: "Customized",
    salesAmount: 42000,
    costAmount: 31000,
    invoice: "Done",
    ticket: "Pending",
    voucher: "Pending",
    baggage: "Pending",
    briefing: "Pending",
    otherPending: "K-ETA approval pending",
    overallStatus: "Processing",
    remarks: "Waiting for flight release"
  }
];

const INITIAL_PAYMENTS = [
  { paymentId: "PAY-0001", bookingId: "BK-0001", clientId: "CL-0001", paymentDate: "2026-09-02", amount: 30000, direction: "Client to Us", method: "Bank Transfer", refNo: "TXN102938", type: "Deposit", remarks: "Initial downpayment" },
  { paymentId: "PAY-0002", bookingId: "BK-0001", clientId: "CL-0001", paymentDate: "2026-09-15", amount: 35000, direction: "Client to Us", method: "Credit Card", refNo: "TXN104500", type: "Full Payment", remarks: "Final balance" },
  { paymentId: "PAY-0003", bookingId: "BK-0001", clientId: "CL-0001", paymentDate: "2026-09-16", amount: 48000, direction: "Us to Operator", method: "Bank Transfer", refNo: "OP-99812", type: "Full Payment", remarks: "Settled operator cost" },
  { paymentId: "PAY-0004", bookingId: "BK-0002", clientId: "CL-0002", paymentDate: "2026-09-11", amount: 20000, direction: "Client to Us", method: "GCash", refNo: "GC-887123", type: "Deposit", remarks: "Partial payment" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States
  const [newClient, setNewClient] = useState({ clientName: '', contactNo: '', email: '', clientType: 'Regular', prefContact: 'WhatsApp', clientSource: 'Direct', remarks: '' });
  const [newBooking, setNewBooking] = useState({ clientId: '', travelStart: '', travelEnd: '', package: '', operator: 'GFT Tours', bookingType: 'Group Tour', salesAmount: '', costAmount: '', remarks: '' });
  const [newPayment, setNewPayment] = useState({ bookingId: '', amount: '', direction: 'Client to Us', method: 'Bank Transfer', refNo: '', type: 'Deposit', remarks: '' });

  // ==========================================
  // HELPER: GOOGLE APPS SCRIPT WEBHOOK SYNC
  // ==========================================
  const sendToGoogleSheet = async (payload) => {
    if (!GOOGLE_WEBHOOK_URL || GOOGLE_WEBHOOK_URL.includes("YOUR_DEPLOYMENT_ID")) {
      return; // Skip if URL not configured yet
    }
    setIsSyncing(true);
    try {
      await fetch(GOOGLE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Google Sheets webhook error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================
  // FINANCIAL & CALCULATED METRICS
  // ==========================================
  const calculatedBookings = useMemo(() => {
    return bookings.map(b => {
      const clientPaid = payments
        .filter(p => p.bookingId === b.bookingId && p.direction === "Client to Us")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const operatorPaid = payments
        .filter(p => p.bookingId === b.bookingId && p.direction === "Us to Operator")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const clientBalance = Number(b.salesAmount || 0) - clientPaid;
      const operatorBalance = Number(b.costAmount || 0) - operatorPaid;
      const grossProfit = Number(b.salesAmount || 0) - Number(b.costAmount || 0);

      // Countdown Days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const travelDate = new Date(b.travelStart);
      const diffTime = travelDate - today;
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...b,
        clientPaid,
        clientBalance,
        operatorPaid,
        operatorBalance,
        grossProfit,
        daysUntil
      };
    });
  }, [bookings, payments]);

  const kpis = useMemo(() => {
    const totalSales = calculatedBookings.reduce((sum, b) => sum + Number(b.salesAmount || 0), 0);
    const totalCost = calculatedBookings.reduce((sum, b) => sum + Number(b.costAmount || 0), 0);
    const grossProfit = totalSales - totalCost;
    const clientBalancesDue = calculatedBookings.reduce((sum, b) => sum + Math.max(0, b.clientBalance), 0);
    const operatorBalancesDue = calculatedBookings.reduce((sum, b) => sum + Math.max(0, b.operatorBalance), 0);
    const upcomingDepartures = calculatedBookings.filter(b => b.daysUntil >= 0 && b.daysUntil <= 30).length;

    return { totalSales, totalCost, grossProfit, clientBalancesDue, operatorBalancesDue, upcomingDepartures };
  }, [calculatedBookings]);

  // ==========================================
  // HANDLERS: ADD CLIENT, BOOKING, PAYMENT
  // ==========================================
  const handleAddClient = (e) => {
    e.preventDefault();
    const clientId = `CL-${String(clients.length + 1).padStart(4, '0')}`;
    const clientData = { clientId, ...newClient };
    setClients([...clients, clientData]);
    sendToGoogleSheet({ action: "ADD_CLIENT", ...clientData });
    setIsClientModalOpen(false);
    setNewClient({ clientName: '', contactNo: '', email: '', clientType: 'Regular', prefContact: 'WhatsApp', clientSource: 'Direct', remarks: '' });
  };

  const handleAddBooking = (e) => {
    e.preventDefault();
    const bookingId = `BK-${String(bookings.length + 1).padStart(4, '0')}`;
    const clientObj = clients.find(c => c.clientId === newBooking.clientId);
    const clientName = clientObj ? clientObj.clientName : 'Unknown Client';
    const todayStr = new Date().toISOString().split('T')[0];

    const bookingData = {
      bookingId,
      bookingDate: todayStr,
      clientName,
      invoice: "Pending",
      ticket: "Pending",
      voucher: "Pending",
      baggage: "Pending",
      briefing: "Pending",
      otherPending: "",
      overallStatus: "Confirmed",
      ...newBooking
    };

    setBookings([...bookings, bookingData]);
    sendToGoogleSheet({ action: "ADD_BOOKING", ...bookingData });
    setIsBookingModalOpen(false);
    setNewBooking({ clientId: '', travelStart: '', travelEnd: '', package: '', operator: 'GFT Tours', bookingType: 'Group Tour', salesAmount: '', costAmount: '', remarks: '' });
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const paymentId = `PAY-${String(payments.length + 1).padStart(4, '0')}`;
    const targetBooking = bookings.find(b => b.bookingId === newPayment.bookingId);
    const clientId = targetBooking ? targetBooking.clientId : '';
    const todayStr = new Date().toISOString().split('T')[0];

    const paymentData = {
      paymentId,
      clientId,
      paymentDate: todayStr,
      ...newPayment
    };

    setPayments([...payments, paymentData]);
    sendToGoogleSheet({ action: "ADD_PAYMENT", ...paymentData });
    setIsPaymentModalOpen(false);
    setNewPayment({ bookingId: '', amount: '', direction: 'Client to Us', method: 'Bank Transfer', refNo: '', type: 'Deposit', remarks: '' });
  };

  // ==========================================
  // EXCEL IMPORT / EXPORT ENGINE
  // ==========================================
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsDashboard = XLSX.utils.json_to_sheet([{
      TotalSales: kpis.totalSales,
      TotalCost: kpis.totalCost,
      GrossProfit: kpis.grossProfit,
      ClientBalancesDue: kpis.clientBalancesDue,
      OperatorBalancesDue: kpis.operatorBalancesDue
    }]);

    const wsClients = XLSX.utils.json_to_sheet(clients);
    const wsBookings = XLSX.utils.json_to_sheet(calculatedBookings);
    const wsPayments = XLSX.utils.json_to_sheet(payments);

    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");
    XLSX.utils.book_append_sheet(wb, wsClients, "Clients");
    XLSX.utils.book_append_sheet(wb, wsBookings, "Bookings");
    XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

    XLSX.writeFile(wb, "Master_Database_Travel_Portal.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });

      if (wb.SheetNames.includes("Clients")) {
        setClients(XLSX.utils.sheet_to_json(wb.Sheets["Clients"]));
      }
      if (wb.SheetNames.includes("Bookings")) {
        setBookings(XLSX.utils.sheet_to_json(wb.Sheets["Bookings"]));
      }
      if (wb.SheetNames.includes("Payments")) {
        setPayments(XLSX.utils.sheet_to_json(wb.Sheets["Payments"]));
      }
      alert("Excel file imported successfully!");
    };
    reader.readAsBinaryString(file);
  };

  // ==========================================
  // FILTERED DATA VIEWS
  // ==========================================
  const filteredBookings = calculatedBookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.package.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'DEPARTING_SOON') return matchesSearch && b.daysUntil >= 0 && b.daysUntil <= 7;
    if (filterStatus === 'BALANCE_DUE') return matchesSearch && b.clientBalance > 0;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 sticky top-0 z-40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Travel Agency Operations Portal</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                Live Google Drive & Excel Sync Engine
                {isSyncing && <span className="text-amber-400 text-xs animate-pulse">● Syncing changes...</span>}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium cursor-pointer border border-slate-700 transition">
              <Upload className="w-4 h-4 mr-2 text-blue-400" />
              Import Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
            <button
              onClick={handleExportExcel}
              className="flex items-center px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
            >
              <Download className="w-4 h-4 mr-2 text-emerald-400" />
              Export .XLSX
            </button>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Booking
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1 mt-6 border-b border-slate-800">
          {[
            { id: 'dashboard', label: 'Executive Dashboard', icon: TrendingUp },
            { id: 'bookings', label: 'Bookings & Departure Monitor', icon: Calendar },
            { id: 'clients', label: 'Client Directory', icon: Users },
            { id: 'payments', label: 'Payments Ledger', icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 font-medium text-sm border-b-2 transition ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* ================= TAB 1: EXECUTIVE DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">₱{kpis.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center">
                  Gross Profit: <span className="text-emerald-400 font-semibold ml-1">₱{kpis.grossProfit.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Pending Client Balances</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">₱{kpis.clientBalancesDue.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Receivables from clients</p>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Unpaid Operator Cost</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">₱{kpis.operatorBalancesDue.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Payables to tour suppliers</p>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Upcoming Departures (30 Days)</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{kpis.upcomingDepartures} Bookings</p>
                  </div>
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Requires voucher & ticket dispatch</p>
              </div>
            </div>

            {/* DEPARTURE MONITOR PREVIEW */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  Immediate Travel Departures Monitor
                </h2>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center"
                >
                  View All Bookings <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              <div className="space-y-3">
                {calculatedBookings.map((b) => (
                  <div key={b.bookingId} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800 gap-4">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-center ${
                        b.daysUntil <= 7 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {b.daysUntil < 0 ? 'Completed' : b.daysUntil === 0 ? 'TODAY' : `${b.daysUntil} Days Left`}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100">{b.package}</h3>
                        <p className="text-xs text-slate-400">Client: {b.clientName} ({b.bookingId}) • Operator: {b.operator}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <div>
                        <p className="text-slate-400">Travel Window</p>
                        <p className="font-medium text-slate-200">{b.travelStart} to {b.travelEnd}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Client Balance</p>
                        <p className={`font-bold ${b.clientBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {b.clientBalance > 0 ? `₱${b.clientBalance.toLocaleString()}` : 'Paid'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOOKINGS SCHEDULE ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search client, booking ID, package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Bookings</option>
                  <option value="DEPARTING_SOON">Departing in 7 Days</option>
                  <option value="BALANCE_DUE">Client Balance Due</option>
                </select>
              </div>
            </div>

            {/* BOOKINGS TABLE */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Booking ID</th>
                      <th className="px-4 py-3.5">Client Name</th>
                      <th className="px-4 py-3.5">Package & Dates</th>
                      <th className="px-4 py-3.5">Countdown</th>
                      <th className="px-4 py-3.5">Sales Amount</th>
                      <th className="px-4 py-3.5">Client Balance</th>
                      <th className="px-4 py-3.5">Operator Balance</th>
                      <th className="px-4 py-3.5">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-semibold text-blue-400">{b.bookingId}</td>
                        <td className="px-4 py-3 font-medium text-slate-100">{b.clientName}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">{b.package}</div>
                          <div className="text-xs text-slate-400">{b.travelStart} ~ {b.travelEnd}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            b.daysUntil <= 7 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {b.daysUntil < 0 ? 'Completed' : `${b.daysUntil} Days`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">₱{Number(b.salesAmount).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold">
                          <span className={b.clientBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                            ₱{b.clientBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          <span className={b.operatorBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            ₱{b.operatorBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">₱{b.grossProfit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CLIENT DIRECTORY ================= */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Registered Clients ({clients.length})</h2>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Client
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c) => (
                <div key={c.clientId} className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-400 uppercase">{c.clientId}</span>
                      <h3 className="text-base font-bold text-white">{c.clientName}</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">
                      {c.clientType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-700/50">
                    <p><span className="text-slate-500">Contact:</span> {c.contactNo}</p>
                    <p><span className="text-slate-500">Email:</span> {c.email}</p>
                    <p><span className="text-slate-500">Source:</span> {c.clientSource}</p>
                    {c.remarks && <p className="italic text-slate-400 pt-1">"{c.remarks}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: PAYMENTS LEDGER ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Financial Transactions Ledger</h2>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Record Payment
              </button>
            </div>

            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Payment ID</th>
                      <th className="px-4 py-3.5">Booking ID</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Direction</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Method</th>
                      <th className="px-4 py-3.5">Reference No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map((p) => (
                      <tr key={p.paymentId} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-semibold text-slate-200">{p.paymentId}</td>
                        <td className="px-4 py-3 text-blue-400 font-medium">{p.bookingId}</td>
                        <td className="px-4 py-3 text-slate-400">{p.paymentDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.direction === 'Client to Us' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {p.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">₱{Number(p.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-300">{p.method}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.refNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          MODAL: ADD NEW BOOKING
      ========================================== */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Travel Booking</h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Client</label>
                <select
                  required
                  value={newBooking.clientId}
                  onChange={(e) => setNewBooking({...newBooking, clientId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.clientId} value={c.clientId}>{c.clientName} ({c.clientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tour Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokyo 5D4N Autumn Special"
                  value={newBooking.package}
                  onChange={(e) => setNewBooking({...newBooking, package: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Start Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.travelStart}
                    onChange={(e) => setNewBooking({...newBooking, travelStart: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Travel End Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.travelEnd}
                    onChange={(e) => setNewBooking({...newBooking, travelEnd: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sales Amount (Client Price)</label>
                  <input
                    type="number"
                    required
                    placeholder="65000"
                    value={newBooking.salesAmount}
                    onChange={(e) => setNewBooking({...newBooking, salesAmount: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Operator Net Cost</label>
                  <input
                    type="number"
                    required
                    placeholder="48000"
                    value={newBooking.costAmount}
                    onChange={(e) => setNewBooking({...newBooking, costAmount: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                >
                  Save Booking & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD NEW CLIENT
      ========================================== */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Register New Client</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Client / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={newClient.clientName}
                  onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact No.</label>
                  <input
                    type="text"
                    required
                    placeholder="09171234567"
                    value={newClient.contactNo}
                    onChange={(e) => setNewClient({...newClient, contactNo: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                >
                  Save Client & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: RECORD PAYMENT
      ========================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Record New Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Booking</label>
                <select
                  required
                  value={newPayment.bookingId}
                  onChange={(e) => setNewPayment({...newPayment, bookingId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map(b => (
                    <option key={b.bookingId} value={b.bookingId}>{b.bookingId} - {b.clientName} ({b.package})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Direction</label>
                  <select
                    value={newPayment.direction}
                    onChange={(e) => setNewPayment({...newPayment, direction: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Client to Us">Client to Us (Receivable)</option>
                    <option value="Us to Operator">Us to Operator (Payable)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount Paid (₱)</label>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GCash">GCash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reference No.</label>
                  <input
                    type="text"
                    required
                    placeholder="TXN-998123"
                    value={newPayment.refNo}
                    onChange={(e) => setNewPayment({...newPayment, refNo: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                >
                  Save Payment & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
