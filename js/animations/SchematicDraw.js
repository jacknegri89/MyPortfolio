/*
 * Lo schema del sistema (sezione Esperienza) si disegna quando entra nello schermo:
 * prima i contorni dei riquadri, poi i fili che li collegano, infine testi e segnali.
 * Usa il plugin DrawSVG di GSAP, che anima il tratto di un contorno da 0% a 100%.
 *
 * Gli elementi tratteggiati (stroke-dasharray) non vengono "disegnati" ma solo fatti apparire:
 * DrawSVG usa proprio il tratteggio per funzionare e a fine animazione lo cancellerebbe.
 */
class SchematicDraw {
  constructor(environment) {
    this.gsap = environment.gsap;
    this.drawSvg = environment.drawSvg;
    this.svg = document.querySelector(".schem-scroll svg");
  }

  start() {
    if (this.svg === null || !this.drawSvg) {
      return;
    }

    const boxes = this.svg.querySelectorAll("rect:not([stroke-dasharray])");
    const wires = this.svg.querySelectorAll(".sw:not([stroke-dasharray])");
    const dashedShapes = this.svg.querySelectorAll("[stroke-dasharray]");
    const texts = this.svg.querySelectorAll("text");
    const signals = this.svg.querySelectorAll(".pulse");

    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: this.svg, start: "top 82%", once: true },
    });

    // Il terzo parametro dice quando parte ogni passo rispetto al precedente (vedi IntroAnimation.js)
    timeline.from(boxes, { drawSVG: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.08 });
    timeline.from(wires, { drawSVG: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.12 }, "-=0.6");
    timeline.from(dashedShapes, { opacity: 0, duration: 0.6, ease: "power1.out" }, "-=0.7");
    timeline.from(texts, { opacity: 0, duration: 0.5, ease: "power1.out", stagger: 0.03 }, "-=0.9");
    timeline.from(signals, { opacity: 0, duration: 0.4 }, "-=0.2");
  }
}
