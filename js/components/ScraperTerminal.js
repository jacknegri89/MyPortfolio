/*
 * Finto terminale del progetto "JobScraper":
 * quando diventa visibile, le righe compaiono una alla volta come se il comando girasse davvero.
 */
class ScraperTerminal {
  constructor(element, environment) {
    this.element = element;
    this.environment = environment;

    // Il testo completo scritto in index.html (togliamo spazi e a capo iniziali/finali)
    this.fullHtml = element.innerHTML.trim();
    element.innerHTML = this.fullHtml;

    this.lines = this.fullHtml.split("\n");
    this.visibleLines = 0;
    this.hasPlayed = false;
  }

  // Avvia l'animazione (una sola volta).
  play() {
    if (this.hasPlayed || this.environment.reduceMotion) {
      return;
    }
    this.hasPlayed = true;
    this.showNextLine();
  }

  showNextLine() {
    this.visibleLines++;
    const shownText = this.lines.slice(0, this.visibleLines).join("\n");

    const isLastLine = this.visibleLines >= this.lines.length;
    if (isLastLine) {
      // Ultima riga: il cursore lampeggiante resta in fondo
      this.element.innerHTML = shownText + ' <span class="tcaret"></span>';
      return;
    }

    this.element.innerHTML = shownText + '\n<span class="tcaret"></span>';

    // La prima riga (il comando) aspetta di più, le altre arrivano a ritmo variabile
    let delay = 900;
    if (this.visibleLines !== 1) {
      delay = 480 + Math.random() * 360;
    }
    setTimeout(() => this.showNextLine(), delay);
  }
}
