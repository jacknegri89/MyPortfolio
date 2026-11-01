/*
 * Gestisce lo scroll della pagina:
 * - scroll morbido con la libreria Lenis (se le animazioni sono attive)
 * - velocità e direzione dello scroll, lette dal marquee
 * - click sui link interni (#progetti, #contatti, ...)
 */
class SmoothScroll {
  constructor(environment) {
    this.environment = environment;
    this.lenis = null;

    // Letti e modificati da VelocityMarquee
    this.velocity = 0;
    this.direction = 1;

    this.lastScrollY = window.scrollY;
  }

  start() {
    if (!this.environment.reduceMotion && window.Lenis) {
      this.startLenis();
    } else {
      this.listenToNativeScroll();
    }
    this.setupAnchorLinks();
  }

  startLenis() {
    this.lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    this.lenis.on("scroll", (event) => this.onLenisScroll(event));

    const gsap = this.environment.gsap;
    if (gsap) {
      // GSAP ha già un ciclo di animazione: Lenis si aggancia a quello.
      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      this.runLenisLoop(performance.now());
    }
  }

  // Ciclo di aggiornamento di Lenis quando GSAP non è disponibile.
  runLenisLoop(time) {
    this.lenis.raf(time);
    requestAnimationFrame((nextTime) => this.runLenisLoop(nextTime));
  }

  onLenisScroll(event) {
    this.velocity = event.velocity;
    if (event.direction) {
      this.direction = event.direction;
    }
    if (this.environment.scrollTrigger) {
      this.environment.scrollTrigger.update();
    }
  }

  // Senza Lenis calcoliamo noi velocità e direzione dallo scroll normale del browser.
  listenToNativeScroll() {
    window.addEventListener(
      "scroll",
      () => {
        const distance = window.scrollY - this.lastScrollY;
        this.velocity = distance;
        if (distance !== 0) {
          this.direction = Math.sign(distance);
        }
        this.lastScrollY = window.scrollY;
      },
      { passive: true }
    );
  }

  setupAnchorLinks() {
    const links = document.querySelectorAll('a[href^="#"]');
    for (const link of links) {
      link.addEventListener("click", (event) => this.onAnchorClick(event, link));
    }
  }

  onAnchorClick(event, link) {
    const id = link.getAttribute("href");

    // "#top" significa "torna in cima" (posizione 0)
    let target = 0;
    if (id !== "#top") {
      target = document.querySelector(id);
    }
    if (target === null) {
      return;
    }

    event.preventDefault();

    if (this.lenis) {
      this.lenis.scrollTo(target, {
        duration: 1.6,
        easing: (progress) => 1 - Math.pow(1 - progress, 4),
      });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Blocca lo scroll (usato durante il caricamento iniziale).
  pause() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  // Riattiva lo scroll.
  resume() {
    if (this.lenis) {
      this.lenis.start();
    }
  }
}
