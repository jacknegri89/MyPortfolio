# Stato tecnico — MyPortfolio (portfolio di Giacomo Negri)
Aggiornato il 15 novembre 2026 (animazioni GSAP 3.14 e rifiniture grafiche).

## Repository e pubblicazione
- GitHub: `jacknegri89/MyPortfolio` (rinominato da `My-Portfolio` il 10/11/2026), ramo unico `main`, PUBLIC.
- Vercel: progetto `giacomonegri`, sito `https://giacomonegri.vercel.app`, deploy automatico da `main`.
- Clone locale: `Documents\MyPortfolio`. Identità git locale: email noreply di GitHub. Email pubblica di contatto: `negrigiacomo435@gmail.com`.
- Nessun `CLAUDE.md` nel repo né nelle cartelle superiori: valgono le regole globali dell'utente (`~/.claude/CLAUDE.md`).

## Stack & Env
- HTML5, CSS3, JavaScript senza build. Nessun `.env`, nessun backend, nessun segreto.
- CDN con SRI: Three.js r128, GSAP 3.14.2 + ScrollTrigger + SplitText + ScrambleTextPlugin + DrawSVGPlugin (cdnjs), Lenis 1.1.13 (jsDelivr). Font locali in `assets/fonts/` (WOFF2), dichiarati in `css/fonts.css`.
- CSP nei `<meta>` di ogni pagina; header in `vercel.json` (nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy).
- Locale: `python -m http.server 5173` (in locale `/privacy` e `/404` non esistono: usare `.html`).

## Mappa architettura
- `index.html`: tutta la pagina. Ordine sezioni: hero, marquee, servizi (siti web), chi-sono, progetti, esperienza, competenze, formazione, contatti, footer.
- `privacy.html`, `404.html`: pagine singole con stile inline minimo.
- `css/`: un file per sezione; `base.css` primo, `reduced-motion.css` ultimo.
- `js/App.js` crea e avvia tutte le classi; `js/main.js` è l'ultimo script. `js/core/` (Environment, SmoothScroll, TextSplitter, OffscreenPauser), `js/components/` (una classe per effetto), `js/animations/` (IntroAnimation, ScrollAnimations, HorizontalProjects, FooterSignature, SchematicDraw, TextScramble).
- Componenti aggiunti/estesi il 15/11: `NavBar` (nasconde la barra scorrendo giù, linea di avanzamento `#scroll-progress`, `aria-current` sul link della sezione), `ShotLightbox` (`<dialog id="lightbox">`), `ScreenshotTabs(environment)` (cambio animato), `Environment.getLoadedPlugins()`, `SmoothScroll.isSmooth()`.
- Attributi in `index.html`: `.split` = titolo parola per parola (TextSplitter); `data-lines` = paragrafo riga per riga (SplitText); `data-chars` = titolo contatti lettera per lettera; `.reveal` = blocco che sale (ScrollTrigger.batch).
- `assets/projects/<progetto>/`: schermate reali WebP 1280x800. `assets/og.jpg`: anteprima social 1200x630. `assets/CV-Giacomo-Negri.pdf`: CV pubblico (senza data di nascita né comune; resta foto e patente). `assets/CV-completo-Giacomo-Negri.pdf`: CV completo cifrato AES-256, password scelta dall'utente e mai salvata (script `cifra-cv.py` in `Documents\MyPortfolio-cv-privato`, fuori dal repo, con il PDF in chiaro: non copiarli nel repo).
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
- Cache busting: `?v=` ora `2026-11-15a` in tutti gli HTML; cambiarlo solo se cambiano CSS/JS.
- Il pin dei progetti ha `refreshPriority: 1`: senza, gli ScrollTrigger delle sezioni successive partirebbero in anticipo (non toglierlo).
- In `TextScramble` usare `overwrite: "auto"`, mai `true`: con `true` lo scramble cancella le altre animazioni dell'elemento (i numeri dei servizi restavano invisibili).
- Nella sezione progetti lo scroll verso la scheda parte solo con focus da tastiera (`:focus-visible`): con il mouse spostava la fila e il click andava a vuoto.
- La lightbox si chiude allo scroll solo senza Lenis (`isSmooth()` falso); con Lenis la pagina è in pausa.
- Elementi tratteggiati dello schema SVG: non animarli con DrawSVG (cancella `stroke-dasharray`), solo opacità.
- Contatore progetti `.h-count` nascosto sotto 1100x760 (le schede lo coprirebbero).
- A schermo basso (`max-height: 840px`) le schede progetto sono compatte (altrimenti sforano i 680px minimi della modalità orizzontale).
- Nessuna licenza scelta: il README dichiara che non è concessa licenza open source (decisione da confermare con l'utente).
- Non pubblicare nel portfolio siti realizzati per clienti (scelta dell'utente, 10/11/2026): niente casi studio commerciali.
- README in inglese per scelta del proprietario. Non inventare dati: niente telefono, P.IVA, recensioni, numeri di clienti.

## Stato avanzamento
- [x] Audit sicurezza iniziale, rinomina repo, repo PUBLIC, cronologia di `main` riscritta (email di contatto, foto rimossa).
- [x] Posizionamento developer, sezione siti web in evidenza, CV rifatto, font locali, case study con schermate reali.
- [x] Audit finale (ramo `chore/portfolio-final-audit`): nessun segreto in 35 commit raggiungibili; axe-core 0 violazioni su home, privacy, 404 (375 e 1280 px); nessun overflow a 320/375/768/1000/1280/1440; corretta la regione scorrevole dello schema (`.schem-scroll`, ora focusabile da tastiera).
- [x] PR #7 unita in `main`, ramo eliminato, deploy Vercel `success`; audit ripetuto sul sito pubblico: tutto PASS.
- [x] Lighthouse sul sito pubblico (mobile e desktop): Accessibility, Best Practices, SEO 100. Performance NON misurata.
- [x] 15/11/2026, ramo `feat/animazioni-gsap`: GSAP 3.14.2 con SplitText, ScrambleText, DrawSVG; nav che si nasconde, linea di avanzamento, link di sezione attivo; servizi in sequenza; paragrafi riga per riga; schema e icone che si disegnano; contatore e profondità nei progetti; lightbox delle schermate; View Transitions tra le pagine; cache lunga per font e schermate in `vercel.json`. Test locali: animazioni 24/24, funzionali 53, audit (larghezze, axe, tastiera) 30/30.

## Problemi aperti
- Cronologia di `main` riscritta una seconda volta il 10/11/2026 (vecchie versioni del CV sostituite con quella pubblica attuale; albero finale identico). Nessuna data di nascita né foto né email personale nei commit di `main`. Backup: `Documents\MyPortfolio-backup-2026-11-10-b.bundle` (e `...-10.bundle` per la prima riscrittura), fuori dal repo, da non pubblicare.
- Ticket #4985290 a GitHub Support creato il 10/11/2026 (Repositories) per dereferenziare le PR #1-#9: i loro riferimenti `refs/pull/*` raggiungono ancora i vecchi commit (email personale come autore, foto, CV con data di nascita). Esito in attesa: Support valuta caso per caso perché sono dati personali e non segreti. Risposte per email a quella di contatto e su support.github.com/tickets.
- La password del CV completo (`assets/CV-completo-Giacomo-Negri.pdf`) non si recupera: va ricifrato con `cifra-cv.py` (cartella `Documents\MyPortfolio-cv-privato`, fuori dal repo).
- Secret scanning e push protection attivati sul repository il 10/11/2026.
- Performance Lighthouse 12 sul sito pubblico (10/11/2026): mobile 79 (FCP 3,1 s, LCP 3,3 s, TBT 220 ms, CLS 0), desktop 95 (LCP 0,8 s). Cause mobile: 17 CSS separati che bloccano il rendering e animazione d'ingresso (LCP = nome nell'hero). Miglioramento facile non applicato: header di cache lunga per `/assets/fonts` e `/assets/projects` in `vercel.json`.
