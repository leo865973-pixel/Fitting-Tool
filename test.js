const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    console.log('Navigating to workspace...');
    // find a model and click it
    const cards = await page.$$('text="DH 前圍綜合檢具"');
    if (cards.length > 0) {
        await cards[0].click();
        await page.waitForTimeout(1000);

        console.log('Clicking SVG part...');
        // click somewhere in the middle of SVG
        await page.mouse.click(350, 500);
        await page.waitForTimeout(500);

        console.log('Pressing Escape...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        console.log('Testing auto save WO...');
        await page.mouse.click(740, 495); // Focus part 1
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        
        await page.mouse.click(863, 495); // Focus part 2
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // click gap and flush
        await page.mouse.click(802, 652);
        await page.keyboard.type('1');
        await page.mouse.click(802, 833);
        await page.keyboard.type('1');

        console.log('Clicking Save Record...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(b => b.textContent.includes('儲存紀錄'));
            if (saveBtn) saveBtn.click();
        });

        await page.waitForTimeout(1000);
        console.log('Finished waiting. Checking for dialog...');
        const dialogText = await page.evaluate(() => {
            const el = document.querySelector('.fixed.inset-0 h3');
            return el ? el.textContent : 'No dialog';
        });
        console.log('Dialog status:', dialogText);
    } else {
        console.log('Could not find model card');
    }

    await browser.close();
})();
