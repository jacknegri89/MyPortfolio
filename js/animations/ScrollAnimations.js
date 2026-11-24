/*
 * Animazioni legate allo scroll (plugin ScrollTrigger di GSAP):
 * - il nome nell'hero sale, sbiadisce e si apre in due mentre scrolli, lo sfondo 3D scorre più lento (profondità)
 * - i titoli .split entrano parola per parola
 * - i paragrafi [data-lines] entrano riga per riga (plugin SplitText)
 * - la frase della sezione Chi sono si "accende" parola per parola; la sezione, chiara, ha i bordi curvi che si appiattiscono
 * - ogni riga dei servizi ha la sua sequenza: numero, descrizione, punti
 * - gli elementi .reveal salgono e appaiono; quelli che entrano insieme lo fanno in sequenza
 * - il titolo dei contatti entra lettera per lettera; la sezione azzurra si apre a cerchio
 */
class ScrollAnimations {
  // Di quanto si spostano di lato nome e cognome mentre l'hero esce (in % della loro larghezza)
  static HERO_SPLIT_PERCENT = 4;
  // Raggio del cerchio dei contatti quando copre tutta la sezione (vedi contact.css)
  static FLOOD_FULL = "150%";
  // Da quanti pixel più in basso partono i blocchi .reveal
  static REVEAL_DISTANCE_PIXELS = 36;
  // Opacità di partenza delle parole della frase "Chi sono": attenuate ma leggibili sul fondo chiaro,
  // anche quelle blu (contrasto minimo 3:1). Più bassa di così e le parole blu non si leggono.
  static STATEMENT_DIM_OPACITY = 0.62;

  // headings: lista di { element, words } preparata da App con TextSplitter
  constructor(environment, headings) {
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
    this.splitText = environment.splitText;
    this.headings = headings;
  }

  // Animazioni della prima schermata (l'hero): App le prepara prima di aprire il sipario.
  getFirstScreenSteps() {
    return [() => this.fadeHeroName()];
  }

  // Animazioni delle sezioni più in basso, un passo per gruppo. App le prepara dopo l'apertura,
  // uno alla volta (App.runOneAtATime), così la pagina non resta bloccata.
  getSteps() {
    return [
      () => this.revealHeadings(),
      () => this.revealLines(),
      () => this.lightUpStatement(),
      () => this.curveLightSection(),
      () => this.revealServices(),
      () => this.revealBlocks(),
      () => this.revealContactTitle(),
      () => this.floodContact(),
    ];
  }

  fadeHeroName() {
    this.gsap.to(".hero-name", { yPercent: -18, opacity: 0.15, ease: "none", scrollTrigger: this.getHeroScroll() });

    // Nome e cognome si allontanano: "Giacomo" verso sinistra, "Negri" verso destra
    this.gsap.to(".hero-name .l1", { xPercent: -ScrollAnimations.HERO_SPLIT_PERCENT, ease: "none", scrollTrigger: this.getHeroScroll() });
    this.gsap.to(".hero-name .l2", { xPercent: ScrollAnimations.HERO_SPLIT_PERCENT, ease: "none", scrollTrigger: this.getHeroScroll() });

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
      { opacity: ScrollAnimations.STATEMENT_DIM_OPACITY },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: "#statement", start: "top 78%", end: "bottom 42%", scrub: true },
      }
    );
  }

  // La sezione chiara "Chi sono" arriva con il bordo in alto curvo, che si appiattisce mentre sale;
  // lo stesso succede al bordo in basso quando la sezione esce (variabili --dome-top e --dome-bottom in about.css).
  curveLightSection() {
    this.gsap.fromTo(
      ".about-sec",
      { "--dome-top": 1 },
      {
        "--dome-top": 0,
        ease: "none",
        scrollTrigger: { trigger: ".about-sec", start: "top bottom", end: "top 30%", scrub: true },
      }
    );
    this.gsap.fromTo(
      ".about-sec",
      { "--dome-bottom": 1 },
      {
        "--dome-bottom": 0,
        ease: "none",
        scrollTrigger: { trigger: ".about-sec", start: "bottom bottom", end: "bottom 25%", scrub: true },
      }
    );
  }

  // Servizi: il titolo entra con revealHeadings (ha la classe .split); qui testo e punti.
  revealServices() {
    const rows = document.querySelectorAll(".svc");
    for (const row of rows) {
      const texts = row.querySelectorAll(".svc-body > p, .svc-points li");

      const timeline = this.gsap.timeline({
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
      timeline.from(texts, { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 });
    }
  }

  // batch raggruppa gli elementi che entrano nello schermo nello stesso momento
  // (es. le card di una riga) e li fa comparire uno dopo l'altro invece che tutti insieme.
  revealBlocks() {
    const blocks = this.gsap.utils.toArray(".reveal");
    this.gsap.set(blocks, { y: ScrollAnimations.REVEAL_DISTANCE_PIXELS, opacity: 0 });

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

  // "Parliamone.": le lettere salgono una alla volta, poi il punto azzurro cresce al suo posto.
  revealContactTitle() {
    const title = document.querySelector("[data-chars]");
    if (title === null || !this.splitText) {
      return;
    }

    // "words,chars": le lettere restano dentro la loro parola, così il titolo non va mai a capo a metà
    const split = this.splitText.create(title, { type: "words,chars" });
    const letters = split.chars.slice(0, -1);
    const finalDot = split.chars[split.chars.length - 1];

    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: title, start: "top 85%", once: true },
    });
    timeline.from(letters, { yPercent: 60, rotate: 7, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.045 });
    timeline.from(finalDot, { scale: 0, duration: 0.9, ease: "expo.out", transformOrigin: "50% 80%" }, "-=0.55");
  }

  // La sezione Contatti è tutta azzurra. Arrivandoci compare come un cerchio che si allarga
  // dal centro del suo bordo in alto, fino a coprire lo schermo (variabile --flood in contact.css).
  floodContact() {
    this.gsap.fromTo(
      ".contact",
      { "--flood": "0%" },
      {
        "--flood": ScrollAnimations.FLOOD_FULL,
        ease: "none",
        scrollTrigger: { trigger: ".contact", start: "top 95%", end: "top 25%", scrub: true },
      }
    );
  }
}
