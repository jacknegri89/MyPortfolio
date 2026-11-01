/*
 * Divide un testo in parole o lettere, ognuna dentro il proprio <span>,
 * così GSAP può animarle una per una.
 *
 * Struttura creata per ogni parola:
 *   <span class="w">        ← maschera che nasconde la parola mentre entra
 *     <span class="wi">     ← la parola vera, quella che si muove
 */
class TextSplitter {
  // Restituisce la lista degli elementi .wi (una per parola).
  static splitWords(element) {
    const originalNodes = Array.from(element.childNodes);
    element.textContent = "";

    for (const node of originalNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        TextSplitter.addWords(element, node.textContent, null);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Es. <span class="serif accent-text">: ogni parola riceve una copia dello span,
        // così lo stile resta e la frase può andare a capo normalmente.
        TextSplitter.addWords(element, node.textContent, node);
      }
    }

    return element.querySelectorAll(".wi");
  }

  // Aggiunge a "container" una parola alla volta presa da "text".
  // Se "template" non è null, ogni parola viene avvolta in una copia di quell'elemento.
  static addWords(container, text, template) {
    const pieces = text.split(/(\s+)/);

    for (const piece of pieces) {
      if (piece === "") {
        continue;
      }

      const isSpace = /^\s+$/.test(piece);
      if (isSpace) {
        container.appendChild(document.createTextNode(" "));
        continue;
      }

      const mask = document.createElement("span");
      mask.className = "w";

      const word = document.createElement("span");
      word.className = "wi";

      if (template) {
        const copy = template.cloneNode(false);
        copy.textContent = piece;
        word.appendChild(copy);
      } else {
        word.textContent = piece;
      }

      mask.appendChild(word);
      container.appendChild(mask);
    }
  }

  // Restituisce la lista degli span .ch (una per lettera).
  static splitChars(element) {
    const text = element.textContent;
    element.textContent = "";

    const letters = [];
    for (const character of Array.from(text)) {
      const letter = document.createElement("span");
      letter.className = "ch";
      letter.textContent = character;
      element.appendChild(letter);
      letters.push(letter);
    }
    return letters;
  }
}
