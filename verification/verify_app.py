from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173/")

        print("Waiting for canvas...")
        page.wait_for_selector("canvas.webgl")

        print("Waiting for region name...")
        page.wait_for_selector("#region-name")

        # Verify text content
        region_name = page.locator("#region-name").inner_text()
        print(f"Region name found: {region_name}")

        if "GEYSER BASIN" in region_name.upper():
            print("Region name verification passed.")
        else:
            print(f"Region name verification failed. Expected 'Geyser Basin', got '{region_name}'")

        # Wait a bit for Three.js to render something
        page.wait_for_timeout(2000)

        print("Taking screenshot...")
        page.screenshot(path="verification/app_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_app()
