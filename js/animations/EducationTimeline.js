/*
 * Linea del tempo della sezione Formazione.
 * - il tratto azzurro tra una tappa e la successiva si allunga mentre scorri la pagina
 *   (scrub: la lunghezza segue lo scroll, avanti e indietro)
 * - quando una tappa entra nello schermo il suo pallino compare e la data scivola al suo posto
 *
 * Il tratto è disegnato dal CSS (education.css, .tl-item::after) e la sua lunghezza
 * dipende dalla variabile --tl-progress: qui GSAP la porta da 0 a 1.
 */
class EducationTimeline {
  constructor(environment) {
    this.gsap = environment.gsap;
  }

  start() {
    const items = document.querySelectorAll("#timeline .tl-item");
    for (const item of items) {
      this.growLine(item);
      this.revealMarker(item);
    }
  }

  // Parte quando l'inizio della tappa arriva a metà schermo, finisce quando ci arriva la sua fine.
  growLine(item) {
    this.gsap.fromTo(
      item,
      { "--tl-progress": 0 },
      {
        "--tl-progress": 1,
        ease: "none",
        scrollTrigger: { trigger: item, start: "top 55%", end: "bottom 55%", scrub: true },
      }
    );
  }

  revealMarker(item) {
    const dot = item.querySelector(".tl-dot");
    const when = item.querySelector(".tl-when");

    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: item, start: "top 85%", once: true },
    });
    timeline.from(dot, { scale: 0, duration: 0.8, ease: "expo.out" });
    timeline.from(when, { x: -14, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.1);
  }
}
