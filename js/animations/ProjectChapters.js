/*
 * Capitoli della sezione Progetti: davanti a ogni scheda il nome del progetto scritto in grande.
 * Il nome nasce come contorno, le lettere salgono una alla volta e poi si riempie d'inchiostro
 * da sinistra a destra (un secondo strato di testo pieno, scoperto con clip-path).
 * - schermi grandi (fila orizzontale): il nome è un "dorso" verticale tra una scheda e l'altra, sempre intero
 *   (prima era orizzontale e la scheda che arrivava lo copriva: si leggeva solo a metà).
 *   La grandezza la decide projects.css partendo da --name-ems, la larghezza del nome misurata qui
 * - schermi piccoli: il capitolo è un titolo grande sopra la scheda, animato dallo scroll verticale
 * I capitoli sono solo decorazione (aria-hidden): i nomi veri restano negli <h3> delle schede.
 * Li creiamo leggendo proprio quegli <h3>, quindi per un progetto nuovo non serve toccare nulla qui.
 */
class ProjectChapters {
  // Da quanto in basso (in % dell'altezza della lettera) e con che inclinazione partono le lettere
  static LETTER_DROP_PERCENT = 115;
  static LETTER_TILT_DEGREES = 12;
  static LETTER_STAGGER = 0.08;
  // Di quanto sale il dorso mentre attraversa lo schermo (in % dell'altezza dello schermo):
  // parte un po' più in basso e finisce un po' più in alto, così sembra a una profondità diversa dalla fila
  static NAME_DRIFT_PERCENT = 6;
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
      this.measureName(chapter);
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

  // Larghezza del nome in em (larghezza in pixel diviso grandezza del carattere): non cambia con la misura
  // della finestra, quindi basta misurarla una volta. offsetWidth ignora la rotazione del dorso.
  measureName(chapter) {
    const name = chapter.querySelector(".chapter-name");
    const fontSize = parseFloat(getComputedStyle(name).fontSize);
    const widthInEms = name.offsetWidth / fontSize;
    chapter.style.setProperty("--name-ems", widthInEms.toFixed(3));
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
        this.driftName(chapter, horizontalScroll);
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
    const scroll = this.getScroll(chapter, horizontalScroll, ["left 98%", "left 62%"], ["top 92%", "top 45%"]);
    const timeline = this.gsap.timeline({ scrollTrigger: scroll });
    timeline.from(chapter.querySelectorAll(".chapter-letter"), {
      yPercent: ProjectChapters.LETTER_DROP_PERCENT,
      rotate: ProjectChapters.LETTER_TILT_DEGREES,
      ease: "power3.out",
      // Contorno e inchiostro salgono insieme: il ritardo dipende dalla posizione nel nome, non nell'elenco
      stagger: (index, letter) => Number(letter.dataset.position) * ProjectChapters.LETTER_STAGGER,
    });
  }

  // L'inchiostro riempie il nome dall'inizio alla fine (sul dorso: dal basso in alto), finendo quando il capitolo è al centro
  fillWithInk(chapter, horizontalScroll) {
    const scroll = this.getScroll(chapter, horizontalScroll, ["left 85%", "left 45%"], ["top 75%", "top 30%"]);
    this.gsap.fromTo(
      chapter.querySelector(".chapter-ink"),
      { clipPath: ProjectChapters.INK_HIDDEN },
      { clipPath: ProjectChapters.INK_SHOWN, ease: "none", scrollTrigger: scroll }
    );
  }

  // Il dorso sale piano mentre attraversa lo schermo. Si muove tutto il capitolo, non il nome:
  // il nome è ruotato e centrato con le proprietà CSS rotate e translate, e animandolo GSAP le riscrive
  // (il nome finiva spostato di lato, sotto la scheda). y negativa = verso l'alto.
  driftName(chapter, horizontalScroll) {
    const drift = () => window.innerHeight * (ProjectChapters.NAME_DRIFT_PERCENT / 100);
    this.gsap.fromTo(
      chapter,
      { y: () => drift() },
      {
        y: () => -drift(),
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
