const ICONS = {
  calendar:
    '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  bell: '<path d="M6 16h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4z"/><path d="M10 16a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M6 19a6 6 0 0 1 12 0"/>',
  help: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.4-1.2.8-1.2 1.6V14"/><path d="M12 17h.01"/>',
};

function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

const NAV = [
  { id: "home", label: "Home", icon: "calendar" },
  { id: "leave", label: "Time off", icon: "sun" },
  { id: "inbox", label: "Inbox", icon: "bell", badge: 2 },
];

window.Zenvokra = {
  svg,
  mount(active) {
    document.getElementById("sidebar").innerHTML = `
      <div class="brand">
        <div class="brand-mark">Z</div>
        <div class="brand-name">Zenvokra</div>
      </div>
      <nav class="nav">
        ${NAV.map((item) => navItem(item, active)).join("")}
      </nav>
      <div class="sidebar-user">
        <img class="avatar" src="assets/mushroom-avatar.svg" alt="" />
        <div>
          <strong>Akram Hossain</strong>
          <span>EMP-1024</span>
        </div>
      </div>
    `;
  },
  month(target, { selected = 20, range = [], compact = false, month = "august" } = {}) {
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const august = [
      null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null, null, null, null, null, null,
    ];
    const september = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, null, null, null, null];
    const days = month === "september" ? september : august;
    const weekend =
      month === "september"
        ? new Set([5, 6, 12, 13, 19, 20, 26, 27])
        : new Set([1, 2, 8, 9, 15, 16, 22, 23, 29, 30]);
    const present = month === "august" ? new Set([3, 4, 5, 6, 7, 10, 11, 13, 14, 17, 18]) : new Set();
    const late = month === "august" ? new Set([12, 19]) : new Set();
    const leave = month === "august" ? new Set([25, 26]) : new Set();
    const holiday = month === "september" ? new Set([5]) : new Set([15]);
    const today = month === "august" ? 20 : null;
    const el = typeof target === "string" ? document.getElementById(target) : target;
    el.innerHTML = dow.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    days.forEach((n) => {
      if (n === null) {
        el.innerHTML += `<div class="cal-cell is-empty"></div>`;
        return;
      }
      const cls = [
        "cal-cell",
        weekend.has(n) ? "is-muted" : "",
        n === today ? "is-today" : "",
        n === selected || range.includes(n) ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      let mark = "";
      if (!compact) {
        if (present.has(n)) mark = `<div class="mark"><i class="dot dot-ok"></i>8h</div>`;
        if (late.has(n)) mark = `<div class="mark"><i class="dot dot-warn"></i>Late</div>`;
        if (leave.has(n)) mark = `<div class="mark"><i class="dot dot-off"></i>Off</div>`;
        if (holiday.has(n)) mark = `<div class="mark"><i class="dot dot-holiday"></i>Closed</div>`;
        if (n === today) mark = `<div class="mark"><i class="dot" style="background:var(--primary)"></i>Now</div>`;
      } else if (n === 25 || n === 26) {
        mark = `<div class="mark"><i class="dot dot-off"></i></div>`;
      }
      if (compact) {
        const sel = n === 25 || n === 26;
        el.innerHTML += `<div style="height:28px;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:500;${sel ? "background:var(--primary);color:var(--primary-foreground)" : weekend.has(n) ? "color:var(--muted-foreground)" : ""}">${n}</div>`;
        return;
      }
      el.innerHTML += `<div class="${cls}"><div class="num">${n}</div>${mark}</div>`;
    });
  },
};

function navItem(item, active) {
  const on = item.id === active ? " is-active" : "";
  const badge = item.badge ? `<span class="badge">${item.badge}</span>` : "";
  return `<div class="nav-item${on}">${svg(item.icon)} ${item.label}${badge}</div>`;
}
