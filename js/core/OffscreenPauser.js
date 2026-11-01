/*
 * Mette in pausa le animazioni infinite delle sezioni che non sono sullo schermo.
 *
 * Alcune animazioni CSS girano per sempre (il riflesso su "Negri", il puntino che pulsa,
 * i puntini dello schema SVG...). Il browser le ricalcola a ogni fotogramma anche quando
 * non si vedono: è lavoro sprecato che può far scattare lo scroll sui telefoni.
 *
 * Come si usa: aggiungi l'attributo data-pause-offscreen a una sezione in index.html.
 * Quando la sezione esce dallo schermo riceve la classe "is-paused" (vedi base.css)
 * e le animazioni SVG al suo interno vengono fermate.
 */
class OffscreenPauser {
  start() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        this.setPaused(entry.target, !entry.isIntersecting);
      }
    });

    const sections = document.querySelectorAll("[data-pause-offscreen]");
    for (const section of sections) {
      observer.observe(section);
    }
  }

  setPaused(section, isPaused) {
    section.classList.toggle("is-paused", isPaused);

    // Le animazioni dentro gli SVG (<animateMotion>) non si fermano col CSS: hanno i loro metodi
    const svgs = section.querySelectorAll("svg");
    for (const svg of svgs) {
      if (isPaused) {
        svg.pauseAnimations();
      } else {
        svg.unpauseAnimations();
      }
    }
  }
}
