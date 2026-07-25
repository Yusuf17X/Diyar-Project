const state = {
  tickets: [],
  filteredTickets: [],
  activeFilter: "all",
  selectedTicket: null,
};

const breadcrumbs = {
  "my-tasks": "My Tasks",
  "update-center": "Update Center",
  "performance": "Performance",
};

function setupAuth() {
  let user = api.getCurrentUser();
  if (!user || user.role !== "STAFF") {
    // Preview Mode: set a mock staff user in localStorage to allow seeing the UI directly
    user = {
      id: "u-technician",
      fullName: "Engineer Ahmed",
      email: "staff.repair@diyar.local",
      role: "STAFF",
      phone: "+20100000006",
      status: "ACTIVE",
      propertyId: "p-palm"
    };
    localStorage.setItem("diyar_user", JSON.stringify(user));
    localStorage.setItem("diyar_token", "mock-jwt-token");
  }

  // Populate user profile in sidebar
  const nameEl = document.getElementById("staff-name");
  const roleEl = document.getElementById("staff-role");
  const avatarEl = document.querySelector(".mp-user-avatar");

  if (nameEl) nameEl.textContent = user.fullName || "Technician";
  if (roleEl) roleEl.textContent = user.role === "STAFF" ? "Senior Technician" : user.role;
  if (avatarEl && user.fullName) {
    avatarEl.textContent = user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Bind logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      api.logout();
      window.showToast("Logged out successfully!", "success");
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1000);
    });
  }
}

function initStaffPage() {
  setupAuth();
  initMobileSidebar();
  initToast();

  bindNavigation();
  bindFilterButtons();
  loadTickets();
  renderView("my-tasks");
}

function bindNavigation() {
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.target;
      if (target) renderView(target);
    });
  });
}

function renderView(target) {
  setActiveView(target);
  const breadcrumbText = document.getElementById("breadcrumb-text");
  if (breadcrumbText) {
    breadcrumbText.textContent = breadcrumbs[target] || "My Tasks";
  }

  // Toggle filters visibility based on target view
  const filtersEl = document.getElementById("topbar-filters");
  if (filtersEl) {
    filtersEl.style.display = target === "my-tasks" ? "flex" : "none";
  }

  if (target === "update-center") {
    renderUpdateCenterList();
    if (state.selectedTicket) {
      renderWorkflowPanel(state.selectedTicket);
    } else {
      // Hide active workflow and show placeholder
      const activeWf = document.getElementById("active-workflow");
      if (activeWf) activeWf.classList.add("hidden");
      const placeholder = document.querySelector("#workflow-panel > div:not(#active-workflow)");
      if (placeholder) placeholder.style.display = "block";
    }
  } else if (target === "performance") {
    renderPerformance();
  }
}

function bindFilterButtons() {
  ["all", "pending", "inprogress", "resolved"].forEach((id) => {
    const btn = document.getElementById(`filter-${id}`);
    if (btn) {
      btn.addEventListener("click", () => {
        state.activeFilter = id;
        document.querySelectorAll("[id^='filter-']").forEach((b) => {
          b.style.borderColor = "var(--mp-border)";
          b.style.color = "var(--mp-text-main)";
        });
        btn.style.borderColor = "var(--mp-amber)";
        btn.style.color = "var(--mp-amber)";
        applyFilter();
      });
    }
  });

  // Highlight "All" initially
  const allBtn = document.getElementById("filter-all");
  if (allBtn) {
    allBtn.style.borderColor = "var(--mp-amber)";
    allBtn.style.color = "var(--mp-amber)";
  }
}

async function loadTickets() {
  try {
    const res = await api.getTickets();
    state.tickets = (res.data.tickets || []).map(t => ({
      ...t,
      priority: { HIGH: "High", MEDIUM: "Medium", LOW: "Low", URGENT: "Urgent" }[t.priority] || t.priority,
      status: { PENDING: "Pending", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" }[t.status] || t.status,
    }));
    applyFilter();
    updateMetrics();
  } catch (error) {
    window.showToast("Failed to load tasks.", "info");
  }
}

function applyFilter() {
  const filter = state.activeFilter;
  if (filter === "all") {
    state.filteredTickets = [...state.tickets];
  } else if (filter === "pending") {
    state.filteredTickets = state.tickets.filter((t) => t.status === "Pending");
  } else if (filter === "inprogress") {
    state.filteredTickets = state.tickets.filter((t) => t.status === "In Progress");
  } else if (filter === "resolved") {
    state.filteredTickets = state.tickets.filter((t) => t.status === "Resolved");
  }
  renderTasksList();
}

function updateMetrics() {
  const pending = state.tickets.filter((t) => t.status === "Pending").length;
  const inProgress = state.tickets.filter((t) => t.status === "In Progress").length;
  const resolved = state.tickets.filter((t) => t.status === "Resolved").length;

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el("staff-pending-count", pending);
  el("staff-inprogress-count", inProgress);
  el("staff-resolved-count", resolved);
  el("perf-resolved", resolved);
}

function renderTasksList() {
  const container = document.getElementById("staff-tickets-list");
  if (!container) return;

  if (state.filteredTickets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 64px; color: var(--mp-text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px auto; display: block;"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        <p style="font-weight: 600; font-size: 16px; color: var(--mp-text-main);">No tasks in this category</p>
        <p style="font-size: 13px; margin-top: 4px;">All clear on this front!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  state.filteredTickets.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = "mp-task-card anim-scale-in";

    const priorityClass =
      ticket.priority === "High" || ticket.priority === "Urgent"
        ? "mp-priority-high"
        : ticket.priority === "Medium"
        ? "mp-priority-medium"
        : "mp-priority-low";

    const statusBadge =
      ticket.status === "Resolved"
        ? `<span class="badge badge-success">${ticket.status}</span>`
        : ticket.status === "In Progress"
        ? `<span class="badge badge-info">${ticket.status}</span>`
        : `<span class="badge badge-warning">${ticket.status}</span>`;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <span style="font-family: monospace; font-size: 13px; color: var(--mp-amber); font-weight: 700;">${ticket.id}</span>
        ${statusBadge}
      </div>
      <h4 style="font-size: 16px; font-weight: 700; margin: 0 0 6px 0; color: var(--mp-text-main);">${ticket.title}</h4>
      <p style="font-size: 13px; color: var(--mp-text-muted); margin: 0 0 14px 0;">${ticket.description}</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <span class="mp-badge ${priorityClass}">${ticket.priority} Priority</span>
        <span style="font-size: 12px; color: var(--mp-text-muted);">${ticket.category}</span>
        <span style="font-size: 12px; color: var(--mp-text-muted);">• ${ticket.unit || "Unknown Unit"}</span>
      </div>
    `;

    // Quick action button
    if (ticket.status !== "Resolved") {
      const quickBtn = document.createElement("button");
      quickBtn.className = "mp-btn-primary";
      quickBtn.style.cssText = "margin-top: 16px; width: 100%; font-size: 13px;";
      quickBtn.textContent = ticket.status === "Pending" ? "→ Start Work" : "→ Mark Resolved";
      quickBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const newStatus = ticket.status === "Pending" ? "In Progress" : "Resolved";
        updateTicketStatus(ticket.id, newStatus);
      });
      card.appendChild(quickBtn);
    }

    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      state.selectedTicket = ticket;
      renderView("update-center");
    });

    container.appendChild(card);
  });
}

function renderUpdateCenterList() {
  const container = document.getElementById("update-tickets-list");
  if (!container) return;

  const open = state.tickets.filter((t) => t.status !== "Resolved");

  if (open.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 0; color: var(--mp-text-muted);">
        <p style="font-weight: 600; color: var(--mp-text-main);">All tasks resolved!</p>
        <p style="font-size: 13px;">Great work. No open items.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  open.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = `mp-task-card${state.selectedTicket?.id === ticket.id ? " active" : ""}`;

    const statusBadge =
      ticket.status === "In Progress"
        ? `<span class="badge badge-info" style="font-size: 11px;">${ticket.status}</span>`
        : `<span class="badge badge-warning" style="font-size: 11px;">${ticket.status}</span>`;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-family: monospace; font-size: 12px; color: var(--mp-amber); font-weight: 700;">${ticket.id}</span>
        ${statusBadge}
      </div>
      <p style="font-size: 14px; font-weight: 600; margin: 0; color: var(--mp-text-main);">${ticket.title}</p>
      <p style="font-size: 12px; color: var(--mp-text-muted); margin-top: 4px;">${ticket.category} · ${ticket.unit || "Unit TBD"}</p>
    `;

    card.addEventListener("click", () => {
      state.selectedTicket = ticket;
      renderUpdateCenterList(); // Re-render to show active state
      renderWorkflowPanel(ticket);
    });

    container.appendChild(card);
  });
}

function renderWorkflowPanel(ticket) {
  document.getElementById("active-workflow").classList.remove("hidden");
  // Remove placeholder
  const placeholder = document.querySelector("#workflow-panel > div:not(#active-workflow)");
  if (placeholder) placeholder.style.display = "none";

  document.getElementById("wf-ticket-id").textContent = ticket.id;
  document.getElementById("wf-ticket-title").textContent = ticket.title;
  document.getElementById("wf-ticket-description").textContent = ticket.description;

  const priorityClass =
    ticket.priority === "High" || ticket.priority === "Urgent"
      ? "mp-priority-high"
      : ticket.priority === "Medium"
      ? "mp-priority-medium"
      : "mp-priority-low";

  const priorityBadge = document.getElementById("wf-priority-badge");
  priorityBadge.className = `mp-badge ${priorityClass}`;
  priorityBadge.textContent = `${ticket.priority} Priority`;

  // Status buttons - highlight current
  document.querySelectorAll(".status-update-btn").forEach((btn) => {
    const isActive = btn.dataset.status === ticket.status;
    if (btn.dataset.status === "Resolved") {
      btn.style.background = isActive ? "#047857" : "#059669";
    } else {
      btn.style.opacity = isActive ? "1" : "0.6";
      btn.style.fontWeight = isActive ? "700" : "600";
    }

    btn.onclick = () => {
      updateTicketStatus(ticket.id, btn.dataset.status, true);
    };
  });

  // Add Note button
  const addNoteBtn = document.getElementById("add-note-btn");
  addNoteBtn.onclick = async () => {
    const noteText = document.getElementById("wf-note-input").value.trim();
    if (!noteText) {
      window.showToast("Please enter a note before appending.", "info");
      return;
    }

    const currentUser = api.getCurrentUser() || { fullName: "Technician" };
    const authorName = currentUser.fullName || "Technician";

    const updatedNotes = [...(ticket.notes || []), { staff: authorName, text: noteText, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }];

    try {
      await api.updateTicketStatus(ticket.id, ticket.status, updatedNotes);
      const ticketInState = state.tickets.find((t) => t.id === ticket.id);
      if (ticketInState) ticketInState.notes = updatedNotes;
      state.selectedTicket = { ...ticketInState };

      document.getElementById("wf-note-input").value = "";
      window.showToast("Note added successfully!", "success");
      renderTimeline(updatedNotes);
    } catch (error) {
      window.showToast("Failed to save note.", "info");
    }
  };

  renderTimeline(ticket.notes || []);
}

function renderTimeline(notes) {
  const timeline = document.getElementById("wf-timeline");
  if (!timeline) return;

  if (notes.length === 0) {
    timeline.innerHTML = `<p style="font-size: 13px; color: var(--mp-text-muted); padding: 16px 0;">No technician notes yet. Add the first note above.</p>`;
    return;
  }

  timeline.innerHTML = notes.map((note, i) => `
    <div class="mp-timeline-item">
      <div class="mp-timeline-dot">${i + 1}</div>
      <div class="mp-timeline-content">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: var(--mp-amber);">${note.staff}</span>
          <span style="font-size: 11px; color: var(--mp-text-muted);">${note.time || "Earlier"}</span>
        </div>
        <p style="margin: 0; color: var(--mp-text-main); font-size: 13.5px;">${note.text}</p>
      </div>
    </div>
  `).join("");
}

async function updateTicketStatus(ticketId, newStatus, fromPanel = false) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return;

  try {
    await api.updateTicketStatus(ticketId, newStatus, ticket.notes || []);
    ticket.status = newStatus;

    window.showToast(`Ticket ${ticketId} updated to "${newStatus}"!`, "success");
    updateMetrics();
    applyFilter();

    if (fromPanel && state.selectedTicket?.id === ticketId) {
      state.selectedTicket.status = newStatus;
      renderWorkflowPanel({ ...ticket, status: newStatus });
      renderUpdateCenterList();
    }
  } catch (error) {
    window.showToast("Failed to update ticket status.", "info");
  }
}

function renderPerformance() {
  const container = document.getElementById("category-breakdown");
  if (!container) return;

  const categories = {};
  state.tickets.forEach((t) => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });

  const total = state.tickets.length || 1;
  const colors = {
    Plumbing: "#3b82f6",
    HVAC: "#d97706",
    Electrical: "#8b5cf6",
    Appliance: "#059669",
    Other: "#94a3b8",
  };

  container.innerHTML = Object.entries(categories).map(([cat, count]) => {
    const pct = Math.round((count / total) * 100);
    const color = colors[cat] || "#94a3b8";
    return `
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 14px;">${cat}</span>
          <span style="font-size: 13px; color: var(--mp-text-muted);">${count} ticket${count > 1 ? "s" : ""} · ${pct}%</span>
        </div>
        <div style="height: 8px; background: var(--mp-surface-alt); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 4px; transition: width 0.6s ease;"></div>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", initStaffPage);
