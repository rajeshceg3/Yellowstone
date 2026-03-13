from playwright.sync_api import sync_playwright

def verify_intro_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local app
        page.goto("http://localhost:5173")

        # Wait for the intro screen to load
        page.wait_for_selector("#intro-screen", state="attached")

        # Wait a moment for rendering and animation
        page.wait_for_timeout(2000)

        # Take a screenshot of the intro screen
        page.screenshot(path="verification/intro_screen.png")

        print("Intro screen screenshot saved to verification/intro_screen.png")
        browser.close()

if __name__ == "__main__":
    verify_intro_screen()
