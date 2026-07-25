// ─── State ────────────────────────────────────────────────────────
const state = {
  passes: [],
  logs: [],
  scansCount: 42,
  activeVisitorsCount: 8,
};

const breadcrumbs = {
  "gate-control":    "Gate Control",
  "guest-directory": "Guest Directory",
  "access-logs":     "Access Logs",
};

// ─── Audio beep synthesizer ────────────────────────────────────────
function playBeep(success = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx  = new AudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      setTimeout(() => osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1), 100);
      osc.stop(ctx.currentTime + 0.26);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn("[Security] Audio blocked:", e.message);
  }
}

// ─── Live clock ────────────────────────────────────────────────────
function startLiveClock() {
  const el = document.getElementById("sg-live-time");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };
  tick();
  setInterval(tick, 1000);
}

// ─── Auth / profile setup ──────────────────────────────────────────
function setupProfile() {
  let user = api.getCurrentUser();
  if (!user || user.role !== "SECURITY") {
    // Preview mode — inject a default security guard
    user = {
      id: "u-security",
      fullName: "Officer Al-Diyar",
      email: "security.gate@diyar.local",
      role: "SECURITY",
      status: "ACTIVE",
      propertyId: "p-palm",
    };
    localStorage.setItem("diyar_user", JSON.stringify(user));
    localStorage.setItem("diyar_token", "mock-jwt-token");
  }

  const nameEl   = document.getElementById("guard-name");
  const roleEl   = document.getElementById("guard-role");
  const avatarEl = document.getElementById("guard-avatar");

  if (nameEl)   nameEl.textContent = user.fullName || "Security Guard";
  if (roleEl)   roleEl.textContent = "GATE SUPERVISOR";
  if (avatarEl && user.fullName) {
    avatarEl.textContent = user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      api.logout();
      window.showToast("Logged out successfully!", "success");
      setTimeout(() => (window.location.href = "./login.html"), 1000);
    });
  }
}

// ─── Init ─────────────────────────────────────────────────────────
function initSecurityPage() {
  setupProfile();
  initMobileSidebar();
  initToast();
  startLiveClock();
  bindNavigation();
  bindGateForm();
  bindLogForm();
  loadData();
  renderView("gate-control");
}

// ─── Navigation ────────────────────────────────────────────────────
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
  const el = document.getElementById("breadcrumb-text");
  if (el) el.textContent = breadcrumbs[target] || "Gate Control";

  if (target === "guest-directory") loadGuestDirectory();
  if (target === "access-logs")     loadAccessLogs();
}

// ─── Load initial data ─────────────────────────────────────────────
async function loadData() {
  try {
    const [passesRes, logsRes] = await Promise.all([
      api.getVisitorPasses(),
      api.getSecurityLogs(),
    ]);

    state.passes = passesRes.data.visitorPasses || [];
    state.logs   = logsRes.data.securityLogs   || [];

    state.activeVisitorsCount = state.passes.filter((p) => p.status === "ACTIVE").length;
    state.scansCount = state.logs.filter((l) => l.event === "Visitor Entry").length + 42;

    setEl("active-visitors-count", state.activeVisitorsCount);
    setEl("scans-count", state.scansCount);
  } catch (err) {
    console.warn("[Security] Data load failed:", err.message);
  }
}

// ─── Gate verification form ────────────────────────────────────────
function bindGateForm() {
  const form = document.getElementById("manual-verify-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("visitor-token-input");
    const token = input.value.trim().toUpperCase();
    if (!token) return;

    const btn = document.getElementById("manual-verify-btn");
    btn.disabled = true;
    btn.textContent = "Verifying...";

    try {
      const res  = await api.useVisitorPass(token);
      const pass = res.data?.visitorPass || res.visitorPass;

      playBeep(true);
      window.showToast(`✓ Access approved for ${pass.guestName}`, "success");

      showApprovalResult(pass);
      input.value = "";

      state.scansCount += 1;
      setEl("scans-count", state.scansCount);
      await loadData(); // refresh active count
    } catch (err) {
      playBeep(false);
      window.showToast(err.message || "Invalid or already used visitor pass", "info");
      showPlaceholder();
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Verify
      `;
    }
  });
}

function showApprovalResult(pass) {
  hide("result-placeholder");
  const card = document.getElementById("result-access-card");
  card.classList.add("visible");

  setEl("result-pass-id", pass.visitorId);
  setEl("result-guest-name", pass.guestName);
  setEl("result-host-name", "Sarah Mitchell · Unit 4B");
  setEl("result-purpose", pass.purpose || "Personal Visit");
  setEl("result-date", pass.visitDate || "—");

  const badge = document.getElementById("result-status-badge");
  badge.className = "sg-access-badge-approved";
  badge.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    ACCESS APPROVED
  `;
}

function showPlaceholder() {
  show("result-placeholder");
  const card = document.getElementById("result-access-card");
  card.classList.remove("visible");
}

// ─── Guest Directory ──────────────────────────────────────────────
async function loadGuestDirectory() {
  const tbody = document.getElementById("directory-table-body");
  if (!tbody) return;

  tbody.innerHTML = emptyRow(6, "Loading passes...");

  try {
    const res = await api.getVisitorPasses();
    state.passes = res.data.visitorPasses || [];
    renderDirectoryTable(state.passes);
    updateGuestCountLabel(state.passes.length);
  } catch {
    tbody.innerHTML = emptyRow(6, "Failed to load guest directory.");
  }

  // Search binding (once per load)
  const search = document.getElementById("guest-search");
  if (search) {
    search.oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = state.passes.filter(
        (p) =>
          p.guestName.toLowerCase().includes(q) ||
          p.visitorId.toLowerCase().includes(q)
      );
      renderDirectoryTable(filtered);
      updateGuestCountLabel(filtered.length);
    };
  }
}

function updateGuestCountLabel(count) {
  const el = document.getElementById("guest-count-label");
  if (el) el.textContent = `${count} pass${count !== 1 ? "es" : ""} found`;
}

function renderDirectoryTable(list) {
  const tbody = document.getElementById("directory-table-body");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = emptyRow(6, "No guest records found.");
    return;
  }

  tbody.innerHTML = list
    .map((p) => {
      const statusBadge =
        p.status === "ACTIVE"
          ? `<span class="sg-badge sg-badge-active">● ACTIVE</span>`
          : p.status === "SCANNED"
          ? `<span class="sg-badge sg-badge-scanned">✓ SCANNED</span>`
          : `<span class="sg-badge sg-badge-cancelled">✕ CANCELLED</span>`;

      const actionCell =
        p.status === "ACTIVE"
          ? `<button class="sg-btn-danger cancel-pass-btn" data-id="${p.id}">Revoke</button>`
          : `<span style="color: var(--sg-text-muted); font-size: 12px;">—</span>`;

      return `
        <tr>
          <td style="font-family: 'Fira Code', monospace; font-weight: 600; color: var(--sg-blue);">${p.visitorId}</td>
          <td style="font-weight: 600; color: var(--sg-text);">${p.guestName}</td>
          <td><span class="sg-badge sg-badge-purpose">${p.purpose || "—"}</span></td>
          <td style="font-family: 'Fira Code', monospace; font-size: 12px;">${p.visitDate || "—"}</td>
          <td>${statusBadge}</td>
          <td>${actionCell}</td>
        </tr>
      `;
    })
    .join("");

  // Bind revoke buttons
  tbody.querySelectorAll(".cancel-pass-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Revoke this visitor pass? The guest will no longer be able to enter.")) return;
      try {
        await api.cancelVisitorPass(btn.dataset.id);
        window.showToast("Visitor pass revoked successfully.", "success");
        loadGuestDirectory();
      } catch {
        window.showToast("Failed to revoke pass.", "info");
      }
    });
  });
}

// ─── Access Logs ──────────────────────────────────────────────────
async function loadAccessLogs() {
  const tbody = document.getElementById("logs-table-body");
  if (!tbody) return;

  tbody.innerHTML = emptyRow(3, "Loading access logs...");

  try {
    const res = await api.getSecurityLogs();
    state.logs = res.data.securityLogs || [];
    renderLogsTable(state.logs);
  } catch {
    tbody.innerHTML = emptyRow(3, "Failed to load access logs.");
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById("logs-table-body");
  if (!tbody) return;

  if (!logs.length) {
    tbody.innerHTML = emptyRow(3, "No checkpoint events recorded today.");
    return;
  }

  tbody.innerHTML = logs
    .map((l) => {
      const eventNorm = (l.event || "").toUpperCase();
      let badgeClass = "sg-badge-gate";
      if (eventNorm.includes("ENTRY")   || eventNorm === "VISITOR ENTRY") badgeClass = "sg-badge-entry";
      else if (eventNorm.includes("EXIT"))    badgeClass = "sg-badge-exit";
      else if (eventNorm.includes("INCIDENT")) badgeClass = "sg-badge-incident";
      else if (eventNorm.includes("PATROL"))   badgeClass = "sg-badge-patrol";

      return `
        <tr>
          <td style="font-family: 'Fira Code', monospace; font-size: 13px; color: var(--sg-text-muted); white-space: nowrap;">${l.time || "—"}</td>
          <td><span class="sg-badge ${badgeClass}">${l.event || "—"}</span></td>
          <td style="color: var(--sg-text-dim);">${l.details || "—"}</td>
        </tr>
      `;
    })
    .join("");
}

function bindLogForm() {
  const form = document.getElementById("new-log-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type    = document.getElementById("log-event-type").value;
    const details = document.getElementById("log-details").value.trim();
    if (!details) return;

    const btn = form.querySelector("button[type='submit']");
    btn.disabled    = true;
    btn.textContent = "Recording...";

    try {
      await api.createSecurityLog(type, details);
      window.showToast("Security event recorded successfully!", "success");
      form.reset();
      loadAccessLogs();
    } catch {
      window.showToast("Failed to record security log.", "info");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
        Record Event
      `;
    }
  });

  // Refresh button
  const refreshBtn = document.getElementById("refresh-logs-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadAccessLogs();
      window.showToast("Logs refreshed.", "success");
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "";
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:var(--sg-text-muted); padding: 44px 20px; font-size: 13.5px;">${msg}</td></tr>`;
}

// ─── Boot ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initSecurityPage);
