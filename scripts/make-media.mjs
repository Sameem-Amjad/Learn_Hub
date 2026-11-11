/**
 * Builds LearnHub's demo media from scripts/hub-content.mjs into
 * scripts/.media/ (git-ignored): one narrated slide video per video lesson,
 * the library's PDFs, the audio session (MP3) and the EPUB.
 * scripts/seed-hub.mjs uploads them to the private storage bucket.
 *
 *   DEEPGRAM_API_KEY=… PLAYWRIGHT_CORE=/path/to/playwright-core CHROME=/path/to/chrome \
 *     node scripts/make-media.mjs
 *
 * Needs ffmpeg, ffprobe and zip on the PATH. Narration is cached, so re-runs
 * only call the speech API for changed text.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { COURSES, LESSONS, MEDIA } from "./hub-content.mjs";

const OUT = new URL("./.media/", import.meta.url).pathname;
const VOICE = "aura-2-thalia-en";
const KEY = process.env.DEEPGRAM_API_KEY;
if (!KEY || !process.env.PLAYWRIGHT_CORE || !process.env.CHROME) {
  console.error("✗ set DEEPGRAM_API_KEY, PLAYWRIGHT_CORE and CHROME");
  process.exit(1);
}
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE);
for (const d of ["tts", "slides", "lessons", "library", "work"]) fs.mkdirSync(OUT + d, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "ignore", "inherit"] });
const seconds = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

async function speak(text) {
  const file = `${OUT}tts/${crypto.createHash("sha1").update(VOICE + text).digest("hex")}.wav`;
  if (fs.existsSync(file)) return file;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`https://api.deepgram.com/v1/speak?model=${VOICE}&encoding=linear16&sample_rate=24000&container=wav`, {
        method: "POST",
        headers: { Authorization: `Token ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
      const audio = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(`${file}.part`, audio);
      fs.renameSync(`${file}.part`, file); // never leave a half-written file in the cache
      return file;
    } catch (e) {
      if (attempt >= 5) throw e;
      console.log(`  TTS retry ${attempt}: ${String(e.message ?? e).slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ACCENT = { insider: "#f6a43a", core: "#2bb3c9", pro: "#c084fc" };

function slideHtml({ course, lesson, slide, n, total }) {
  const accent = ACCENT[course.required_tier];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:1280px;height:720px;font-family:-apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif;color:#eef2f7;
    background:radial-gradient(900px 500px at 0% 0%,${accent}33,transparent),radial-gradient(700px 400px at 100% 100%,#26aecc22,transparent),#0d1520;overflow:hidden}
  .wrap{position:absolute;inset:64px 88px;display:flex;flex-direction:column}
  .top{display:flex;justify-content:space-between;font-size:20px;color:#9fb0c3;letter-spacing:.02em}
  .brand{font-weight:700;color:#eef2f7}.brand b{color:${accent}}
  h1{font-size:${n === 1 ? 64 : 54}px;line-height:1.08;margin:auto 0 28px;max-width:1000px;letter-spacing:-.01em}
  ul{list-style:none;padding:0;margin:0 0 auto;display:grid;gap:18px}
  li{font-size:30px;color:#d6dee8;display:flex;gap:18px;align-items:baseline}
  li:before{content:"";flex:0 0 12px;height:12px;border-radius:50%;background:${accent};transform:translateY(-4px)}
  .foot{display:flex;justify-content:space-between;font-size:18px;color:#7f8fa3}
  .bar{position:absolute;left:0;bottom:0;height:6px;background:${accent};width:${(n / total) * 100}%}
  </style></head><body><div class="wrap">
  <div class="top"><span class="brand">Learn<b>Hub</b></span><span>${esc(course.title)}</span></div>
  <h1>${esc(slide.title)}</h1>
  <ul>${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
  <div class="foot"><span>${esc(lesson.title)}</span><span>${n} / ${total}</span></div>
  </div><div class="bar"></div></body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const durations = {};

// ---- lesson videos ----
for (const lesson of LESSONS.filter((l) => l.slides)) {
  const parts = [];
  for (const [i, slide] of lesson.slides.entries()) {
    const png = `${OUT}slides/${lesson.slug}-${i + 1}.png`;
    await page.setContent(slideHtml({ course: lesson.course, lesson, slide, n: i + 1, total: lesson.slides.length }));
    await page.screenshot({ path: png });
    const wav = await speak(slide.say);
    const seg = `${OUT}work/${lesson.slug}-${i + 1}.mp4`;
    const dur = seconds(wav) + 0.8; // a beat of silence between slides
    run("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-framerate", "24", "-t", dur.toFixed(2), "-i", png, "-i", wav,
      "-filter_complex", `[1:a]apad=whole_dur=${dur.toFixed(2)}[a]`, "-map", "0:v", "-map", "[a]",
      "-c:v", "libx264", "-tune", "stillimage", "-crf", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "64k", "-ar", "48000", "-shortest", seg]);
    parts.push(seg);
  }
  const list = `${OUT}work/${lesson.slug}.txt`;
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const mp4 = `${OUT}lessons/${lesson.slug}.mp4`;
  run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", mp4]);
  durations[`lessons/${lesson.slug}.mp4`] = Math.round(seconds(mp4));
  console.log(`✓ ${lesson.slug}.mp4  ${durations[`lessons/${lesson.slug}.mp4`]}s  ${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB`);
}

// ---- library: PDFs ----
const strategy = COURSES[0];
const pdfCss = `body{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;color:#1d2733;margin:0}
  section{page-break-after:always;padding:56px 64px;min-height:900px}section:last-child{page-break-after:auto}
  h1{font-size:40px;margin:0 0 8px}h2{font-size:26px;margin:0 0 16px;color:#b5651d}p,li{font-size:15px;line-height:1.6}
  .cover{background:#0d1520;color:#eef2f7;display:flex;flex-direction:column;justify-content:center;min-height:1000px}
  .cover p{color:#9fb0c3}.box{border:1.5px solid #c9d2dc;border-radius:10px;height:110px;margin:10px 0 18px}
  .small{color:#5d6b7a;font-size:13px}`;
const lessonPages = strategy.modules.flatMap((m) => m.lessons).map((l) => {
  const body = l.content.split(/\n\s*\n/).map((b) => {
    const lines = b.split("\n");
    if (lines[0].startsWith("## ")) return `<h3>${esc(lines[0].slice(3))}</h3>`;
    if (lines.every((x) => x.startsWith("- "))) return `<ul>${lines.map((x) => `<li>${esc(x.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${esc(lines.join(" "))}</p>`;
  }).join("");
  return `<section><h2>${esc(l.title)}</h2>${body}<p class="small">Worksheet: write your own answer below.</p><div class="box"></div></section>`;
});
async function pdf(file, html) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${pdfCss}</style></head><body>${html}</body></html>`);
  await page.pdf({ path: file, format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
}
await pdf(`${OUT}library/strategic-thinking-handbook.pdf`,
  `<section class="cover"><h1>Strategic Thinking Handbook</h1><p>The frameworks from Product Strategy Foundations, with a worksheet for each.</p><p>LearnHub sample material</p></section>${lessonPages.join("")}`);
durations["library/strategic-thinking-handbook.pdf"] = { pages: 1 + lessonPages.length };
await pdf(`${OUT}library/decision-journal-template.pdf`,
  `<section><h1>Decision Journal</h1><p class="small">Fill one page per decision. Revisit it on the check date.</p>
  ${["The decision", "Options considered", "Why this one", "What would change my mind", "Check date and result"].map((h) => `<h2>${h}</h2><div class="box"></div>`).join("")}</section>`);
durations["library/decision-journal-template.pdf"] = { pages: 1 };
console.log("✓ PDFs");

// ---- library: audio session ----
const audioScript = [
  "Welcome to this short session on preparing for a difficult conversation. Find a quiet spot, and give yourself five minutes.",
  "Start by naming the conversation. Who is it with, and what is the one thing you need them to understand by the end? Say it to yourself in a single sentence.",
  "Now think about the other person. What are they likely to be worried about? What would a good outcome look like from where they sit? Hold both outcomes in mind: yours and theirs.",
  "Plan your first sentence. It should say the important thing plainly, without a long run-up. People can hear hard news; what they struggle with is waiting for it.",
  "Then plan a question. After you've said the hard part, ask what they think, and listen to the whole answer before you respond.",
  "Finally, decide what you'll offer. Two options and your recommendation are usually enough to turn a hard conversation into a plan.",
  "Take one slow breath. You know your first sentence, your question and your options. You're ready."
];
const audioParts = [];
for (const line of audioScript) audioParts.push(await speak(line));
const audioList = `${OUT}work/audio.txt`;
const gap = `${OUT}work/gap.wav`;
run("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1.2", gap]);
fs.writeFileSync(audioList, audioParts.flatMap((p) => [`file '${p}'`, `file '${gap}'`]).join("\n"));
const mp3 = `${OUT}library/leadership-audio-session.mp3`;
run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", audioList, "-c:a", "libmp3lame", "-b:a", "96k", mp3]);
durations["library/leadership-audio-session.mp3"] = Math.round(seconds(mp3));
console.log(`✓ audio ${durations["library/leadership-audio-session.mp3"]}s`);

// ---- library: EPUB ----
const comms = COURSES[2];
const chapters = comms.modules.flatMap((m) => m.lessons);
const ep = `${OUT}work/epub`;
fs.rmSync(ep, { recursive: true, force: true });
fs.mkdirSync(`${ep}/META-INF`, { recursive: true });
fs.mkdirSync(`${ep}/OEBPS`, { recursive: true });
fs.writeFileSync(`${ep}/mimetype`, "application/epub+zip");
fs.writeFileSync(`${ep}/META-INF/container.xml`, `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
const xhtml = (title, body) => `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>${esc(title)}</title></head><body>${body}</body></html>`;
chapters.forEach((c, i) => {
  const body = c.content.split(/\n\s*\n/).map((b) => {
    const lines = b.split("\n");
    if (lines[0].startsWith("## ")) return `<h2>${esc(lines[0].slice(3))}</h2>`;
    if (lines.every((x) => x.startsWith("- "))) return `<ul>${lines.map((x) => `<li>${esc(x.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${esc(lines.join(" "))}</p>`;
  }).join("");
  fs.writeFileSync(`${ep}/OEBPS/ch${i + 1}.xhtml`, xhtml(c.title, `<h1>${esc(c.title)}</h1>${body}`));
});
fs.writeFileSync(`${ep}/OEBPS/nav.xhtml`, xhtml("Contents", `<nav epub:type="toc"><h1>Contents</h1><ol>${chapters.map((c, i) => `<li><a href="ch${i + 1}.xhtml">${esc(c.title)}</a></li>`).join("")}</ol></nav>`));
fs.writeFileSync(`${ep}/OEBPS/content.opf`, `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">learnhub-exec-comms-playbook</dc:identifier><dc:title>Executive Communication Playbook</dc:title><dc:language>en</dc:language><dc:creator>LearnHub</dc:creator><meta property="dcterms:modified">2026-11-11T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${chapters.map((_, i) => `<item id="c${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("")}</manifest><spine>${chapters.map((_, i) => `<itemref idref="c${i + 1}"/>`).join("")}</spine></package>`);
const epub = `${OUT}library/executive-communication-playbook.epub`;
fs.rmSync(epub, { force: true });
execFileSync("zip", ["-X0q", epub, "mimetype"], { cwd: ep });
execFileSync("zip", ["-Xrq9", epub, "META-INF", "OEBPS"], { cwd: ep });
console.log("✓ EPUB");

await browser.close();
fs.writeFileSync(`${OUT}durations.json`, JSON.stringify(durations, null, 1));
console.log(`done: ${Object.keys(durations).length} files in ${path.relative(process.cwd(), OUT)}`);
// MEDIA is imported so a renamed library file shows up as a missing upload in the seed.
void MEDIA;
