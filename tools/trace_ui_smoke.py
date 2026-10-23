"""Chromium-only local static smoke; never loads confidential customer records."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'web/traces.html').read_text()
out=root/'.aifirst-local'/'qa-traces'
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        for w,h in [(1440,900),(390,844),(320,740)]:
            page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(html,wait_until='load')
            assert page.get_by_role('heading',name='The agents leave traces.').count()==1
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'overflow at {w}'
            assert not errors,errors
            page.screenshot(path=str(out/f'traces-{w}.png'),full_page=True)
            page.close()
        print('Trace Intelligence Chromium: 1440 / 390 / 320 PASS, no horizontal overflow or JS errors')
    finally:browser.close()
