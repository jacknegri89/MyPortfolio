/*
 * Testi delle schede progetto che si compongono mentre la scheda arriva (legati allo scroll):
 * 1. la riga in alto (tipo di progetto e date) scivola dentro
 * 2. Problema / Soluzione / Tecnica entrano a turno da destra
 * 3. le tecnologie spuntano una alla volta, poi arrivano pulsanti e nota
 * Il titolo della scheda non si anima: il nome lo ha appena fatto lettera per lettera il capitolo
 * gigante che la precede (ProjectChapters), ripeterlo subito dopo sarebbe di troppo.
 * Su schermi grandi segue lo scorrimento orizzontale della fila (containerAnimation),
 * su telefono lo scroll normale. Le scritte restano nel documento: cambia solo come appaiono.
 */
class ProjectDetails {
  // Righe Problema / Soluzione / Tecnica: arrivano da destra
  static ROW_SHIFT_PIXELS = 28;
  static ROW_STAGGER = 0.15;
  // Tecnologie: partono più piccole
  static CHIP_START_SCALE = 0.6;
  static CHIP_STAGGER = 0.06;

  constructor(environment) {
    this.gsap = environment.gsap;
  }

  // horizontalScroll = animazione della fila orizzontale, oppure null su telefono
  animate(project, horizontalScroll) {
    const scroll = this.getScroll(project, horizontalScroll);
    const timeline = this.gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: scroll });

    this.slideHeader(timeline, project.querySelector(".proj-num"));
    this.bringRows(timeline, project.querySelectorAll(".case > div"));
    this.popChips(timeline, project.querySelectorAll(".chips li"));
    this.liftEnding(timeline, project.querySelectorAll(".proj-links, .proj-note"));
  }

  getScroll(project, horizontalScroll) {
    if (horizontalScroll === null) {
      return { trigger: project, start: "top 85%", end: "top 35%", scrub: true };
    }
    return {
      trigger: project,
      containerAnimation: horizontalScroll,
      start: "left 80%",
      end: "left 28%",
      scrub: true,
    };
  }

  slideHeader(timeline, header) {
    if (header === null) {
      return;
    }
    timeline.from(header, { opacity: 0, x: 40, duration: 0.4 }, 0);
  }

  bringRows(timeline, rows) {
    if (rows.length === 0) {
      return;
    }
    timeline.fromTo(
      rows,
      { opacity: 0, x: ProjectDetails.ROW_SHIFT_PIXELS },
      { opacity: 1, x: 0, stagger: ProjectDetails.ROW_STAGGER, duration: 0.5 },
      0.25
    );
  }

  popChips(timeline, chips) {
    if (chips.length === 0) {
      return;
    }
    timeline.from(
      chips,
      { opacity: 0, scale: ProjectDetails.CHIP_START_SCALE, y: 10, stagger: ProjectDetails.CHIP_STAGGER, duration: 0.3 },
      0.6
    );
  }

  liftEnding(timeline, elements) {
    if (elements.length === 0) {
      return;
    }
    timeline.from(elements, { opacity: 0, y: 16, stagger: 0.1, duration: 0.3 }, 0.8);
  }
}
