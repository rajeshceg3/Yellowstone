from playwright.sync_api import sync_playwright
import os

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        app_url = os.environ.get("APP_URL", "http://localhost:5173/")
        print(f"Navigating to app at {app_url}...")
        page.goto(app_url)

        print("Waiting for canvas...")
        page.wait_for_selector("canvas.webgl")

        print("Waiting for region name...")
        page.wait_for_selector("#region-name")

        # Verify text content
        region_name = page.locator("#region-name").inner_text()
        print(f"Region name found: {region_name}")

        assert "GEYSER BASIN" in region_name.upper(), f"Region name verification failed. Expected 'Geyser Basin', got '{region_name}'"
        print("Region name verification passed.")

        # Wait a bit for Three.js to render something
        page.wait_for_timeout(2000)

        print("Taking screenshot...")
        page.screenshot(path="verification/app_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_app()
