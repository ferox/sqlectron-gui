import path from 'path';
import { expect } from 'chai';
import electronPath = require('electron');
import { electron, ElectronApplication, Page } from 'playwright-electron';

const startApp = async ({
  sqlectronHome,
}: {
  sqlectronHome: string;
}): Promise<{ app: ElectronApplication; mainWindow: Page }> => {
  // Start Electron application
  // @ts-ignore
  const app: ElectronApplication = await electron.launch(electronPath, {
    path: electronPath,
    args:
      process.env.DEV_MODE === 'true'
        ? [path.join(__dirname, '../../src/browser/main'), '--dev']
        : [path.join(__dirname, '../../out/browser/main')],
    // MUST pass along the host env variables, otherwise it will
    // crash if we use a custom env variable with tests running with xvfb
    env: Object.assign({}, process.env, {
      SQLECTRON_HOME: sqlectronHome,
    }),
  });

  const mainWindow = await getAppPage(app);

  return { app, mainWindow };
};

const endApp = async (app: ElectronApplication): Promise<void> => {
  // After each test close Electron application.
  await app.close();
};

const wait = (time: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, time));

const getAppPage = async (app: ElectronApplication, { waitAppLoad = true } = {}): Promise<Page> => {
  // Attempt though 25 times waiting 1s between each attempt
  // to get the application page
  for (let attempt = 0; attempt < 25; attempt++) {
    const windows = await app.windows();

    for (let i = 0; i < windows.length; i++) {
      const page = windows[i];
      if ((await page.title()) === 'Sqlectron') {
        if (waitAppLoad) {
          // Wait until the app finished loading
          await page.waitForSelector('.ui');
        }

        return page;
      }
    }

    await wait(1000);
  }

  throw new Error('Could not find application page');
};

const expectToEqualText = async (page: Page, selector: string, text: string): Promise<void> => {
  expect(await page.$eval(selector, (node: HTMLElement) => node.innerText)).to.be.equal(text);
};

export default {
  startApp,
  endApp,
  wait,
  getAppPage,
  expectToEqualText,
};
