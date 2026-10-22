#!/usr/bin/env python3
"""Static Chromium smoke of AIFIRST marketing and console. No network, no real credentials.
Install: pip install playwright && python -m playwright install chromium
This is NOT a production HTTP/CSP, accessibility certification or enterprise E2E test.
"""
from pathlib import Path
import argparse
import json
import os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
def run(folder):
    folder.mkdir(parents=True,exist_ok=True)
    results=[]
    with sync_playwright() as playwright:
        browser_bin=os.environ.get("AIFIRST_CHROMIUM_PATH")
        if not browser_bin and Path("/usr/bin/chromium").exists():
            browser_bin="/usr/bin/chromium"
        options={"headless":True,"args":["--no-sandbox"]}
        if browser_bin:
            options["executable_path"]=browser_bin
        browser=playwright.chromium.launch(**options)
        try:
            for file,kind in [("index.html","landing"),("pilot.html","console")]:
                markup=(ROOT/"web"/file).read_text(encoding="utf8")
                for width,height,device in [(1440,900,"desktop"),(390,844,"mobile")]:
                    page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
                    errors=[]
                    page.on("pageerror",lambda exc:errors.append(str(exc)))
                    page.set_content(markup,wait_until="load")
                    scrollwidth=page.locator("html").evaluate("el=>el.scrollWidth")
                    assert scrollwidth<=width+2, f"Overflow {kind}/{device}: {scrollwidth}>{width}"
                    if kind=="landing":
                        assert "Tu próxima ventaja" in page.locator("h1").inner_text()
                        page.locator('[data-case="quality"]').click()
                        assert "Más pruebas." in page.locator("#case-title").inner_text()
                        page.locator('[data-case="operations"]').click()
                        assert "Procesos invisibles." in page.locator("#case-title").inner_text()
                        page.locator('[data-case="docs"]').click()
                    else:
                        assert page.locator(".delivery").count()==11
                        if device=="mobile":
                            page.locator("#menu").click()
                            assert page.locator("#sidebar").is_visible()
                        page.locator('[data-view="evidence"]').click()
                        page.locator("#deliverable-search").fill("EX05")
                        assert page.locator(".delivery").count()==1
                        page.locator("#deliverable-search").fill("")
                        assert page.locator(".delivery").count()==11
                    assert not errors,errors
                    path=folder/f"{kind}_{device}.png"
                    page.screenshot(path=str(path),full_page=True)
                    results.append({"page":kind,"device":device,"viewport":[width,height],"horizontal_overflow":False,"js_errors":0,"screenshot":str(path)})
                    page.close()
        finally:
            browser.close()
    print(json.dumps({"status":"PASS_STATIC_RENDER_ONLY","cases":len(results),"results":results,"note":"No authenticated browser API, CSP, or real integrations are tested"},indent=2))
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=ROOT/"artifacts"/"uiux-smoke")
    run(parser.parse_args().output)
