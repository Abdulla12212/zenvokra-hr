#!/usr/bin/env python3
"""Screenshot employee mockups at 1440×900 into the UX design folder."""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = Path("/Users/abdulla/Documents/Cloudesh_HR/docs/ux-employee/export")
BRAVE = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

PAGES = [
    ("00-design-system.html", "00-cloudesh-design-system.png"),
    ("01-welcome.html", "01-welcome.png"),
    ("02-home.html", "02-home.png"),
    ("03-punch-in.html", "03-punch-in.png"),
    ("04-punch-out.html", "04-punch-out.png"),
    ("05-home-month.html", "05-home-month.png"),
    ("06-edit-punches.html", "06-edit-punches.png"),
    ("07-time-off.html", "07-time-off.png"),
    ("08-request-sheet.html", "08-request-sheet.png"),
    ("09-request-detail.html", "09-request-detail.png"),
    ("10-inbox.html", "10-inbox.png"),
    ("11-profile.html", "11-profile.png"),
    ("12-help.html", "12-help.png"),
]

STALE = [
    "02-today.png",
    "03-day.png",
    "04-correct-day.png",
    "05-time-off.png",
    "06-request-time-off.png",
    "07-request-sheet.png",
    "08-request-detail.png",
    "09-inbox.png",
    "10-profile.png",
    "11-holidays.png",
    "11-home-month.png",
    "13-punch-in.png",
    "14-punch-out.png",
    "15-today-holiday.png",
    "15-home-holiday.png",
    "00-geohr-design-system.png",
    "01-login.png",
    "02-employee-dashboard.png",
    "03-attendance.png",
    "03-attendance-calendar.png",
    "04-attendance-day.png",
    "04-attendance-details.png",
    "05-attendance-correction.png",
    "06-leave-dashboard.png",
    "07-apply-leave.png",
    "07-request-time-off.png",
    "08-leave-from-calendar.png",
    "08-request-from-calendar.png",
    "09-leave-details-pending.png",
    "10-month-summary.png",
    "10-monthly-summary.png",
    "11-work-schedule.png",
    "11-schedule.png",
    "12-holiday-calendar.png",
    "13-inbox.png",
    "13-notifications.png",
    "14-profile.png",
    "15-help.png",
    "15-help-support.png",
]


def main() -> None:
    server = subprocess.Popen(
        ["python3", "-m", "http.server", "8765", "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        for html, png in PAGES:
            dest = OUT / png
            url = f"http://127.0.0.1:8765/{html}"
            subprocess.run(
                [
                    BRAVE,
                    "--headless=new",
                    "--disable-gpu",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=2",
                    "--window-size=1440,900",
                    f"--screenshot={dest}",
                    "--virtual-time-budget=4000",
                    url,
                ],
                check=True,
            )
            print(f"wrote {dest.name}")
        keep = {png for _, png in PAGES}
        keep.add("mushroom-avatar.svg")
        for path in OUT.glob("*.png"):
            if path.name not in keep:
                path.unlink()
                print(f"removed {path.name}")
        for name in STALE:
            path = OUT / name
            if path.exists() and name not in keep:
                path.unlink()
                print(f"removed {name}")
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
