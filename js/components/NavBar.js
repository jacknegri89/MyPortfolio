/*
 * Barra di navigazione in alto. Mentre scorri la pagina:
 * - classe "is-scrolled" quando non sei più in cima (su telefono il CSS le dà uno sfondo scuro)
 * - classe "is-hidden" quando scorri verso il basso: la barra esce, così non copre i titoli;
 *   appena torni verso l'alto ricompare
 * - la linea sottile in cima alla pagina si allunga in base a quanto hai letto
 * - il link della sezione che stai guardando viene evidenziato (aria-current)
 * - sopra una sezione chiara la barra diventa scura (classe "is-over-light" su <html>)
 * Vedi nav.css per l'aspetto di ogni stato.
 */
class NavBar {
  // Sotto questa distanza dalla cima la barra resta sempre visibile (siamo ancora nell'hero)
  static ALWAYS_VISIBLE_UNTIL_PIXELS = 400;
  // Spostamenti più piccoli di così non contano come "cambio di direzione" (evita il tremolio)
  static DIRECTION_TOLERANCE_PIXELS = 6;

  constructor() {
    this.nav = document.querySelector(".nav");
    this.progressBar = document.getElementById("scroll-progress");
    this.isScrolled = false;
    this.isHidden = false;
    this.lastScrollY = window.scrollY;
    this.isUpdateScheduled = false;
  }

  start() {
    if (this.nav === null) {
      return;
    }
    this.update();
    window.addEventListener("scroll", () => this.scheduleUpdate(), { passive: true });
    this.watchSections();
    this.watchLightSections();
  }

  // Lo scroll genera decine di eventi al secondo: aggiorniamo al massimo una volta per fotogramma.
  scheduleUpdate() {
    if (this.isUpdateScheduled) {
      return;
    }
    this.isUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.isUpdateScheduled = false;
      this.update();
    });
  }

  update() {
    const scrollY = window.scrollY;
    this.updateScrolledState(scrollY);
    this.updateHiddenState(scrollY);
    this.updateProgressBar(scrollY);
  }

  updateScrolledState(scrollY) {
    const isScrolled = scrollY > 20;

    // Tocchiamo la pagina solo quando lo stato cambia davvero, non a ogni pixel di scroll
    if (isScrolled !== this.isScrolled) {
      this.isScrolled = isScrolled;
      this.nav.classList.toggle("is-scrolled", isScrolled);
    }
  }

  updateHiddenState(scrollY) {
    const distance = scrollY - this.lastScrollY;
    if (Math.abs(distance) < NavBar.DIRECTION_TOLERANCE_PIXELS) {
      return;
    }
    this.lastScrollY = scrollY;

    const isGoingDown = distance > 0;
    const isHidden = isGoingDown && scrollY > NavBar.ALWAYS_VISIBLE_UNTIL_PIXELS;

    if (isHidden !== this.isHidden) {
      this.isHidden = isHidden;
      this.nav.classList.toggle("is-hidden", isHidden);
    }
  }

  updateProgressBar(scrollY) {
    if (this.progressBar === null) {
      return;
    }

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    let fraction = 0;
    if (scrollableHeight > 0) {
      fraction = Math.min(Math.max(scrollY / scrollableHeight, 0), 1);
    }
    this.progressBar.style.transform = "scaleX(" + fraction + ")";
  }

  // Evidenzia il link della sezione che attraversa il centro dello schermo.
  watchSections() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    // rootMargin -50% sopra e sotto: l'area osservata è la riga orizzontale a metà schermo
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.setCurrentSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    const sections = document.querySelectorAll("main > [id]");
    for (const section of sections) {
      observer.observe(section);
    }
  }

  // Quando una sezione chiara (data-theme="light", es. i contatti) passa sotto la barra,
  // <html> riceve la classe "is-over-light" e nav.css rende scuri barra e linea di avanzamento.
  watchLightSections() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    // rootMargin -96% in basso: l'area osservata è la fascia in cima allo schermo, dove sta la barra
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          document.documentElement.classList.toggle("is-over-light", entry.isIntersecting);
        }
      },
      { rootMargin: "0px 0px -96% 0px" }
    );

    const lightSections = document.querySelectorAll('[data-theme="light"]');
    for (const section of lightSections) {
      observer.observe(section);
    }
  }

  setCurrentSection(sectionId) {
    const links = this.nav.querySelectorAll("ul a");
    for (const link of links) {
      const isCurrent = link.getAttribute("href") === "#" + sectionId;
      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }
}
