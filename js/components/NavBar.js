/*
 * Barra di navigazione in alto.
 * Quando la pagina non è più in cima aggiunge la classe "is-scrolled":
 * su telefono il CSS le dà uno sfondo scuro, così il menu non si sovrappone al testo (vedi nav.css).
 */
class NavBar {
  constructor() {
    this.nav = document.querySelector(".nav");
    this.isScrolled = false;
  }

  start() {
    if (this.nav === null) {
      return;
    }
    this.update();
    window.addEventListener("scroll", () => this.update(), { passive: true });
  }

  update() {
    const isScrolled = window.scrollY > 20;

    // Tocchiamo la pagina solo quando lo stato cambia davvero, non a ogni pixel di scroll
    if (isScrolled !== this.isScrolled) {
      this.isScrolled = isScrolled;
      this.nav.classList.toggle("is-scrolled", isScrolled);
    }
  }
}
