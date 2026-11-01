/*
 * Sezione Progetti:
 * - su schermi grandi la sezione si blocca e i progetti scorrono in orizzontale mentre scrolli
 * - su schermi piccoli i progetti sono uno sotto l'altro ed entrano dal basso
 * ScrollTrigger.matchMedia cambia comportamento da solo quando ridimensioni la finestra.
 */
class HorizontalProjects {
  constructor(environment) {
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
    this.root = environment.root;
    this.track = document.getElementById("h-track");
  }

  start() {
    this.scrollTrigger.matchMedia({
      "(min-width: 1000px) and (min-height: 680px)": () => this.setupDesktop(),
      "(max-width: 999px), (max-height: 679px)": () => this.setupMobile(),
    });
  }

  // Quanti pixel deve scorrere la fila di progetti per mostrarli tutti.
  getScrollDistance() {
    return this.track.scrollWidth - window.innerWidth;
  }

  setupDesktop() {
    // La classe "is-h" attiva il layout orizzontale in projects.css
    this.root.classList.add("is-h");

    const horizontalScroll = this.gsap.to(this.track, {
      x: () => -this.getScrollDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: "#progetti",
        start: "top top",
        end: () => "+=" + this.getScrollDistance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    // Barra di avanzamento sotto i progetti
    this.gsap.to("#h-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#progetti",
        start: "top top",
        end: () => "+=" + this.getScrollDistance(),
        scrub: true,
      },
    });

    // Ogni progetto entra leggermente ruotato e rimpicciolito
    const projects = this.gsap.utils.toArray("#h-track .proj");
    for (const project of projects) {
      this.gsap.from(project, {
        rotate: 3,
        scale: 0.92,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: {
          trigger: project,
          containerAnimation: horizontalScroll,
          start: "left right",
          end: "left 55%",
          scrub: true,
        },
      });
    }

    // Tastiera: quando un link di un progetto riceve il focus (tasto Tab), scorriamo fino a quel progetto
    const onFocus = (event) => this.scrollToFocusedProject(event, horizontalScroll);
    this.track.addEventListener("focusin", onFocus);

    // Funzione di pulizia: GSAP la chiama quando lo schermo diventa piccolo
    return () => {
      this.track.removeEventListener("focusin", onFocus);
      this.root.classList.remove("is-h");
      this.gsap.set(this.track, { clearProps: "transform" });
    };
  }

  // Senza questo, chi naviga con Tab finirebbe su link spostati fuori dallo schermo e non li vedrebbe.
  scrollToFocusedProject(event, horizontalScroll) {
    const project = event.target.closest(".proj, .h-intro");
    if (project === null) {
      return;
    }

    // Il browser prova da solo a "scorrere" la sezione per mostrare il link: annulliamo quello spostamento
    const section = document.getElementById("progetti");
    section.scrollLeft = 0;

    // Posizione del progetto dentro la fila, come frazione (0 = inizio, 1 = fine dello scorrimento)
    const projectLeft = project.getBoundingClientRect().left - this.track.getBoundingClientRect().left;
    const progress = Math.min(Math.max((projectLeft - window.innerWidth * 0.06) / this.getScrollDistance(), 0), 1);

    // Trasformiamo la frazione nella posizione verticale della pagina che mostra quel progetto
    const trigger = horizontalScroll.scrollTrigger;
    window.scrollTo(0, trigger.start + progress * (trigger.end - trigger.start));
  }

  setupMobile() {
    const projects = this.gsap.utils.toArray("#h-track .proj");
    for (const project of projects) {
      this.gsap.from(project, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: project, start: "top 88%" },
      });
    }
  }
}
