/*
 * Sezione Progetti:
 * - su schermi grandi la sezione si blocca e i progetti scorrono in orizzontale mentre scrolli:
 *   la prima schermata è l'indice dei progetti, e un click su una sua riga porta alla scheda di quel progetto
 * - su schermi piccoli i progetti sono uno sotto l'altro ed entrano dal basso
 * gsap.matchMedia cambia comportamento da solo quando ridimensioni la finestra: quando una
 * condizione non vale più, GSAP annulla le animazioni create dentro la sua funzione.
 */
class HorizontalProjects {
  // Di quanti pixel la finestra con le schermate resta indietro (e poi avanti) rispetto alla scheda
  static DEPTH_SHIFT_PIXELS = 48;
  // Quanto è ingrandita la schermata mentre la sua finestra si sta ancora aprendo (1 = grandezza normale)
  static SHOT_START_SCALE = 1.25;
  // Su schermi piccoli: spazio lasciato sopra la scheda raggiunta dall'indice (ci sta la barra in alto)
  static SPACE_ABOVE_PROJECT_PIXELS = 76;
  // Di quanti gradi è girata la finestra mentre entra (e, al contrario, mentre esce). Al centro è dritta.
  static WINDOW_TURN_DEGREES = 22;
  static WINDOW_PERSPECTIVE_PIXELS = 1100;
  // Schermi piccoli: di quanti gradi è coricata all'indietro la finestra quando spunta dal basso
  static MOBILE_TILT_DEGREES = 28;
  // Inclinazione delle schede con la velocità dello scroll: 1 grado ogni 450 pixel al secondo, al massimo 4
  static SPEED_PER_SKEW_DEGREE = 450;
  static MAX_SKEW_DEGREES = 4;
  // La finestra si apre dall'alto fino a -25% in basso (per non tagliare l'ombra):
  // la linea di luce scende quindi fino al 125% dell'altezza
  static EDGE_END_PERCENT = 125;
  // Da che punto dell'apertura la linea di luce comincia a spegnersi (0 = inizio, 1 = fine)
  static EDGE_FADE_AT = 0.7;
  // Da che punto dell'apertura escono i fogli della pila dietro la finestra
  static DECK_OPEN_AT = 0.75;

  constructor(environment, smoothScroll) {
    this.smoothScroll = smoothScroll;
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
    this.canScramble = Boolean(environment.scrambleText);
    this.root = environment.root;
    this.track = document.getElementById("h-track");
    this.counter = document.getElementById("h-count");
    this.chapters = new ProjectChapters(environment, this.track);
    this.details = new ProjectDetails(environment);
    this.edges = [];
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

    // I capitoli con i nomi giganti vanno creati prima di misurare quanto è lunga la fila
    const chapters = this.chapters.build();
    const projects = this.gsap.utils.toArray("#h-track .proj");
    this.prepareSkew(projects.concat(chapters));

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
        onUpdate: (trigger) => this.skewWithSpeed(trigger),
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

    // Ogni progetto entra leggermente ruotato e rimpicciolito. Senza dissolvenza: la scheda deve restare
    // piena per coprire il nome gigante del capitolo che le scorre sotto.
    for (let index = 0; index < projects.length; index++) {
      const project = projects[index];
      this.gsap.from(project, {
        rotate: 3,
        scale: 0.92,
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
      this.openWindow(project, horizontalScroll);
      this.countProject(project, index + 1, horizontalScroll);
      this.details.animate(project, horizontalScroll);
    }
    this.chapters.animate(horizontalScroll);

    // Tastiera: quando un link di un progetto riceve il focus (tasto Tab), scorriamo fino a quel progetto
    const onFocus = (event) => this.scrollToFocusedProject(event, horizontalScroll);
    this.track.addEventListener("focusin", onFocus);

    // Indice: un click su una riga porta alla scheda del progetto. L'ascolto è in fase di "cattura"
    // (terzo parametro true) per arrivare prima di SmoothScroll, che altrimenti cercherebbe la scheda
    // scorrendo in verticale come per un link qualsiasi.
    const onClick = (event) => {
      this.scrollToClickedProject(event, (project) => this.getPagePositionOf(project, horizontalScroll));
    };
    this.track.addEventListener("click", onClick, true);

    // Funzione di pulizia: GSAP la chiama quando lo schermo diventa piccolo
    return () => {
      this.track.removeEventListener("focusin", onFocus);
      this.track.removeEventListener("click", onClick, true);
      this.chapters.remove();
      this.removeEdges();
      this.root.classList.remove("is-h");
      this.gsap.set(this.track, { clearProps: "transform" });
    };
  }

  // Le schede (e i nomi dei capitoli) si inclinano un poco quando scorri veloce, poi tornano dritte.
  prepareSkew(targets) {
    this.setSkew = this.gsap.quickTo(targets, "skewX", { duration: 0.6, ease: "power3.out" });
    this.straightenLater = this.gsap.delayedCall(0.15, () => this.setSkew(0));
    this.straightenLater.pause();
  }

  skewWithSpeed(trigger) {
    const skew = trigger.getVelocity() / HorizontalProjects.SPEED_PER_SKEW_DEGREE;
    const limitedSkew = this.gsap.utils.clamp(-HorizontalProjects.MAX_SKEW_DEGREES, HorizontalProjects.MAX_SKEW_DEGREES, skew);
    this.setSkew(-limitedSkew);
    this.straightenLater.restart(true);
  }

  // Profondità: la finestra con le schermate scorre un po' più lenta del resto della scheda e gira
  // in 3D come una porta: entra girata verso destra, al centro è dritta, esce girata dall'altra parte.
  addDepth(project, horizontalScroll) {
    const visual = project.querySelector(".shots, .phone-stage");
    if (visual === null) {
      return;
    }

    this.gsap.fromTo(
      visual,
      {
        x: HorizontalProjects.DEPTH_SHIFT_PIXELS,
        rotationY: -HorizontalProjects.WINDOW_TURN_DEGREES,
        transformPerspective: HorizontalProjects.WINDOW_PERSPECTIVE_PIXELS,
      },
      {
        x: -HorizontalProjects.DEPTH_SHIFT_PIXELS,
        rotationY: HorizontalProjects.WINDOW_TURN_DEGREES,
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

  // La finestra con le schermate si apre dall'alto verso il basso quando è già sullo schermo,
  // e la schermata dentro parte ingrandita e torna alla sua misura: sembra che venga "scansionata".
  openWindow(project, horizontalScroll) {
    const windowFrame = project.querySelector(".shots .window");
    if (windowFrame === null) {
      return;
    }

    // clip-path "inset(alto destra basso sinistra)": all'inizio il lato basso è tagliato del tutto (100%).
    // I valori finali sono negativi per non tagliare l'ombra che la finestra ha attorno.
    this.gsap.fromTo(
      windowFrame,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(-10% -10% -25% -10%)", ease: "none", scrollTrigger: this.getOpeningScroll(project, horizontalScroll) }
    );
    this.gsap.fromTo(
      windowFrame.querySelectorAll(".win-shot"),
      { scale: HorizontalProjects.SHOT_START_SCALE },
      { scale: 1, ease: "none", scrollTrigger: this.getOpeningScroll(project, horizontalScroll) }
    );
    this.traceOpeningEdge(windowFrame, project, horizontalScroll);

    this.openDeck(windowFrame, project, horizontalScroll);
  }

  // I fogli della pila dietro la finestra (projects.css, .shot-stage) escono solo nell'ultimo tratto
  // dell'apertura: prima la finestra è ancora tagliata e sotto il suo bordo si vedrebbero i fogli vuoti.
  openDeck(windowFrame, project, horizontalScroll) {
    const stage = windowFrame.closest(".shot-stage");
    if (stage === null) {
      return;
    }
    const start = HorizontalProjects.DECK_OPEN_AT;
    const timeline = this.gsap.timeline({ scrollTrigger: this.getOpeningScroll(project, horizontalScroll) });
    timeline.fromTo(stage, { "--deck-open": 0 }, { "--deck-open": 1, duration: 1 - start, ease: "none" }, start);
  }

  // Una linea di luce azzurra scende sul bordo che si sta aprendo, come una scansione, e si spegne alla fine
  traceOpeningEdge(windowFrame, project, horizontalScroll) {
    const edge = document.createElement("span");
    edge.className = "win-edge";
    edge.setAttribute("aria-hidden", "true");
    windowFrame.appendChild(edge);
    this.edges.push(edge);

    const timeline = this.gsap.timeline({ scrollTrigger: this.getOpeningScroll(project, horizontalScroll) });
    const endTop = HorizontalProjects.EDGE_END_PERCENT + "%";
    timeline.fromTo(edge, { top: "0%", opacity: 1 }, { top: endTop, duration: 1, ease: "none" }, 0);
    const fadeSeconds = 1 - HorizontalProjects.EDGE_FADE_AT;
    timeline.to(edge, { opacity: 0, duration: fadeSeconds, ease: "none" }, HorizontalProjects.EDGE_FADE_AT);
  }

  removeEdges() {
    for (const edge of this.edges) {
      edge.remove();
    }
    this.edges = [];
  }

  // Apertura della finestra: la finestra sta nella metà destra della scheda, quindi entra nello schermo
  // solo quando il bordo sinistro della scheda è a metà. Finisce quando la scheda è quasi centrata.
  getOpeningScroll(project, horizontalScroll) {
    return {
      trigger: project,
      containerAnimation: horizontalScroll,
      start: "left 55%",
      end: "left 15%",
      scrub: true,
    };
  }

  // Contatore "02 / 04" accanto alla barra: cambia quando il capitolo del progetto (il nome gigante che
  // lo precede) arriva al centro dello schermo, e resta finché la scheda non è passata.
  countProject(project, position, horizontalScroll) {
    if (this.counter === null) {
      return;
    }

    this.scrollTrigger.create({
      trigger: project.previousElementSibling,
      endTrigger: project,
      containerAnimation: horizontalScroll,
      start: "left center",
      end: "right center",
      onToggle: (trigger) => {
        if (trigger.isActive) {
          this.showCount(String(position).padStart(2, "0"));
        }
      },
    });
  }

  // Il numero cambia "decifrandosi" (plugin ScrambleText); senza il plugin cambia e basta
  showCount(text) {
    if (!this.canScramble) {
      this.counter.textContent = text;
      return;
    }
    this.gsap.to(this.counter, {
      duration: 0.5,
      ease: "none",
      overwrite: "auto",
      scrambleText: { text: text, chars: "0123456789", speed: 0.6 },
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

    window.scrollTo(0, this.getPagePositionOf(project, horizontalScroll));
  }

  // Click su una riga dell'indice (<a class="work-row" href="#progetto-renova">): scorre fino a quella scheda.
  // getPagePosition è la funzione che dice a quale punto della pagina si trova la scheda
  // (diversa tra schermo grande, dove la fila è orizzontale, e schermo piccolo).
  scrollToClickedProject(event, getPagePosition) {
    const row = event.target.closest(".work-row");
    if (row === null) {
      return;
    }
    const project = document.querySelector(row.getAttribute("href"));
    if (project === null) {
      return;
    }

    event.preventDefault();
    this.smoothScroll.scrollToPosition(getPagePosition(project));
  }

  // Posizione verticale della pagina che mostra un progetto (o l'indice) al centro dello schermo.
  getPagePositionOf(project, horizontalScroll) {
    // Dove si trova il progetto dentro la fila (offsetLeft non risente di rotazioni e ingrandimenti
    // delle animazioni d'ingresso), e quanto spazio resta ai suoi lati quando è centrato
    const projectLeft = project.offsetLeft;
    const sideSpace = (window.innerWidth - project.offsetWidth) / 2;

    // Frazione dello scorrimento orizzontale: 0 = inizio della fila, 1 = fine
    const wantedProgress = (projectLeft - sideSpace) / this.getScrollDistance();
    const progress = Math.min(Math.max(wantedProgress, 0), 1);

    // Trasformiamo la frazione nella posizione verticale della pagina
    const trigger = horizontalScroll.scrollTrigger;
    return trigger.start + progress * (trigger.end - trigger.start);
  }

  setupMobile() {
    // Anche qui ogni scheda ha il suo capitolo con il nome grande, animato dallo scroll verticale
    this.chapters.build();
    this.chapters.animate(null);

    const projects = this.gsap.utils.toArray("#h-track .proj");
    for (const project of projects) {
      this.gsap.from(project, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: project, start: "top 88%" },
      });
      this.tiltInVisual(project);
      this.details.animate(project, null);
    }

    // Indice: il tocco su una riga porta alla scheda, lasciando spazio per la barra in alto.
    // (In fase di "cattura", come su schermo grande: vedi setupDesktop.)
    const onClick = (event) => {
      this.scrollToClickedProject(event, (project) => this.getPageTopOf(project) - HorizontalProjects.SPACE_ABOVE_PROJECT_PIXELS);
    };
    this.track.addEventListener("click", onClick, true);

    return () => {
      this.track.removeEventListener("click", onClick, true);
      this.chapters.remove();
    };
  }

  // Schermi piccoli: la finestra (o il telefono) entra coricata all'indietro e si raddrizza salendo
  tiltInVisual(project) {
    const visual = project.querySelector(".shots, .phone-stage");
    if (visual === null) {
      return;
    }
    this.gsap.fromTo(
      visual,
      { rotationX: HorizontalProjects.MOBILE_TILT_DEGREES, transformPerspective: HorizontalProjects.WINDOW_PERSPECTIVE_PIXELS, transformOrigin: "50% 100%" },
      { rotationX: 0, ease: "none", scrollTrigger: { trigger: visual, start: "top 98%", end: "top 55%", scrub: true } }
    );
  }

  // Distanza di un elemento dall'inizio della pagina, sommando le distanze dai contenitori.
  // A differenza di getBoundingClientRect non risente delle animazioni che spostano l'elemento.
  getPageTopOf(element) {
    let top = 0;
    let current = element;
    while (current !== null) {
      top += current.offsetTop;
      current = current.offsetParent;
    }
    return top;
  }
}
