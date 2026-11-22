/*
 * Schermate dei progetti: sotto ogni finestra ci sono dei pulsanti (es. "Dashboard", "Pannello")
 * e ognuno mostra una schermata diversa nella stessa finestra.
 *
 * In index.html:
 * - il contenitore ha l'attributo data-shots
 * - ogni pulsante ha data-shot-target con l'id della schermata (.shot-panel) da mostrare
 *   e dentro la miniatura della schermata (.shot-thumb)
 * - la finestra sta in .shot-stage, che disegna in CSS la pila di fogli dietro di lei
 * Senza JavaScript le schermate restano tutte visibili, una sotto l'altra.
 */
class ScreenshotTabs {
  // Cambio schermata: la finestra parte da qui (più in alto e più piccola, come il foglio dietro)
  static SHUFFLE_LIFT_PIXELS = 12;
  static SHUFFLE_START_SCALE = 0.95;

  constructor(environment) {
    this.environment = environment;
  }

  start() {
    const groups = document.querySelectorAll("[data-shots]");
    for (const group of groups) {
      this.setupGroup(group);
    }
  }

  setupGroup(group) {
    const buttons = group.querySelectorAll("[data-shot-target]");
    if (buttons.length === 0) {
      return;
    }

    for (const button of buttons) {
      button.addEventListener("click", () => {
        this.showPanel(buttons, button);
        this.animatePanel(document.getElementById(button.dataset.shotTarget));
      });
    }

    // All'inizio è visibile la prima schermata
    const firstButton = buttons[0];
    this.showPanel(buttons, firstButton);
  }

  // Mostra la schermata del pulsante scelto e nasconde le altre dello stesso gruppo.
  showPanel(buttons, activeButton) {
    for (const button of buttons) {
      const isActive = button === activeButton;
      const panel = document.getElementById(button.dataset.shotTarget);

      // aria-pressed dice ai lettori di schermo quale pulsante è selezionato
      button.setAttribute("aria-pressed", String(isActive));
      panel.hidden = !isActive;
    }
  }

  // La schermata appena scelta sale leggermente e appare (solo se le animazioni sono attive).
  // Intanto la pila "si rimescola": la finestra arriva dal foglio dietro (più in alto e più piccola)
  // e i fogli dietro, prima raccolti, tornano a spuntare.
  animatePanel(panel) {
    if (!this.environment.canAnimateWithGsap()) {
      return;
    }
    const gsap = this.environment.gsap;

    gsap.fromTo(
      panel,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }
    );

    const stage = panel.closest(".shot-stage");
    if (stage === null) {
      return;
    }
    const windowFrame = stage.querySelector(".window");
    gsap.fromTo(
      windowFrame,
      { y: -ScreenshotTabs.SHUFFLE_LIFT_PIXELS, scale: ScreenshotTabs.SHUFFLE_START_SCALE },
      { y: 0, scale: 1, duration: 0.7, ease: "expo.out", overwrite: "auto" }
    );
    gsap.fromTo(stage, { "--deck-spread": 0 }, { "--deck-spread": 1, duration: 0.8, ease: "expo.out", overwrite: "auto" });
  }
}
