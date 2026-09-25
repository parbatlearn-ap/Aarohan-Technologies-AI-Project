# UI smoke test + screenshots against the local preview server (mocked services).
# Usage: node tests/local-server.mjs &  then  python3 tests/screenshots.py
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8888")
OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/screenshots"
os.makedirs(OUT, exist_ok=True)
errors = []

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1366, "height": 860})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE); pg.wait_for_selector("#emp-table tbody tr td:nth-child(2)")
    pg.wait_for_timeout(300); pg.screenshot(path=f"{OUT}/1-dashboard.png")

    pg.click("[data-tab=welcome]"); pg.select_option("#welcome-emp", "EMP-2001")
    pg.click("#btn-preview"); pg.wait_for_function("!document.querySelector('#btn-send').disabled")
    pg.click("#btn-send"); pg.wait_for_selector("#send-out .result")
    pg.screenshot(path=f"{OUT}/2-welcome.png")

    pg.click("[data-tab=policy]"); pg.click("text=Onboarding Day-1"); pg.wait_for_selector("#policy-out .result")
    pg.fill("#chat-in", "How is EMP-1003 doing?"); pg.press("#chat-in", "Enter")
    pg.wait_for_selector(".msg .tools"); pg.screenshot(path=f"{OUT}/3-policy-assistant.png")

    pg.click("[data-tab=progress]"); pg.select_option("#progress-emp", "EMP-1003")
    pg.click("#btn-progress"); pg.wait_for_selector("#progress-out .cards")
    pg.screenshot(path=f"{OUT}/4-progress.png", full_page=True)

    m = b.new_page(viewport={"width": 390, "height": 844})
    m.goto(BASE); m.wait_for_selector("#emp-table tbody tr td:nth-child(2)")
    overflow = m.evaluate("document.documentElement.scrollWidth > window.innerWidth")
    m.screenshot(path=f"{OUT}/5-mobile.png")
    b.close()

print("JS errors:", errors or "none")
print("Mobile horizontal overflow:", overflow)
sys.exit(1 if errors or overflow else 0)
