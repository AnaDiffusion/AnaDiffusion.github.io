import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const pageRoot = resolve(testDirectory, '..');
const pagePath = resolve(pageRoot, 'index.html');
const cssPath = resolve(pageRoot, 'assets/css/main.css');
const siteModulePath = resolve(pageRoot, 'assets/js/site.mjs');
const volumeViewerPath = resolve(pageRoot, 'assets/js/volume-viewer.mjs');
const continuousAssemblyPath = resolve(pageRoot, 'media/anadiffusion-assembly-transparent-continuous.webm');
const assemblyVolumePath = resolve(pageRoot, 'volumes/assembly-parts-sample-01.nii.gz');
const assemblyBuilderPath = resolve(pageRoot, 'scripts/build-colored-assembly.py');
const faviconSvgPath = resolve(pageRoot, 'images/favicon.svg');
const faviconPngPath = resolve(pageRoot, 'images/favicon.png');

function readPage() {
  return readFileSync(pagePath, 'utf8');
}

test('uses the AnaDiffusion spectrum favicon instead of the PHAI logo', () => {
  const html = readPage();

  assert.equal(existsSync(faviconSvgPath), true, 'Missing AnaDiffusion SVG favicon');
  const svg = readFileSync(faviconSvgPath, 'utf8');
  const png = readFileSync(faviconPngPath);

  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="images\/favicon\.svg\?v=20260824-1">/);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="256x256" href="images\/favicon\.png\?v=20260824-1">/);
  assert.match(svg, /viewBox="0 0 256 256"/);
  assert.match(svg, /#9b7fd4/i);
  assert.match(svg, /#f0d78a/i);
  assert.match(svg, /#a4cf94/i);
  assert.doesNotMatch(svg, /PHAI|#2d4f73/i);
  assert.equal(png.readUInt32BE(16), 256);
  assert.equal(png.readUInt32BE(20), 256);
});

test('contains every required research section', () => {
  const html = readPage();

  for (const id of ['overview', 'method', 'results', 'editing', 'samples', 'limitations', 'citation']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('routes every paper action to the canonical arXiv PDF without bundling a local paper', () => {
  const html = readPage();
  const paperLinks = [...html.matchAll(/<a\b[^>]*href="https:\/\/arxiv\.org\/pdf\/2608\.23014"[^>]*>/g)];

  assert.equal(paperLinks.length, 4);
  for (const [link] of paperLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener"/);
  }
  assert.doesNotMatch(html, /paper\.pdf/);
  assert.equal(existsSync(resolve(pageRoot, 'paper.pdf')), false);
});

test('uses the corrected paper identity and primary claims', () => {
  const html = readPage();

  assert.match(html, /August 23, 2026/);
  assert.match(html, /Anatomically Compositional Latent Diffusion for Controllable 3D Brain MRI Generation/);
  assert.match(html, /Xiaoqing Wang/);
  assert.doesNotMatch(html, /Jade Wang/);
  assert.match(html, /36\.16/);
  assert.match(html, /6\.21/);
  assert.match(html, /6\.67/);
  assert.match(html, /1\.06/);
  assert.match(html, /0\.29/);
  assert.match(html, /0\.144/);
  assert.match(html, /0\.169/);
  assert.match(html, /0\.185/);
  assert.match(html, /0\.9427/);
  assert.match(html, /0\.9618/);
  assert.match(html, /<span>Table 1<\/span><h3 id="table-1-title">Generation and focused morphometric metrics on ADNI\.<\/h3>/);
  assert.doesNotMatch(html, /May 17, 2026|34\.33|0\.24/);
});

test('presents the abstract contributions as four bullets', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');
  const abstract = html.match(/<section class="paper-section abstract-section"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.match(abstract, /<ul class="abstract-contributions" aria-label="AnaDiffusion contributions">/);
  assert.equal([...abstract.matchAll(/<li>/g)].length, 4);
  assert.match(abstract, /We introduce <strong>AnaDiffusion<\/strong>, a compositional latent diffusion framework/);
  assert.match(abstract, /We propose a part-to-whole latent refinement/);
  assert.match(abstract, /left-right canonicalization and side-indicator conditioning/);
  assert.match(abstract, /without requiring subject-specific dense segmentation maps at inference time/);
  assert.doesNotMatch(abstract, /To address these limitations|On the subject-disjoint ADNI test split/);
  assert.match(css, /\.abstract-contributions\s*\{[^}]*font-size:\s*clamp\(1\.2rem,\s*1\.6vw,\s*1\.45rem\)/s);
  assert.match(css, /\.abstract-contributions\s*\{[^}]*display:\s*block[^}]*column-count:\s*1/s);
  assert.doesNotMatch(abstract, /class="contribution-list"/);
});

test('uses the concise requested TLDR', () => {
  const html = readPage();
  const abstract = html.match(/<section class="paper-section abstract-section"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.match(
    abstract,
    /<strong>AnaDiffusion<\/strong> builds a 3D brain MRI from <strong>anatomical parts<\/strong> — left\/right hemispheres and the cerebellum–brainstem — then <strong>assembles and globally refines<\/strong> them into one coherent volume, improving <strong>regional FID<\/strong> and enabling <strong>controllable part editing<\/strong> with <strong>no subject-specific segmentation maps<\/strong> at inference\./,
  );
  assert.doesNotMatch(abstract, /lowest FID across every region/);
});

test('uses the continuous assembly as a quiet accessible Abstract background', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');
  const siteModule = readFileSync(siteModulePath, 'utf8');
  const abstract = html.match(/<section class="paper-section abstract-section"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.equal(existsSync(continuousAssemblyPath), true, 'Missing continuous transparent assembly animation');
  assert.match(abstract, /<div class="abstract-motion" aria-hidden="true">/);
  assert.match(
    abstract,
    /<video\s+data-abstract-motion\s+muted\s+loop\s+playsinline\s+preload="metadata"\s+tabindex="-1">/,
  );
  assert.doesNotMatch(abstract, /\sposter=/);
  assert.match(
    abstract,
    /<source src="media\/anadiffusion-assembly-transparent-continuous\.webm\?v=20260824-1" type="video\/webm">/,
  );
  assert.doesNotMatch(abstract, /\b(?:autoplay|controls)\b/);

  assert.match(css, /\.abstract-section\s*\{[^}]*position:\s*relative[^}]*isolation:\s*isolate[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.abstract-motion\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*z-index:\s*0/s);
  assert.match(css, /\.abstract-motion\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.abstract-section \.section-kicker,\s*\.abstract-section h2\s*\{[^}]*text-align:\s*left/s);
  assert.match(css, /\.abstract-section \.section-kicker::after\s*\{[^}]*width:\s*48px[^}]*height:\s*3px[^}]*margin:\s*14px 0 0[^}]*background:\s*var\(--grad\)/s);
  assert.match(css, /\.abstract-section h2\s*\{[^}]*max-width:\s*760px[^}]*margin-inline:\s*0/s);
  assert.match(css, /\.abstract-motion video\s*\{[^}]*opacity:\s*\.3[^}]*transform:\s*translateY\(120px\)/s);
  assert.match(
    css,
    /@media \(max-width:\s*720px\)[\s\S]*\.abstract-motion video\s*\{[^}]*position:\s*absolute[^}]*top:\s*50%[^}]*left:\s*50%[^}]*width:\s*165vw[^}]*opacity:\s*\.3[^}]*transform:\s*translate\(-50%,\s*calc\(-50% \+ 120px\)\)/,
  );
  assert.match(css, /\.abstract-section > \.reading-shell\s*\{[^}]*z-index:\s*1/s);

  assert.match(siteModule, /function initAbstractMotion\(root\)/);
  assert.match(siteModule, /prefers-reduced-motion:\s*reduce/);
  assert.match(siteModule, /new IntersectionObserver/);
  assert.match(siteModule, /video\.play\(\)/);
  assert.match(siteModule, /video\.pause\(\)/);
  assert.match(siteModule, /initAbstractMotion\(document\)/);
});

test('links the supplied paper and repository without invented destinations', () => {
  const html = readPage();

  assert.match(html, /https:\/\/arxiv\.org\/pdf\/2608\.23014/);
  assert.doesNotMatch(html, /href=["']paper\.pdf["']/);
  assert.match(html, /https:\/\/github\.com\/phai-lab\/AnaDiffusion\.git/);
  assert.match(html, /https:\/\/anadiffusion\.github\.io\//);
  assert.doesNotMatch(html, /youtube\.com|VIDEO_ID/);
  assert.doesNotMatch(html, /href=["']#["']/);
});

test('contains no unfilled template markers', () => {
  const html = readPage();

  assert.equal(html.includes(['RE', 'PLACE'].join('')), false);
  assert.doesNotMatch(html, /placeholder-(?:teaser|figure|author|logo)/i);
});

test('references only existing local image and paper assets', () => {
  const html = readPage();
  const localTargets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((target) => !target.startsWith('http') && !target.startsWith('#'))
    .filter((target) => /\.(?:png|jpe?g|pdf)$/i.test(target));

  assert.equal(localTargets.length > 0, true);
  for (const target of localTargets) {
    assert.equal(existsSync(resolve(pageRoot, target)), true, `Missing local asset: ${target}`);
  }
});

test('publishes complete corrected figures and ten independent samples', () => {
  const requiredFigures = [
    'images/teaser.png',
    'images/figure-2-method.png',
    'images/figure-3-comparison.png',
    'images/editing-comparison.png',
  ];
  const requiredSamples = Array.from(
    { length: 10 },
    (_, index) => `images/samples/sample-${String(index + 1).padStart(2, '0')}.png`,
  );

  for (const asset of [...requiredFigures, ...requiredSamples]) {
    assert.equal(existsSync(resolve(pageRoot, asset)), true, `Missing corrected-paper asset: ${asset}`);
  }
});

test('uses the supplied teaser as Figure 1', () => {
  const html = readPage();
  const figure = readFileSync(resolve(pageRoot, 'images/teaser.png'));
  const digest = createHash('sha256').update(figure).digest('hex');

  assert.equal(digest, 'c26d7cd9a6fdda1023010dcb4485fd6d60a863d5848b09d87c869982c1ae200b');
  assert.match(html, /href="images\/teaser\.png\?v=c26d7cd9"[^>]*aria-label="Open Figure 1 at full resolution"/);
  assert.match(html, /src="images\/teaser\.png\?v=c26d7cd9" width="1990" height="1110"/);
  assert.match(html, /alt="AnaDiffusion Figure 1 comparing baseline anatomical failures with AnaDiffusion outputs, a MedicalNet FID radar chart, and a SynthSeg Cohen's effect-size radar chart"/);
  assert.match(html, /class="full-resolution-link" href="images\/teaser\.png\?v=c26d7cd9"/);
  assert.doesNotMatch(html, /(?:src|href)="images\/figure-1-overview\.png"/);
});

test('includes canonical and social metadata from the paper', () => {
  const html = readPage();

  assert.match(html, /rel=["']canonical["'][^>]+https:\/\/anadiffusion\.github\.io\//);
  assert.match(html, /property=["']og:url["'][^>]+https:\/\/anadiffusion\.github\.io\//);
  assert.match(html, /property=["']og:title["'][^>]+AnaDiffusion/);
  assert.match(html, /name=["']description["'][^>]+anatomically compositional/i);
});

test('keeps every paper figure accessible without JavaScript', () => {
  const html = readPage();

  assert.match(html, /<a[^>]+data-paper-figure=["']1["'][^>]+href=["']images\/teaser\.png\?v=c26d7cd9["']/);
  for (let number = 2; number <= 3; number += 1) {
    assert.match(html, new RegExp(`<a[^>]+data-paper-figure=["']${number}["'][^>]+href=["']images/figure-${number}-[^"']+\\.png["']`));
  }
  assert.match(html, /<a[^>]+data-paper-figure=["']4["'][^>]+href=["']images\/editing-comparison\.png["']/);
  assert.doesNotMatch(html, /<dialog|data-figure-open|data-figure-close/);
  assert.doesNotMatch(html, /<canvas|anatomy-canvas|hero-object/);
});

test('displays every research figure completely in the main reading flow', () => {
  const html = readPage();

  assert.match(html, /src=["']images\/teaser\.png\?v=c26d7cd9["']/);
  assert.match(html, /Figure 1/);
  for (let number = 2; number <= 3; number += 1) {
    assert.match(html, new RegExp(`src=["']images/figure-${number}-[^"']+\\.png["']`));
    assert.match(html, new RegExp(`Figure ${number}`));
  }
  assert.match(html, /src=["']images\/editing-comparison\.png["']/);
  assert.match(html, /Figure 4b/);
  assert.equal((html.match(/class=["'][^"']*paper-figure-image[^"']*["']/g) ?? []).length, 4);
});

test('shows only the localized editing comparison above the editing table', () => {
  const html = readPage();
  const figure = html.match(
    /<figure class="paper-figure">\s*<a class="figure-link" data-paper-figure="4"[\s\S]*?<\/figure>/,
  )?.[0] ?? '';

  assert.match(figure, /href="images\/editing-comparison\.png"/);
  assert.match(figure, /src="images\/editing-comparison\.png"/);
  assert.match(figure, /width="2200" height="1096"/);
  assert.doesNotMatch(figure, /figure-4-editing\.png|Quantitative editing locality above/);
  assert.match(html, /data-table="editing"/);
  assert.equal((html.match(/data-editing-row/g) ?? []).length, 6);
});

test('uses the shared skinny border for Figure 3', () => {
  const html = readPage();
  const figureClass = html.match(
    /<figure class="([^"]*)">\s*<a class="figure-link" data-paper-figure="3"/,
  )?.[1] ?? '';

  assert.equal(figureClass, 'paper-figure');
  assert.doesNotMatch(figureClass, /paper-figure-dark/);
});

test('renders ten independent samples in an accessible scroll rail', () => {
  const html = readPage();

  assert.match(html, /data-sample-rail/);
  assert.match(html, /data-gallery-previous/);
  assert.match(html, /data-gallery-next/);
  assert.match(html, /data-gallery-status[^>]+aria-live=["']polite["']/);
  assert.equal((html.match(/class=["'][^"']*sample-card[^"']*["']/g) ?? []).length, 10);
  assert.equal((html.match(/images\/samples\/sample-\d{2}\.png/g) ?? []).length, 10);
});

test('publishes all four paper-grounded limitations', () => {
  const html = readPage();
  const section = html.match(/<section[^>]+id="limitations"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.equal((section.match(/<p><strong>/g) ?? []).length, 4);
  assert.match(section, /additional training and inference complexity compared with a monolithic LDM/i);
  assert.match(section, /does not fully solve broader tissue-level calibration/i);
  assert.match(section, /tissue classes, functional networks, or multi-scale anatomical hierarchies/i);
  assert.match(section, /approximate correspondence with MNI152/i);
  assert.match(section, /severe mass effect or displaced anatomical boundaries/i);
  assert.match(section, /lesion-aware or subject-adaptive localization/i);
});

test('keeps footer logos legible and sample cards closer to source size', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.footer-logos img:first-child\s*\{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
  assert.match(css, /\.footer-logos img:last-child\s*\{[^}]*max-width:\s*160px[^}]*filter:\s*brightness\(0\) invert\(1\)/s);
  assert.match(css, /\.sample-card\s*\{[^}]*flex:\s*0 0 min\(720px,\s*62vw\)/s);
});

test('uses the editorial serif for the future-work heading', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(
    css,
    /\.section-heading h2,\s*\.abstract-section h2,\s*\.limitations-section h2,\s*\.future-section h2,\s*\.citation-section h2\s*\{[^}]*font-family:\s*var\(--serif\)/s,
  );
});

test('implements a readable evidence-first responsive design system', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /--page:\s*#fbfaf7/i);
  assert.match(css, /--accent-aqua:\s*#9fe8e5/i);
  assert.match(css, /--accent-violet:\s*#b8b9ff/i);
  assert.match(css, /body\s*\{[^}]*font-size:\s*clamp\(19px,\s*calc\(17px \+ 0\.25vw\),\s*21px\)[^}]*line-height:\s*1\.65/s);
  assert.match(css, /\.assemble-title\s*\{[^}]*font-size:\s*min\(13\.5vw,\s*128px\)/s);
  assert.doesNotMatch(css, /body\s*\{\s*font-size:\s*18px;\s*\}/);
  assert.doesNotMatch(css, /\.assemble-title\s*\{\s*font-size:\s*3\.2rem;\s*\}/);
  assert.match(css, /--figure:\s*min\(1040px,\s*calc\(100vw\s*-\s*64px\)\)/i);
  assert.match(css, /\.paper-figure\s*\{[^}]+width:\s*var\(--figure\)/is);
  assert.match(css, /\.paper-figure-image[^}]+width:\s*100%/is);
  assert.match(css, /\.paper-table\s*\{[^}]+font-size:\s*1\.0625rem/is);
  assert.match(css, /\.table-scroll[^}]+overflow-x:\s*auto/is);
  assert.match(css, /\.paper-table[^}]+font-variant-numeric:\s*tabular-nums/is);
  assert.match(css, /position:\s*sticky/i);
  assert.match(css, /scroll-snap-type:\s*x\s+mandatory/i);
  assert.match(css, /scroll-snap-align:\s*start/i);
  assert.doesNotMatch(css, /\.paper-figure-image[^}]+(?:max-height|object-fit:\s*cover)/is);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
});

test('scales the publication header typography responsively', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.publication-heading\s*\{[^}]*width:\s*min\(1180px,\s*calc\(100vw - 64px\)\)/s);
  assert.match(css, /\.paper-subtitle\s*\{[^}]*font-size:\s*clamp\(2rem,\s*4vw,\s*3\.5rem\)/s);
  assert.match(css, /\.authors\s*\{[^}]*font-size:\s*clamp\(1\.05rem,\s*1\.35vw,\s*1\.3rem\)/s);
  assert.match(css, /\.affiliations\s*\{[^}]*font-size:\s*clamp\(\.98rem,\s*1\.15vw,\s*1\.15rem\)/s);
  assert.match(css, /\.author-note\s*\{[^}]*font-size:\s*clamp\(\.9rem,\s*1vw,\s*1rem\)/s);
  assert.match(css, /\.hero-summary\s*\{[^}]*font-size:\s*clamp\(1\.35rem,\s*1\.9vw,\s*1\.7rem\)/s);
  assert.match(css, /@media \(max-width:\s*820px\)[\s\S]*\.publication-heading\s*\{[^}]*width:\s*calc\(100vw - 34px\)/);
});

test('keeps explanatory cards compact and groups each number with its copy', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.method-steps article\s*\{[^}]+display:\s*grid[^}]+grid-template-columns:\s*38px\s+minmax\(0,\s*1fr\)[^}]+min-height:\s*0/is);
  assert.match(css, /\.method-steps h3\s*\{[^}]+grid-column:\s*2[^}]+margin:\s*0/is);
  assert.match(css, /\.method-steps p\s*\{[^}]+grid-column:\s*2[^}]+margin:\s*12px\s+0\s+0/is);
  assert.match(css, /\.contribution-list article\s*\{[^}]+display:\s*grid[^}]+grid-template-columns:\s*38px\s+minmax\(0,\s*1fr\)[^}]+min-height:\s*0/is);
  assert.match(css, /\.contribution-list h3\s*\{[^}]+grid-column:\s*2[^}]+margin:\s*0/is);
  assert.doesNotMatch(css, /min-height:\s*(?:230|250)px|margin:\s*(?:53|68)px\s+0|\.method-steps h3\s*\{[^}]+margin-top:\s*25px/is);
});

test('publishes the complete generation, ablation, and editing tables', () => {
  const html = readPage();

  assert.match(html, /data-table=["']generation["']/);
  for (const method of ['VAE-GAN', 'HA-GAN', 'LDM', 'Seg\. cLDM', 'MorphLDM', 'ControlNet LDM', 'Grid-based LDM', 'Ours']) {
    assert.match(html, new RegExp(method));
  }
  for (const heading of ['WB', 'Left Hemi', 'Right Hemi', 'CB', 'Seam', 'Ventricles', 'Cerebellum', 'Brainstem']) {
    assert.match(html, new RegExp(`>${heading}<`));
  }

  assert.match(html, /data-table=["']ablation["']/);
  assert.match(html, /separate hemisphere models/i);
  assert.match(html, /w\/o latent injection/);
  assert.match(html, /full latent injection/);
  assert.match(html, /r<sub>inj<\/sub>\s*=\s*7/);
  assert.match(html, /r<sub>inj<\/sub>\s*=\s*15/);

  assert.match(html, /data-table=["']editing["']/);
  assert.equal((html.match(/data-editing-row/g) ?? []).length, 6);
  assert.match(html, /0\.9427/);
  assert.match(html, /0\.9484/);
  assert.match(html, /0\.9618/);
});

test('loads complete progressive-enhancement modules', () => {
  const html = readPage();
  const modules = [
    'assets/js/gallery-state.mjs',
    'assets/js/sample-gallery.mjs',
    'assets/js/site.mjs',
  ];

  for (const modulePath of modules) {
    assert.equal(existsSync(resolve(pageRoot, modulePath)), true, `Missing runtime module: ${modulePath}`);
  }
  const siteModule = readFileSync(siteModulePath, 'utf8');
  assert.match(siteModule, /initSampleGallery/);
  assert.doesNotMatch(siteModule, /initAnatomyExplorer|initFigureDialogs|showModal|data-figure-open/);
  assert.match(html, /<script\s+type=["']module["']\s+src=["']assets\/js\/site\.mjs\?v=20260824-1["']/);
});

test('contains the corrected paper citation without the obsolete figure-one note', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');

  assert.match(html, /Xiaoqing Wang/);
  assert.match(html, /year\s*=\s*\{2026\}/);
  assert.doesNotMatch(html, /The overview is reproduced in full|final manuscript values are reported/);
  assert.doesNotMatch(html, /class="caption-note"/);
  assert.doesNotMatch(css, /\.caption-note\s*\{/);
});

test('uses the concise AnaDiffusion citation heading', () => {
  const html = readPage();
  const section = html.match(/<section class="citation-section"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.match(section, /<h2 id="citation-title">Cite AnaDiffusion<\/h2>/);
  assert.doesNotMatch(section, /Use and cite AnaDiffusion/);
  assert.doesNotMatch(section, /The exact supplied preprint is available below together with the implementation repository\./);
});

test('does not publish unused social image metadata', () => {
  const html = readPage();

  assert.equal(existsSync(resolve(pageRoot, 'images/og-card.png')), false);
  assert.doesNotMatch(html, /property=["']og:image(?::(?:width|height|alt))?["']/);
  assert.doesNotMatch(html, /name=["']twitter:image["']/);
});

test('uses a smaller square viewer beside a vertical volume rail', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');

  assert.match(html, /<div class="viewer-viewport">[\s\S]*data-volume-viewer[\s\S]*data-viewer-status/);
  assert.match(css, /\.viewer-shell\s*\{[^}]*grid-template-columns:\s*210px minmax\(0,\s*520px\)/s);
  assert.match(css, /\.viewer-stage\s*\{[^}]*aspect-ratio:\s*1/s);
  assert.match(css, /\.viewer-chips\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.viewer-chips\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test('keeps one four-panel mode without redundant view buttons', () => {
  const html = readPage();
  const viewerModule = readFileSync(volumeViewerPath, 'utf8');

  assert.doesNotMatch(html, /data-view=/);
  assert.doesNotMatch(html, />Slices<|>3D</);
  assert.doesNotMatch(viewerModule, /querySelectorAll\('\[data-view\]'\)/);
  assert.match(viewerModule, /nv\.setSliceType\(nv\.sliceTypeMultiplanar\)/);
});

test('uses readable viewer emphasis and active-button text', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.viewer-heading strong\s*\{[^}]*color:\s*#fff/s);
  assert.match(css, /\.viewer-chips button\.is-active\s*\{[^}]*color:\s*#21172c/s);
});

test('renders one precomposed colored assembly without viewer overlays', () => {
  const viewerModule = readFileSync(volumeViewerPath, 'utf8');
  const assemblyBranch = viewerModule.match(
    /if \(which === 'assemble'\) \{([\s\S]*?)\n\s*\} else \{/,
  )?.[1] ?? '';

  assert.match(viewerModule, /crosshairWidth:\s*0/);
  assert.match(viewerModule, /show3Dcrosshair:\s*false/);
  assert.match(viewerModule, /isOrientationTextVisible:\s*false/);
  assert.match(viewerModule, /multiplanarLayout:\s*2/);
  assert.match(viewerModule, /multiplanarShowRender:\s*1/);
  assert.match(viewerModule, /assembly:\s*\{ url: BASE \+ 'assembly-parts-sample-01\.nii\.gz'/);
  assert.match(assemblyBranch, /nv\.loadVolumes\(\[\{ url: VOLUMES\.assembly\.url, opacity: 1 \}\]\)/);
  assert.doesNotMatch(assemblyBranch, /VOLUMES\.(?:whole|lhemi|rhemi|cb)\.url/);
  assert.doesNotMatch(assemblyBranch, /colormap|hideBackground/);
});

test('locks scalar volume color scaling to minus one through one', () => {
  const viewerModule = readFileSync(volumeViewerPath, 'utf8');

  assert.match(viewerModule, /const INTENSITY_WINDOW = Object\.freeze\(\{ cal_min: -1, cal_max: 1 \}\)/);
  assert.match(
    viewerModule,
    /nv\.loadVolumes\(\[\{ url: VOLUMES\[which\]\.url, colormap: 'gray', opacity: 1, \.\.\.INTENSITY_WINDOW \}\]\)/,
  );
  assert.match(viewerModule, /nv\.onImageLoaded\s*=\s*\(volume\)\s*=>/);
  assert.match(viewerModule, /RGB_DATATYPES\.has\(volume\?\.hdr\?\.datatypeCode\)/);
  assert.match(viewerModule, /volume\.cal_min = INTENSITY_WINDOW\.cal_min/);
  assert.match(viewerModule, /volume\.cal_max = INTENSITY_WINDOW\.cal_max/);
  assert.match(viewerModule, /nv\.updateGLVolume\(\)/);
});

test('publishes the three supplied parts as one RGB NIfTI volume', () => {
  assert.equal(existsSync(assemblyVolumePath), true, 'Missing precomposed assembly volume');

  const nifti = gunzipSync(readFileSync(assemblyVolumePath));
  assert.equal(nifti.readInt32LE(0), 348);
  assert.equal(nifti.readInt16LE(70), 128, 'Expected NIfTI RGB24 datatype');
  assert.equal(nifti.readInt16LE(72), 24, 'Expected 24 bits per voxel');
  assert.deepEqual(
    [nifti.readInt16LE(42), nifti.readInt16LE(44), nifti.readInt16LE(46)],
    [128, 128, 128],
  );

  const builder = readFileSync(assemblyBuilderPath, 'utf8');
  assert.match(builder, /target_mask = np\.any\(part_masks, axis=0\)/);
  assert.doesNotMatch(builder, /distance_transform_edt|uncovered|whole\s*=\s*np\.asarray/);
});

test('cache-busts the viewer module so viewer updates reach the browser', () => {
  const html = readPage();

  assert.match(
    html,
    /<script\s+type=["']module["']\s+src=["']assets\/js\/volume-viewer\.mjs\?v=20260823-8["']><\/script>/,
  );
});

test('cache-busts the stylesheet so current styles reach the browser', () => {
  const html = readPage();

  assert.match(
    html,
    /<link\s+rel=["']stylesheet["']\s+href=["']assets\/css\/main\.css\?v=20260824-6["']>/,
  );
});
