"""Static browser smoke for the Evolution OS UI. Does not certify accessibility or real API."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'web/evolution.html').read_text()
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('mobile',390,844),('small_mobile',320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        js=[]
        page.on('pageerror',lambda exc:js.append(str(exc)))
        page.set_content(html,wait_until='domcontentloaded')
        page.locator('[data-tab="jobs"]').click()
        assert page.locator('#panel-jobs').is_visible()
        page.locator('[data-tab="god"]').click()
        assert page.locator('#panel-god').is_visible()
        page.locator('[data-tab="overview"]').click()
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(root/f'evolution_{label}.png'),full_page=True)
        dims=page.evaluate('({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
        results.append({'viewport':label,'width':width,**dims,'horizontal_overflow':dims['scroll']>dims['client'],'script_errors':js})
        assert not js,js
        assert dims['scroll']<=dims['client'],dims
        page.close()
    browser.close()
print(json.dumps(results,indent=2))
