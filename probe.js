const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('https://sha256algorithm.com/', { waitUntil: 'networkidle' });
  console.log('title:', await p.title());
  const info = await p.evaluate(() => ({
    inputs: [...document.querySelectorAll('input,textarea,button,select')].map(e => ({
      tag: e.tagName, type: e.type, id: e.id, cls: e.className, ph: e.placeholder, val: e.value, txt: (e.innerText||'').slice(0,40)
    })),
    h: document.documentElement.scrollHeight,
    animations: document.getAnimations().length
  }));
  console.log(JSON.stringify(info, null, 1));
  await p.screenshot({ path: 'probe.png' });
  await b.close();
})();
