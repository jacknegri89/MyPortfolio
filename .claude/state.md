# Stato tecnico — MyPortfolio (portfolio di Giacomo Negri)
Aggiornato il 10 novembre 2026.

## Repository e pubblicazione
- GitHub: `jacknegri89/MyPortfolio` (rinominato da `My-Portfolio` il 10/11/2026), ramo unico `main`.
- Visibilità: vedi sezione "Stato avanzamento" (passaggio a PUBLIC dopo audit).
- Vercel: progetto `giacomonegri`, sito `https://giacomonegri.vercel.app`, deploy automatico da `main`.
- Clone locale: `Documents\MyPortfolio`. Identità git locale: email noreply di GitHub.
- Nessun `CLAUDE.md` nel repo: valgono le regole globali dell'utente.

## Stack & Env
- HTML5, CSS3, JavaScript senza build. Nessun `.env`, nessun backend, nessun segreto.
- CDN con SRI: Three.js r128, GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsDelivr). Font: Google Fonts.
- Locale: `python -m http.server 5173`.

## Mappa architettura
- `index.html`: tutta la pagina. Ordine sezioni: hero, marquee, chi-sono, servizi, progetti, esperienza, competenze, formazione, contatti, footer.
- `privacy.html`, `404.html`: pagine singole con stile inline minimo.
- `css/`: un file per sezione; `base.css` primo, `reduced-motion.css` ultimo. `services.css` = elenco servizi.
- `js/App.js`: crea e avvia tutte le classi. `js/main.js`: ultimo script.
- `js/core/`: `Environment`, `SmoothScroll`, `TextSplitter`, `OffscreenPauser`.
- `js/components/`: `ScreenshotTabs` (pulsanti `data-shot-target` → `.shot-panel`), `ScraperTerminal`, `InViewWatcher`, `ParticleWave`, `CustomCursor`, `CardSpotlight`, `MagneticButtons`, `SecureNotesDemo`, `SerialMonitor`, `CopyButtons`, `VelocityMarquee`, `NavBar`, `ContactDetails`.
- `js/animations/`: `IntroAnimation`, `ScrollAnimations`, `HorizontalProjects`, `FooterSignature`.
- `assets/projects/<progetto>/`: schermate reali WebP 1280x800. `assets/og.jpg`: anteprima social (hero a 1200x630).
- `docs/portfolio-home.jpg`: immagine del README (esclusa dal deploy con `.vercelignore`).

## Progetti presentati (fonti verificate il 10/11/2026)
- Renova (repo privato, solo demo): PHP 8 senza framework, MySQL/MariaDB, Chart.js, Ember API, 2FA, pannello admin, test. Schermate: home e funzionalità catturate dal sito live.
- JobScraper (pubblico, v1.2.0): 13 fonti, Playwright, dedup, stato annunci, stime nette IT/CH, AI opzionale. Schermate dal repo (`docs/`, dati inventati) + terminale animato.
- LogLens (pubblico): incidenti con evidenze, motore a regole, OpenAI/Ollama opzionali, benchmark 15 scenari. Home dalla demo live, report e workbench dal repo.
- Secure Notes: nessun repo né screenshot; mockup dichiarato come ricostruzione.
- Non inserito: repo privato umoristico per amici.

## Decisioni & vincoli
- Posizionamento: web designer & developer freelance; percorso recruiter nella sezione contatti.
- Niente ternari né `if` su una riga (regola utente). Script classici, non moduli: l'ordine dei `<script>` conta.
- Dopo ogni modifica a CSS/JS cambiare `?v=` in tutti gli HTML (ora `2026-11-10b`).
- Schede progetto: a schermo basso (`max-height: 840px`) lo stile è compatto, altrimenti sforano i 680px minimi della modalità orizzontale.
- JSON-LD nel `<head>`: è un blocco dati, non viene bloccato dalla CSP.
- Nessuna licenza scelta: il README dichiara che non è concessa licenza open source (decisione da confermare).
- README in inglese per scelta precedente del proprietario.
- Non inventare dati: niente telefono, P.IVA, recensioni, numeri di clienti.

## Stato avanzamento
- [x] Audit sicurezza su file e 18 commit: nessun segreto.
- [x] Rinomina repo, remote aggiornato.
- [x] Riposizionamento freelance, sezione servizi, case study, schermate, SEO, privacy, README.
- [x] Test in Chromium (Playwright) a 320/375/768/1000/1280/1440: PASS.
- [/] Merge su `main`, pulizia rami, visibilità PUBLIC, verifica Vercel.

## Problemi aperti
- I 17 commit iniziali hanno come autore un'email personale: diventa visibile con il repo pubblico.
- `assets/giacomo.jpg` (foto non usata) rimossa il 10/11/2026 su richiesta; resta nei commit precedenti finché la cronologia non viene riscritta.
- Font ancora da Google Fonts: ospitarli in locale toglierebbe una terza parte.
