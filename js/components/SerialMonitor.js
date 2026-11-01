/*
 * Finto monitor seriale del Raspberry Pi (sezione Esperienza).
 * Simula il sistema dello stage: l'umidità sale finché supera la soglia,
 * allora la pompa si accende e l'umidità scende; sotto soglia - 3 la pompa si spegne.
 */
class SerialMonitor {
  constructor(element, environment) {
    this.element = element;
    this.environment = environment;

    this.maxRows = 8;
    this.threshold = 60; // soglia di umidità relativa (%)

    this.humidity = 57.4;
    this.temperature = 22.4;
    this.pumpIsOn = false;
    this.clock = new Date(2025, 5, 18, 10, 14, 2);

    this.rows = [];
    this.isOnScreen = false;
  }

  start() {
    for (let i = 0; i < this.maxRows; i++) {
      this.rows.push(this.readSensor());
    }
    this.draw();

    if (!this.environment.reduceMotion) {
      this.watchIfOnScreen();
      setInterval(() => this.addRow(), 1400);
    }
  }

  // Quando il monitor non si vede non serve aggiornarlo: risparmiamo lavoro al browser
  watchIfOnScreen() {
    if (!("IntersectionObserver" in window)) {
      this.isOnScreen = true;
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      this.isOnScreen = entries[0].isIntersecting;
    });
    observer.observe(this.element);
  }

  addRow() {
    if (!this.isOnScreen) {
      return;
    }
    this.rows.push(this.readSensor());
    if (this.rows.length > this.maxRows) {
      this.rows.shift();
    }
    this.draw();
  }

  // Simula una lettura del sensore DHT22 e restituisce la riga di testo (HTML) da mostrare.
  readSensor() {
    this.clock = new Date(this.clock.getTime() + 2000);

    if (this.pumpIsOn) {
      this.humidity -= 0.5 + Math.random() * 0.9;
    } else {
      this.humidity += 0.2 + Math.random() * 0.9;
    }
    this.temperature += (Math.random() - 0.5) * 0.12;

    if (this.humidity > this.threshold) {
      this.pumpIsOn = true;
    } else if (this.humidity < this.threshold - 3) {
      this.pumpIsOn = false;
    }

    let pumpText = '<span class="off">○ pompa OFF</span>';
    if (this.pumpIsOn) {
      pumpText = '<span class="on">● pompa ON</span>';
    }

    return (
      '<span class="t">' +
      this.formatTime(this.clock) +
      "</span>  UR " +
      this.humidity.toFixed(1) +
      " %  T " +
      this.temperature.toFixed(1) +
      " °C  " +
      pumpText
    );
  }

  formatTime(date) {
    return this.twoDigits(date.getHours()) + ":" + this.twoDigits(date.getMinutes()) + ":" + this.twoDigits(date.getSeconds());
  }

  twoDigits(number) {
    return String(number).padStart(2, "0");
  }

  draw() {
    this.element.innerHTML = this.rows.join("\n");
  }
}
