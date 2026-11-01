# Portfolio di Giacomo Negri

Sito statico: HTML, CSS e JavaScript senza build. Per vederlo basta aprire `index.html` nel browser.
Le librerie esterne (Three.js, GSAP, ScrollTrigger, Lenis) arrivano da CDN, quindi serve la connessione.

## Struttura

```
index.html            solo il contenuto (testi, sezioni, link)
css/                  uno stile per ogni parte della pagina
js/
  core/               classi di base usate da tutto il sito
  components/         una classe per ogni elemento interattivo
  animations/         animazioni GSAP (apertura, scroll, progetti orizzontali)
  App.js              crea e avvia tutti i componenti
  main.js             avvia App (deve essere l'ultimo script)
assets/               CV in PDF, screenshot di Renova, og.jpg (anteprima quando condividi il link)
```

### CSS

L'ordine dei `<link>` in `index.html` conta, perché una regola scritta dopo vince su una scritta prima.
`base.css` va sempre per primo, `reduced-motion.css` sempre per ultimo.

| File | Cosa contiene |
| --- | --- |
| `base.css` | colori e font (variabili `--bg`, `--fg`, `--a1`...), reset, classi riutilizzabili |
| `loader.css` | schermata di caricamento |
| `cursor.css` | cursore personalizzato |
| `nav.css` | barra in alto |
| `buttons.css` | pulsanti `.btn` |
| `hero.css` | prima schermata con il nome |
| `marquee.css` | fasce di testo che scorrono |
| `sections.css` | card, chip e intestazioni comuni a tutte le sezioni |
| `about.css`, `projects.css`, `experience.css`, `skills.css`, `education.css`, `contact.css`, `footer.css` | una sezione ciascuno |
| `reduced-motion.css` | versione senza animazioni |

Per cambiare un colore in tutto il sito modifica la variabile in `:root` dentro `base.css`.

### JavaScript

Ogni file contiene una classe con un metodo `start()` (o `play()`), che la fa partire.
`App.js` le crea tutte nell'ordine giusto.

| Classe | Cosa fa |
| --- | --- |
| `Environment` | sa se l'utente ha il mouse, se vuole meno animazioni e se GSAP è caricato |
| `TextSplitter` | divide un testo in parole o lettere da animare |
| `SmoothScroll` | scroll morbido (Lenis), velocità dello scroll, link interni `#...` |
| `OffscreenPauser` | ferma le animazioni infinite delle sezioni con `data-pause-offscreen` quando non si vedono |
| `ContactDetails` | anno corrente nel footer |
| `NavBar` | su telefono dà uno sfondo alla barra in alto quando scorri |
| `ParticleWave` | onda di particelle 3D nell'hero |
| `CustomCursor`, `CardSpotlight`, `MagneticButtons` | effetti del mouse (solo su computer) |
| `ScraperTerminal` | finto terminale del progetto Job Scraper |
| `InViewWatcher` | fa partire il finto terminale quando entra nello schermo |
| `SecureNotesDemo` | testo che si cifra e decifra nel telefono |
| `SerialMonitor` | finto monitor del Raspberry Pi |
| `CopyButtons` | pulsanti "Copia" nei contatti |
| `VelocityMarquee` | fasce di testo legate alla velocità dello scroll |
| `IntroAnimation` | animazione d'apertura |
| `ScrollAnimations` | titoli, frasi e blocchi che appaiono scrollando |
| `HorizontalProjects` | progetti in orizzontale su desktop |
| `FooterSignature` | il nome nel footer che si disegna da solo quando arrivi in fondo |

Gli script sono normali `<script>` (non moduli), così il sito funziona anche aprendo il file con doppio clic.
Per questo l'ordine dei `<script>` in `index.html` è importante: una classe deve essere caricata prima di chi la usa.

## Operazioni frequenti

- **Dopo ogni modifica a CSS o JS:** in `index.html` cambia il numero dopo `?v=` (es. `?v=2026-10-07` → `?v=2026-10-08`) con cerca e sostituisci. Altrimenti chi ha già visitato il sito potrebbe vedere la versione vecchia.

- **Aggiungere un progetto:** copia un blocco `<article class="card proj">` in `index.html`. Lo scorrimento orizzontale si adatta da solo.
- **Aggiungere un effetto nuovo:** crea la classe in `js/components/`, aggiungi il suo `<script>` prima di `App.js` e avviala dentro `App.start()`.

## Pubblicare

Il sito è su Vercel: https://giacomonegri.vercel.app

Per aggiornarlo, dalla cartella con i file da pubblicare (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `vercel.json`, `css/`, `js/`, `assets/`):

```bash
npx vercel deploy --prod --yes
```

In PowerShell scrivi `npx.cmd` al posto di `npx`. `vercel.json` fa aprire il CV nel browser, imposta la cache e le intestazioni di sicurezza.
`.htaccess` serviva al vecchio hosting (InfinityFree): su Vercel non viene usato.
