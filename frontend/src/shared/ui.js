function initMobileSidebar() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  if (!mobileMenuBtn || !sidebar || !sidebarOverlay) {
    return;
  }

  const closeMenu = () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
  };

  const toggleMenu = () => {
    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");
  };

  mobileMenuBtn.addEventListener("click", toggleMenu);
  sidebarOverlay.addEventListener("click", closeMenu);

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

function initToast() {
  const toastContainer = document.getElementById("toast-container");

  window.showToast = (message, type = "success") => {
    if (!toastContainer) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const isSuccess = type === "success";
    const iconColor = isSuccess ? "var(--c-success)" : "var(--c-info)";
    const iconBg = isSuccess
      ? "var(--c-success-subtle)"
      : "var(--c-info-subtle)";
    const iconSvg = isSuccess
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    toast.innerHTML = `
      <div class="flex-center" style="width: 24px; height: 24px; border-radius: 50%; background: ${iconBg}; color: ${iconColor};">
        ${iconSvg}
      </div>
      ${message}
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  };
}

function setActiveView(targetView, activeClass = "active") {
  const links = document.querySelectorAll(".sidebar-link");
  const views = document.querySelectorAll(".page-content");

  links.forEach((link) => {
    // Always clear the base active state and any role-specific active class.
    link.classList.remove("active");
    link.classList.remove(activeClass);
    if (link.dataset.target === targetView) {
      link.classList.add("active");
      link.classList.add(activeClass);
    }
  });

  views.forEach((view) => view.classList.remove("active"));
  const activeViewEl = document.getElementById(targetView);
  if (activeViewEl) {
    activeViewEl.classList.add("active");
  }
}
