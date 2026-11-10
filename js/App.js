/*
 * Punto di partenza del sito: crea tutti i componenti e li avvia nell'ordine giusto.
 * Per aggiungere una nuova funzionalità:
 *   1. crea una classe in js/components/ (o js/animations/)
 *   2. aggiungi il suo <script> in index.html, prima di App.js
 *   3. creala e avviala qui dentro
 */
class App {
  constructor() {
    this.environment = new Environment();
    this.smoothScroll = new SmoothScroll(this.environment);
  }

  start() {
    new ContactDetails().start();
    new NavBar().start();
    new OffscreenPauser().start();
    this.smoothScroll.start();
    new ParticleWave(document.getElementById("bg3d"), this.environment).start();

    if (this.environment.canUseCustomCursor()) {
      new CustomCursor(this.environment).start();
      new CardSpotlight().start();
      new MagneticButtons(this.environment).start();
    }

    const terminal = new ScraperTerminal(document.getElementById("scraper-term"), this.environment);
    new InViewWatcher(terminal).start();

    new SecureNotesDemo(this.environment).start();
    new SerialMonitor(document.getElementById("serial-body"), this.environment).start();
    new CopyButtons().start();
    new ScreenshotTabs().start();
    new VelocityMarquee(this.smoothScroll, this.environment).start();

    this.startAnimations();
  }

  startAnimations() {
    const loader = document.getElementById("loader");

    // Il testo viene diviso sempre, anche senza animazioni, così l'HTML finale è lo stesso
    const firstNameLetters = TextSplitter.splitChars(document.getElementById("name-1"));
    const headings = [];
    const splitElements = document.querySelectorAll(".split");
    for (const element of splitElements) {
      headings.push({ element: element, words: TextSplitter.splitWords(element) });
    }

    if (!this.environment.canAnimateWithGsap()) {
      // Niente animazioni: nascondiamo subito il loader e il sito è già tutto visibile
      loader.style.display = "none";
      return;
    }

    const gsap = this.environment.gsap;
    const scrollTrigger = this.environment.scrollTrigger;
    gsap.registerPlugin(scrollTrigger);

    new IntroAnimation(this.environment, this.smoothScroll, loader, firstNameLetters, document.getElementById("name-2")).play();
    new ScrollAnimations(this.environment, headings).start();
    new HorizontalProjects(this.environment).start();
    new FooterSignature(this.environment).start();

    // Quando immagini e font sono pronti le misure della pagina cambiano: ricalcoliamo gli scroll.
    window.addEventListener("load", () => scrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scrollTrigger.refresh());
    }
  }
}
