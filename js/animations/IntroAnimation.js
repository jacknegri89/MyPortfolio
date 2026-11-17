/*
 * Animazione d'apertura, in due tempi:
 * 1. prepare(): mentre App prepara la prima schermata un passo alla volta (onda 3D, effetti del mouse,
 *    nome dell'hero), il loader resta su e il contatore segue la preparazione (setPreparation). Il contatore
 *    è già partito in CSS mentre si scaricavano i file (css/loader.css): qui riparte da dove era arrivato.
 * 2. reveal(): a pagina pronta il contatore arriva a 100, il loader sale come un sipario con il bordo curvo
 *    (intanto la camera vola sull'onda: ParticleWave.startFlyIn), le lettere di "Giacomo" salgono,
 *    entra "Negri", poi il testo e i pulsanti dell'hero, e "Developer" si decifra.
 * Il lavoro della prima schermata sta sotto il sipario; quello delle altre sezioni parte a apertura finita:
 * così l'entrata del nome è fluida. Durante l'apertura lo scroll è bloccato.
 */
class IntroAnimation {
  // Quanto dura la salita del sipario (in secondi) e di quanto salgono le scritte del loader prima di sparire
  static CURTAIN_SECONDS = 1.05;
  static TEXT_LIFT_PIXELS = 40;
  // Di quanto parte in ritardo il sipario azzurro rispetto a quello scuro: con questo valore si vede
  // come una fascia alta circa un quarto di schermo (di più e lo schermo diventa tutto azzurro)
  static VEIL_DELAY_SECONDS = 0.08;
  // Anche con tutti i file già in cache il contatore si vede salire per almeno questo tempo dall'apertura
  static MIN_LOADER_SECONDS = 0.9;
  static FINAL_COUNT_SECONDS = 0.35;
  // Durante la preparazione il contatore si ferma a 95: l'ultimo tratto fino a 100 lo fa reveal()
  static PREPARATION_MAX_PERCENT = 95;

  constructor(environment, smoothScroll, loader, firstNameLetters, lastName) {
    this.gsap = environment.gsap;
    this.root = environment.root;
    this.smoothScroll = smoothScroll;
    this.loader = loader;
    this.firstNameLetters = firstNameLetters;
    this.lastName = lastName;
    this.role = document.querySelector(".role");
    this.canScramble = Boolean(environment.scrambleText);
    this.progress = { value: 0 };
    this.startPercent = 0;
  }

  // Primo tempo: il JavaScript prende in mano il contatore e nasconde l'hero in attesa dell'apertura.
  prepare() {
    this.startPercent = this.readCssProgress();
    this.progress.value = this.startPercent;

    // Togliamo le animazioni CSS del loader (contatore e riserva): da qui in poi ci pensa GSAP.
    // Prima fissiamo il numero raggiunto, altrimenti il contatore tornerebbe a 0.
    this.loader.style.animation = "none";
    this.showProgress();

    this.smoothScroll.pause();
    this.hideHeroBeforeIntro();
  }

  // Il numero a cui è arrivato il contatore CSS (0 se il browser non sa animare la variabile)
  readCssProgress() {
    const text = getComputedStyle(this.loader).getPropertyValue("--ld-progress");
    const value = parseInt(text, 10);
    if (Number.isNaN(value)) {
      return 0;
    }
    return value;
  }

  showProgress() {
    this.loader.style.setProperty("--ld-progress", String(Math.round(this.progress.value)));
  }

  // App la chiama dopo ogni passo della preparazione: il contatore sale in proporzione ai passi fatti.
  setPreparation(doneSteps, totalSteps) {
    const share = doneSteps / totalSteps;
    const target = this.startPercent + (IntroAnimation.PREPARATION_MAX_PERCENT - this.startPercent) * share;
    this.gsap.to(this.progress, {
      value: target,
      duration: 0.35,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => this.showProgress(),
    });
  }

  hideHeroBeforeIntro() {
    this.gsap.set(this.firstNameLetters, { yPercent: 110 });
    this.gsap.set(this.lastName, { yPercent: 110 });
    this.gsap.set(".hero-in", { y: 30, opacity: 0 });
  }

  // Secondo tempo: la prima schermata è pronta, si apre il sipario.
  // whenOpen parte alla fine dell'apertura (App prepara allora le sezioni più in basso).
  reveal(whenOpen) {
    const timeline = this.gsap.timeline({
      onComplete: () => {
        this.smoothScroll.resume();
        whenOpen();
      },
    });

    // Ultimo tratto del contatore fino a 100. Se la pagina è stata velocissima allunghiamo un po',
    // così il loader non lampeggia e basta.
    const secondsSinceOpening = performance.now() / 1000;
    const missingSeconds = IntroAnimation.MIN_LOADER_SECONDS - secondsSinceOpening;
    const countSeconds = Math.max(IntroAnimation.FINAL_COUNT_SECONDS, missingSeconds);
    timeline.to(this.progress, {
      value: 100,
      duration: countSeconds,
      ease: "power2.inOut",
      overwrite: true,
      onUpdate: () => this.showProgress(),
    });

    this.liftCurtain(timeline);
    this.bringInHero(timeline);
    timeline.set(this.loader, { display: "none" });
  }

  // Nel secondo parametro: "-=0.55" = si sovrappone di 0,55 secondi all'animazione precedente.
  bringInHero(timeline) {
    timeline.to(this.firstNameLetters, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.045 }, "-=0.55");
    timeline.to(this.lastName, { yPercent: 0, duration: 1.3, ease: "expo.out" }, "-=1.05");
    timeline.to(".hero-in", { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08 }, "-=1");
    if (this.canScramble && this.role !== null) {
      const roleText = this.role.textContent;
      const scramble = { text: roleText, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.5 };
      // Finisce insieme al resto dell'hero, senza allungare l'animazione d'apertura
      timeline.to(this.role, { duration: 0.8, ease: "none", scrambleText: scramble }, "-=0.9");
    }
  }

  // Il loader sale come un sipario con il bordo in basso curvo (.ld-curve in loader.css):
  // prima spariscono le scritte, poi il sipario sale e la curva si appiattisce mentre esce.
  // Dietro c'è un secondo sipario azzurro (#ld-veil) che parte un attimo dopo: si vede come una fascia
  // azzurra che insegue quello scuro.
  liftCurtain(timeline) {
    const veil = document.getElementById("ld-veil");
    const curves = document.querySelectorAll(".ld-curve");
    const loaderTexts = this.loader.querySelectorAll(".ld-top, .ld-bottom");

    // Ogni sipario deve salire della sua altezza più quella della curva che ha sotto
    const getLiftDistance = () => -(this.loader.offsetHeight + curves[0].offsetHeight);
    const duration = IntroAnimation.CURTAIN_SECONDS;

    this.gsap.set(veil, { display: "block" });

    timeline.to(loaderTexts, { y: -IntroAnimation.TEXT_LIFT_PIXELS, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.05");
    timeline.to("#ld-bar", { opacity: 0, duration: 0.3 }, "<");
    // Da qui la pagina si scopre: l'onda 3D comincia il suo volo (ParticleWave ascolta "introreveal")
    timeline.call(() => this.announceReveal(), null, "-=0.2");
    timeline.to(this.loader, { y: getLiftDistance, duration: duration, ease: "power3.inOut" }, "<");
    timeline.to(veil, { y: getLiftDistance, duration: duration, ease: "power3.inOut" }, "<+=" + IntroAnimation.VEIL_DELAY_SECONDS);
    // Le due curve si appiattiscono mentre i sipari escono dallo schermo
    timeline.to(curves, { scaleY: 0, duration: duration, ease: "power2.in" }, "<");
    timeline.set(veil, { display: "none" });
  }

  announceReveal() {
    this.root.classList.add("is-revealed");
    document.dispatchEvent(new Event("introreveal"));
  }
}
