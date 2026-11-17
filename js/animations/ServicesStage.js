/*
 * Scena dei servizi (solo schermi grandi, con le animazioni attive).
 * La parte con i tre servizi si blocca sullo schermo e, mentre scorri:
 * - a sinistra i servizi si aprono uno alla volta (gli altri restano chiusi e in grigio)
 * - a destra un sito stilizzato si ricompone per mostrare il servizio aperto:
 *   1. sito su misura  → pagina completa con menu, titolo, foto e tre riquadri
 *   2. landing page    → una sola colonna con un grande pulsante al centro, che un cursore clicca
 *   3. restyling       → prima un sito vecchio e disordinato, poi una linea azzurra lo attraversa
 *                        e ogni pezzo va al suo posto
 *
 * Per tutta la scena il sito ruota piano su se stesso, come un oggetto visto da due lati, e un
 * riflesso di luce attraversa lo schermo. Davanti al computer c'è lo stesso sito su un telefono,
 * che si ricompone insieme a lui (nel sito vecchio il telefono mostra la pagina del computer
 * rimpicciolita e tagliata: non era fatto per il telefono). Più avanti ancora fluttuano
 * due etichette per servizio. Telefono ed etichette sono "più vicini": ruotando si spostano di più.
 *
 * Il sito è un SVG in index.html: ogni rettangolo ha data-block="nome". Qui sotto, in LAYOUTS
 * (computer) e PHONE_LAYOUTS (telefono), c'è la posizione di ogni rettangolo in ciascuna
 * disposizione: per cambiare un disegno basta cambiare quei numeri. L'aspetto è in css/services.css.
 */
class ServicesStage {
  // Per quante "altezze di schermo" la scena resta bloccata mentre scorri
  static PIN_SCREENS = 2.6;

  // La scena è una linea del tempo lunga 10 unità. Ogni servizio è aperto in un suo intervallo.
  static LENGTH = 10;
  static SERVICE_TIMES = [
    { start: 0, end: 3 },
    { start: 3, end: 6.2 },
    { start: 6.2, end: 10 },
  ];
  static LANDING_AT = 2.3; // quando il sito diventa una landing page
  static CLICK_AT = 4.1; // quando il cursore arriva sul pulsante della landing page
  static OLD_SITE_AT = 5.6; // quando diventa il sito vecchio da rifare
  static TIDY_AT = 7; // quando parte la linea che lo rimette in ordine
  static SCAN_SECONDS = 1.6; // durata del passaggio della linea
  static SITE_WIDTH = 556; // larghezza del disegno percorsa dalla linea
  static BUTTON_BLUE = "#63bdff";
  static BUTTON_GREY = "#5b6172"; // nel sito vecchio il pulsante è grigio e non si nota
  // Rotazione del sito (in gradi) all'inizio e alla fine della scena
  static TURN_START = { rotationY: -16, rotationX: 6 };
  static TURN_END = { rotationY: 12, rotationX: 2 };
  // Quanto stanno davanti al computer (in pixel, verso chi guarda) il telefono e le etichette
  static PHONE_DEPTH_PIXELS = 70;
  static TAG_DEPTH_PIXELS = 120;
  // Il telefono si ricompone poco dopo il computer, pezzo dopo pezzo
  static PHONE_DELAY = 0.15;
  static PHONE_STAGGER = 0.06;
  // Larghezza della scia che segue la linea del restyling (unità dell'SVG)
  static SCAN_TRAIL_WIDTH = 70;

  // Quando compare e quando sparisce ogni etichetta (stesse unità della linea del tempo).
  // hide null = resta fino alla fine della scena.
  static TAG_TIMES = [
    { tag: "speed", show: 0.4, hide: 2.1 },
    { tag: "phone", show: 0.7, hide: 2.1 },
    { tag: "goal", show: 3.3, hide: 5.3 },
    { tag: "request", show: 4.9, hide: 5.3 },
    { tag: "before", show: 6, hide: 7.5 },
    { tag: "after", show: 8.4, hide: null },
  ];

  // Posizione e misura di ogni pezzo del sito nelle diverse disposizioni (coordinate dell'SVG, 560 x 400)
  static LAYOUTS = {
    landing: {
      nav: { x: 200, y: 64, width: 160, height: 10, rx: 5 },
      title: { x: 110, y: 100, width: 340, height: 34, rx: 6 },
      text: { x: 170, y: 146, width: 220, height: 12, rx: 6 },
      cta: { x: 190, y: 176, width: 180, height: 46, rx: 23 },
      card1: { x: 196, y: 236, width: 50, height: 6, rx: 3 },
      card2: { x: 255, y: 236, width: 50, height: 6, rx: 3 },
      card3: { x: 314, y: 236, width: 50, height: 6, rx: 3 },
      img: { x: 110, y: 262, width: 340, height: 96, rx: 8 },
      foot: { x: 240, y: 372, width: 80, height: 6, rx: 3 },
    },
    old: {
      nav: { x: 20, y: 56, width: 520, height: 40, rx: 0 },
      title: { x: 30, y: 108, width: 150, height: 14, rx: 0 },
      text: { x: 30, y: 130, width: 300, height: 56, rx: 0 },
      cta: { x: 440, y: 312, width: 60, height: 14, rx: 0 },
      img: { x: 350, y: 108, width: 170, height: 78, rx: 0 },
      card1: { x: 30, y: 200, width: 120, height: 112, rx: 0 },
      card2: { x: 160, y: 216, width: 170, height: 60, rx: 0 },
      card3: { x: 345, y: 196, width: 175, height: 96, rx: 0 },
      foot: { x: 20, y: 336, width: 520, height: 48, rx: 0 },
    },
    restyled: {
      nav: { x: 40, y: 62, width: 480, height: 12, rx: 6 },
      img: { x: 40, y: 94, width: 230, height: 236, rx: 10 },
      title: { x: 300, y: 112, width: 210, height: 30, rx: 6 },
      text: { x: 300, y: 154, width: 170, height: 12, rx: 6 },
      cta: { x: 300, y: 184, width: 120, height: 32, rx: 16 },
      card1: { x: 300, y: 240, width: 104, height: 90, rx: 8 },
      card2: { x: 416, y: 240, width: 104, height: 39, rx: 8 },
      card3: { x: 416, y: 291, width: 104, height: 39, rx: 8 },
      foot: { x: 40, y: 352, width: 480, height: 10, rx: 5 },
    },
  };

  // Le stesse disposizioni sul telefono (coordinate dell'SVG del telefono, 120 x 240; schermo da x 5 a 115)
  static PHONE_LAYOUTS = {
    landing: {
      nav: { x: 40, y: 24, width: 40, height: 5, rx: 2.5 },
      title: { x: 14, y: 44, width: 92, height: 22, rx: 5 },
      text: { x: 24, y: 74, width: 72, height: 6, rx: 3 },
      cta: { x: 22, y: 90, width: 76, height: 22, rx: 11 },
      card1: { x: 30, y: 122, width: 16, height: 4, rx: 2 },
      card2: { x: 52, y: 122, width: 16, height: 4, rx: 2 },
      card3: { x: 74, y: 122, width: 16, height: 4, rx: 2 },
      img: { x: 14, y: 136, width: 92, height: 72, rx: 6 },
      foot: { x: 44, y: 224, width: 32, height: 4, rx: 2 },
    },
    // Il sito vecchio è la pagina del computer rimpicciolita (30%): esce dallo schermo a destra
    // e il pulsante non si vede nemmeno
    old: {
      nav: { x: 10, y: 20.8, width: 156, height: 12, rx: 0 },
      title: { x: 13, y: 36.4, width: 45, height: 4.2, rx: 0 },
      text: { x: 13, y: 43, width: 90, height: 16.8, rx: 0 },
      cta: { x: 136, y: 97.6, width: 18, height: 4.2, rx: 0 },
      img: { x: 109, y: 36.4, width: 51, height: 23.4, rx: 0 },
      card1: { x: 13, y: 64, width: 36, height: 33.6, rx: 0 },
      card2: { x: 52, y: 68.8, width: 51, height: 18, rx: 0 },
      card3: { x: 107.5, y: 62.8, width: 52.5, height: 28.8, rx: 0 },
      foot: { x: 10, y: 104.8, width: 156, height: 14.4, rx: 0 },
    },
    // Rifatto pensando al telefono: una colonna, pulsante largo quanto lo schermo
    restyled: {
      nav: { x: 10, y: 22, width: 100, height: 8, rx: 4 },
      img: { x: 10, y: 36, width: 100, height: 70, rx: 8 },
      title: { x: 10, y: 114, width: 90, height: 14, rx: 4 },
      text: { x: 10, y: 134, width: 72, height: 6, rx: 3 },
      cta: { x: 10, y: 148, width: 100, height: 18, rx: 9 },
      card1: { x: 10, y: 174, width: 48, height: 40, rx: 6 },
      card2: { x: 62, y: 174, width: 48, height: 18, rx: 6 },
      card3: { x: 62, y: 196, width: 48, height: 18, rx: 6 },
      foot: { x: 10, y: 222, width: 100, height: 5, rx: 2.5 },
    },
  };

  constructor(environment) {
    this.gsap = environment.gsap;
    this.drawSvg = environment.drawSvg;
    this.root = environment.root;
    this.stage = document.getElementById("svc-stage");
    this.list = document.getElementById("svc-list");
    this.scanLine = document.getElementById("svc-scan");
    this.pointer = document.getElementById("svc-pointer");
    this.ripple = document.getElementById("svc-ripple");
    this.scanTrail = document.getElementById("svc-scan-trail");
    this.sheen = document.getElementById("svc-sheen");
    this.phone = document.getElementById("svc-phone");
    this.activeIndex = -1;
  }

  start() {
    if (this.stage === null || this.list === null) {
      return;
    }
    this.rows = this.list.querySelectorAll(".svc");
    this.blocks = this.stage.querySelectorAll("#svc-site [data-block]");
    this.phoneBlocks = this.stage.querySelectorAll("#svc-phone [data-block]");
    this.tags = this.stage.querySelectorAll(".svc-tag");
    this.visual = this.stage.querySelector(".svc-visual");

    // Solo su schermi larghi e abbastanza alti: sotto queste misure resta l'elenco normale.
    // Quando la finestra viene rimpicciolita, GSAP annulla da solo tutto ciò che setup() ha creato.
    const media = this.gsap.matchMedia();
    media.add("(min-width: 1000px) and (min-height: 680px)", () => this.setup());
  }

  setup() {
    // La classe "is-svc" attiva il layout a due colonne in services.css
    this.root.classList.add("is-svc");
    this.setActive(0);

    const timeline = this.gsap.timeline({
      defaults: { ease: "power2.inOut" },
      // onUpdate della linea del tempo (non dello scroll): con lo "scrub" la scena arriva un attimo
      // dopo lo scroll, e il servizio aperto deve seguire quello che si vede davvero
      onUpdate: () => this.followTimeline(timeline),
      scrollTrigger: {
        trigger: this.stage,
        start: "top top",
        end: () => "+=" + window.innerHeight * ServicesStage.PIN_SCREENS,
        pin: true,
        scrub: 0.8,
        // Questa scena allunga la pagina ed è sopra i progetti (che hanno priorità 1):
        // deve essere misurata per prima, altrimenti le sezioni sotto partono nel punto sbagliato.
        refreshPriority: 2,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    this.placeInDepth();
    this.turnSite(timeline);
    this.sweepSheen(timeline);
    this.moveBlocks(timeline, this.blocks, ServicesStage.LAYOUTS.landing, ServicesStage.LANDING_AT, 1.4);
    this.movePhoneBlocks(timeline, ServicesStage.PHONE_LAYOUTS.landing, ServicesStage.LANDING_AT, 1.2);
    this.clickButton(timeline);
    this.moveBlocks(timeline, this.blocks, ServicesStage.LAYOUTS.old, ServicesStage.OLD_SITE_AT, 1);
    this.movePhoneBlocks(timeline, ServicesStage.PHONE_LAYOUTS.old, ServicesStage.OLD_SITE_AT, 0.8);
    const buttons = [this.getBlock("cta"), this.getPhoneBlock("cta")];
    timeline.to(buttons, { fill: ServicesStage.BUTTON_GREY, duration: 1 }, ServicesStage.OLD_SITE_AT);
    this.tidyBlocks(timeline);
    this.tidyPhone(timeline);
    this.showTags(timeline);
    // Un passo vuoto alla fine: porta la linea del tempo esattamente a LENGTH
    timeline.to({}, { duration: 0.01 }, ServicesStage.LENGTH - 0.01);

    this.drawOnEnter();

    // Tastiera: se il focus arriva su un link dentro un servizio chiuso, scorriamo fino a quel servizio
    const onFocus = (event) => this.scrollToFocusedService(event, timeline.scrollTrigger);
    this.list.addEventListener("focusin", onFocus);

    // Funzione di pulizia: GSAP la chiama quando lo schermo diventa piccolo
    return () => {
      this.list.removeEventListener("focusin", onFocus);
      this.root.classList.remove("is-svc");
      this.clearActive();
    };
  }

  getBlock(name) {
    return this.stage.querySelector('#svc-site [data-block="' + name + '"]');
  }

  getPhoneBlock(name) {
    return this.stage.querySelector('#svc-phone [data-block="' + name + '"]');
  }

  // Telefono ed etichette più vicini a chi guarda: con la rotazione del sito si spostano di più (parallasse)
  placeInDepth() {
    this.gsap.set(this.phone, { z: ServicesStage.PHONE_DEPTH_PIXELS });
    this.gsap.set(this.tags, { z: ServicesStage.TAG_DEPTH_PIXELS });
  }

  // Un riflesso di luce attraversa lo schermo da destra a sinistra, insieme alla rotazione
  sweepSheen(timeline) {
    timeline.fromTo(
      this.sheen,
      { backgroundPosition: "100% 0%" },
      { backgroundPosition: "0% 0%", duration: ServicesStage.LENGTH, ease: "none" },
      0
    );
  }

  // Ogni etichetta sale e compare nel suo momento, poi sparisce verso l'alto
  showTags(timeline) {
    for (const moment of ServicesStage.TAG_TIMES) {
      const tag = this.stage.querySelector('[data-tag="' + moment.tag + '"]');
      if (tag === null) {
        continue;
      }
      timeline.fromTo(
        tag,
        { opacity: 0, y: 14, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" },
        moment.show
      );
      if (moment.hide !== null) {
        timeline.to(tag, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, moment.hide);
      }
    }
  }

  // Il telefono si ricompone poco dopo il computer, un pezzo alla volta
  movePhoneBlocks(timeline, layout, startTime, duration) {
    const phoneStart = startTime + ServicesStage.PHONE_DELAY;
    for (let index = 0; index < this.phoneBlocks.length; index++) {
      const block = this.phoneBlocks[index];
      const target = layout[block.dataset.block];
      const blockStart = phoneStart + index * ServicesStage.PHONE_STAGGER;
      timeline.to(block, { attr: target, duration: duration }, blockStart);
    }
  }

  // Restyling sul telefono: parte quando la linea ha attraversato metà del computer
  tidyPhone(timeline) {
    const startTime = ServicesStage.TIDY_AT + ServicesStage.SCAN_SECONDS * 0.5;
    this.movePhoneBlocks(timeline, ServicesStage.PHONE_LAYOUTS.restyled, startTime, 0.7);
  }

  // Il sito ruota lentamente per tutta la durata della scena: da girato a sinistra a girato a destra.
  turnSite(timeline) {
    const start = {
      transformPerspective: 1300,
      rotationY: ServicesStage.TURN_START.rotationY,
      rotationX: ServicesStage.TURN_START.rotationX,
    };
    const end = {
      rotationY: ServicesStage.TURN_END.rotationY,
      rotationX: ServicesStage.TURN_END.rotationX,
      duration: ServicesStage.LENGTH,
      ease: "none",
    };
    timeline.fromTo(this.visual, start, end, 0);
  }

  // Landing page: il cursore entra da destra, arriva sul pulsante e lo clicca.
  // Il pulsante si schiaccia un attimo e un'onda si allarga dal punto del click.
  clickButton(timeline) {
    const startTime = ServicesStage.CLICK_AT;
    const button = this.getBlock("cta");

    timeline.fromTo(
      this.pointer,
      { x: 470, y: 340, opacity: 0 },
      { x: 290, y: 200, opacity: 1, duration: 0.7, ease: "power2.out" },
      startTime
    );
    timeline.to(button, { scale: 0.93, transformOrigin: "50% 50%", duration: 0.12, ease: "power1.in" }, startTime + 0.7);
    timeline.to(button, { scale: 1, duration: 0.3, ease: "power2.out" }, startTime + 0.82);
    timeline.fromTo(
      this.ripple,
      { attr: { r: 4 }, opacity: 0.9 },
      // immediateRender false: altrimenti l'onda sarebbe già visibile all'inizio della scena
      { attr: { r: 64 }, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false },
      startTime + 0.76
    );
    timeline.to(this.pointer, { opacity: 0, duration: 0.3 }, ServicesStage.OLD_SITE_AT - 0.3);
  }

  // Sposta tutti i pezzi del sito verso una nuova disposizione, nello stesso momento.
  moveBlocks(timeline, blocks, layout, startTime, duration) {
    for (const block of blocks) {
      const target = layout[block.dataset.block];
      timeline.to(block, { attr: target, duration: duration }, startTime);
    }
  }

  // Restyling: una linea azzurra attraversa il sito da sinistra a destra
  // e ogni pezzo va al suo posto nel momento in cui la linea lo raggiunge.
  tidyBlocks(timeline) {
    const startTime = ServicesStage.TIDY_AT;
    const scanSeconds = ServicesStage.SCAN_SECONDS;

    timeline.set(this.scanLine, { opacity: 1 }, startTime);
    timeline.fromTo(
      this.scanLine,
      { attr: { x: 0 } },
      { attr: { x: ServicesStage.SITE_WIDTH }, duration: scanSeconds, ease: "none" },
      startTime
    );
    timeline.set(this.scanLine, { opacity: 0 }, startTime + scanSeconds);

    // La scia segue la linea, un po' più indietro, e svanisce alla fine del passaggio
    const trailWidth = ServicesStage.SCAN_TRAIL_WIDTH;
    timeline.set(this.scanTrail, { opacity: 1 }, startTime);
    timeline.fromTo(
      this.scanTrail,
      { attr: { x: -trailWidth } },
      { attr: { x: ServicesStage.SITE_WIDTH - trailWidth }, duration: scanSeconds, ease: "none" },
      startTime
    );
    timeline.to(this.scanTrail, { opacity: 0, duration: 0.4 }, startTime + scanSeconds);

    for (const block of this.blocks) {
      const name = block.dataset.block;
      const oldPosition = ServicesStage.LAYOUTS.old[name];
      const centerX = oldPosition.x + oldPosition.width / 2;
      const whenLineArrives = (centerX / ServicesStage.SITE_WIDTH) * scanSeconds;

      timeline.to(block, { attr: ServicesStage.LAYOUTS.restyled[name], duration: 0.7 }, startTime + whenLineArrives * 0.8);
    }
    // Il pulsante torna azzurro (anche sul telefono): nel sito rifatto è la prima cosa che si nota
    const buttons = [this.getBlock("cta"), this.getPhoneBlock("cta")];
    timeline.to(buttons, { fill: ServicesStage.BUTTON_BLUE, duration: 0.5 }, startTime + scanSeconds * 0.6);
  }

  // Chiamata a ogni movimento dello scroll: decide quale servizio è aperto
  // e allunga la linea sotto il suo titolo in base a quanto manca al prossimo.
  followTimeline(timeline) {
    const time = timeline.time();

    let index = ServicesStage.SERVICE_TIMES.length - 1;
    for (let position = 0; position < ServicesStage.SERVICE_TIMES.length; position++) {
      if (time < ServicesStage.SERVICE_TIMES[position].end) {
        index = position;
        break;
      }
    }
    this.setActive(index);

    const times = ServicesStage.SERVICE_TIMES[index];
    const fraction = (time - times.start) / (times.end - times.start);
    this.rows[index].style.setProperty("--svc-progress", fraction.toFixed(3));
  }

  setActive(index) {
    if (index === this.activeIndex) {
      return;
    }
    this.activeIndex = index;

    for (let position = 0; position < this.rows.length; position++) {
      const row = this.rows[position];
      const isActive = position === index;
      row.classList.toggle("is-active", isActive);
      if (!isActive) {
        row.style.removeProperty("--svc-progress");
      }
    }
  }

  clearActive() {
    this.activeIndex = -1;
    for (const row of this.rows) {
      row.classList.remove("is-active");
      row.style.removeProperty("--svc-progress");
    }
  }

  // La prima volta che la scena entra nello schermo il sito "si costruisce": cornice, poi i pezzi.
  drawOnEnter() {
    const timeline = this.gsap.timeline({
      scrollTrigger: { trigger: this.stage, start: "top 70%", once: true },
    });
    if (this.drawSvg) {
      timeline.from(this.stage.querySelectorAll(".site-frame"), { drawSVG: 0, duration: 1.2, ease: "power2.inOut" });
    }
    timeline.from(
      this.blocks,
      { opacity: 0, y: 14, duration: 0.7, ease: "expo.out", stagger: 0.05, clearProps: "opacity,transform" },
      0.25
    );
    // Il telefono sale da sotto dopo il computer (solo opacity da ripulire: la profondità z deve restare)
    timeline.from(this.phone, { opacity: 0, y: 60, duration: 1, ease: "expo.out", clearProps: "opacity" }, 0.6);
  }

  scrollToFocusedService(event, trigger) {
    const row = event.target.closest(".svc");
    if (row === null) {
      return;
    }
    // Serve solo a chi usa la tastiera: con il mouse il link è già visibile sotto il cursore
    const focusCameFromKeyboard = event.target.matches(":focus-visible");
    if (!focusCameFromKeyboard) {
      return;
    }

    const index = Array.from(this.rows).indexOf(row);
    const times = ServicesStage.SERVICE_TIMES[index];
    const middle = (times.start + times.end) / 2;
    const progress = middle / ServicesStage.LENGTH;
    window.scrollTo(0, trigger.start + progress * (trigger.end - trigger.start));
  }
}
