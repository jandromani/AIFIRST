"""Browser-only smoke. Uses synthetic UI data, never local/private samples."""
from pathlib import Path
import asyncio,json
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.aifirst-ui-history'
OUT.mkdir(exist_ok=True)
DATA={
 'imported':True,'cases':[{'case_id':case,'title':title,'rule':'SYNTHETIC_TEST_RULE','caution':'SYNTHETIC_TEST_FIXTURE','decision':'SECURITY_HOLD' if case=='S04' else 'HEURISTIC_COMPARISON','release_gate':'BLOCKED_NO_INDEPENDENT_BENCHMARK','signals':{'runs':3,'events':64,'evaluations':4,'real_observed_events':0,'derived_events':0,'security_veto':case=='S04','ab_heuristic':{'improved':2,'equal':1,'worsened':1}},'checks':[{'name':'synthetic_gate_validation','passed':True}]} for case,title in [('S04','Límite sensible'),('S11','Prueba A/B heurística')]]
}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
  try:
   for width,height in [(1440,900),(390,844),(320,700)]:
    page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    await page.set_content((ROOT/'web/history.html').read_text(encoding='utf-8'),wait_until='domcontentloaded')
    await page.evaluate('''data=>{window.fetch=async()=>({ok:true,json:async()=>data})}''',DATA)
    await page.locator('#token').fill('SYNTHETIC_BEARER_NEVER_VALID')
    await page.locator('#connect').click()
    await page.locator('[data-case="S04"]').click()
    assert 'SECURITY_HOLD' in await page.locator('#detail').inner_text()
    await page.locator('[data-case="S11"]').click()
    assert 'HEURISTIC_COMPARISON' in await page.locator('#detail').inner_text()
    assert await page.locator('#kPromotion').inner_text()=='0'
    overflow=await page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    assert overflow <= 1,(width,overflow)
    assert not errors,(width,errors)
    await page.screenshot(path=str(OUT/f'history-{width}.png'),full_page=True)
    print(json.dumps({'width':width,'overflow':overflow,'js_errors':errors,'selected':'S11','automatic_promotions':0}))
    await page.close()
  finally:await browser.close()
asyncio.run(main())
