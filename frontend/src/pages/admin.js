const breadcrumbs = {
  dashboard: "Dashboard",
  residents: "Resident Management",
  billing: "Billing & Invoices",
  maintenance: "Maintenance Overview",
  announcements: "Announcements",
  security: "Security & Access Control",
};

const adminData = {
  residents: [
    { name: "Sarah Mitchell", unit: "4B", contact: "sarah.m@example.com", status: "Active", joined: "Oct 2024" },
    { name: "Michael Chang", unit: "12A", contact: "m.chang@example.com", status: "Active", joined: "Jan 2025" },
    { name: "Emma Watson", unit: "7C", contact: "emma.w@example.com", status: "Active", joined: "Mar 2024" },
    { name: "David Miller", unit: "2B", contact: "d.miller@example.com", status: "Pending", joined: "Apr 2026" },
  ],
  billing: [
    { id: "INV-2026-04", resident: "Sarah Mitchell", amount: "$2,700", due: "Apr 5, 2026", status: "Paid" },
    { id: "INV-2026-05", resident: "Michael Chang", amount: "$3,100", due: "May 5, 2026", status: "Unpaid" },
    { id: "INV-2026-06", resident: "Emma Watson", amount: "$2,400", due: "May 5, 2026", status: "Overdue" },
  ],
  announcements: [
    { title: "Pool Maintenance", category: "Maintenance", time: "2 hours ago", message: "Main pool closed for cleaning." },
    { title: "BBQ Event", category: "Event", time: "Yesterday", message: "Join us for community BBQ." },
  ],
  securityLogs: [
    { time: "14:20", event: "Visitor Entry", details: "John Smith (V-X92B7) verified" },
    { time: "13:45", event: "Gate Access", details: "Resident Unit 12A entered" },
    { time: "12:10", event: "Delivery", details: "FedEx delivery verified" },
  ]
};

function initAdminPage() {
  initMobileSidebar();
  initToast();

  bindNavigation();
  bindModalActions();

  // Load live data then render
  loadAdminDashboard();
  renderView("dashboard");
}

async function loadAdminDashboard() {
  try {
    const res = await api.getDashboardSummary();
    const data = res.data;
    // Merge live data into adminMetrics
    adminMetrics.totalResidents = data.totalResidents ?? adminMetrics.totalResidents;
    adminMetrics.pendingMaintenance = data.pendingMaintenance ?? adminMetrics.pendingMaintenance;
    adminMetrics.totalRevenue = data.totalRevenue ?? adminMetrics.totalRevenue;
    adminMetrics.unpaidInvoices = data.unpaidInvoices ?? adminMetrics.unpaidInvoices;
  } catch (e) {
    console.warn("[Admin] Falling back to mock metrics:", e.message);
  }

  populateAdminDashboard();
  await loadMaintenanceTickets();
  await loadResidents();
  await loadBilling();
  await loadAnnouncements();
  await loadSecurityLogs();
}

function bindNavigation() {
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.target;
      if (target) {
        renderView(target);
      }
    });
  });
}

function bindModalActions() {
  const modal = document.getElementById("admin-modal");
  const scannerModal = document.getElementById("scanner-modal");
  const modalTitle = document.getElementById("admin-modal-title");
  const modalSubtitle = document.getElementById("admin-modal-subtitle");
  const modalBody = document.getElementById("admin-modal-body");
  const closeBtn = document.getElementById("close-admin-modal");
  const confirmBtn = document.getElementById("confirm-admin-modal");

  const openModal = (title, subtitle, bodyHtml) => {
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalBody.innerHTML = bodyHtml;
    modal.classList.add("active");
  };

  const closeModal = () => {
    modal.classList.remove("active");
  };

  // Add Resident
  document.getElementById("add-resident-btn")?.addEventListener("click", () => {
    openModal("Add New Resident", "Register a new tenant in the compound", `
      <div class="grid-2 gap-4">
        <div>
          <label class="form-label mb-2 block">Full Name</label>
          <input type="text" class="form-input" placeholder="e.g. John Doe">
        </div>
        <div>
          <label class="form-label mb-2 block">Email Address</label>
          <input type="email" class="form-input" placeholder="john@example.com">
        </div>
        <div>
          <label class="form-label mb-2 block">Unit Number</label>
          <input type="text" class="form-input" placeholder="e.g. 4B">
        </div>
        <div>
          <label class="form-label mb-2 block">Phone Number</label>
          <input type="tel" class="form-input" placeholder="+1 234 567 890">
        </div>
      </div>
    `);
  });

  // Batch Invoice
  document.getElementById("batch-invoice-btn")?.addEventListener("click", () => {
    openModal("Generate Batch Invoices", "Create invoices for all active residents", `
      <div class="flex-col gap-4">
        <div>
          <label class="form-label mb-2 block">Billing Period</label>
          <select class="form-input">
            <option>May 2026</option>
            <option>June 2026</option>
          </select>
        </div>
        <div class="p-4 bg-slate-50 rounded-xl border">
          <p class="text-sm font-semibold mb-2">Summary</p>
          <div class="flex-between text-xs mb-1"><span>Target Residents:</span><span>1,248</span></div>
          <div class="flex-between text-xs mb-1"><span>Base Rate:</span><span>$2,500</span></div>
          <div class="flex-between text-xs font-bold mt-2 border-t pt-2"><span>Estimated Total:</span><span>$3,120,000</span></div>
        </div>
      </div>
    `);
  });

  // New Announcement
  document.getElementById("new-announcement-btn")?.addEventListener("click", () => {
    openModal("New Announcement", "Draft a message for all residents", `
      <div class="flex-col gap-4">
        <div>
          <label class="form-label mb-2 block">Announcement Title</label>
          <input id="ann-title" type="text" class="form-input" placeholder="Title of notice">
        </div>
        <div>
          <label class="form-label mb-2 block">Category</label>
          <select id="ann-category" class="form-input">
            <option value="GENERAL">General</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Security">Security</option>
            <option value="Event">Event</option>
          </select>
        </div>
        <div>
          <label class="form-label mb-2 block">Message</label>
          <textarea id="ann-message" class="form-input" rows="4" placeholder="Type your message here..."></textarea>
        </div>
      </div>
    `);
  });

  // Security Scanner
  document.getElementById("verify-visitor-btn")?.addEventListener("click", () => {
    const idInput = document.getElementById("visitor-id-input");
    const id = idInput.value;
    
    if (!id) {
        // If no ID, open scanner
        scannerModal.classList.add("active");
        // No auto-close timer anymore
    } else {
        window.showToast(`Verifying ${id}...`, "info");
        setTimeout(() => {
            window.showToast(`Visitor ${id} verified successfully!`, "success");
            idInput.value = ""; // Clear input
        }, 1000);
    }
  });

  closeBtn.addEventListener("click", closeModal);
  confirmBtn.addEventListener("click", async () => {
    // If in new announcement context, save it via API
    const annTitle = document.getElementById("ann-title");
    const annCategory = document.getElementById("ann-category");
    const annMessage = document.getElementById("ann-message");
    if (annTitle && annCategory && annMessage) {
      try {
        await api.createAnnouncement(annTitle.value, annCategory.value, annMessage.value);
        window.showToast("Announcement published!", "success");
        await loadAnnouncements();
      } catch (err) {
        window.showToast("Failed to post announcement.", "info");
      }
    } else {
      window.showToast("Action completed successfully!", "success");
    }
    closeModal();
  });

  document.getElementById("close-scanner")?.addEventListener("click", () => {
      scannerModal.classList.remove("active");
  });
}

function renderView(target) {
  setActiveView(target);
  const breadcrumbText = document.getElementById("breadcrumb-text");
  if (breadcrumbText) {
    breadcrumbText.textContent = breadcrumbs[target] || "Dashboard";
  }
}

async function loadResidents() {
  try {
    const res = await api.getUsers();
    const users = (res.data.users || []).filter(u => u.role === 'RESIDENT');
    adminData.residents = users.map(u => ({
      id: u.id,
      name: u.fullName,
      unit: u.unit || 'N/A',
      contact: u.email,
      status: u.status === 'ACTIVE' ? 'Active' : 'Pending',
      joined: u.joined || 'N/A',
    }));
  } catch (e) {
    console.warn("[Admin] Using default residents data");
  }
  renderResidentsTable();
}

function renderResidentsTable() {
  const tbody = document.getElementById("admin-residents-table-body");
  if (!tbody) return;
  tbody.innerHTML = adminData.residents.map((r, index) => `
    <tr>
      <td class="bold-text-98">${r.name}</td>
      <td class="bold-text-102">${r.unit}</td>
      <td>${r.contact}</td>
      <td><span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-warning'}">${r.status}</span></td>
      <td>${r.joined}</td>
      <td><button class="text-link-sm edit-res-btn" data-index="${index}">Edit</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll(".edit-res-btn").forEach(btn => {
      btn.addEventListener("click", () => {
          const res = adminData.residents[btn.dataset.index];
          const modal = document.getElementById("admin-modal");
          document.getElementById("admin-modal-title").textContent = "Edit Resident";
          document.getElementById("admin-modal-subtitle").textContent = `Modifying details for ${res.name}`;
          document.getElementById("admin-modal-body").innerHTML = `
            <div class="grid-2 gap-4">
                <div>
                <label class="form-label mb-2 block">Full Name</label>
                <input type="text" class="form-input" value="${res.name}">
                </div>
                <div>
                <label class="form-label mb-2 block">Email Address</label>
                <input type="email" class="form-input" value="${res.contact}">
                </div>
                <div>
                <label class="form-label mb-2 block">Unit Number</label>
                <input type="text" class="form-input" value="${res.unit}">
                </div>
                <div>
                <label class="form-label mb-2 block">Joined Date</label>
                <input type="text" class="form-input" value="${res.joined}">
                </div>
            </div>
          `;
          modal.classList.add("active");
      });
  });
}

async function loadBilling() {
  try {
    const res = await api.getInvoices();
    const invoices = res.data.invoices || [];
    adminData.billing = invoices.map(inv => ({
      id: inv.id,
      resident: inv.residentName || inv.userId,
      amount: `$${(inv.total || 0).toLocaleString()}`,
      due: inv.dueDate,
      status: inv.status === 'PAID' ? 'Paid' : inv.status === 'OVERDUE' ? 'Overdue' : 'Unpaid',
    }));
  } catch (e) {
    console.warn("[Admin] Using default billing data");
  }
  renderBillingTable();
}

function renderBillingTable() {
  const tbody = document.getElementById("admin-billing-table-body");
  if (!tbody) return;
  tbody.innerHTML = adminData.billing.map(b => `
    <tr>
      <td class="primary-bold-99">${b.id}</td>
      <td class="bold-text-98">${b.resident}</td>
      <td class="bold-text-98">${b.amount}</td>
      <td>${b.due}</td>
      <td><span class="badge ${b.status === 'Paid' ? 'badge-success' : b.status === 'Unpaid' ? 'badge-warning' : 'badge-danger'}">${b.status}</span></td>
      <td><button class="text-link-sm">Remind</button></td>
    </tr>
  `).join('');
}

async function loadAnnouncements() {
  try {
    const res = await api.getAnnouncements();
    adminData.announcements = res.data.announcements || adminData.announcements;
  } catch (e) {
    console.warn("[Admin] Using default announcements");
  }
  renderAnnouncements();
}

function renderAnnouncements() {
  const list = document.getElementById("admin-announcements-list");
  if (!list) return;
  list.innerHTML = adminData.announcements.map(a => `
    <div class="announcement-item p-4 rounded-xl bg-slate-50 border-l-4 ${a.category === 'Maintenance' ? 'border-primary' : 'border-accent'}">
      <div class="flex-between mb-1">
        <p class="bold-text-110">${a.title}</p>
        <span class="text-xs text-muted">${a.time}</span>
      </div>
      <p class="text-sm text-muted mb-2">${a.message}</p>
      <span class="badge badge-info text-xs">${a.category}</span>
    </div>
  `).join('');
}

async function loadSecurityLogs() {
  try {
    const res = await api.getSecurityLogs();
    adminData.securityLogs = res.data.securityLogs || adminData.securityLogs;
  } catch (e) {
    console.warn("[Admin] Using default security logs");
  }
  renderSecurityLogs();
}

function renderSecurityLogs() {
  const tbody = document.getElementById("security-logs-body");
  if (!tbody) return;
  tbody.innerHTML = adminData.securityLogs.map(l => `
    <tr>
      <td class="text-text-secondary">${l.time}</td>
      <td class="bold-text-98">${l.event}</td>
      <td>${l.details}</td>
    </tr>
  `).join('');
}

function populateAdminDashboard() {
  document.getElementById("val-total-residents").textContent =
    adminMetrics.totalResidents;
  document.getElementById("val-pending-maint").textContent =
    adminMetrics.pendingMaintenance;
  document.getElementById("val-revenue").textContent =
    "$" + adminMetrics.totalRevenue.toLocaleString();
  document.getElementById("val-unpaid").textContent =
    adminMetrics.unpaidInvoices;

  renderRevenueChart();
  renderOccupancyChart();
  renderActivityTable();
}

function renderRevenueChart() {
  const chartContainer = document.getElementById("revenue-bar-chart");
  chartContainer.innerHTML = "";

  const maxAmount = Math.max(...revenueByMonth.map((d) => d.amount));

  revenueByMonth.forEach((entry, index) => {
    const isLast = index === revenueByMonth.length - 1;
    const height = (entry.amount / maxAmount) * 100;

    chartContainer.innerHTML += `
      <div class="bar-container">
        <div class="bar" style="width: 100%; height: ${height}%; background: ${isLast ? "var(--c-primary)" : "var(--c-primary-subtle)"};" title="$${entry.amount.toLocaleString()}"></div>
        <span class="bold-text-91">${entry.month}</span>
      </div>
    `;
  });
}

function renderOccupancyChart() {
  const donutChart = document.getElementById("occupancy-donut");
  const donutLegend = document.getElementById("occupancy-legend");
  const occupancyRateValue = document.getElementById("occupancy-rate-val");

  const total = occupancyData.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;

  const segments = occupancyData.map((item) => {
    const start = (cumulative / total) * 360;
    cumulative += item.value;
    const end = (cumulative / total) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  });

  donutChart.style.background = `conic-gradient(${segments.join(", ")})`;
  occupancyRateValue.textContent = `${adminMetrics.occupancyRate}%`;

  donutLegend.innerHTML = "";
  occupancyData.forEach((item) => {
    donutLegend.innerHTML += `
      <div class="flex-row gap-2">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${item.color};"></div>
        <span class="text-93">${item.label} <span class="text-text-muted">(${item.value})</span></span>
      </div>
    `;
  });
}

function renderActivityTable() {
  const tbody = document.getElementById("activity-table-body");
  tbody.innerHTML = "";

  recentActivity.forEach((item) => {
    const iconByType = {
      payment:
        '<div class="custom-style-95 metric-card-icon icon-success"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>',
      maintenance:
        '<div class="custom-style-95 metric-card-icon icon-accent"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></div>',
      system:
        '<div class="custom-style-95 metric-card-icon icon-primary"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>',
    };

    const badgeByStatus = {
      completed: '<span class="badge badge-success">Completed</span>',
      pending: '<span class="badge badge-warning">Pending</span>',
      warning: '<span class="badge badge-danger">Alert</span>',
    };

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${iconByType[item.type] || iconByType.system}</td>
      <td class="custom-style-96">${item.description}</td>
      <td class="font-500">${item.resident}</td>
      <td class="bold-98">${item.amount || "-"}</td>
      <td><span class="text-text-secondary flex-row gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${item.time}</span></td>
      <td>${badgeByStatus[item.status] || ""}</td>
    `;

    tbody.appendChild(row);
  });
}

async function loadMaintenanceTickets() {
  try {
    const res = await api.getTickets();
    const tickets = (res.data.tickets || []).map(t => ({
      id: t.id,
      unit: t.unit || t.unitId || "—",
      category: t.category || "Other",
      description: t.description || t.title || "",
      priority: { HIGH: "High", MEDIUM: "Medium", LOW: "Low", URGENT: "Urgent" }[t.priority] || t.priority || "Medium",
      status: { PENDING: "Pending", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" }[t.status] || t.status || "Pending",
    }));
    tickets.forEach(t => maintenanceRequests.push(t));
  } catch (e) {
    console.warn("[Admin] Using default maintenance data");
  }
  populateAdminMaintenance();
}

function populateAdminMaintenance() {
  document.getElementById("val-maint-pending").textContent =
    adminMetrics.pendingMaintenance;
  document.getElementById("val-maint-resolved").textContent =
    adminMetrics.resolvedThisMonth;

  const tbody = document.getElementById("admin-maint-table-body");
  tbody.innerHTML = "";

  maintenanceRequests.forEach((request) => {
    const priorityBadge =
      request.priority === "High" || request.priority === "Urgent"
        ? `<span class="badge badge-danger">${request.priority}</span>`
        : request.priority === "Medium"
          ? `<span class="badge badge-warning">${request.priority}</span>`
          : `<span class="badge badge-info">${request.priority}</span>`;

    const statusBadge =
      request.status === "Pending"
        ? `<span class="badge badge-warning">${request.status}</span>`
        : request.status === "In Progress"
          ? `<span class="badge badge-info">${request.status}</span>`
          : `<span class="badge badge-success">${request.status}</span>`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="primary-bold-99">${request.id}</td>
      <td class="bold-98">${request.unit}</td>
      <td>${request.category}</td>
      <td class="text-truncate">${request.description}</td>
      <td>${priorityBadge}</td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", initAdminPage);
