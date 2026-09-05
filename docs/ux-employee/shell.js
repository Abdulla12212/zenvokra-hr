const ICONS = {
  calendar:
    '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  bell: '<path d="M6 16h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4z"/><path d="M10 16a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M6 19a6 6 0 0 1 12 0"/>',
  help: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.4-1.2.8-1.2 1.6V14"/><path d="M12 17h.01"/>',
};

const PLANE =
  '<svg class="plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12h8l10-8v16L10 12"/></svg>';

function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

const NAV = [
  { id: "home", label: "Home", icon: "calendar" },
  { id: "leave", label: "Time off", icon: "sun" },
  { id: "inbox", label: "Inbox", icon: "bell", badge: 2 },
];

const AUGUST_HOURS = {
  3: "8h 05m",
  4: "8h 12m",
  5: "7h 58m",
  6: "8h 00m",
  7: "8h 21m",
  10: "8h 04m",
  11: "8h 18m",
  13: "8h 02m",
  14: "8h 09m",
  17: "8h 06m",
  18: "8h 11m",
};

const LATE_IN = {
  12: "09:35",
  19: "09:42",
};

window.Cloudesh = {
  svg,
  mount(active) {
    document.getElementById("sidebar").innerHTML = `
      <div class="brand">
        <div class="brand-mark">C</div>
        <div class="brand-name">Cloudesh</div>
      </div>
      <nav class="nav">
        ${NAV.map((item) => navItem(item, active)).join("")}
      </nav>
      <div class="sidebar-user">
        <img class="avatar" src="assets/mushroom-avatar.svg" alt="" />
        <div>
          <strong>Akram Hossain</strong>
          <span>EMP-1024</span>
          <span class="loc">Dhaka HQ</span>
        </div>
      </div>
    `;
  },
  month(
    target,
    {
      selected = 20,
      range = [],
      compact = false,
      month = "august",
      clockedIn = true,
    } = {},
  ) {
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const august = [
      null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
      14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      null, null, null, null, null, null,
    ];
    const september = [
      null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, null, null, null, null,
    ];
    const days = month === "september" ? september : august;
    const weekend =
      month === "september"
        ? new Set([5, 6, 12, 13, 19, 20, 26, 27])
        : new Set([1, 2, 8, 9, 15, 16, 22, 23, 29, 30]);
    const present = month === "august" ? new Set(Object.keys(AUGUST_HOURS).map(Number)) : new Set();
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
      if (compact) {
        const sel = n === 25 || n === 26;
        el.innerHTML += `<div style="height:28px;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:500;${sel ? "background:var(--primary);color:var(--primary-foreground)" : weekend.has(n) ? "color:var(--muted-foreground)" : ""}">${n}</div>`;
        return;
      }

      const isToday = n === today;
      const isWeekend = weekend.has(n);
      const isHoliday = holiday.has(n);
      const isLeave = leave.has(n);
      const isLate = late.has(n);
      const isPresent = present.has(n);
      const isFutureWeekday =
        month === "august" && n > 20 && !isWeekend && !isLeave && !isHoliday;
      const isSeptWeekday = month === "september" && !isWeekend && !isHoliday;

      const cls = [
        "cal-cell",
        isWeekend && !isHoliday ? "is-muted" : "",
        isToday ? "is-today" : "",
        n === selected || range.includes(n) ? "is-selected" : "",
        isLate ? "is-late" : "",
        isLeave ? "is-leave" : "",
        isHoliday ? "is-closed" : "",
      ]
        .filter(Boolean)
        .join(" ");

      let meta = "";
      if (isToday && clockedIn) {
        meta = `<div class="cal-cell-meta"><strong>6h 32m</strong><span>Active</span></div>`;
      } else if (isToday && !clockedIn) {
        meta = `<div class="cal-cell-meta"><span>Due 09:00</span></div>`;
      } else if (isLate) {
        meta = `<div class="cal-cell-meta"><strong>Late</strong><span>${LATE_IN[n]}</span></div>`;
      } else if (isLeave) {
        meta = `<div class="cal-cell-meta">${PLANE}<span>Annual Leave</span></div>`;
      } else if (isHoliday) {
        meta = `<div class="cal-cell-meta"><strong>Closed</strong></div>`;
      } else if (isPresent) {
        meta = `<div class="cal-cell-meta"><strong>${AUGUST_HOURS[n]}</strong></div>`;
      } else if (isFutureWeekday || isSeptWeekday) {
        meta = `<div class="cal-cell-meta"><span>Scheduled</span></div>`;
      } else if (isWeekend) {
        meta = `<div class="cal-cell-meta"><span>Weekend</span></div>`;
      }

      let dot = "";
      if (isToday) dot = `<i class="dot" style="background:var(--primary)"></i>`;
      else if (isLate) dot = `<i class="dot dot-warn"></i>`;
      else if (isLeave) dot = `<i class="dot dot-off"></i>`;
      else if (isHoliday) dot = `<i class="dot dot-holiday"></i>`;
      else if (isPresent) dot = `<i class="dot dot-ok"></i>`;

      el.innerHTML += `<div class="${cls}"><div class="cal-cell-top"><div class="num">${n}</div>${dot}</div>${meta}</div>`;
    });
  },
};

function navItem(item, active) {
  const on = item.id === active ? " is-active" : "";
  const badge = item.badge ? `<span class="badge">${item.badge}</span>` : "";
  return `<div class="nav-item${on}">${svg(item.icon)} ${item.label}${badge}</div>`;
}
