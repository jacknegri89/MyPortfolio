/*
 * Nome nell'hero che reagisce al mouse (solo con il mouse e con le animazioni attive).
 * Il font Geist è "variabile": lo spessore delle lettere può assumere qualsiasi valore
 * tra 300 (sottile) e 800 (nero), non solo quelli fissi. Qui lo usiamo così:
 * le lettere di "Giacomo" vicine al cursore si assottigliano, quelle lontane restano piene.
 * Le lettere sottili sono anche più strette, quindi il nome si muove come se "respirasse".
 *
 * Due accorgimenti per non appesantire la pagina:
 * - lo spessore cambia a passi di WEIGHT_STEP: ogni spessore diverso è una nuova versione del carattere
 *   da preparare, e con valori qualsiasi il browser ne preparava centinaia (layout lentissimo)
 * - il centro di ogni lettera si misura quando il mouse entra nell'hero, non a ogni movimento:
 *   misurare subito dopo aver cambiato lo spessore obbliga il browser a ricalcolare la pagina
 */
class NameProximity {
  static FULL_WEIGHT = 700; // spessore normale del nome (lo stesso scritto in hero.css)
  static THIN_WEIGHT = 300; // spessore della lettera sotto il cursore
  static WEIGHT_STEP = 20; // lo spessore va da 300 a 700 a passi di 20 (21 versioni del carattere)
  static RADIUS_PIXELS = 420; // oltre questa distanza dal cursore la lettera non cambia

  constructor(environment) {
    this.environment = environment;
    this.gsap = environment.gsap;
    this.hero = document.querySelector(".hero");
    this.lastEvent = null;
    this.isUpdateScheduled = false;
    this.centers = [];
  }

  start() {
    if (this.hero === null || !this.environment.canUseCustomCursor()) {
      return;
    }
    this.letters = this.hero.querySelectorAll("#name-1 .ch");

    this.hero.addEventListener("pointerenter", () => this.measureLetters());
    this.hero.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
    this.hero.addEventListener("pointerleave", () => this.reset());
  }

  // Centro di ogni lettera nella pagina (non nello schermo: così resta valido anche se scorri un po')
  measureLetters() {
    this.centers = [];
    for (const letter of this.letters) {
      const box = letter.getBoundingClientRect();
      this.centers.push({
        x: box.left + box.width / 2 + window.scrollX,
        y: box.top + box.height / 2 + window.scrollY,
      });
    }
  }

  // Il mouse manda molti eventi: aggiorniamo le lettere al massimo una volta per fotogramma.
  onPointerMove(event) {
    this.lastEvent = event;
    if (this.isUpdateScheduled) {
      return;
    }
    this.isUpdateScheduled = true;
    requestAnimationFrame(() => this.update());
  }

  update() {
    this.isUpdateScheduled = false;
    // Il mouse era già sopra l'hero all'apertura (nessun pointerenter): misuriamo ora
    if (this.centers.length === 0) {
      this.measureLetters();
    }

    for (let index = 0; index < this.letters.length; index++) {
      const letter = this.letters[index];
      const center = this.centers[index];
      const distance = Math.hypot(this.lastEvent.pageX - center.x, this.lastEvent.pageY - center.y);

      // closeness: 1 con il cursore sopra la lettera, 0 dal raggio in poi
      const closeness = Math.max(0, 1 - distance / NameProximity.RADIUS_PIXELS);
      const weightRange = NameProximity.FULL_WEIGHT - NameProximity.THIN_WEIGHT;
      const weight = NameProximity.FULL_WEIGHT - weightRange * closeness;

      this.setWeight(letter, weight, 0.5);
    }
  }

  reset() {
    for (const letter of this.letters) {
      this.setWeight(letter, NameProximity.FULL_WEIGHT, 0.9);
    }
  }

  setWeight(letter, weight, duration) {
    // snap: anche durante l'animazione lo spessore resta un multiplo di WEIGHT_STEP
    this.gsap.to(letter, {
      fontWeight: weight,
      duration: duration,
      ease: "power3.out",
      overwrite: "auto",
      snap: { fontWeight: NameProximity.WEIGHT_STEP },
    });
  }
}
