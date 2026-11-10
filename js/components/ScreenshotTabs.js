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
      button.addEventListener("click", () => this.showPanel(buttons, button));
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
}
