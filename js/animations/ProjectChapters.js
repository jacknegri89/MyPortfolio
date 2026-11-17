/*
 * Capitoli della sezione Progetti: davanti a ogni scheda il nome del progetto scritto in grande.
 * Il nome nasce come contorno, le lettere salgono una alla volta e poi si riempie d'inchiostro
 * da sinistra a destra (un secondo strato di testo pieno, scoperto con clip-path).
 * - schermi grandi (fila orizzontale): il nome è a tutta altezza, scorre più lento della fila e la scheda
 *   che arriva gli passa sopra coprendolo
 * - schermi piccoli: il capitolo è un titolo grande sopra la scheda, animato dallo scroll verticale
 * I capitoli sono solo decorazione (aria-hidden): i nomi veri restano negli <h3> delle schede.
 * Li creiamo leggendo proprio quegli <h3>, quindi per un progetto nuovo non serve toccare nulla qui.
 */
class ProjectChapters {
  // Da quanto in basso (in % dell'altezza della lettera) e con che inclinazione partono le lettere
  static LETTER_DROP_PERCENT = 115;
  static LETTER_TILT_DEGREES = 12;
  static LETTER_STAGGER = 0.08;
  // Quanto scivola il nome mentre il capitolo attraversa lo schermo (in % della larghezza dello schermo).
  // Va verso destra: il nome resta indietro rispetto alla fila e finisce sotto la scheda che arriva,
  // senza mai passare sopra l'indice o la scheda precedente.
  static NAME_SLIDE_START = 0;
  static NAME_SLIDE_END = 40;
  // clip-path dello strato pieno: tutto nascosto (tagliato a destra del 100%) e tutto visibile
  static INK_HIDDEN = "inset(0% 100% 0% 0%)";
  static INK_SHOWN = "inset(0% 0% 0% 0%)";

  constructor(environment, track) {
    this.gsap = environment.gsap;
    this.track = track;
    this.chapters = [];
  }

  // Mette un capitolo davanti a ogni scheda. Va chiamato prima di misurare la larghezza della fila.
  build() {
    const projects = this.track.querySelectorAll(".proj");
    for (let index = 0; index < projects.length; index++) {
      const chapter = this.createChapter(projects[index]);
      this.track.insertBefore(chapter, projects[index]);
      this.chapters.push(chapter);
    }
    return this.chapters;
  }

  // Solo il nome: numero e tipo di progetto li dicono già l'indice, il contatore "01 / 04" e la scheda
  createChapter(project) {
    const chapter = document.createElement("div");
    chapter.className = "proj-chapter";
    chapter.setAttribute("aria-hidden", "true");

    // Due strati con lo stesso nome: il contorno sotto, l'inchiostro pieno sopra
    const title = project.querySelector("h3").textContent;
    const name = document.createElement("span");
    name.className = "chapter-name serif";
    const ink = document.createElement("span");
    ink.className = "chapter-ink";
    this.addLetters(name, title);
    this.addLetters(ink, title);
    name.appendChild(ink);

    chapter.append(name);
    return chapter;
  }

  // Ogni lettera in uno <span>, con il suo numero d'ordine (serve a farle salire una alla volta)
  addLetters(parent, title) {
    let position = 0;
    for (const character of title) {
      const letter = document.createElement("span");
      letter.className = "chapter-letter";
      letter.textContent = character;
      letter.dataset.position = String(position);
      parent.appendChild(letter);
      position += 1;
    }
  }

  // horizontalScroll: l'animazione della fila orizzontale, oppure null sugli schermi piccoli
  animate(horizontalScroll) {
    for (const chapter of this.chapters) {
      this.raiseLetters(chapter, horizontalScroll);
      this.fillWithInk(chapter, horizontalScroll);
      if (horizontalScroll !== null) {
        this.slideName(chapter, horizontalScroll);
      }
    }
  }

  // Le impostazioni di scroll cambiano tra fila orizzontale (bordi "left") e pagina verticale (bordi "top")
  getScroll(chapter, horizontalScroll, horizontalRange, verticalRange) {
    if (horizontalScroll === null) {
      return { trigger: chapter, start: verticalRange[0], end: verticalRange[1], scrub: true };
    }
    return {
      trigger: chapter,
      containerAnimation: horizontalScroll,
      start: horizontalRange[0],
      end: horizontalRange[1],
      scrub: true,
    };
  }

  // Le lettere salgono da sotto la linea mentre il capitolo entra
  raiseLetters(chapter, horizontalScroll) {
    const scroll = this.getScroll(chapter, horizontalScroll, ["left 92%", "left 35%"], ["top 92%", "top 45%"]);
    const timeline = this.gsap.timeline({ scrollTrigger: scroll });
    timeline.from(chapter.querySelectorAll(".chapter-letter"), {
      yPercent: ProjectChapters.LETTER_DROP_PERCENT,
      rotate: ProjectChapters.LETTER_TILT_DEGREES,
      ease: "power3.out",
      // Contorno e inchiostro salgono insieme: il ritardo dipende dalla posizione nel nome, non nell'elenco
      stagger: (index, letter) => Number(letter.dataset.position) * ProjectChapters.LETTER_STAGGER,
    });
  }

  // L'inchiostro riempie il nome da sinistra a destra, finendo quando il capitolo è al centro
  fillWithInk(chapter, horizontalScroll) {
    const scroll = this.getScroll(chapter, horizontalScroll, ["left 70%", "left 15%"], ["top 75%", "top 30%"]);
    this.gsap.fromTo(
      chapter.querySelector(".chapter-ink"),
      { clipPath: ProjectChapters.INK_HIDDEN },
      { clipPath: ProjectChapters.INK_SHOWN, ease: "none", scrollTrigger: scroll }
    );
  }

  // Il nome si muove più lento della fila: resta indietro e scivola sotto la scheda che segue
  slideName(chapter, horizontalScroll) {
    this.gsap.fromTo(
      chapter.querySelector(".chapter-name"),
      { x: () => window.innerWidth * (ProjectChapters.NAME_SLIDE_START / 100) },
      {
        x: () => window.innerWidth * (ProjectChapters.NAME_SLIDE_END / 100),
        ease: "none",
        scrollTrigger: {
          trigger: chapter,
          containerAnimation: horizontalScroll,
          start: "left right",
          end: "right left",
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  remove() {
    for (const chapter of this.chapters) {
      chapter.remove();
    }
    this.chapters = [];
  }
}
