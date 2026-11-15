/*
 * Animazioni legate allo scroll (plugin ScrollTrigger di GSAP):
 * - il nome nell'hero sale e sbiadisce mentre scrolli, lo sfondo 3D scorre più lento (profondità)
 * - i titoli .split entrano parola per parola
 * - i paragrafi [data-lines] entrano riga per riga (plugin SplitText)
 * - la frase della sezione Chi sono si "accende" parola per parola
 * - ogni riga dei servizi ha la sua sequenza: numero, descrizione, punti
 * - gli elementi .reveal salgono e appaiono; quelli che entrano insieme lo fanno in sequenza
 * - nelle card delle competenze l'icona si disegna e le etichette compaiono una dopo l'altra
 * - il titolo dei contatti entra lettera per lettera, la luce dietro cresce con lo scroll
 */
class ScrollAnimations {
  // headings: lista di { element, words } preparata da App con TextSplitter
  constructor(environment, headings) {
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
    this.splitText = environment.splitText;
    this.drawSvg = environment.drawSvg;
    this.headings = headings;
  }

  // Restituisce l'elenco dei passi da eseguire, uno per gruppo di animazioni.
  // Li esegue App uno alla volta (App.runOneAtATime), così la pagina non resta bloccata all'avvio.
  getSteps() {
    return [
      () => this.fadeHeroName(),
      () => this.revealHeadings(),
      () => this.revealLines(),
      () => this.lightUpStatement(),
      () => this.revealServices(),
      () => this.revealBlocks(),
      () => this.revealSkillDetails(),
      () => this.revealContactTitle(),
      () => this.growContactLight(),
    ];
  }

  fadeHeroName() {
    this.gsap.to(".hero-name", { yPercent: -18, opacity: 0.15, ease: "none", scrollTrigger: this.getHeroScroll() });

    // L'onda di particelle scende un po' mentre l'hero sale: sembra più lontana del testo
    this.gsap.to("#bg3d", { yPercent: 14, ease: "none", scrollTrigger: this.getHeroScroll() });
  }

  // Dall'inizio dell'hero fino a quando è uscito tutto dallo schermo, legato allo scroll (scrub).
  getHeroScroll() {
    return { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  }

  revealHeadings() {
    for (const heading of this.headings) {
      this.gsap.from(heading.words, {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: heading.element, start: "top 85%" },
      });
    }
  }

  // I paragrafi introduttivi entrano una riga alla volta, da sotto una "maschera".
  revealLines() {
    const paragraphs = document.querySelectorAll("[data-lines]");

    // Senza il plugin SplitText i paragrafi entrano come normali blocchi .reveal
    if (!this.splitText) {
      for (const paragraph of paragraphs) {
        paragraph.classList.add("reveal");
      }
      return;
    }

    for (const paragraph of paragraphs) {
      this.splitText.create(paragraph, {
        type: "lines",
        mask: "lines",
        aria: "none", // il testo resta leggibile così com'è dai lettori di schermo
        // autoSplit: se cambia la larghezza (o arrivano i font) le righe vengono ricalcolate
        // e onSplit ricrea l'animazione sulle righe nuove
        autoSplit: true,
        onSplit: (split) => {
          return this.gsap.from(split.lines, {
            yPercent: 110,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: paragraph, start: "top 90%" },
          });
        },
      });
    }
  }

  lightUpStatement() {
    const statement = document.getElementById("statement");
    const words = TextSplitter.splitWords(statement);

    this.gsap.fromTo(
      words,
      { opacity: 0.55 }, // partono attenuate ma leggibili, anche quelle azzurre (contrasto minimo 3:1)
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: "#statement", start: "top 78%", end: "bottom 42%", scrub: true },
      }
    );
  }

  // Servizi: il titolo entra con revealHeadings (ha la classe .split); qui numero, testo e punti.
  revealServices() {
    const rows = document.querySelectorAll(".svc");
    for (const row of rows) {
      const number = row.querySelector(".svc-num");
      const texts = row.querySelectorAll(".svc-body > p, .svc-points li");

      const timeline = this.gsap.timeline({
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
      timeline.from(number, { x: -18, opacity: 0, duration: 0.7, ease: "power3.out" });
      timeline.from(texts, { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, "-=0.45");
    }
  }

  // batch raggruppa gli elementi che entrano nello schermo nello stesso momento
  // (es. le card di una riga) e li fa comparire uno dopo l'altro invece che tutti insieme.
  revealBlocks() {
    const blocks = this.gsap.utils.toArray(".reveal");
    this.gsap.set(blocks, { y: 60, opacity: 0 });

    this.scrollTrigger.batch(blocks, {
      start: "top 90%",
      once: true,
      onEnter: (enteredBlocks) => {
        this.gsap.to(enteredBlocks, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.09,
          overwrite: true,
        });
      },
    });
  }

  // Competenze: dentro ogni card l'icona si disegna e le etichette compaiono in sequenza.
  revealSkillDetails() {
    const cards = document.querySelectorAll(".skill");
    for (const card of cards) {
      const chips = card.querySelectorAll(".chips li");
      const iconShapes = card.querySelectorAll(".skill-ico svg *");

      const timeline = this.gsap.timeline({
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });
      timeline.from(chips, { y: 10, scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.6)", stagger: 0.035 }, 0.25);

      if (this.drawSvg) {
        timeline.from(iconShapes, { drawSVG: 0, duration: 1.1, ease: "power2.inOut" }, 0.15);
      }
    }
  }

  // "Parliamone.": le lettere salgono una alla volta, poi il punto azzurro "rimbalza" al suo posto.
  revealContactTitle() {
    const title = document.querySelector("[data-chars]");
    if (title === null || !this.splitText) {
      return;
    }

    const split = this.splitText.create(title, { type: "chars" });
    const letters = split.chars.slice(0, -1);
    const finalDot = split.chars[split.chars.length - 1];

    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: title, start: "top 85%", once: true },
    });
    timeline.from(letters, { yPercent: 60, rotate: 7, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.045 });
    timeline.from(finalDot, { scale: 0, duration: 0.7, ease: "back.out(3)", transformOrigin: "50% 80%" }, "-=0.55");
  }

  // La luce azzurra dietro i contatti si allarga e scende mentre arrivi in fondo alla pagina.
  growContactLight() {
    this.gsap.fromTo(
      ".contact .orb",
      { scale: 0.7, yPercent: -12 },
      {
        scale: 1.25,
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom bottom", scrub: true },
      }
    );
  }
}
