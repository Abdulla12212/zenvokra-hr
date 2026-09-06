#!/usr/bin/env python3
"""Screenshot admin mockups at 1440×900 into the UX design folder."""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "export"
BRAVE = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

PAGES = [
    ("00-design-system.html", "00-admin-design-system.png"),
    ("01-continue.html", "01-continue.png"),
    ("02-dashboard.html", "02-dashboard.png"),
    ("03-employees.html", "03-employees.png"),
    ("04-add-employee.html", "04-add-employee.png"),
    ("05-employee-calendar.html", "05-employee-calendar.png"),
    ("06-employee-leave.html", "06-employee-leave.png"),
    ("07-approvals.html", "07-approvals.png"),
    ("08-organization.html", "08-organization.png"),
]


def main() -> None:
    server = subprocess.Popen(
        ["python3", "-m", "http.server", "8766", "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        for html, png in PAGES:
            dest = OUT / png
            url = f"http://127.0.0.1:8766/{html}"
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
        for path in OUT.glob("*.png"):
            if path.name not in keep:
                path.unlink()
                print(f"removed {path.name}")
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
