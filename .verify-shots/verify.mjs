// One-off verification script. Loads /library at desktop + mobile,
// in night and day mode, captures any 404 image requests and console
// errors, and screenshots each combination.
import { chromium, devices } from 'playwright';

const URL = 'http://localhost:4321/';
const results = [];

const browser = await chromium.launch();

async function run({ name, viewport, mode }) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.failure()?.errorText || 'failed'}  ${req.url()}`);
  });
  page.on('response', (resp) => {
    if (resp.status() >= 400) failedRequests.push(`${resp.status()}  ${resp.url()}`);
  });

  // Force theme by setting localStorage BEFORE the page loads anything.
  await ctx.addInitScript((m) => {
    try { localStorage.setItem('yuval-theme', m); } catch {}
  }, mode);

  await page.goto(URL, { waitUntil: 'networkidle' });
  // Make sure the right theme class is on <html>.
  await page.evaluate((m) => {
    if (m === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, mode);
  // Wait a beat for the theme transition.
  await page.waitForTimeout(700);

  const shot = `.verify-shots/${name}.png`;
  await page.screenshot({ path: shot, fullPage: false });

  const dayKnowledgeRefs = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    return {
      day_spring: (html.match(/day-spring/g) || []).length,
      library_ai_core: (html.match(/library-ai-core/g) || []).length,
      knowledge_spring_asset: (html.match(/knowledge_spring/g) || []).length,
      knowledge_ai_core_asset: (html.match(/knowledge_ai_core/g) || []).length,
    };
  });

  results.push({ name, viewport, mode, consoleErrors, failedRequests, dayKnowledgeRefs, shot });
  await ctx.close();
}

await run({ name: 'desktop-night', viewport: { width: 1440, height: 900 }, mode: 'dark' });
await run({ name: 'desktop-day',   viewport: { width: 1440, height: 900 }, mode: 'light' });
await run({ name: 'mobile-night',  viewport: { width: 390,  height: 844 }, mode: 'dark' });
await run({ name: 'mobile-day',    viewport: { width: 390,  height: 844 }, mode: 'light' });

await browser.close();

console.log(JSON.stringify(results, null, 2));
