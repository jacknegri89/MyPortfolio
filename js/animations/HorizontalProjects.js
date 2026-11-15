/*
 * Sezione Progetti:
 * - su schermi grandi la sezione si blocca e i progetti scorrono in orizzontale mentre scrolli
 * - su schermi piccoli i progetti sono uno sotto l'altro ed entrano dal basso
 * gsap.matchMedia cambia comportamento da solo quando ridimensioni la finestra: quando una
 * condizione non vale più, GSAP annulla le animazioni create dentro la sua funzione.
 */
class HorizontalProjects {
  // Di quanti pixel la finestra con le schermate resta indietro (e poi avanti) rispetto alla scheda
  static DEPTH_SHIFT_PIXELS = 48;

  constructor(environment) {
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
    this.root = environment.root;
    this.track = document.getElementById("h-track");
    this.counter = document.getElementById("h-count");
  }

  start() {
    const media = this.gsap.matchMedia();
    media.add("(min-width: 1000px) and (min-height: 680px)", () => this.setupDesktop());
    media.add("(max-width: 999px), (max-height: 679px)", () => this.setupMobile());
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
        // La sezione bloccata allunga la pagina. Con refreshPriority ScrollTrigger la calcola per prima,
        // così le animazioni delle sezioni successive tengono conto dello spazio in più.
        refreshPriority: 1,
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
    for (let index = 0; index < projects.length; index++) {
      const project = projects[index];
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
      this.addDepth(project, horizontalScroll);
      this.countProject(project, index + 1, horizontalScroll);
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

  // Profondità: la finestra con le schermate scorre un po' più lenta del resto della scheda.
  // Quando la scheda è al centro dello schermo lo spostamento è quasi zero.
  addDepth(project, horizontalScroll) {
    const visual = project.querySelector(".shots, .phone-stage");
    if (visual === null) {
      return;
    }

    this.gsap.fromTo(
      visual,
      { x: HorizontalProjects.DEPTH_SHIFT_PIXELS },
      {
        x: -HorizontalProjects.DEPTH_SHIFT_PIXELS,
        ease: "none",
        scrollTrigger: {
          trigger: project,
          containerAnimation: horizontalScroll,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      }
    );
  }

  // Contatore "02 / 04" accanto alla barra: cambia quando un progetto attraversa il centro dello schermo.
  countProject(project, position, horizontalScroll) {
    if (this.counter === null) {
      return;
    }

    this.scrollTrigger.create({
      trigger: project,
      containerAnimation: horizontalScroll,
      start: "left center",
      end: "right center",
      onToggle: (trigger) => {
        if (trigger.isActive) {
          this.counter.textContent = String(position).padStart(2, "0");
        }
      },
    });
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

    // Serve solo a chi usa la tastiera. Con il mouse il link è già sotto il cursore:
    // spostare la fila tra la pressione e il rilascio del tasto farebbe "scappare" il click.
    const focusCameFromKeyboard = event.target.matches(":focus-visible");
    if (!focusCameFromKeyboard) {
      return;
    }

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
