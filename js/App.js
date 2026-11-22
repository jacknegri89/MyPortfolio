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
 * I passi sono in due gruppi:
 * 1. prima schermata (onda 3D, effetti del mouse, nome dell'hero): girano sotto il loader, che ne
 *    mostra l'avanzamento, poi si apre il sipario (IntroAnimation.reveal)
 * 2. tutte le altre sezioni: partono quando l'animazione d'apertura è finita. Così il loader dura poco
 *    e l'entrata del nome non scatta per il lavoro fatto nel frattempo.
 */
class App {
  constructor() {
    this.environment = new Environment();
    this.smoothScroll = new SmoothScroll(this.environment);
    this.intro = null; // IntroAnimation, solo quando le animazioni sono attive
  }

  start() {
    // Subito: scroll, barra in alto e animazione d'apertura (il loader copre la pagina nel frattempo)
    this.startBasics();
    const animationSteps = this.startIntro();

    const firstScreenSteps = [() => this.startParticleWave(), () => this.startPointerEffects()];
    for (const step of animationSteps.firstScreen) {
      firstScreenSteps.push(step);
    }

    const laterSteps = [() => this.startProjectWidgets(), () => this.startSmallWidgets()];
    for (const step of animationSteps.belowTheFold) {
      laterSteps.push(step);
    }

    const totalSteps = firstScreenSteps.length;
    const showProgress = (stepsLeft) => this.showPreparation(totalSteps - stepsLeft, totalSteps);
    const openPage = () => this.revealPage(laterSteps);
    setTimeout(() => this.runOneAtATime(firstScreenSteps, showProgress, openPage), 0);
  }

  // L'onda 3D usa Three.js, che si scarica in parallelo (async in index.html) perché è pesante e
  // non deve far aspettare l'apertura. Se non è ancora arrivato, l'onda parte quando arriva.
  startParticleWave() {
    const startWave = () => new ParticleWave(document.getElementById("bg3d"), this.environment).start();
    if (window.THREE) {
      startWave();
      return;
    }
    const threeScript = document.getElementById("three-script");
    if (threeScript === null) {
      return;
    }
    threeScript.addEventListener("load", startWave, { once: true });
  }

  startBasics() {
    new ContactDetails().start();
    new LocalClock().start();
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
    new NameProximity(this.environment).start();
    new WorkIndex(this.environment).start();
    new WindowTilt(this.environment).start();
  }

  // Schermate dei progetti: pulsanti per cambiarle, versione ingrandita, terminale e telefono simulati.
  startProjectWidgets() {
    new ScreenshotTabs(this.environment).start();
    new ShotLightbox(this.environment, this.smoothScroll).start();

    // Un terminale animato per ogni elemento con data-terminal (oggi JobScraper e RelayHub)
    const terminals = [];
    const terminalElements = document.querySelectorAll("[data-terminal]");
    for (const element of terminalElements) {
      terminals.push(new TypingTerminal(element, this.environment));
    }
    new InViewWatcher(terminals).start();
    new SecureNotesDemo(this.environment).start();
  }

  startSmallWidgets() {
    new SerialMonitor(document.getElementById("serial-body"), this.environment).start();
    new CopyButtons().start();
    const stackFilter = new StackFilter(this.environment);
    stackFilter.start();
    new StackConstellation(this.environment, stackFilter).start();
    new VelocityMarquee(this.smoothScroll, this.environment).start();
  }

  // Avvia l'animazione d'apertura e restituisce i passi che preparano le animazioni di scroll:
  // { firstScreen: quelli dell'hero, belowTheFold: quelli delle altre sezioni }
  // (liste vuote se le animazioni sono disattivate).
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
      return { firstScreen: [], belowTheFold: [] };
    }

    const gsap = this.environment.gsap;
    gsap.registerPlugin(...this.environment.getLoadedPlugins());
    this.skipRefreshOnLoad();

    this.intro = new IntroAnimation(this.environment, this.smoothScroll, loader, firstNameLetters, document.getElementById("name-2"));
    this.intro.prepare();

    const scrollAnimations = new ScrollAnimations(this.environment, headings);
    const steps = scrollAnimations.getSteps();
    steps.push(() => new ServicesStage(this.environment).start());
    steps.push(() => new HorizontalProjects(this.environment, this.smoothScroll).start());
    steps.push(() => new SchematicDraw(this.environment).start());
    steps.push(() => new RuleLines(this.environment).start());
    steps.push(() => new EducationTimeline(this.environment).start());
    steps.push(() => new TextScramble(this.environment).start());
    steps.push(() => this.refreshScrollPositions());
    return { firstScreen: scrollAnimations.getFirstScreenSteps(), belowTheFold: steps };
  }

  // Esegue il primo passo della lista e programma il successivo per "subito dopo".
  // afterEachStep riceve quanti passi mancano; whenDone parte quando la lista è vuota.
  runOneAtATime(steps, afterEachStep, whenDone) {
    const nextStep = steps.shift();
    if (nextStep === undefined) {
      whenDone();
      return;
    }
    nextStep();
    afterEachStep(steps.length);
    setTimeout(() => this.runOneAtATime(steps, afterEachStep, whenDone), 0);
  }

  // Il contatore del loader segue i passi della prima schermata
  showPreparation(doneSteps, totalSteps) {
    if (this.intro === null) {
      return;
    }
    this.intro.setPreparation(doneSteps, totalSteps);
  }

  // Si apre il sipario; le altre sezioni si preparano quando l'apertura è finita.
  // Senza animazioni non c'è sipario: si preparano subito.
  revealPage(laterSteps) {
    const doNothing = () => {};
    const prepareTheRest = () => this.runOneAtATime(laterSteps, doNothing, doNothing);
    if (this.intro === null) {
      prepareTheRest();
      return;
    }
    this.intro.reveal(prepareTheRest);
  }

  // Di suo ScrollTrigger ricalcola tutte le posizioni anche all'evento "load" (immagini e Three.js
  // arrivati): con le sezioni bloccate è un lavoro pesante e cadeva proprio mentre si alza il sipario.
  // Non serve: le immagini hanno width e height nell'HTML (non spostano nulla) e ricalcoliamo noi
  // alla fine della preparazione e all'arrivo dei font (refreshScrollPositions).
  skipRefreshOnLoad() {
    const scrollTrigger = this.environment.scrollTrigger;
    if (!scrollTrigger) {
      return;
    }
    scrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
  }

  // Ultimo passo: ora che tutte le animazioni esistono, ScrollTrigger ricalcola le posizioni.
  // (A ogni ridimensionamento lo rifà già da solo.)
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
