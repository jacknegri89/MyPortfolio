/*
 * Il nome gigante nel footer si "disegna da solo" quando arrivi in fondo alla pagina,
 * come una firma: il contorno di ogni lettera viene tracciato, prima più luminoso,
 * poi si spegne fino al grigio tenue definitivo.
 *
 * Come funziona il trucco del disegno:
 * - stroke-dasharray divide il contorno in un tratto pieno lungo "dashLength" e un vuoto lungo uguale
 * - stroke-dashoffset sposta l'inizio del tratto: con offset = dashLength si vede solo il vuoto
 * - riportando l'offset a 0 il tratto pieno "scorre" lungo il contorno e la lettera si disegna
 */
class FooterSignature {
  constructor(environment) {
    this.gsap = environment.gsap;
    this.text = document.querySelector(".foot-sign-text");
  }

  start() {
    if (!this.text) {
      return;
    }

    const dashLength = this.getDashLength();

    // Stato iniziale: contorno invisibile e più luminoso del normale
    this.gsap.set(this.text, {
      strokeDasharray: dashLength + " " + dashLength,
      strokeDashoffset: dashLength,
      stroke: "rgba(255, 255, 255, 0.6)",
    });

    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: ".foot-name", start: "top 85%", once: true },
    });

    // 1. le lettere si disegnano
    timeline.to(this.text, { strokeDashoffset: 0, duration: 3, ease: "power1.inOut" });

    // 2. verso la fine il contorno si spegne fino al colore definitivo del CSS
    timeline.to(this.text, { stroke: "rgba(255, 255, 255, 0.14)", duration: 1.6, ease: "power1.out" }, "-=1.2");

    // 3. finito tutto, togliamo gli stili inline: resta solo quello che dice footer.css
    timeline.set(this.text, { clearProps: "strokeDasharray,strokeDashoffset,stroke" });
  }

  // Il tratto deve essere lungo almeno quanto il contorno più lungo (la "m"),
  // altrimenti a fine animazione resterebbe un pezzo vuoto. Misurato: 5 volte la dimensione del font.
  // Più lungo di così funziona lo stesso, ma il disegno finirebbe a metà animazione.
  getDashLength() {
    const fontSize = parseFloat(window.getComputedStyle(this.text).fontSize);
    return fontSize * 5;
  }
}
