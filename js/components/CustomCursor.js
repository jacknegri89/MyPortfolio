/*
 * Cursore personalizzato: un punto che segue il mouse e un anello che lo insegue.
 * Sopra i link l'anello si ingrandisce; sopra gli elementi con data-cursor="..."
 * diventa un cerchio pieno con un'etichetta (es. "Apri", "Codice").
 */
class CustomCursor {
  constructor(environment) {
    this.environment = environment;
    this.gsap = environment.gsap;

    this.dot = document.getElementById("cur-dot");
    this.ring = document.getElementById("cur-ring");
    this.label = document.getElementById("cur-label");
  }

  start() {
    // La classe "has-cursor" nasconde il cursore normale del sistema (vedi cursor.css)
    this.environment.root.classList.add("has-cursor");

    // quickTo crea funzioni ottimizzate per aggiornare spesso una proprietà
    this.moveDotX = this.gsap.quickTo(this.dot, "x", { duration: 0.08 });
    this.moveDotY = this.gsap.quickTo(this.dot, "y", { duration: 0.08 });
    this.moveRingX = this.gsap.quickTo(this.ring, "x", { duration: 0.45, ease: "power3" });
    this.moveRingY = this.gsap.quickTo(this.ring, "y", { duration: 0.45, ease: "power3" });

    window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
    document.addEventListener("pointerover", (event) => this.onPointerOver(event));
    document.addEventListener("pointerleave", () => this.setOpacity(0));
    document.addEventListener("pointerenter", () => this.setOpacity(1));
  }

  onPointerMove(event) {
    this.moveDotX(event.clientX);
    this.moveDotY(event.clientY);
    this.moveRingX(event.clientX);
    this.moveRingY(event.clientY);
  }

  onPointerOver(event) {
    const elementWithLabel = event.target.closest("[data-cursor]");
    const linkOrButton = event.target.closest("a,button");

    const showLabel = elementWithLabel !== null;
    const showLinkStyle = !showLabel && linkOrButton !== null;

    this.ring.classList.toggle("is-view", showLabel);
    this.ring.classList.toggle("is-link", showLinkStyle);

    if (showLabel) {
      this.label.textContent = elementWithLabel.dataset.cursor;
    }
  }

  // Nasconde (0) o mostra (1) il cursore quando il mouse esce o rientra nella finestra.
  setOpacity(opacity) {
    this.gsap.to([this.dot, this.ring], { opacity: opacity, duration: 0.2 });
  }
}
