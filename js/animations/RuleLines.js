/*
 * Righe con la linea che si disegna (attributo data-rule in index.html): dati di "Chi sono"
 * e indice degli strumenti. Quando una riga entra nello schermo:
 * 1. la linea in alto si allunga da sinistra a destra
 * 2. l'etichetta a sinistra scivola al suo posto
 * 3. i contenuti a destra compaiono uno dopo l'altro
 *
 * La linea è disegnata dal CSS (sections.css, [data-rule]::before) e la sua lunghezza
 * dipende dalla variabile --rule: qui GSAP la porta da 0 a 1.
 */
class RuleLines {
  constructor(environment) {
    this.gsap = environment.gsap;
    this.scrollTrigger = environment.scrollTrigger;
  }

  start() {
    const rows = this.gsap.utils.toArray("[data-rule]");
    if (rows.length === 0) {
      return;
    }

    for (const row of rows) {
      this.hide(row);
    }

    // batch: le righe che entrano insieme partono in sequenza, non tutte nello stesso istante
    this.scrollTrigger.batch(rows, {
      start: "top 90%",
      once: true,
      onEnter: (enteredRows) => this.showInSequence(enteredRows),
    });
  }

  hide(row) {
    this.gsap.set(row, { "--rule": 0 });
    this.gsap.set(this.getLabel(row), { x: -14, opacity: 0 });
    this.gsap.set(this.getItems(row), { y: 16, opacity: 0 });
  }

  showInSequence(rows) {
    const delayBetweenRows = 0.1;
    let delay = 0;
    for (const row of rows) {
      this.show(row, delay);
      delay = delay + delayBetweenRows;
    }
  }

  show(row, delay) {
    const timeline = this.gsap.timeline({ delay: delay });
    timeline.to(row, { "--rule": 1, duration: 1.1, ease: "expo.out" });
    timeline.to(this.getLabel(row), { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.15);
    // clearProps: a fine animazione gli stili tornano quelli del CSS (serve al filtro degli strumenti)
    timeline.to(
      this.getItems(row),
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.03, clearProps: "transform,opacity" },
      0.2
    );
  }

  getLabel(row) {
    return row.querySelector("dt");
  }

  // Se la riga contiene un elenco animiamo le singole voci, altrimenti il contenuto intero.
  getItems(row) {
    const listItems = row.querySelectorAll("li");
    if (listItems.length > 0) {
      return listItems;
    }
    return row.querySelectorAll("dd");
  }
}
