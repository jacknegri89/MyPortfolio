/*
 * Pulsanti "Copia" nei contatti: copiano il valore di data-copy negli appunti.
 * Se il browser non lo permette, selezionano il testo così l'utente può copiarlo a mano.
 */
class CopyButtons {
  start() {
    const buttons = document.querySelectorAll("[data-copy]");
    for (const button of buttons) {
      button.addEventListener("click", () => this.copy(button));
    }
  }

  copy(button) {
    const text = button.dataset.copy;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => this.showCopied(button),
        () => this.selectText(button)
      );
    } else {
      this.selectText(button);
    }
  }

  // Mostra "Copiato" per 1,8 secondi, poi torna a "Copia".
  showCopied(button) {
    button.textContent = "Copiato";
    button.classList.add("done");

    setTimeout(() => {
      button.textContent = "Copia";
      button.classList.remove("done");
    }, 1800);
  }

  // Seleziona il link che sta subito prima del pulsante (l'indirizzo email).
  selectText(button) {
    const link = button.previousElementSibling;
    const range = document.createRange();
    range.selectNodeContents(link);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
