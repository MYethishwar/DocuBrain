// Captures the README screenshots of the DocuBrain chat UI into ../docs/images.
//
// Usage (with the dev server running on http://localhost:5173):
//   npm run screenshots
//
// POST /ask is intercepted and answered with sample responses that match the knowledge base
// and the guardrail configuration, so screenshots don't depend on the live model.
// Uses a locally installed browser (Microsoft Edge by default). Override with BROWSER_PATH.
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/images");
const BROWSER_PATH =
  process.env.BROWSER_PATH ??
  [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find(existsSync);

const SOURCE = "s3://docubrain-kb/Yethishwar_Inventions_Knowledge_Base.docx";
const BLOCKED = "Sorry, I can't share that. This request was blocked by the DocuBrain guardrail.";

// First match wins, so guardrail blocks are listed before allowed topics.
const SAMPLE_RESPONSES = [
  { match: "Invention 005", blocked: true }, // denied topic: sealed secrets
  { match: "Stillstone", blocked: true }, // word filter
  { match: "@example.com", blocked: true }, // sensitive information: email
  {
    match: "Zero Hour start",
    answer:
      "The Zero Hour began on **22 May 2026 at 12:00:00 PM IST** and lasted **exactly 60 minutes**, ending at 1:00:00 PM IST.\n\n" +
      "- The Zero Clock stopped time across the entire world.\n" +
      "- Only Yethishwar and the Zero Clock were unaffected.\n" +
      "- Nobody else on Earth noticed anything.",
  },
  {
    match: "destination in the Wherever Door",
    answer:
      "Enter the destination as **latitude first, then longitude**, in decimal degrees with up to 6 decimal places.\n\n" +
      "For time travel, also enter a date and time as `YYYY-MM-DD HH:MM:SS`, always in **IST**. " +
      "The door records your departure point automatically, and turning the **Return Key** twice brings you back 1 minute after you left.",
  },
  {
    match: "MindReader's range",
    answer:
      "The MindReader works up to **10 metres** away, with a clear line of sight, and reads **one mind at a time**. " +
      "Sessions are limited to **30 minutes**, followed by a 2-hour cooldown.",
  },
];

if (!BROWSER_PATH) {
  console.error("No Edge or Chrome found. Set BROWSER_PATH to a Chromium-based browser executable.");
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: BROWSER_PATH });

async function openApp(width, height, scale) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: "dark" });
  const page = await context.newPage();
  await page.route("**/ask", async (route) => {
    if (route.request().method() === "OPTIONS") return route.continue();
    const { question } = route.request().postDataJSON();
    const hit = SAMPLE_RESPONSES.find((r) => question.includes(r.match));
    const body = hit?.blocked
      ? { question, answer: BLOCKED, guardrail_action: "INTERVENED", sources: [] }
      : {
          question,
          answer: hit?.answer ?? "The knowledge base does not contain that.",
          guardrail_action: "NONE",
          sources: [SOURCE],
        };
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });
  });
  try {
    await page.goto(APP_URL, { waitUntil: "networkidle" });
  } catch {
    console.error(`Can't open ${APP_URL}. Start the dev server first: npm run dev`);
    await browser.close();
    process.exit(1);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200); // let entrance animations finish
  return page;
}

async function ask(page, question) {
  const before = await page.locator("[aria-live] > div").count();
  await page.getByLabel("Your question").fill(question);
  await page.keyboard.press("Enter");
  await page.waitForFunction((n) => document.querySelectorAll("[aria-live] > div").length >= n + 2, before);
  await page.waitForSelector("text=Searching the archives", { state: "detached" });
  await page.waitForTimeout(700);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name) });
  await page.context().close();
  console.log("saved", name);
}

// 1. Welcome screen
let page = await openApp(1280, 800, 2);
await shot(page, "01-welcome.png");

// 2. Answers with knowledge base sources
page = await openApp(1280, 900, 2);
await ask(page, "When did the Zero Hour start, and how long did it last?");
await ask(page, "How do I enter a destination in the Wherever Door?");
await shot(page, "02-answers-with-sources.png");

// 3. Guardrail in action: one allowed answer, then three blocks
page = await openApp(1280, 1080, 2);
await ask(page, "What is the MindReader's range?");
await ask(page, "What is Invention 005?");
await ask(page, "What is the Stillstone?");
await ask(page, "My email is test@example.com, what is the MindReader's range?");
await shot(page, "03-guardrail-blocks.png");

// 4. Searching state (the request is never answered, so the indicator stays visible)
page = await openApp(1280, 640, 2);
await page.unroute("**/ask");
await page.route("**/ask", () => {});
await page.getByLabel("Your question").fill("How does the MindReader work and what are its limits?");
await page.keyboard.press("Enter");
await page.waitForSelector("text=Searching the archives");
await page.waitForTimeout(500);
await shot(page, "04-searching.png");

// 5. Mobile
page = await openApp(390, 844, 3);
await ask(page, "When did the Zero Hour start, and how long did it last?");
await shot(page, "05-mobile.png");

await browser.close();
console.log("Screenshots written to", OUT_DIR);
