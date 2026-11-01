/*
 * Raccoglie in un solo posto le informazioni sul browser dell'utente
 * e le librerie esterne caricate (GSAP, ScrollTrigger).
 * Tutte le altre classi ricevono un'istanza di Environment invece di
 * rileggere queste informazioni ognuna per conto suo.
 */
class Environment {
  constructor() {
    // true se l'utente ha chiesto al sistema operativo di ridurre le animazioni
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // true se l'utente usa un mouse (e non un dito su touchscreen)
    this.finePointer = window.matchMedia("(pointer: fine)").matches;

    // Librerie caricate dai CDN in index.html (possono mancare se la rete fallisce)
    this.gsap = window.gsap;
    this.scrollTrigger = window.ScrollTrigger;

    // L'elemento <html>, usato per aggiungere classi globali
    this.root = document.documentElement;
  }

  // Il cursore personalizzato serve solo con il mouse, con le animazioni attive e con GSAP caricato.
  canUseCustomCursor() {
    return this.finePointer && !this.reduceMotion && Boolean(this.gsap);
  }

  // Le animazioni GSAP partono solo se la libreria c'è e l'utente non ha chiesto meno movimento.
  canAnimateWithGsap() {
    return Boolean(this.gsap) && !this.reduceMotion;
  }
}
