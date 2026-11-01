/*
 * Riflesso luminoso sulle card (.card) che segue il mouse.
 * Il JavaScript passa solo la posizione del mouse al CSS tramite le variabili
 * --mx e --my; il disegno del riflesso è in sections.css (.card::before e ::after).
 *
 * Prestazioni:
 * - il riflesso si vede solo sulla card sotto il mouse, quindi aggiorniamo solo quella
 * - al massimo un aggiornamento per fotogramma, anche se il mouse manda più eventi
 */
class CardSpotlight {
  constructor() {
    this.lastEvent = null;
    this.updateIsScheduled = false;
  }

  start() {
    window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
  }

  onPointerMove(event) {
    this.lastEvent = event;
    if (this.updateIsScheduled) {
      return;
    }
    this.updateIsScheduled = true;
    requestAnimationFrame(() => this.update());
  }

  update() {
    this.updateIsScheduled = false;

    const card = this.lastEvent.target.closest(".card");
    if (card === null) {
      return;
    }

    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", this.lastEvent.clientX - box.left + "px");
    card.style.setProperty("--my", this.lastEvent.clientY - box.top + "px");
  }
}
