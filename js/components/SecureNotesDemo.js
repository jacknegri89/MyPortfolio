/*
 * Animazione del telefono "Secure Notes": ogni 3,2 secondi le note
 * passano da testo leggibile a testo cifrato e viceversa, lettera per lettera.
 * È solo un effetto visivo: non c'è vera crittografia.
 */
class SecureNotesDemo {
  constructor(environment) {
    this.environment = environment;

    this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    this.totalFrames = 22;
    this.isEncrypted = false;

    this.notes = [this.createNote("cipher-1"), this.createNote("cipher-2")];
    this.stateLabel = document.getElementById("ph-state");
    this.isOnScreen = false;
  }

  createNote(id) {
    const element = document.getElementById(id);
    return { element: element, plainText: element.textContent };
  }

  start() {
    if (this.environment.reduceMotion) {
      return;
    }
    this.watchIfOnScreen();
    setInterval(() => this.toggle(), 3200);
  }

  // Quando il telefono non si vede non serve animarlo: risparmiamo lavoro al browser
  watchIfOnScreen() {
    if (!("IntersectionObserver" in window)) {
      this.isOnScreen = true;
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      this.isOnScreen = entries[0].isIntersecting;
    });
    observer.observe(this.stateLabel.closest(".phone"));
  }

  toggle() {
    if (!this.isOnScreen) {
      return;
    }
    this.isEncrypted = !this.isEncrypted;

    for (const note of this.notes) {
      this.scramble(note, this.isEncrypted);
    }

    if (this.isEncrypted) {
      this.stateLabel.textContent = "AES · nota cifrata su disco";
    } else {
      this.stateLabel.textContent = "AES · sbloccato con password";
    }
  }

  scramble(note, toCipher) {
    const cipherText = this.randomText(note.plainText.length);
    note.element.classList.toggle("enc", toCipher);
    this.drawScrambleFrame(note, cipherText, toCipher, 1);
  }

  // Disegna un fotogramma: le lettere a sinistra di "progress" sono già trasformate.
  drawScrambleFrame(note, cipherText, toCipher, frame) {
    const length = note.plainText.length;
    const progress = frame / this.totalFrames;
    let text = "";

    for (let i = 0; i < length; i++) {
      const isDone = i / length < progress;

      if (toCipher) {
        if (isDone) {
          text += cipherText[i];
        } else {
          text += note.plainText[i];
        }
      } else {
        if (isDone) {
          text += note.plainText[i];
        } else {
          text += this.randomCharacter();
        }
      }
    }
    note.element.textContent = text;

    if (frame < this.totalFrames) {
      requestAnimationFrame(() => this.drawScrambleFrame(note, cipherText, toCipher, frame + 1));
    } else if (toCipher) {
      note.element.textContent = cipherText;
    } else {
      note.element.textContent = note.plainText;
    }
  }

  randomCharacter() {
    const index = Math.floor(Math.random() * this.alphabet.length);
    return this.alphabet[index];
  }

  randomText(length) {
    let text = "";
    for (let i = 0; i < length; i++) {
      text += this.randomCharacter();
    }
    return text;
  }
}
