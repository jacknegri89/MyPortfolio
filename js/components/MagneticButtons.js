/*
 * Pulsanti "magnetici" (classe .magnetic): quando il mouse ci passa sopra
 * il pulsante si sposta leggermente verso il mouse, poi torna al suo posto.
 */
class MagneticButtons {
  constructor(environment) {
    this.gsap = environment.gsap;

    // Quanto il pulsante segue il mouse: 0 = per niente, 1 = completamente
    this.strength = 0.35;
  }

  start() {
    const buttons = document.querySelectorAll(".magnetic");
    for (const button of buttons) {
      this.makeMagnetic(button);
    }
  }

  makeMagnetic(button) {
    const animationSettings = { duration: 0.6, ease: "elastic.out(1,0.4)" };
    const moveX = this.gsap.quickTo(button, "x", animationSettings);
    const moveY = this.gsap.quickTo(button, "y", animationSettings);

    button.addEventListener("pointermove", (event) => {
      const box = button.getBoundingClientRect();
      const distanceFromCenterX = event.clientX - box.left - box.width / 2;
      const distanceFromCenterY = event.clientY - box.top - box.height / 2;
      moveX(distanceFromCenterX * this.strength);
      moveY(distanceFromCenterY * this.strength);
    });

    button.addEventListener("pointerleave", () => {
      moveX(0);
      moveY(0);
    });
  }
}
