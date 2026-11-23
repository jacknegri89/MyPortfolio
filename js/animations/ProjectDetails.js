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
    if (horizontalScroll === null) {
      this.animateOnPhone(project);
      return;
    }

    // Schermo grande: la scheda intera entra da destra, un'unica sequenza basta
    const scroll = {
      trigger: project,
      containerAnimation: horizontalScroll,
      start: "left 80%",
      end: "left 28%",
      scrub: true,
    };
    const timeline = this.createTimeline(scroll);
    this.slideHeader(timeline, project.querySelector(".proj-num"), 0);
    this.bringRows(timeline, project.querySelectorAll(".case > div"), 0.25);
    this.popChips(timeline, project.querySelectorAll(".chips li"), 0.6);
    this.liftEnding(timeline, project.querySelectorAll(".proj-links, .proj-note"), 0.8);
  }

  // Telefono: la scheda è alta più schermi, quindi ogni parte si anima quando arriva lei sullo schermo.
  // (Con un'unica sequenza legata all'inizio della scheda, le righe in basso restavano invisibili
  // mentre erano già a metà schermo e la scheda sembrava vuota.)
  animateOnPhone(project) {
    const header = project.querySelector(".proj-num");
    if (header !== null) {
      this.slideHeader(this.createTimeline(this.getPhoneScroll(header)), header, 0);
    }

    const rows = project.querySelectorAll(".case > div");
    for (const row of rows) {
      this.bringRows(this.createTimeline(this.getPhoneScroll(row)), [row], 0);
    }

    const chipList = project.querySelector(".chips");
    if (chipList !== null) {
      this.popChips(this.createTimeline(this.getPhoneScroll(chipList)), chipList.querySelectorAll("li"), 0);
    }

    const endings = project.querySelectorAll(".proj-links, .proj-note");
    for (const ending of endings) {
      this.liftEnding(this.createTimeline(this.getPhoneScroll(ending)), [ending], 0);
    }
  }

  // Su telefono ogni parte compare mentre sale dal fondo dello schermo fino a poco sotto la metà
  getPhoneScroll(element) {
    return { trigger: element, start: "top 95%", end: "top 70%", scrub: true };
  }

  createTimeline(scroll) {
    return this.gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: scroll });
  }

  slideHeader(timeline, header, at) {
    if (header === null) {
      return;
    }
    timeline.from(header, { opacity: 0, x: 40, duration: 0.4 }, at);
  }

  bringRows(timeline, rows, at) {
    if (rows.length === 0) {
      return;
    }
    timeline.fromTo(
      rows,
      { opacity: 0, x: ProjectDetails.ROW_SHIFT_PIXELS },
      { opacity: 1, x: 0, stagger: ProjectDetails.ROW_STAGGER, duration: 0.5 },
      at
    );
  }

  popChips(timeline, chips, at) {
    if (chips.length === 0) {
      return;
    }
    timeline.from(
      chips,
      { opacity: 0, scale: ProjectDetails.CHIP_START_SCALE, y: 10, stagger: ProjectDetails.CHIP_STAGGER, duration: 0.3 },
      at
    );
  }

  liftEnding(timeline, elements, at) {
    if (elements.length === 0) {
      return;
    }
    timeline.from(elements, { opacity: 0, y: 16, stagger: 0.1, duration: 0.3 }, at);
  }
}
