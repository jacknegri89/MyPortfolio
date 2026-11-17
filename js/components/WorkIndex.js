/*
 * Indice dei progetti (le righe grandi all'inizio della sezione Progetti).
 * Con il mouse, passando sopra una riga compare un'anteprima del progetto che segue il cursore:
 * - l'anteprima (#work-preview) è una finestrella che insegue il mouse con un po' di ritardo
 * - dentro c'è una striscia verticale (#work-strip) con una schermata per progetto:
 *   la striscia scorre finché si vede quella della riga puntata (attributo data-work della riga)
 * - muovendo il mouse di lato l'anteprima si inclina leggermente, poi si raddrizza
 * Il click sulla riga porta alla scheda del progetto: ci pensano SmoothScroll e HorizontalProjects.
 * Su touchscreen l'anteprima non c'è: restano le righe, che sono normali link.
 */
class WorkIndex {
  // Distanza tra il cursore e il bordo sinistro dell'anteprima, e margine minimo dal bordo della sezione
  static GAP_FROM_CURSOR_PIXELS = 30;
  static EDGE_MARGIN_PIXELS = 16;
  // Inclinazione: gradi per ogni pixel di spostamento laterale del mouse, e massimo consentito
  static TILT_PER_PIXEL = 0.4;
  static MAX_TILT_DEGREES = 7;
  // Dopo quanto tempo senza movimento l'anteprima torna dritta (secondi)
  static STRAIGHTEN_AFTER_SECONDS = 0.12;
  // Grandezza dell'anteprima quando è nascosta (1 = grandezza piena)
  static HIDDEN_SCALE = 0.8;

  constructor(environment) {
    this.environment = environment;
    this.gsap = environment.gsap;
    this.section = document.getElementById("progetti");
    this.list = document.getElementById("work");
    this.preview = document.getElementById("work-preview");
    this.strip = document.getElementById("work-strip");
    this.isVisible = false;
  }

  start() {
    const somethingIsMissing = this.list === null || this.preview === null || this.strip === null;
    if (somethingIsMissing || !this.environment.canUseCustomCursor()) {
      return;
    }

    this.slideCount = this.strip.children.length;
    this.gsap.set(this.preview, { autoAlpha: 0, scale: WorkIndex.HIDDEN_SCALE });

    // quickTo crea funzioni ottimizzate per aggiornare spesso una proprietà
    this.moveX = this.gsap.quickTo(this.preview, "x", { duration: 0.55, ease: "power3" });
    this.moveY = this.gsap.quickTo(this.preview, "y", { duration: 0.55, ease: "power3" });
    this.tilt = this.gsap.quickTo(this.preview, "rotation", { duration: 0.6, ease: "power3" });

    // Timer che raddrizza l'anteprima: riparte da capo a ogni movimento del mouse
    this.straighten = this.gsap.delayedCall(WorkIndex.STRAIGHTEN_AFTER_SECONDS, () => this.tilt(0));
    this.straighten.pause();

    // Le schermate dell'anteprima si scaricano solo la prima volta che il mouse arriva sull'indice:
    // chi non ci passa sopra (o usa un touchscreen) non le scarica per niente
    this.list.addEventListener("pointerenter", () => this.loadImages(), { once: true });
    this.list.addEventListener("pointermove", (event) => this.follow(event), { passive: true });
    this.list.addEventListener("pointerleave", () => this.hide());
    // Scorrendo la pagina le righe si spostano sotto il cursore fermo: l'anteprima resterebbe lì da sola
    window.addEventListener("scroll", () => this.hide(), { passive: true });

    const rows = this.list.querySelectorAll(".work-row");
    for (const row of rows) {
      row.addEventListener("pointerenter", () => this.showSlide(Number(row.dataset.work)));
    }
  }

  loadImages() {
    const images = this.strip.querySelectorAll("img[data-src]");
    for (const image of images) {
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
    }
  }

  follow(event) {
    const position = this.getPreviewPosition(event);

    if (!this.isVisible) {
      // Prima comparsa: parte già vicino al cursore, senza arrivare da dov'era l'ultima volta
      this.gsap.set(this.preview, { x: position.x, y: position.y, rotation: 0 });
      this.show();
    }

    this.moveX(position.x);
    this.moveY(position.y);

    const wantedTilt = event.movementX * WorkIndex.TILT_PER_PIXEL;
    const limitedTilt = Math.min(Math.max(wantedTilt, -WorkIndex.MAX_TILT_DEGREES), WorkIndex.MAX_TILT_DEGREES);
    this.tilt(limitedTilt);
    this.straighten.restart(true);
  }

  // Posizione dell'anteprima dentro la sezione: a destra del cursore, centrata in verticale su di lui,
  // senza uscire dai bordi della sezione.
  getPreviewPosition(event) {
    const sectionBox = this.section.getBoundingClientRect();
    const previewWidth = this.preview.offsetWidth;
    const previewHeight = this.preview.offsetHeight;
    const margin = WorkIndex.EDGE_MARGIN_PIXELS;

    const wantedX = event.clientX - sectionBox.left + WorkIndex.GAP_FROM_CURSOR_PIXELS;
    const wantedY = event.clientY - sectionBox.top - previewHeight / 2;

    const maxX = sectionBox.width - previewWidth - margin;
    const maxY = sectionBox.height - previewHeight - margin;

    return {
      x: Math.min(Math.max(wantedX, margin), maxX),
      y: Math.min(Math.max(wantedY, margin), maxY),
    };
  }

  show() {
    this.isVisible = true;
    this.gsap.to(this.preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
  }

  hide() {
    if (!this.isVisible) {
      return;
    }
    this.isVisible = false;
    this.gsap.to(this.preview, {
      autoAlpha: 0,
      scale: WorkIndex.HIDDEN_SCALE,
      duration: 0.35,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  // Fa scorrere la striscia finché si vede la schermata numero "index" (0 = la prima).
  showSlide(index) {
    const stripShiftPercent = (-100 * index) / this.slideCount;
    this.gsap.to(this.strip, { yPercent: stripShiftPercent, duration: 0.7, ease: "expo.out", overwrite: "auto" });
  }
}
