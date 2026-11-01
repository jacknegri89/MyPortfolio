/*
 * Fasce di testo che scorrono all'infinito (.vrow).
 * Più veloce scrolli, più veloci vanno e più si inclinano.
 * Ogni fascia contiene il testo ripetuto due volte: quando la prima metà
 * è uscita dallo schermo la riportiamo indietro, così il giro non si interrompe.
 *
 * Prestazioni:
 * - la larghezza delle fasce viene misurata solo all'avvio e quando cambia la finestra,
 *   non a ogni fotogramma (misurare costringe il browser a ricalcolare la pagina)
 * - quando le fasce non sono sullo schermo l'animazione si ferma
 */
class VelocityMarquee {
  constructor(smoothScroll, environment) {
    this.smoothScroll = smoothScroll;
    this.environment = environment;
    this.container = document.querySelector(".vmarquee");
    this.skew = 0;
    this.isVisible = false;
    this.animationFrameId = 0;

    this.rows = [];
    const elements = document.querySelectorAll(".vrow");
    for (const element of elements) {
      // data-dir="-1" o "1": verso in cui scorre la fascia
      this.rows.push({ element: element, x: 0, direction: Number(element.dataset.dir), halfWidth: 0 });
    }
  }

  start() {
    if (this.environment.reduceMotion || this.container === null) {
      return;
    }

    this.measure();
    window.addEventListener("resize", () => this.measure());
    if (document.fonts && document.fonts.ready) {
      // Quando arrivano i font la larghezza del testo cambia
      document.fonts.ready.then(() => this.measure());
    }

    this.runOnlyWhenVisible();
  }

  measure() {
    for (const row of this.rows) {
      row.halfWidth = row.element.scrollWidth / 2;
    }
  }

  runOnlyWhenVisible() {
    if (!("IntersectionObserver" in window)) {
      this.isVisible = true;
      this.update();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      cancelAnimationFrame(this.animationFrameId);
      if (this.isVisible) {
        this.animationFrameId = requestAnimationFrame(() => this.update());
      }
    });
    observer.observe(this.container);
  }

  update() {
    // Velocità dello scroll, limitata tra -60 e 60 per evitare effetti esagerati
    const speed = Math.max(-60, Math.min(60, this.smoothScroll.velocity || 0));

    // L'inclinazione insegue piano il valore desiderato
    this.skew += (-speed * 0.25 - this.skew) * 0.1;

    for (const row of this.rows) {
      this.moveRow(row, speed);
    }

    // La velocità si spegne gradualmente quando smetti di scrollare
    this.smoothScroll.velocity *= 0.92;

    if (this.isVisible) {
      this.animationFrameId = requestAnimationFrame(() => this.update());
    }
  }

  moveRow(row, speed) {
    row.x += (0.6 + Math.abs(speed) * 0.35) * row.direction * this.smoothScroll.direction * -1;

    if (row.x <= -row.halfWidth) {
      row.x += row.halfWidth;
    }
    if (row.x > 0) {
      row.x -= row.halfWidth;
    }

    row.element.style.transform = "translate3d(" + row.x + "px,0,0) skewX(" + this.skew.toFixed(2) + "deg)";
  }
}
