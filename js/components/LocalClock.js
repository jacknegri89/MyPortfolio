/*
 * Orologio nel footer: mostra l'ora di Barlassina (fuso orario italiano), qualunque sia il fuso
 * di chi guarda il sito. Serve a chi scrive da lontano per capire se è un buon momento.
 * La riga parte nascosta nell'HTML: la mostra questo script, così senza JavaScript non resta vuota.
 */
class LocalClock {
  static TIME_ZONE = "Europe/Rome";
  // Ogni quanti millisecondi viene riletta l'ora (mostriamo solo ore e minuti)
  static REFRESH_MILLISECONDS = 20 * 1000;

  constructor() {
    this.row = document.getElementById("local-time-row");
    this.time = document.getElementById("local-time");
  }

  start() {
    if (this.row === null || this.time === null) {
      return;
    }

    // Es. "14:32", sempre nel fuso orario italiano
    this.formatter = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: LocalClock.TIME_ZONE,
    });

    this.showTime();
    this.row.hidden = false;
    setInterval(() => this.showTime(), LocalClock.REFRESH_MILLISECONDS);
  }

  showTime() {
    const now = new Date();
    this.time.textContent = this.formatter.format(now);
    // dateTime è la versione leggibile dalle macchine (lettori di schermo, motori di ricerca)
    this.time.dateTime = now.toISOString();
  }
}
