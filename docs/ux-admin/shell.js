const ICONS = {
  layout:
    '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.2"/><path d="M16 19a5 5 0 0 0 5-4"/>',
  check:
    '<path d="M8 12.5 10.5 15 16 9"/><rect x="4" y="4" width="16" height="16" rx="2"/>',
  building:
    '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M9 20v-4h6v4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 16h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4z"/><path d="M10 16a2 2 0 0 0 4 0"/>',
  sliders:
    '<path d="M5 8h14M5 16h14"/><circle cx="9" cy="8" r="1.6"/><circle cx="15" cy="16" r="1.6"/>',
};

function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout" },
  { id: "employees", label: "Employees", icon: "users", badge: "48" },
  { id: "approvals", label: "Approvals", icon: "check", badge: "4", alert: true },
  { id: "organization", label: "Organization", icon: "building" },
];

function navItem(item, active) {
  const on = item.id === active ? " is-active" : "";
  const badgeClass = item.alert ? " badge is-alert" : "badge";
  const badge = item.badge ? `<span class="${badgeClass}">${item.badge}</span>` : "";
  return `<div class="nav-item${on}">${svg(item.icon)} ${item.label}${badge}</div>`;
}

window.CloudeshAdmin = {
  svg,
  mount(active) {
    document.getElementById("sidebar").innerHTML = `
      <div class="brand">
        <div class="brand-mark">C</div>
        <div class="brand-stack">
          <div class="brand-name">Cloudesh Admin</div>
          <div class="brand-sub">Acme Consulting</div>
        </div>
      </div>
      <nav class="nav">
        ${NAV.map((item) => navItem(item, active)).join("")}
      </nav>
      <div class="sidebar-user">
        <img class="avatar" src="assets/mushroom-avatar.svg" alt="" />
        <div>
          <strong>Akram Hossain</strong>
          <span class="role">Admin · Dhaka HQ</span>
        </div>
      </div>
    `;
  },
  topbar(extra = "") {
    return `
      <div class="topbar-meta">Thu 20 Aug 2026 · 09:42 AM · Asia/Dhaka HQ</div>
      <div class="topbar-search">
        ${svg("search")}
        Quick search or jump…
        <span class="kbd">⌘K</span>
      </div>
      <div class="row">
        ${extra}
        <div class="icon-btn">
          ${svg("bell")}
          <span class="ping"></span>
        </div>
        <div class="icon-btn">${svg("sliders")}</div>
        <div class="avatar-initials">AH</div>
      </div>
    `;
  },
};
