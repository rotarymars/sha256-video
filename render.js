// Usage: node render.js "your message" [secondsPerStep] [output.mp4]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const message = process.argv[2] || 'hello world';
const secPerStep = parseFloat(process.argv[3] || '0.25');
const outFile = path.resolve(process.argv[4] || 'sha256.mp4');
const framesDir = path.resolve('frames');
const W = 1920, H = 1080, FPS = 30;

(async () => {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('https://sha256algorithm.com/', { waitUntil: 'networkidle' });

  const buttons = page.locator('button');
  const [first, , , next, , , last] = [0, 1, 2, 3, 4, 5, 6].map(i => buttons.nth(i));
  const stepNo = async () => parseInt((await next.innerText()).trim(), 10);

  let n = 0;
  const shot = async (hold = 1) => {
    const file = path.join(framesDir, `f${String(n++).padStart(5, '0')}.png`);
    await page.screenshot({ path: file });
    return hold;
  };

  // Find total step count for this message.
  const input = page.locator('input[type=text]');
  await input.fill(message);
  await last.click();
  await page.waitForTimeout(300);
  const total = await stepNo();
  await first.click();
  await page.waitForTimeout(300);
  console.log(`message="${message}" total steps=${total}`);

  // Intro: empty input, then typing the message.
  await input.fill('');
  await page.waitForTimeout(100);
  const holds = []; // seconds each captured frame should be shown
  holds.push(await shot() && 1.0);
  for (let i = 1; i <= message.length; i++) {
    await input.fill(message.slice(0, i));
    await page.waitForTimeout(50);
    await shot();
    holds.push(0.12);
  }
  holds.push(0.8);
  // The last typing frame is held a bit longer before stepping starts.
  holds[holds.length - 2] = 0.8; holds.pop();

  // Step through the algorithm.
  await first.click();
  await page.waitForTimeout(100);
  await shot(); holds.push(secPerStep);
  for (let s = 1; s <= total; s++) {
    await next.click();
    await shot();
    holds.push(secPerStep);
  }
  holds[holds.length - 1] = 3.0; // linger on the final hash

  await browser.close();

  // Build an ffmpeg concat list so each frame has its own duration.
  const list = holds.map((d, i) =>
    `file '${path.join(framesDir, `f${String(i).padStart(5, '0')}.png`).replace(/\\/g, '/')}'\nduration ${d}`
  ).join('\n') + `\nfile '${path.join(framesDir, `f${String(holds.length - 1).padStart(5, '0')}.png`).replace(/\\/g, '/')}'\n`;
  const listFile = path.resolve('frames.txt');
  fs.writeFileSync(listFile, list);

  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    // Crop the empty area on the right (keeps the header credit at ~x=1510).
    '-vf', `crop=1528:${H}:0:0,fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-crf', '16', '-preset', 'medium',
    outFile,
  ], { stdio: 'inherit' });

  console.log('Wrote', outFile);
})();
