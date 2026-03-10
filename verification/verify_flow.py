from playwright.sync_api import sync_playwright

def test_sanctuary_entry_flow(page):
    page.goto("http://localhost:5173/")

    # Check intro screen visibility
    intro_screen = page.locator("#intro-screen")
    intro_screen.wait_for(state="visible")

    # Take screenshot of the intro screen
    page.screenshot(path="verification/intro_screen.png")
    print("Intro screen screenshot taken.")

    # Click enter button
    enter_button = page.locator("#enter-button")
    enter_button.click()

    # Wait for cinematic title to appear
    cinematic_title = page.locator("#cinematic-title")
    cinematic_title.wait_for(state="visible")

    # Wait a moment for fade in
    page.wait_for_timeout(1000)

    # Take screenshot of the cinematic title
    page.screenshot(path="verification/cinematic_title.png")
    print("Cinematic title screenshot taken.")

    # Wait for cinematic title to disappear (4s timeout + transition time)
    page.wait_for_timeout(4500)

    # Take screenshot of the final UI state
    page.screenshot(path="verification/exploration_ui.png")
    print("Exploration UI screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_sanctuary_entry_flow(page)
        finally:
            browser.close()