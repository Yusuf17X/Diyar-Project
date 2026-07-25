// Dual-Mode API Service Layer
// Transparently handles REST API fetch requests with automatic localStorage mock fallback.

const BASE_URL = "http://localhost:3000/api/v1";

// Helper to check if server is reachable and run API requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("diyar_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `API request failed with status ${response.status}`);
    }
    // Handle 204 No Content
    if (response.status === 204) return true;
    return await response.json();
  } catch (error) {
    // If it's a standard network error (server offline), we trigger mock fallback.
    if (error instanceof TypeError || error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      console.warn(`[API] Server offline at ${BASE_URL}. Falling back to in-browser Mock DB.`);
      return handleMock(endpoint, options);
    }
    throw error;
  }
}

// ==========================================
// MOCK DATABASE & STORAGE (Fallback Mode)
// ==========================================

const MOCK_DB_KEY = "diyar_mock_db";

const DEFAULT_DB = {
  users: [
    { id: "u-admin", fullName: "Admin User", email: "admin.palm@diyar.local", role: "ADMIN", phone: "+20100000000", status: "ACTIVE", propertyId: "p-palm" },
    { id: "u-sarah", fullName: "Sarah Mitchell", email: "sarah.m@example.com", role: "RESIDENT", phone: "+1 (555) 0123-4567", status: "ACTIVE", propertyId: "p-palm" },
    { id: "u-michael", fullName: "Michael Chang", email: "m.chang@example.com", role: "RESIDENT", phone: "+20100000002", status: "ACTIVE", propertyId: "p-palm" },
    { id: "u-emma", fullName: "Emma Watson", email: "emma.w@example.com", role: "RESIDENT", phone: "+20100000003", status: "ACTIVE", propertyId: "p-palm" },
    { id: "u-david", fullName: "David Miller", email: "d.miller@example.com", role: "RESIDENT", phone: "+20100000004", status: "PENDING", propertyId: "p-palm" },
    { id: "u-security", fullName: "Officer Al-Diyar", email: "security.gate@diyar.local", role: "SECURITY", phone: "+20100000005", status: "ACTIVE", propertyId: "p-palm" },
    { id: "u-technician", fullName: "Engineer Ahmed", email: "staff.repair@diyar.local", role: "STAFF", phone: "+20100000006", status: "ACTIVE", propertyId: "p-palm" },
  ],
  properties: [
    { id: "p-palm", name: "Palm Heights East" }
  ],
  units: [
    { id: "unit-4b", propertyId: "p-palm", code: "4B", occupancyStatus: "OCCUPIED" },
    { id: "unit-12a", propertyId: "p-palm", code: "12A", occupancyStatus: "OCCUPIED" },
    { id: "unit-7c", propertyId: "p-palm", code: "7C", occupancyStatus: "OCCUPIED" },
    { id: "unit-2b", propertyId: "p-palm", code: "2B", occupancyStatus: "OCCUPIED" },
  ],
  assignments: [
    { id: "a-sarah", propertyId: "p-palm", userId: "u-sarah", unitId: "unit-4b", occupancyType: "TENANT", isBillingResponsible: true, startsAt: "2024-10-01T00:00:00.000Z", isCurrent: true },
    { id: "a-michael", propertyId: "p-palm", userId: "u-michael", unitId: "unit-12a", occupancyType: "TENANT", isBillingResponsible: true, startsAt: "2025-01-01T00:00:00.000Z", isCurrent: true },
    { id: "a-emma", propertyId: "p-palm", userId: "u-emma", unitId: "unit-7c", occupancyType: "TENANT", isBillingResponsible: true, startsAt: "2024-03-01T00:00:00.000Z", isCurrent: true },
    { id: "a-david", propertyId: "p-palm", userId: "u-david", unitId: "unit-2b", occupancyType: "TENANT", isBillingResponsible: true, startsAt: "2026-04-01T00:00:00.000Z", isCurrent: true },
  ],
  announcements: [
    { id: "ann-1", propertyId: "p-palm", createdByUserId: "u-admin", title: "Pool Maintenance Notice", category: "Maintenance", message: "The main pool will be closed for cleaning this Friday from 8 AM to 2 PM.", time: "2 hours ago" },
    { id: "ann-2", propertyId: "p-palm", createdByUserId: "u-admin", title: "Community BBQ Event", category: "Event", message: "Join us for a community BBQ at the clubhouse next Saturday at 5 PM!", time: "Yesterday" },
  ],
  invoices: [
    { id: "INV-2026-04", propertyId: "p-palm", userId: "u-sarah", unitId: "unit-4b", invoiceNumber: 2001, billingPeriod: "2026-04", issueDate: "2026-04-01", dueDate: "April 5, 2026", status: "ISSUED", subtotal: 2700, previousBalance: 0, total: 2700, paid: 0, items: [
      { id: "item-1", label: "Base Rent (Unit 4B)", amount: 2500 },
      { id: "item-2", label: "Parking Fee (Spot #42)", amount: 150 },
      { id: "item-3", label: "Trash & Utilities", amount: 50 },
    ]},
    { id: "INV-2026-05", propertyId: "p-palm", userId: "u-michael", unitId: "unit-12a", invoiceNumber: 2002, billingPeriod: "2026-05", issueDate: "2026-05-01", dueDate: "May 5, 2026", status: "UNPAID", subtotal: 3100, previousBalance: 0, total: 3100, paid: 0, items: [
      { id: "item-4", label: "Base Rent (Unit 12A)", amount: 2900 },
      { id: "item-5", label: "Parking Fee", amount: 150 },
      { id: "item-6", label: "Utilities", amount: 50 },
    ]},
    { id: "INV-2026-06", propertyId: "p-palm", userId: "u-emma", unitId: "unit-7c", invoiceNumber: 2003, billingPeriod: "2026-05", issueDate: "2026-05-01", dueDate: "May 5, 2026", status: "OVERDUE", subtotal: 2400, previousBalance: 0, total: 2400, paid: 0, items: [
      { id: "item-7", label: "Base Rent (Unit 7C)", amount: 2200 },
      { id: "item-8", label: "Parking Fee", amount: 150 },
      { id: "item-9", label: "Utilities", amount: 50 },
    ]},
  ],
  payments: [
    { id: "pay-1", period: "March 2026", amount: 2700, date: "Mar 3, 2026", method: "Visa .... 4829", status: "Paid" },
    { id: "pay-2", period: "February 2026", amount: 2700, date: "Feb 2, 2026", method: "Visa .... 4829", status: "Paid" },
    { id: "pay-3", period: "January 2026", amount: 2700, date: "Jan 4, 2026", method: "Visa .... 4829", status: "Paid" },
  ],
  tickets: [
    { id: "MR-2038", title: "Leaking sink in the master bathroom", category: "Plumbing", priority: "High", description: "Leaking sink in the master bathroom.", status: "Pending", unit: "Unit 4B", userId: "u-sarah", notes: [] },
    { id: "MR-2039", title: "AC not cooling properly", category: "HVAC", priority: "Medium", description: "AC is running but room remains hot.", status: "In Progress", unit: "Unit 12A", userId: "u-michael", notes: [{ staff: "Technician Ahmed", text: "Checked compressors, ordering coolant." }] },
    { id: "MR-2040", title: "Outlet in kitchen not working", category: "Electrical", priority: "Low", description: "The microwave outlet has no electricity.", status: "Resolved", unit: "Unit 7C", userId: "u-emma", notes: [] },
    { id: "MR-2041", title: "Refrigerator making loud noise", category: "Appliance", priority: "Medium", description: "Loud humming coming from the compressor.", status: "Pending", unit: "Unit 2B", userId: "u-david", notes: [] },
  ],
  passes: [],
  securityLogs: [
    { id: "log-1", time: "14:20", event: "Visitor Entry", details: "John Smith (V-X92B7) verified" },
    { id: "log-2", time: "13:45", event: "Gate Access", details: "Resident Unit 12A entered" },
    { id: "log-3", time: "12:10", event: "Delivery", details: "FedEx delivery verified at gate" },
  ]
};

function getMockDB() {
  let db = localStorage.getItem(MOCK_DB_KEY);
  if (!db) {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  return JSON.parse(db);
}

function saveMockDB(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

// Implement custom routes on standard JSON structures
function handleMock(endpoint, options) {
  const db = getMockDB();
  const currentUser = JSON.parse(localStorage.getItem("diyar_user") || '{"id":"u-sarah","fullName":"Sarah Mitchell","role":"RESIDENT"}');
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  // Auth Routes
  if (endpoint === "/users/login") {
    const user = db.users.find(u => u.email === body.email);
    if (!user) throw new Error("Incorrect email or password");
    // Simulate Auth
    localStorage.setItem("diyar_token", "mock-jwt-token");
    localStorage.setItem("diyar_user", JSON.stringify(user));
    return { status: "success", token: "mock-jwt-token", data: { user } };
  }

  if (endpoint === "/users/signup") {
    const roleUpper = (body.role || "RESIDENT").toUpperCase();
    const newUser = {
      id: "u-" + Date.now().toString(36),
      fullName: body.name || body.fullName || "New User",
      email: body.email,
      role: roleUpper,
      phone: body.phone || "+20100000000",
      status: "ACTIVE",
      propertyId: "p-palm",
    };
    db.users.push(newUser);
    saveMockDB(db);
    localStorage.setItem("diyar_token", "mock-jwt-token");
    localStorage.setItem("diyar_user", JSON.stringify(newUser));
    return { status: "success", token: "mock-jwt-token", data: { user: newUser } };
  }

  if (endpoint === "/users/me") {
    return { status: "success", data: { user: currentUser } };
  }

  // Users Routes
  if (endpoint.startsWith("/users")) {
    const id = endpoint.split("/")[2];
    if (!id) {
      if (method === "POST") {
        const u = { id: "u-" + Date.now(), ...body, status: "ACTIVE" };
        db.users.push(u);
        saveMockDB(db);
        return { status: "success", data: { user: u } };
      }
      return { status: "success", data: { users: db.users } };
    }
    const userIndex = db.users.findIndex(u => u.id === id);
    if (method === "GET") {
      return { status: "success", data: { user: db.users[userIndex] } };
    }
    if (method === "PATCH") {
      db.users[userIndex] = { ...db.users[userIndex], ...body };
      saveMockDB(db);
      return { status: "success", data: { user: db.users[userIndex] } };
    }
    if (method === "DELETE") {
      db.users.splice(userIndex, 1);
      saveMockDB(db);
      return true;
    }
  }

  // Announcements Routes
  if (endpoint.startsWith("/announcements")) {
    const id = endpoint.split("/")[2];
    if (!id) {
      if (method === "POST") {
        const newAnn = {
          id: "ann-" + Date.now(),
          propertyId: "p-palm",
          createdByUserId: currentUser.id,
          time: "Just now",
          ...body,
        };
        db.announcements.unshift(newAnn);
        saveMockDB(db);
        return { status: "success", data: { announcement: newAnn } };
      }
      return { status: "success", data: { announcements: db.announcements } };
    }
    const idx = db.announcements.findIndex(a => a.id === id);
    if (method === "PATCH") {
      db.announcements[idx] = { ...db.announcements[idx], ...body };
      saveMockDB(db);
      return { status: "success", data: { announcement: db.announcements[idx] } };
    }
    if (method === "DELETE") {
      db.announcements.splice(idx, 1);
      saveMockDB(db);
      return true;
    }
  }

  // Properties Routes
  if (endpoint.startsWith("/properties")) {
    return { status: "success", data: { properties: db.properties } };
  }

  // Units Routes
  if (endpoint.startsWith("/units")) {
    return { status: "success", data: { units: db.units } };
  }

  // Assignments Routes
  if (endpoint.startsWith("/assignments")) {
    return { status: "success", data: { assignments: db.assignments } };
  }

  // Invoices Routes
  if (endpoint.startsWith("/invoices")) {
    if (endpoint === "/invoices/publish" && method === "PATCH") {
      db.invoices.forEach(i => { if (i.status === "DRAFT") i.status = "ISSUED"; });
      saveMockDB(db);
      return { status: "success", message: "Invoices published" };
    }
    const invoiceId = endpoint.split("/")[2];
    if (!invoiceId) {
      if (method === "POST") {
        const newInv = {
          id: "INV-" + Date.now(),
          items: [],
          ...body,
        };
        db.invoices.unshift(newInv);
        saveMockDB(db);
        return { status: "success", data: { invoice: newInv } };
      }
      return { status: "success", data: { invoices: db.invoices } };
    }
    const invIdx = db.invoices.findIndex(i => i.id === invoiceId);
    
    // Add item to invoice
    if (endpoint.endsWith("/items") && method === "POST") {
      const newItem = { id: "item-" + Date.now(), ...body };
      db.invoices[invIdx].items.push(newItem);
      db.invoices[invIdx].total += newItem.amount;
      db.invoices[invIdx].subtotal += newItem.amount;
      saveMockDB(db);
      return { status: "success", data: { invoice: db.invoices[invIdx] } };
    }
    if (method === "PATCH") {
      db.invoices[invIdx] = { ...db.invoices[invIdx], ...body };
      saveMockDB(db);
      return { status: "success", data: { invoice: db.invoices[invIdx] } };
    }
    if (method === "DELETE") {
      db.invoices.splice(invIdx, 1);
      saveMockDB(db);
      return true;
    }
    return { status: "success", data: { invoice: db.invoices[invIdx] } };
  }

  // Payments Routes
  if (endpoint === "/payments/cash") {
    const inv = db.invoices.find(i => i.id === body.invoiceId);
    if (inv) {
      inv.status = "PAID";
      inv.paid = inv.total;
    }
    db.payments.unshift({
      id: "pay-" + Date.now(),
      period: inv ? inv.billingPeriod : "May 2026",
      amount: body.amount || 2700,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      method: "Cash / Direct",
      status: "Paid",
    });
    saveMockDB(db);
    return { status: "success", message: "Cash payment recorded" };
  }

  if (endpoint === "/payments/payment-session") {
    // Resident Online Payment mock
    const inv = db.invoices.find(i => i.id === body.invoiceId);
    if (inv) {
      inv.status = "PAID";
      inv.paid = inv.total;
    }
    db.payments.unshift({
      id: "pay-" + Date.now(),
      period: inv ? inv.billingPeriod : "May 2026",
      amount: inv ? inv.total : 2700,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      method: "Visa .... 4829",
      status: "Paid",
    });
    saveMockDB(db);
    return { status: "success", url: "#success" }; // Simulate Stripe redirect
  }

  // Resident views
  if (endpoint === "/resident/overview") {
    const residentInvoices = db.invoices.filter(i => i.userId === currentUser.id);
    const activeInvoice = residentInvoices.find(i => i.status !== "PAID") || null;
    const residentTickets = db.tickets.filter(t => t.userId === currentUser.id);
    const activePasses = db.passes.filter(p => p.status === "ACTIVE" && p.userId === currentUser.id);

    return {
      status: "success",
      data: {
        balance: activeInvoice ? activeInvoice.total : 0,
        invoice: activeInvoice,
        invoices: residentInvoices,
        ticketsCount: residentTickets.length,
        passesCount: activePasses.length,
        announcements: db.announcements.slice(0, 3)
      }
    };
  }

  if (endpoint === "/resident/invoices") {
    const list = db.invoices.filter(i => i.userId === currentUser.id);
    return { status: "success", data: { invoices: list, payments: db.payments } };
  }

  // Admin Dashboard Summaries
  if (endpoint === "/dashboard/summary") {
    const totalRev = db.payments.reduce((sum, p) => sum + p.amount, 0);
    const unpaidInvoices = db.invoices.filter(i => i.status !== "PAID");
    const pendingTickets = db.tickets.filter(t => t.status === "Pending");
    const activeRes = db.users.filter(u => u.role === "RESIDENT" && u.status === "ACTIVE").length;

    return {
      status: "success",
      data: {
        totalResidents: activeRes,
        occupancyRate: 92,
        pendingMaintenance: pendingTickets.length,
        resolvedThisMonth: 45,
        totalRevenue: totalRev,
        unpaidInvoices: unpaidInvoices.length,
      }
    };
  }

  if (endpoint === "/dashboard/billing-summary") {
    return { status: "success", data: { revenueTrend: db.payments.slice(0, 6) } };
  }

  if (endpoint === "/dashboard/maintenance-trends") {
    return { status: "success", data: { pending: 14, resolved: 45 } };
  }

  // Tickets Routes
  if (endpoint.startsWith("/tickets")) {
    const id = endpoint.split("/")[2];
    if (!id) {
      if (method === "POST") {
        const t = {
          id: "MR-" + (2042 + db.tickets.length),
          status: "Pending",
          unit: currentUser.role === "RESIDENT" ? "Unit 4B" : "Unit 12A",
          userId: currentUser.id,
          notes: [],
          ...body,
        };
        db.tickets.unshift(t);
        saveMockDB(db);
        return { status: "success", data: { ticket: t } };
      }
      // Staff filter
      if (currentUser.role === "STAFF") {
        return { status: "success", data: { tickets: db.tickets } };
      }
      // Resident filter
      if (currentUser.role === "RESIDENT") {
        return { status: "success", data: { tickets: db.tickets.filter(t => t.userId === currentUser.id) } };
      }
      return { status: "success", data: { tickets: db.tickets } };
    }
    const tIdx = db.tickets.findIndex(t => t.id === id);
    if (method === "PATCH") {
      db.tickets[tIdx] = { ...db.tickets[tIdx], ...body };
      saveMockDB(db);
      return { status: "success", data: { ticket: db.tickets[tIdx] } };
    }
    if (method === "DELETE") {
      db.tickets.splice(tIdx, 1);
      saveMockDB(db);
      return true;
    }
    return { status: "success", data: { ticket: db.tickets[tIdx] } };
  }

  // Visitor Passes Routes
  if (endpoint.startsWith("/visitor-passes")) {
    const passId = endpoint.split("/")[2];

    // POST /visitor-passes — generate
    if (!passId && method === "POST") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let qrToken = "V-";
      for (let index = 0; index < 6; index += 1) {
        qrToken += chars[Math.floor(Math.random() * chars.length)];
      }
      const p = {
        id: "vp-" + Date.now(),
        visitorId: qrToken,
        status: "ACTIVE",
        guestName: body.guestName,
        visitDate: body.visitDate,
        purpose: body.purpose || "Personal Visit",
        userId: currentUser.id,
        unitId: body.unitId || "unit-4b",
      };
      db.passes.unshift(p);
      saveMockDB(db);
      return { status: "success", data: { visitorPass: p } };
    }

    // POST /visitor-passes/use — scan
    if (passId === "use" && method === "POST") {
      const p = db.passes.find(pass => pass.visitorId === body.token);
      if (!p) throw new Error("Invalid Visitor Pass QR token");
      if (p.status !== "ACTIVE") throw new Error("Pass is no longer active or already scanned");
      p.status = "SCANNED";
      db.securityLogs.unshift({
        id: "log-" + Date.now(),
        time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
        event: "Visitor Entry",
        details: `Visitor ${p.guestName} (${p.visitorId}) scanned at Main Gate`
      });
      saveMockDB(db);
      return { status: "success", data: { visitorPass: p } };
    }

    // PATCH /visitor-passes/:id/cancel
    if (passId && endpoint.endsWith("/cancel") && method === "PATCH") {
      const p = db.passes.find(pass => pass.id === passId);
      if (p) p.status = "CANCELLED";
      saveMockDB(db);
      return { status: "success", data: { visitorPass: p } };
    }

    // GET /visitor-passes — list
    if (!passId && method === "GET") {
      if (currentUser.role === "RESIDENT") {
        return { status: "success", data: { visitorPasses: db.passes.filter(p => p.userId === currentUser.id) } };
      }
      return { status: "success", data: { visitorPasses: db.passes } };
    }
  }

  // Security Logs Routes
  if (endpoint.startsWith("/security-logs")) {
    const logId = endpoint.split("/")[2];
    if (!logId) {
      if (method === "POST") {
        const l = {
          id: "log-" + Date.now(),
          time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
          event: body.eventType || "ENTRY",
          details: body.details || "Security checkpoint verification",
        };
        db.securityLogs.unshift(l);
        saveMockDB(db);
        return { status: "success", data: { securityLog: l } };
      }
      return { status: "success", data: { securityLogs: db.securityLogs } };
    }
  }

  throw new Error(`Mock implementation not found for ${method} ${endpoint}`);
}

// ==========================================
// EXPORTED API WRAPPERS
// ==========================================

const api = {
  // Auth
  async login(email, password) {
    return request("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(name, email, password, role, propertyName) {
    return request("/users/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, passwordConfirm: password, role, propertyName }),
    });
  },

  logout() {
    localStorage.removeItem("diyar_token");
    localStorage.removeItem("diyar_user");
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("diyar_user") || "null");
  },

  // Users
  async getUsers() {
    return request("/users");
  },

  async createUser(data) {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(id, data) {
    return request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Properties & Units
  async getProperties() {
    return request("/properties");
  },

  async getUnits() {
    return request("/units");
  },

  // Invoices & Billing
  async getInvoices() {
    return request("/invoices");
  },

  async getResidentInvoices() {
    return request("/resident/invoices");
  },

  async getResidentOverview() {
    return request("/resident/overview");
  },

  async createInvoice(data) {
    return request("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async publishInvoices() {
    return request("/invoices/publish", {
      method: "PATCH",
    });
  },

  async addInvoiceItem(invoiceId, type, label, amount) {
    return request(`/invoices/${invoiceId}/items`, {
      method: "POST",
      body: JSON.stringify({ type, label, amount }),
    });
  },

  async recordCashPayment(invoiceId, amount) {
    return request("/payments/cash", {
      method: "POST",
      body: JSON.stringify({ invoiceId, amount }),
    });
  },

  async createPaymentSession(invoiceId) {
    return request("/payments/payment-session", {
      method: "POST",
      body: JSON.stringify({ invoiceId }),
    });
  },

  // Dashboard Summary
  async getDashboardSummary() {
    return request("/dashboard/summary");
  },

  // Announcements
  async getAnnouncements() {
    return request("/announcements");
  },

  async createAnnouncement(title, category, message) {
    const user = this.getCurrentUser();
    return request("/announcements", {
      method: "POST",
      body: JSON.stringify({
        propertyId: user?.propertyId || "p-palm",
        createdByUserId: user?.id || "u-admin",
        title, category, message
      }),
    });
  },

  // Maintenance Requests (Tickets)
  async getTickets() {
    return request("/tickets");
  },

  async createTicket(title, category, priority, description) {
    const statusMap = { "Low": "LOW", "Medium": "MEDIUM", "High": "HIGH", "Urgent": "URGENT" };
    return request("/tickets", {
      method: "POST",
      body: JSON.stringify({ title, category, priority: statusMap[priority] || priority.toUpperCase(), description }),
    });
  },

  async updateTicketStatus(id, status, notes = []) {
    const statusMap = { "Pending": "PENDING", "In Progress": "IN_PROGRESS", "Resolved": "RESOLVED" };
    return request(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusMap[status] || status, notes }),
    });
  },

  // Visitor Passes
  async getVisitorPasses() {
    return request("/visitor-passes");
  },

  async generateVisitorPass(guestName, visitDate, purpose, unitId = "unit-4b") {
    return request("/visitor-passes", {
      method: "POST",
      body: JSON.stringify({ unitId, guestName, visitDate, purpose }),
    });
  },

  async useVisitorPass(token) {
    return request("/visitor-passes/use", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async cancelVisitorPass(id) {
    return request(`/visitor-passes/${id}/cancel`, {
      method: "PATCH",
    });
  },

  // Security Logs
  async getSecurityLogs() {
    return request("/security-logs");
  },

  async createSecurityLog(eventType, details) {
    const user = this.getCurrentUser();
    return request("/security-logs", {
      method: "POST",
      body: JSON.stringify({
        propertyId: user?.propertyId || "p-palm",
        actorId: user?.id || "u-security",
        eventType, details
      }),
    });
  }
};
