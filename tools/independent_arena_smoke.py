"""No network, no browser credentials: render private arena with mocked read API."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data/aifirst_arena_qa')
OUT.mkdir(parents=True,exist_ok=True)
SAMPLE={'runs':[{'id':'arena_example','created':'2026-10-24T10:00:00.000Z','case_count':12,'decision':'RECOMMEND_INDEPENDENT_HUMAN_REVIEW','reason':'Synthetic paired wins without safety regression','report_hash':'4'*64,'summary':{'case_count':12,'incumbent_pass':8,'candidate_pass':12,'wins':4,'losses':0,'ties':8,'candidate_safety_violations':0,'cost_known':True}}]}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(1440,900),(390,844),(320,720)]:
   page=await browser.new_page(viewport={'width':width,'height':height})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content((ROOT/'web/arena.html').read_text(encoding='utf8'))
   await page.evaluate('''data=>{window.fetch=async(url)=>({ok:true,json:async()=>url.endsWith('audit')?{valid:true,checked:1}:data});}''',SAMPLE)
   await page.locator('#token').fill('synthetic-placeholder-not-a-secret')
   await page.locator('#connect').click()
   await page.wait_for_timeout(160)
   assert await page.locator('#runs').inner_text()=='1'
   assert 'RECOMMEND' in await page.locator('#detail').inner_text()
   overflow=await page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
   assert not overflow,(width,'overflow')
   assert not errors,(width,errors)
   await page.screenshot(path=str(OUT/f'arena-{width}.png'),full_page=True)
   print('PASS',width,height,'browser UI, no horizontal overflow or JS errors')
   await page.close()
  await browser.close()
asyncio.run(main())
