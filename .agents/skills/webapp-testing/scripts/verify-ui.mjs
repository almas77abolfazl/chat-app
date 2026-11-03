import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('d:/projects/chat-app/chat-app-front/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost...');
  await page.goto('http://localhost', { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log('Page title:', title);

  await page.screenshot({ path: 'webapp-test-home.png' });
  console.log('Screenshot saved to webapp-test-home.png');

  await browser.close();
})();

