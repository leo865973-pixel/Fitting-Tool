const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    console.log('Taking screenshot of the homepage...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'homepage_debug.png' });
    console.log('Screenshot saved to homepage_debug.png');
    await browser.close();
    process.exit(0);
        await cards[0].click();
        await page.waitForTimeout(1000);

        console.log('=== TEST 1: ESC Key ===');
        // Click on SVG to select a custom point
        await page.mouse.click(400, 400);
        await page.waitForTimeout(500);
        let sidebarInput = await page.$('input[placeholder="標準"]');
        console.log('Is sidebar open after click?', !!sidebarInput);
        
        console.log('Pressing Escape...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        sidebarInput = await page.$('input[placeholder="標準"]');
        console.log('Is sidebar open after ESC?', !!sidebarInput);

        console.log('=== TEST 2: Middle Mouse Pan ===');
        // Get initial viewBox
        let viewBox = await page.$eval('svg', el => el.getAttribute('viewBox'));
        console.log('Initial viewBox:', viewBox);
        
        // Middle mouse drag
        await page.mouse.move(400, 400);
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(300, 300, { steps: 10 });
        await page.mouse.up({ button: 'middle' });
        await page.waitForTimeout(500);

        let newViewBox = await page.$eval('svg', el => el.getAttribute('viewBox'));
        console.log('ViewBox after middle mouse drag:', newViewBox);

        console.log('=== TEST 3: Auto-Save WO ===');
        // Click on SVG again to open sidebar
        await page.mouse.click(400, 400);
        await page.waitForTimeout(500);
        
        // Input some data
        await page.mouse.click(802, 652); // Gap input
        await page.keyboard.type('1');
        
        console.log('Clicking Save Record...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(b => b.textContent.includes('儲存紀錄'));
            if (saveBtn) saveBtn.click();
        });
        await page.waitForTimeout(1000);

        const dialogTitle = await page.evaluate(() => {
            const el = document.querySelector('.fixed.inset-0 h3');
            return el ? el.textContent : 'No dialog';
        });
        console.log('Dialog status:', dialogTitle);
        
        // Check for toast
        const toast = await page.evaluate(() => {
            const el = document.querySelector('.fixed.bottom-4.right-4 div');
            return el ? el.textContent : 'No toast';
        });
        console.log('Toast status:', toast);

    await browser.close();
})();
