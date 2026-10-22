"""Static browser smoke: does NOT attest authenticated HTTP, Lighthouse or WCAG AA."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
views=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width,height in [(1440,900),(390,844),(320,780)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content((root/'web/pilot.html').read_text())
        page.locator('[data-view="connections"]').first.click()
        visible=page.locator('#view-connections').is_visible()
        overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        assert visible and not overflow and not errors, (width,height,visible,overflow,errors)
        views.append({'width':width,'height':height,'connections_visible':visible,'overflow':overflow,'errors':errors})
        page.close()
    browser.close()
print(json.dumps({'kind':'STATIC_CHROMIUM_ONLY','views':views,'real_services_tested':False,'wcag_certified':False},indent=2))
