/*
 * Punto di partenza del sito: crea tutti i componenti e li avvia nell'ordine giusto.
 * Per aggiungere una nuova funzionalità:
 *   1. crea una classe in js/components/ (o js/animations/)
 *   2. aggiungi il suo <script> in index.html, prima di App.js
 *   3. creala e avviala qui dentro, in uno dei passi di start()
 *
 * L'avvio è diviso in passi eseguiti uno alla volta (vedi runOneAtATime): tra un passo e l'altro
 * il browser può disegnare la pagina e rispondere a tocchi e scroll. Preparare tutto in un colpo
 * solo lo terrebbe bloccato troppo a lungo, soprattutto sui telefoni.
 */
class App {
  constructor() {
    this.environment = new Environment();
    this.smoothScroll = new SmoothScroll(this.environment);
  }

  start() {
    // Subito: scroll, barra in alto e animazione d'apertura (il loader copre la pagina nel frattempo)
    this.startBasics();
    const scrollAnimationSteps = this.startIntro();

    // Poi, un passo alla volta: sfondo 3D, effetti del mouse, piccole demo, animazioni di scroll
    const steps = [
      () => new ParticleWave(document.getElementById("bg3d"), this.environment).start(),
      () => this.startPointerEffects(),
      () => this.startProjectWidgets(),
      () => this.startSmallWidgets(),
    ];
    for (const step of scrollAnimationSteps) {
      steps.push(step);
    }
    setTimeout(() => this.runOneAtATime(steps), 0);
  }

  startBasics() {
    new ContactDetails().start();
    new NavBar().start();
    new OffscreenPauser().start();
    this.smoothScroll.start();
  }

  startPointerEffects() {
    if (!this.environment.canUseCustomCursor()) {
      return;
    }
    new CustomCursor(this.environment).start();
    new CardSpotlight().start();
    new MagneticButtons(this.environment).start();
  }

  // Schermate dei progetti: pulsanti per cambiarle, versione ingrandita, terminale e telefono simulati.
  startProjectWidgets() {
    new ScreenshotTabs(this.environment).start();
    new ShotLightbox(this.environment, this.smoothScroll).start();

    const terminal = new ScraperTerminal(document.getElementById("scraper-term"), this.environment);
    new InViewWatcher(terminal).start();
    new SecureNotesDemo(this.environment).start();
  }

  startSmallWidgets() {
    new SerialMonitor(document.getElementById("serial-body"), this.environment).start();
    new CopyButtons().start();
    new VelocityMarquee(this.smoothScroll, this.environment).start();
  }

  // Avvia l'animazione d'apertura e restituisce i passi che preparano le animazioni di scroll
  // (lista vuota se le animazioni sono disattivate).
  startIntro() {
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
      return [];
    }

    const gsap = this.environment.gsap;
    gsap.registerPlugin(...this.environment.getLoadedPlugins());

    new IntroAnimation(this.environment, this.smoothScroll, loader, firstNameLetters, document.getElementById("name-2")).play();

    const steps = new ScrollAnimations(this.environment, headings).getSteps();
    steps.push(() => new HorizontalProjects(this.environment).start());
    steps.push(() => new FooterSignature(this.environment).start());
    steps.push(() => new SchematicDraw(this.environment).start());
    steps.push(() => new TextScramble(this.environment).start());
    steps.push(() => this.refreshScrollPositions());
    return steps;
  }

  // Esegue il primo passo della lista e programma il successivo per "subito dopo".
  runOneAtATime(steps) {
    const nextStep = steps.shift();
    if (nextStep === undefined) {
      return;
    }
    nextStep();
    setTimeout(() => this.runOneAtATime(steps), 0);
  }

  // Ultimo passo: ora che tutte le animazioni esistono, ScrollTrigger ricalcola le posizioni.
  // (Al "load" della pagina e a ogni ridimensionamento lo rifà già da solo.)
  refreshScrollPositions() {
    const scrollTrigger = this.environment.scrollTrigger;
    scrollTrigger.refresh();

    // Se i font non sono ancora arrivati, al loro arrivo i testi cambiano altezza: ricalcoliamo ancora
    const fontsAreStillLoading = Boolean(document.fonts) && document.fonts.status !== "loaded";
    if (fontsAreStillLoading) {
      document.fonts.ready.then(() => scrollTrigger.refresh());
    }
  }
}
