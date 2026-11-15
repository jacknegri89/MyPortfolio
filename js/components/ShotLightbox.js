/*
 * Schermata ingrandita: cliccando una schermata dei progetti si apre sopra la pagina,
 * partendo dalla posizione della miniatura, invece di aprire una scheda nuova.
 *
 * Usa l'elemento <dialog> del browser (in index.html), che gestisce da solo:
 * - il tasto Esc per chiudere
 * - il focus della tastiera, che resta dentro la finestra e poi torna al link di partenza
 * Senza JavaScript, o con Ctrl/Shift + click, il link apre l'immagine in una scheda nuova come prima.
 */
class ShotLightbox {
  constructor(environment, smoothScroll) {
    this.environment = environment;
    this.smoothScroll = smoothScroll;
    this.dialog = document.getElementById("lightbox");
    this.image = document.getElementById("lightbox-img");
    this.closeButton = document.getElementById("lightbox-close");
  }

  start() {
    // Browser molto vecchi non hanno <dialog>: lasciamo il comportamento normale dei link
    if (this.dialog === null || typeof this.dialog.showModal !== "function") {
      return;
    }

    const links = document.querySelectorAll(".shot-panel a");
    for (const link of links) {
      link.addEventListener("click", (event) => this.open(event, link));
    }

    this.closeButton.addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("click", (event) => this.closeIfBackdrop(event));
    this.dialog.addEventListener("close", () => this.smoothScroll.resume());

    // Con lo scroll morbido la pagina sotto viene bloccata (pause). Senza, può ancora scorrere:
    // in quel caso scorrere chiude la schermata, così non resta aperta sopra una pagina che si muove.
    if (!this.smoothScroll.isSmooth()) {
      window.addEventListener("scroll", () => this.closeIfOpen(), { passive: true });
    }
  }

  open(event, link) {
    // Chi tiene premuto Ctrl, Cmd o Shift vuole aprire il link in un'altra scheda o finestra
    const wantsNewTab = event.ctrlKey || event.metaKey || event.shiftKey;
    if (wantsNewTab) {
      return;
    }
    event.preventDefault();

    const thumbnail = link.querySelector("img");
    this.image.src = link.href;
    this.image.alt = thumbnail.alt;

    this.smoothScroll.pause();
    this.dialog.showModal();
    this.growFromThumbnail(thumbnail);
  }

  // L'immagine parte piccola, sopra la miniatura cliccata, e cresce fino al centro dello schermo.
  growFromThumbnail(thumbnail) {
    if (!this.environment.canAnimateWithGsap()) {
      return;
    }

    const start = thumbnail.getBoundingClientRect();
    const end = this.image.getBoundingClientRect();
    if (end.width === 0) {
      return;
    }

    const startCenterX = start.left + start.width / 2;
    const startCenterY = start.top + start.height / 2;
    const endCenterX = end.left + end.width / 2;
    const endCenterY = end.top + end.height / 2;

    this.environment.gsap.fromTo(
      this.image,
      { x: startCenterX - endCenterX, y: startCenterY - endCenterY, scale: start.width / end.width },
      { x: 0, y: 0, scale: 1, duration: 0.65, ease: "expo.out", clearProps: "transform" }
    );
  }

  // Un click sullo sfondo scuro (cioè sul <dialog> stesso, non sull'immagine) chiude la schermata.
  closeIfBackdrop(event) {
    if (event.target === this.dialog) {
      this.dialog.close();
    }
  }

  closeIfOpen() {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }
}
