"""Chromium offline smoke: actual controls, calculations, gating and responsive UX.
No network, no credentials, no Docker. Requires playwright Chromium.
"""
from pathlib import Path
import asyncio,json,os,shutil
from playwright.async_api import async_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'web/demo.html').read_text(encoding='utf-8')
output=Path(os.environ.get('AIFIRST_THEATER_SHOTS',str(root/'artifacts'/'theater')))
output.mkdir(parents=True,exist_ok=True)

async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('AIFIRST_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
  results=[]
  for width,height in [(1440,900),(390,844),(320,760)]:
   page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   await page.set_content(html,wait_until='load')
   await page.screenshot(path=str(output/f'AIFIRST_THEATER_{width}.png'),full_page=True)
   await page.locator('a[data-nav="arena"]').click()
   await page.locator('#panel-arena').wait_for(state='visible')
   await page.locator('#arena-run').click()
   assert (await page.locator('#arena-inc').inner_text())=='4/6'
   assert (await page.locator('#arena-new').inner_text())=='5/6'
   assert (await page.locator('#arena-status').inner_text())=='CANDIDATO'
   await page.locator('#arena-human').check()
   await page.locator('#arena-promote').click()
   assert 'Canary ficticio' in (await page.locator('#arena-decision').inner_text())
   await page.locator('#arena-rollback').click()
   assert 'Rollback completado' in (await page.locator('#arena-decision').inner_text())
   await page.locator('#arena-candidate').select_option('outsider')
   await page.locator('#arena-run').click()
   assert (await page.locator('#arena-status').inner_text())=='BLOQUEADO'
   assert await page.locator('#arena-promote').is_disabled()
   await page.locator('a[data-nav="dios"]').click()
   await page.locator('#panel-dios').wait_for(state='visible')
   await page.locator('[data-voter="AG-01"]').select_option('yes')
   await page.locator('[data-voter="AG-02"]').select_option('yes')
   await page.locator('[data-voter="AG-03"]').select_option('yes')
   await page.locator('[data-voter="AG-04"]').select_option('yes')
   await page.locator('[data-voter="AG-05"]').select_option('no')
   await page.locator('#god-gate').check()
   assert await page.locator('#god-adopt').is_disabled()
   await page.locator('[data-voter="AG-05"]').select_option('yes')
   assert await page.locator('#god-adopt').is_enabled()
   await page.locator('#god-adopt').click()
   assert (await page.locator('#god-version').inner_text())=='V2'
   assert await page.locator('#god-adopt').is_disabled()
   async with page.expect_download() as god_download:
    await page.locator('#god-export').click()
   assert (await god_download.value).suggested_filename=='aifirst-dios-synthetic-proof.json'
   await page.locator('a[data-nav="discovery"]').click()
   await page.locator('#panel-discovery').wait_for(state='visible')
   assert (await page.locator('#dis-rows tr').count())==10
   await page.locator('#dis-budget').fill('15')
   await page.locator('#dis-risk').fill('20')
   assert int(await page.locator('#dis-eligible').inner_text())<=2
   await page.locator('#dis-run').click()
   assert 'DEMO-CHECKSUM' in (await page.locator('#dis-receipt').inner_text())
   # bounded public-only download
   async with page.expect_download() as item:
    await page.locator('#dis-export').click()
   assert (await item.value).suggested_filename=='aifirst-discovery-synthetic-proof.json'
   overflow=await page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   assert not overflow, f'horizontal overflow at {width}px'
   assert not errors,errors
   results.append({'viewport':width,'tests':'discovery/arena/dios/rollback/download','page_errors':errors,'overflow':overflow,'status':'PASS'})
   await page.close()
  await browser.close()
  print(json.dumps({'tests':results,'static_offline':True,'customer_results':False},indent=2))

if __name__=='__main__': asyncio.run(run())
