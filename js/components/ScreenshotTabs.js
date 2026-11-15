/*
 * Schermate dei progetti: sotto ogni finestra ci sono dei pulsanti (es. "Dashboard", "Pannello")
 * e ognuno mostra una schermata diversa nella stessa finestra.
 *
 * In index.html:
 * - il contenitore ha l'attributo data-shots
 * - ogni pulsante ha data-shot-target con l'id della schermata (.shot-panel) da mostrare
 * Senza JavaScript le schermate restano tutte visibili, una sotto l'altra.
 */
class ScreenshotTabs {
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
  animatePanel(panel) {
    if (!this.environment.canAnimateWithGsap()) {
      return;
    }

    this.environment.gsap.fromTo(
      panel,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }
    );
  }
}
