const appState = {
  activeView: "overview",
  tickets: [],
  passes: [],
  isPaid: false,
  activeInvoiceId: null,
  paymentHistory: null,
};

const breadcrumbs = {
  overview: "Overview",
  billing: "Billing & Payments",
  maintenance: "Maintenance Request",
  visitor: "Visitor Pass",
  profile: "My Profile",
};

function initResidentPage() {
  initMobileSidebar();
  initToast();
  bindNavigation();
  bindActions();

  // Load live data first, then render views
  loadResidentData().then(() => {
    renderView("overview");
  });
}

async function loadResidentData() {
  try {
    const overviewRes = await api.getResidentOverview();
    const data = overviewRes.data;

    // Sync invoice from API into local state
    if (data.invoice) {
      residentInvoice.invoiceId = data.invoice.id;
      residentInvoice.dueDate = data.invoice.dueDate;
      residentInvoice.previousBalance = data.invoice.previousBalance || 0;
      residentInvoice.items = data.invoice.items || residentInvoice.items;
      appState.activeInvoiceId = data.invoice.id;
    }

    // Sync tickets count from API
    const ticketsRes = await api.getTickets();
    appState.tickets = (ticketsRes.data.tickets || []).map(t => ({
      ...t,
      priority: { HIGH: "High", MEDIUM: "Medium", LOW: "Low", URGENT: "Urgent" }[t.priority] || t.priority,
      status: { PENDING: "Pending", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", SUBMITTED: "Submitted" }[t.status] || t.status,
    }));

    // Sync passes from API
    const passesRes = await api.getVisitorPasses();
    appState.passes = (passesRes.data.visitorPasses || []).map(p => ({
      id: p.id,
      visitorId: p.visitorId,
      guestName: p.guestName,
      visitDate: p.visitDate,
      purpose: p.purpose,
    }));

    // Sync payment history
    const invoicesRes = await api.getResidentInvoices();
    if (invoicesRes.data.payments) {
      appState.paymentHistory = invoicesRes.data.payments;
    }
  } catch (err) {
    console.warn("[Resident] Falling back to mock data:", err.message);
  }

  renderOverview();
  renderBilling();
  renderMaintenanceList();
  renderPassesList();
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

function bindActions() {
  const payBtn = document.getElementById("pay-now-btn");
  if (payBtn) {
    payBtn.addEventListener("click", handlePayment);
  }

  const maintenanceForm = document.getElementById("maintenance-form");
  if (maintenanceForm) {
    maintenanceForm.addEventListener("submit", handleMaintenanceSubmit);
  }

  const visitorForm = document.getElementById("visitor-form");
  if (visitorForm) {
    visitorForm.addEventListener("submit", handleVisitorSubmit);
  }

  document.querySelectorAll(".close-modal").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("payment-modal").classList.remove("active");
    });
  });
}

function renderView(target) {
  appState.activeView = target;
  setActiveView(target, "resident-active");

  const breadcrumbText = document.getElementById("breadcrumb-text");
  if (breadcrumbText) {
    breadcrumbText.textContent = breadcrumbs[target] || "Billing & Payments";
  }

  if (target === "overview") {
    renderOverview();
  }

  if (target === "billing") {
    renderBilling();
  }

  if (target === "maintenance") {
    renderMaintenanceList();
  }

  if (target === "visitor") {
    renderPassesList();
    const dateInput = document.getElementById("visit-date");
    if (dateInput) {
      dateInput.min = new Date().toISOString().split("T")[0];
    }
  }

  if (target === "profile") {
    // Profile is static for now, but could be rendered dynamically
  }
}

function renderOverview() {
  const total =
    residentInvoice.items.reduce((sum, item) => sum + item.amount, 0) +
    residentInvoice.previousBalance;

  const balanceEl = document.getElementById("overview-balance");
  if (balanceEl) {
    if (appState.isPaid) {
      balanceEl.textContent = "$0";
      balanceEl.style.color = "var(--c-success)";
    } else {
      balanceEl.textContent = "$" + total.toLocaleString();
      balanceEl.style.color = "var(--c-text-primary)";
    }
  }

  const ticketsEl = document.getElementById("overview-tickets");
  if (ticketsEl) {
    ticketsEl.textContent = appState.tickets.length;
  }

  const passesEl = document.getElementById("overview-passes");
  if (passesEl) {
    passesEl.textContent = appState.passes.length;
  }

  const announcementsEl = document.getElementById("overview-announcements");
  if (announcementsEl) {
    announcementsEl.innerHTML = `
      <div class="announcement-item p-4 rounded-xl bg-slate-50 border-l-4 border-primary">
        <p class="bold-text-110 mb-1">Pool Maintenance Notice</p>
        <p class="text-sm text-muted mb-2">The main pool will be closed for cleaning this Friday from 8 AM to 2 PM.</p>
        <span class="text-xs font-semibold text-primary">Posted 2 hours ago</span>
      </div>
      <div class="announcement-item p-4 rounded-xl bg-slate-50 border-l-4 border-accent">
        <p class="bold-text-110 mb-1">Community BBQ Event</p>
        <p class="text-sm text-muted mb-2">Join us for a community BBQ at the clubhouse next Saturday at 5 PM!</p>
        <span class="text-xs font-semibold text-accent">Posted yesterday</span>
      </div>
    `;
  }

  // Bind dashboard quick links
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      renderView(btn.dataset.nav);
    });
  });
}

function renderBilling() {
  const total =
    residentInvoice.items.reduce((sum, item) => sum + item.amount, 0) +
    residentInvoice.previousBalance;

  const currentDueEl = document.getElementById("billing-current-due");
  const invoiceCard = document.getElementById("invoice-card");
  const allCaughtUp = document.getElementById("all-caught-up");

  if (appState.isPaid) {
    currentDueEl.textContent = "$0";
    currentDueEl.style.color = "var(--c-success)";
    invoiceCard.classList.add("hidden");
    allCaughtUp.classList.remove("hidden");
  } else {
    currentDueEl.textContent = "$" + total.toLocaleString();
    currentDueEl.style.color = "var(--c-text-primary)";
    invoiceCard.classList.remove("hidden");
    allCaughtUp.classList.add("hidden");

    const invoiceItemsEl = document.getElementById("invoice-items");
    invoiceItemsEl.innerHTML = "";

    residentInvoice.items.forEach((item) => {
      invoiceItemsEl.innerHTML += `
        <div class="flex-101">
          <span class="text-51">${item.label}</span>
          <span class="bold-text-102">$${item.amount.toLocaleString()}</span>
        </div>
      `;
    });

    document.getElementById("invoice-total").textContent =
      "$" + total.toLocaleString();
    document.getElementById("invoice-due-date").textContent =
      residentInvoice.dueDate;
    document.getElementById("pay-now-btn").innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
      Pay Now - $${total.toLocaleString()}
    `;
  }

  const tbody = document.getElementById("payment-history-body");
  tbody.innerHTML = "";
  paymentHistory.forEach((payment) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="bold-98">${payment.period}</td>
      <td class="bold-98">$${payment.amount.toLocaleString()}</td>
      <td>${payment.date}</td>
      <td>${payment.method}</td>
      <td><span class="badge badge-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${payment.status}</span></td>
    `;
    tbody.appendChild(row);
  });
}

async function handlePayment() {
  document.getElementById("payment-modal").classList.add("active");

  const total = residentInvoice.items.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  document.getElementById("modal-amount").textContent =
    "$" + total.toLocaleString();
  document.getElementById("modal-txn").textContent =
    "TXN-" + Date.now().toString(36).toUpperCase();
  document.getElementById("modal-date").textContent =
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  // Record payment via API
  try {
    if (appState.activeInvoiceId) {
      await api.createPaymentSession(appState.activeInvoiceId);
    }
  } catch (err) {
    console.warn("[Resident] Payment API call failed, recording locally.");
  }

  appState.isPaid = true;
  window.showToast("Payment processed successfully!", "success");
  renderBilling();
}

function handleMaintenanceSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("ticket-title").value;
  const category = document.getElementById("ticket-category").value;
  const priority = document.getElementById("ticket-priority").value;
  const description = document.getElementById("ticket-description").value;

  if (!title || !category || !priority || !description) {
    window.showToast("Please fill in all required fields.", "info");
    return;
  }

  const submitButton = document.getElementById("submit-ticket-btn");
  const originalButtonHtml = submitButton.innerHTML;
  submitButton.innerHTML = '<div class="spinner"></div> Submitting...';
  submitButton.disabled = true;

  setTimeout(async () => {
    const newTicket = {
      id: `MR-${2042 + appState.tickets.length}`,
      title,
      category,
      priority,
      description,
      status: "Submitted",
    };

    // Call API to persist
    try {
      const res = await api.createTicket(title, category, priority, description);
      if (res.data?.ticket) newTicket.id = res.data.ticket.id;
    } catch (err) {
      console.warn("[Resident] Ticket creation fallback to local");
    }

    appState.tickets.unshift(newTicket);

    event.target.reset();
    submitButton.innerHTML = originalButtonHtml;
    submitButton.disabled = false;

    window.showToast(
      `Maintenance request ${newTicket.id} submitted successfully!`,
      "success",
    );

    renderMaintenanceList();
  }, 800);
}

function renderMaintenanceList() {
  const listContainer = document.getElementById("resident-tickets-list");
  const ticketCount = document.getElementById("resident-tickets-count");

  ticketCount.textContent = `(${appState.tickets.length})`;

  if (appState.tickets.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-card premium-card">
        <div class="empty-icon-lg flex-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
        </div>
        <p class="bold-text-105">No tickets yet</p>
        <p class="text-106">Submit a request and it will appear here</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = "";
  appState.tickets.forEach((ticket) => {
    const isHigh = ticket.priority === "High" || ticket.priority === "Urgent";
    const isMedium = ticket.priority === "Medium";

    const color = isHigh
      ? "var(--c-danger)"
      : isMedium
        ? "var(--c-warning)"
        : "var(--c-text-secondary)";

    const card = document.createElement("div");
    card.className = "premium-card anim-scale-in";
    card.style.padding = "24px";
    card.style.marginBottom = "16px";

    card.innerHTML = `
      <div class="mb-12 flex-between">
        <span class="primary-bold-text-108">${ticket.id}</span>
        <span class="badge badge-info"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${ticket.status}</span>
      </div>
      <h4 class="bold-text-110">${ticket.title}</h4>
      <p class="text-111">${ticket.description}</p>
      <div class="text-59 flex-row gap-3">
        <span class="flex-row gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> ${ticket.category}</span>
        <span>-</span>
        <span style="font-weight: 600; color: ${color};">${ticket.priority} Priority</span>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

function handleVisitorSubmit(event) {
  event.preventDefault();

  const guestName = document.getElementById("guest-name").value;
  const visitDate = document.getElementById("visit-date").value;
  const purpose = document.getElementById("visit-purpose").value;

  if (!guestName || !visitDate) {
    window.showToast("Please enter guest name and visit date.", "info");
    return;
  }

  const generateButton = document.getElementById("generate-pass-btn");
  const originalButtonHtml = generateButton.innerHTML;
  generateButton.innerHTML = '<div class="spinner"></div> Generating...';
  generateButton.disabled = true;

  setTimeout(async () => {
    const visitorId = generateVisitorId();
    const newPass = {
      id: Date.now(),
      visitorId,
      guestName,
      visitDate: new Date(visitDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      purpose,
    };

    // Call API to generate pass
    try {
      const res = await api.generateVisitorPass(guestName, visitDate, purpose);
      if (res.data?.visitorPass) {
        newPass.id = res.data.visitorPass.id;
        newPass.visitorId = res.data.visitorPass.visitorId;
      }
    } catch (err) {
      console.warn("[Resident] Pass generation fallback to local");
    }

    appState.passes.unshift(newPass);
    event.target.reset();
    document.getElementById("visit-purpose").value = "Personal Visit";
    generateButton.innerHTML = originalButtonHtml;
    generateButton.disabled = false;

    window.showToast(
      `Visitor pass ${newPass.visitorId} generated successfully!`,
      "success",
    );

    renderPassesList();
  }, 1000);
}

function renderPassesList() {
  const listContainer = document.getElementById("resident-passes-list");
  const passCount = document.getElementById("resident-passes-count");

  passCount.textContent = `(${appState.passes.length})`;

  if (appState.passes.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-card-dashed premium-card">
        <div class="empty-icon-xl flex-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
        </div>
        <p class="bold-text-105">No passes generated yet</p>
        <p class="text-106">Fill in the form to create a visitor pass</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = "";

  appState.passes.forEach((pass) => {
    const card = document.createElement("div");
    card.className = "premium-card anim-scale-in flex-col gap-6";
    card.style.padding = "32px";
    card.style.borderTop = "4px solid var(--c-primary)";
    card.style.marginBottom = "24px";

    const qrCells = Array(225)
      .fill(0)
      .map(() =>
        Math.random() > 0.5
          ? '<div class="qr-cell qr-cell-dark"></div>'
          : '<div class="qr-cell qr-cell-light"></div>',
      )
      .join("");

    card.innerHTML = `
      <div class="items-center flex-col-md-row gap-8">
        <div class="flex-col gap-4 flex-center">
          <div class="qr-code-grid anim-scale-in">${qrCells}</div>
          <p class="bold-text-116">Scan at entrance</p>
        </div>
        <div class="custom-style-117">
          <div class="mb-24 flex-row gap-3">
            <div class="icon-box-sm-primary-119 flex-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div>
              <h4 class="bold-text-120">Digital Visitor Pass</h4>
              <p class="text-121">Valid for single entry</p>
            </div>
          </div>
          <div class="mb-32 flex-col gap-4">
            <div class="text-15 flex-between"><span class="text-text-secondary">Visitor ID</span><span class="bold-123">${pass.visitorId}</span></div>
            <div class="text-15 flex-between"><span class="text-text-secondary">Guest Name</span><span class="bold-13">${pass.guestName}</span></div>
            <div class="text-15 flex-between"><span class="text-text-secondary">Visit Date</span><span class="custom-style-86">${pass.visitDate}</span></div>
            <div class="text-15 flex-between"><span class="text-text-secondary">Purpose</span><span class="custom-style-86">${pass.purpose}</span></div>
            <div class="text-15 flex-between"><span class="text-text-secondary">Host Unit</span><span class="bold-13">Unit 4B - Sarah Mitchell</span></div>
            <div class="text-15 flex-between"><span class="text-text-secondary">Status</span><span class="badge badge-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-4"><polyline points="20 6 9 17 4 12"></polyline></svg> Active</span></div>
          </div>
          <button class="px-6-py-3-1 btn-secondary w-full" data-download-pass>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Pass
          </button>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });

  document.querySelectorAll("[data-download-pass]").forEach((button) => {
    button.addEventListener("click", () => {
      window.showToast("Pass downloaded successfully!", "success");
    });
  });
}

function generateVisitorId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "V-";

  for (let index = 0; index < 6; index += 1) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

document.addEventListener("DOMContentLoaded", initResidentPage);
