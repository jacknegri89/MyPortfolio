/*
 * Animazione d'apertura:
 * 1. il contatore del loader va da 0 a 100 mentre si riempie la barra
 * 2. il loader scorre via verso l'alto
 * 3. le lettere di "Giacomo" salgono una alla volta, poi entra "Negri"
 * 4. compaiono il testo e i pulsanti dell'hero (.hero-in)
 * Durante l'animazione lo scroll è bloccato.
 */
class IntroAnimation {
  constructor(environment, smoothScroll, loader, firstNameLetters, lastName) {
    this.gsap = environment.gsap;
    this.smoothScroll = smoothScroll;
    this.loader = loader;
    this.firstNameLetters = firstNameLetters;
    this.lastName = lastName;
    this.counterText = document.getElementById("ld-count");
  }

  play() {
    // Il CSS ha un'animazione di riserva che nasconde il loader se il JS non parte:
    // qui la togliamo perché ci pensa GSAP.
    this.loader.style.animation = "none";
    this.smoothScroll.pause();

    this.hideHeroBeforeIntro();
    this.buildTimeline();
  }

  hideHeroBeforeIntro() {
    this.gsap.set(this.firstNameLetters, { yPercent: 110 });
    this.gsap.set(this.lastName, { yPercent: 110 });
    this.gsap.set(".hero-in", { y: 30, opacity: 0 });
  }

  buildTimeline() {
    const counter = { value: 0 };

    const timeline = this.gsap.timeline({
      onComplete: () => this.smoothScroll.resume(),
    });

    // Nel secondo parametro: 0 = parte all'inizio, "+=0.15" = dopo una pausa,
    // "-=0.45" = si sovrappone di 0,45 secondi all'animazione precedente.
    // Durate brevi: il caricamento non deve far aspettare (era ~2,7 secondi, ora ~1,7)
    timeline.to(counter, {
      value: 100,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        this.counterText.textContent = Math.round(counter.value);
      },
    });
    timeline.to("#ld-bar", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0);
    timeline.to(this.loader, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut" }, "+=0.05");
    timeline.to(this.firstNameLetters, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.045 }, "-=0.45");
    timeline.to(this.lastName, { yPercent: 0, duration: 1.3, ease: "expo.out" }, "-=1.05");
    timeline.to(".hero-in", { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08 }, "-=1");
    timeline.set(this.loader, { display: "none" });
  }
}
