/*
 * Finestre e telefono dei progetti che si inclinano verso il mouse, con un riflesso di luce
 * che segue il cursore (le variabili --glare-x e --glare-y usate in projects.css).
 * Solo con il mouse e con le animazioni attive: lo decide App, che la avvia tra gli effetti del puntatore.
 */
class WindowTilt {
  // Inclinazione massima in gradi quando il mouse è sul bordo della finestra
  static MAX_TILT_DEGREES = 7;
  static PERSPECTIVE_PIXELS = 900;

  constructor(environment) {
    this.gsap = environment.gsap;
  }

  start() {
    const surfaces = document.querySelectorAll(".proj .window, .proj .phone");
    for (const surface of surfaces) {
      this.makeTiltable(surface);
    }
  }

  makeTiltable(surface) {
    this.gsap.set(surface, { transformPerspective: WindowTilt.PERSPECTIVE_PIXELS });
    const turnX = this.gsap.quickTo(surface, "rotationX", { duration: 0.6, ease: "power3.out" });
    const turnY = this.gsap.quickTo(surface, "rotationY", { duration: 0.6, ease: "power3.out" });

    surface.addEventListener("pointermove", (event) => {
      const box = surface.getBoundingClientRect();
      // Posizione del mouse nella finestra: 0 = bordo sinistro (o alto), 1 = bordo destro (o basso)
      const across = (event.clientX - box.left) / box.width;
      const down = (event.clientY - box.top) / box.height;

      turnY((across - 0.5) * 2 * WindowTilt.MAX_TILT_DEGREES);
      turnX((0.5 - down) * 2 * WindowTilt.MAX_TILT_DEGREES);
      surface.style.setProperty("--glare-x", (across * 100).toFixed(1) + "%");
      surface.style.setProperty("--glare-y", (down * 100).toFixed(1) + "%");
      surface.classList.add("is-tilted");
    });

    surface.addEventListener("pointerleave", () => {
      turnX(0);
      turnY(0);
      surface.classList.remove("is-tilted");
    });
  }
}
