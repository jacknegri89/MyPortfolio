<h1 align="center">Giacomo Negri · Portfolio</h1>

<p align="center">
  <a href="https://giacomonegri.vercel.app"><img alt="Live site" src="https://img.shields.io/badge/live-giacomonegri.vercel.app-63bdff?style=for-the-badge&logo=vercel&logoColor=white&labelColor=04050a"></a>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-e34f26?style=for-the-badge&logo=html5&logoColor=white&labelColor=04050a">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572b6?style=for-the-badge&logo=css3&logoColor=white&labelColor=04050a">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black&labelColor=04050a">
  <img alt="GSAP" src="https://img.shields.io/badge/GSAP-88ce02?style=for-the-badge&labelColor=04050a">
</p>

<p align="center">
  A static, build-free personal portfolio with 3D hero animations, scroll-driven sections and a few interactive demos.
</p>

> Open `index.html` in your browser to view the site locally. External libraries (Three.js, GSAP, ScrollTrigger, Lenis) load from a CDN, so you need an internet connection.

---

## Structure

```
index.html            content only (texts, sections, links)
css/                  one stylesheet per part of the page
js/
  core/               base classes used across the site
  components/         one class per interactive element
  animations/         GSAP animations (intro, scroll, horizontal projects)
  App.js              creates and starts all components
  main.js             starts App (must be the last script)
assets/               CV as PDF, Renova screenshots, og.jpg (preview when the link is shared)
```

### CSS

The order of the `<link>` tags in `index.html` matters, because a rule written later wins over one written earlier.
`base.css` always goes first, `reduced-motion.css` always goes last.

| File | Contents |
| --- | --- |
| `base.css` | colors and fonts (variables `--bg`, `--fg`, `--a1`...), reset, reusable classes |
| `loader.css` | loading screen |
| `cursor.css` | custom cursor |
| `nav.css` | top bar |
| `buttons.css` | `.btn` buttons |
| `hero.css` | first screen with the name |
| `marquee.css` | scrolling text bands |
| `sections.css` | cards, chips and headings shared by all sections |
| `about.css`, `projects.css`, `experience.css`, `skills.css`, `education.css`, `contact.css`, `footer.css` | one section each |
| `reduced-motion.css` | version without animations |

To change a color across the whole site, edit the variable in `:root` inside `base.css`.

### JavaScript

Each file contains a class with a `start()` (or `play()`) method that starts it.
`App.js` creates all of them in the right order.

| Class | What it does |
| --- | --- |
| `Environment` | detects whether the user has a mouse, whether they prefer fewer animations and whether GSAP is loaded |
| `TextSplitter` | splits a text into words or letters to animate |
| `SmoothScroll` | smooth scrolling (Lenis), scroll speed, internal `#...` links |
| `OffscreenPauser` | pauses the endless animations of sections marked `data-pause-offscreen` when they are not visible |
| `ContactDetails` | current year in the footer |
| `NavBar` | on phones, gives the top bar a background when you scroll |
| `ParticleWave` | 3D particle wave in the hero |
| `CustomCursor`, `CardSpotlight`, `MagneticButtons` | mouse effects (desktop only) |
| `ScraperTerminal` | fake terminal for the Job Scraper project |
| `InViewWatcher` | starts the fake terminal when it enters the screen |
| `SecureNotesDemo` | text that is encrypted and decrypted on phones |
| `SerialMonitor` | fake monitor for the Raspberry Pi |
| `CopyButtons` | "Copy" buttons in the contacts |
| `VelocityMarquee` | text bands linked to scroll speed |
| `IntroAnimation` | opening animation |
| `ScrollAnimations` | titles, phrases and blocks that appear while scrolling |
| `HorizontalProjects` | projects in a horizontal row on desktop |
| `FooterSignature` | the name in the footer that draws itself when you reach the bottom |

The scripts are plain `<script>` tags (not modules), so the site also works when you open the file by double-clicking it.
For this reason the order of the `<script>` tags in `index.html` matters: a class must be loaded before anything that uses it.

## Common tasks

- **After every change to CSS or JS:** in `index.html`, change the number after `?v=` (e.g. `?v=2026-10-07` → `?v=2026-10-08`) using find and replace. Otherwise, visitors who have already opened the site may see the old version.

- **Adding a project:** copy a `<article class="card proj">` block in `index.html`. The horizontal scrolling adapts on its own.
- **Adding a new effect:** create the class in `js/components/`, add its `<script>` before `App.js`, and start it inside `App.start()`.

## Publishing

The site is hosted on **Vercel**: https://giacomonegri.vercel.app

To update it, run this from the folder with the files to publish (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `vercel.json`, `css/`, `js/`, `assets/`):

```bash
npx vercel deploy --prod --yes
```

In PowerShell, write `npx.cmd` instead of `npx`. `vercel.json` makes the CV open in the browser, and sets caching and security headers.
`.htaccess` was used by the old hosting (InfinityFree): Vercel does not use it.

---

<p align="center">Made by <a href="https://www.linkedin.com/in/giacomo-negri-952084448">Giacomo Negri</a></p>
