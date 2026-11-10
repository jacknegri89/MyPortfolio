# Stato tecnico — MyPortfolio (portfolio di Giacomo Negri)
Aggiornato il 10 novembre 2026 (audit finale, ramo `chore/portfolio-final-audit`).

## Repository e pubblicazione
- GitHub: `jacknegri89/MyPortfolio` (rinominato da `My-Portfolio` il 10/11/2026), ramo unico `main`, PUBLIC.
- Vercel: progetto `giacomonegri`, sito `https://giacomonegri.vercel.app`, deploy automatico da `main`.
- Clone locale: `Documents\MyPortfolio`. Identità git locale: email noreply di GitHub. Email pubblica di contatto: `negrigiacomo435@gmail.com`.
- Nessun `CLAUDE.md` nel repo né nelle cartelle superiori: valgono le regole globali dell'utente (`~/.claude/CLAUDE.md`).

## Stack & Env
- HTML5, CSS3, JavaScript senza build. Nessun `.env`, nessun backend, nessun segreto.
- CDN con SRI: Three.js r128, GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsDelivr). Font locali in `assets/fonts/` (WOFF2), dichiarati in `css/fonts.css`.
- CSP nei `<meta>` di ogni pagina; header in `vercel.json` (nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy).
- Locale: `python -m http.server 5173` (in locale `/privacy` e `/404` non esistono: usare `.html`).

## Mappa architettura
- `index.html`: tutta la pagina. Ordine sezioni: hero, marquee, servizi (siti web), chi-sono, progetti, esperienza, competenze, formazione, contatti, footer.
- `privacy.html`, `404.html`: pagine singole con stile inline minimo.
- `css/`: un file per sezione; `base.css` primo, `reduced-motion.css` ultimo.
- `js/App.js` crea e avvia tutte le classi; `js/main.js` è l'ultimo script. `js/core/` (Environment, SmoothScroll, TextSplitter, OffscreenPauser), `js/components/` (una classe per effetto), `js/animations/` (Intro, ScrollAnimations, HorizontalProjects, FooterSignature).
- `assets/projects/<progetto>/`: schermate reali WebP 1280x800. `assets/og.jpg`: anteprima social 1200x630. `assets/CV-Giacomo-Negri.pdf`: CV (2 pagine, generato da HTML con Chromium).
- `docs/portfolio-home.jpg`: immagine del README (esclusa dal deploy da `.vercelignore`).

## Progetti presentati (verificati il 10/11/2026)
- Renova (repo privato, solo demo `renovaenergy.vercel.app`): PHP 8, MySQL/MariaDB, Chart.js, API Ember, 2FA. Schermate: home e sezione «il progetto» dal sito live (la galleria «funzionalità» veniva male: non usarla).
- JobScraper (pubblico, v1.2.0): Python + Playwright, 13 fonti. Schermate dal repo (dati inventati) + terminale animato.
- LogLens (pubblico): React, Node, Prisma, PostgreSQL; demo `loglens-demo.vercel.app`.
- Secure Notes: nessun repo né screenshot; mockup dichiarato come ricostruzione.
- Non inseriti: repo privato umoristico; progetto locale per una pasticceria (bozza per un potenziale cliente, nessun contratto né consegna: non pubblicabile senza autorizzazione).

## Decisioni & vincoli
- Posizionamento: "Developer". NON usare "freelance" né "web designer". Ai clienti offre SOLO siti web (vetrina, landing page, restyling) per negozi, professionisti, attività locali; software su richiesta solo come nota secondaria. Confermato il 10/11/2026: niente elenco di gestionali, automazioni o API tra i servizi.
- Niente ternari né `if` su una riga (regola utente). Script classici, non moduli: l'ordine dei `<script>` conta.
- Cache busting: `?v=` ora `2026-11-10e` in tutti gli HTML; cambiarlo solo se cambiano CSS/JS.
- A schermo basso (`max-height: 840px`) le schede progetto sono compatte (altrimenti sforano i 680px minimi della modalità orizzontale).
- Nessuna licenza scelta: il README dichiara che non è concessa licenza open source (decisione da confermare con l'utente).
- README in inglese per scelta del proprietario. Non inventare dati: niente telefono, P.IVA, recensioni, numeri di clienti.

## Stato avanzamento
- [x] Audit sicurezza iniziale, rinomina repo, repo PUBLIC, cronologia di `main` riscritta (email di contatto, foto rimossa).
- [x] Posizionamento developer, sezione siti web in evidenza, CV rifatto, font locali, case study con schermate reali.
- [x] Audit finale (ramo `chore/portfolio-final-audit`): nessun segreto in 35 commit raggiungibili; axe-core 0 violazioni su home, privacy, 404 (375 e 1280 px); nessun overflow a 320/375/768/1000/1280/1440; corretta la regione scorrevole dello schema (`.schem-scroll`, ora focusabile da tastiera).
- [ ] Merge su `main`, rami eliminati, verifica Vercel (vedi report finale).

## Problemi aperti
- I commit precedenti alla pulizia (autore con email personale diversa da quella di contatto, foto `assets/giacomo.jpg`) restano raggiungibili da `refs/pull/1/head` e `refs/pull/2/head`: solo il supporto GitHub può eliminarli.
- Il CV pubblico contiene data di nascita, comune di residenza, patente e foto: decisione dell'utente se tenerli.
- Backup della cronologia originale: `Documents\MyPortfolio-backup-2026-11-10.bundle` (fuori dal repo, non pubblicare).
- Lighthouse: vedere il report finale per i punteggi misurati.
