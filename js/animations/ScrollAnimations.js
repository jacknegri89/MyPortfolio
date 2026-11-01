/*
 * Animazioni legate allo scroll (plugin ScrollTrigger di GSAP):
 * - il nome nell'hero sale e sbiadisce mentre scrolli
 * - i titoli .split entrano parola per parola
 * - la frase della sezione Chi sono si "accende" parola per parola
 * - gli elementi .reveal salgono e appaiono
 */
class ScrollAnimations {
  // headings: lista di { element, words } preparata da App con TextSplitter
  constructor(environment, headings) {
    this.gsap = environment.gsap;
    this.headings = headings;
  }

  start() {
    this.fadeHeroName();
    this.revealHeadings();
    this.lightUpStatement();
    this.revealBlocks();
  }

  fadeHeroName() {
    this.gsap.to(".hero-name", {
      yPercent: -18,
      opacity: 0.15,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  revealHeadings() {
    for (const heading of this.headings) {
      this.gsap.from(heading.words, {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: heading.element, start: "top 85%" },
      });
    }
  }

  lightUpStatement() {
    const statement = document.getElementById("statement");
    const words = TextSplitter.splitWords(statement);

    this.gsap.fromTo(
      words,
      { opacity: 0.55 }, // partono attenuate ma leggibili, anche quelle azzurre (contrasto minimo 3:1)
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: "#statement", start: "top 78%", end: "bottom 42%", scrub: true },
      }
    );
  }

  revealBlocks() {
    const blocks = this.gsap.utils.toArray(".reveal");
    for (const block of blocks) {
      this.gsap.from(block, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: block, start: "top 90%" },
      });
    }
  }
}
