/*
 * Costellazione degli strumenti (sezione Strumenti): una sfera 3D disegnata su <canvas> che gira piano.
 * Al centro i linguaggi, attorno gli altri strumenti. Una linea unisce due voci quando le ho usate
 * nello stesso progetto (almeno una delle due è un linguaggio).
 * - scegliendo un progetto nel filtro (StackFilter) i suoi strumenti si accendono e lungo le linee corrono impulsi
 * - con il mouse la sfera si inclina verso il cursore e si può trascinare per girarla;
 *   passando su uno strumento (nel canvas o nell'elenco sotto) si legge dove è stato usato
 * - quando entra nello schermo i punti arrivano da lontano e si ricompongono (solo con le animazioni attive)
 * Tutti i dati arrivano dall'elenco #stack in index.html (testo e data-used di ogni <li>, e la prima riga
 * sono i linguaggi): il canvas è solo decorazione (aria-hidden), l'elenco resta il contenuto vero.
 */
class StackConstellation {
  // Raggi delle due sfere (1 = sfera esterna) e distanza della "telecamera" per la prospettiva
  static LANGUAGE_RADIUS = 0.58;
  static TOOL_RADIUS = 1;
  static CAMERA_DISTANCE = 4.5;
  // La sfera si allarga in orizzontale fino a 1,9 volte, perché il canvas è più largo che alto
  static MAX_WIDTH_STRETCH = 1.9;
  // Sotto questa larghezza (telefoni) i nomi degli strumenti si leggono solo davanti o quando sono accesi:
  // tutti insieme in così poco spazio si coprirebbero a vicenda
  static COMPACT_WIDTH_PIXELS = 640;
  static COMPACT_LABEL_MIN_DEPTH = 0.72;
  // Spazio lasciato ai lati (in pixel): le scritte stanno verso l'interno, quindi ne basta poco
  static SIDE_MARGIN_PIXELS = 28;
  // Movimento: rotazione automatica, inclinazione verso il mouse, trascinamento e frenata dopo il rilascio
  static AUTO_SPIN_RADIANS_PER_SECOND = 0.12;
  static POINTER_TILT_RADIANS = 0.38;
  static DRAG_RADIANS_PER_PIXEL = 0.006;
  static SPIN_FRICTION_PER_SECOND = 2.2;
  static TILT_FOLLOW_PER_SECOND = 3;
  // Quanto vicino a un punto deve passare il mouse per "prenderlo"
  static HOVER_DISTANCE_PIXELS = 28;
  // Un tocco che si sposta meno di così è un tap, non un trascinamento
  static TAP_MAX_MOVE_PIXELS = 6;
  // Velocità con cui le voci si accendono e si spengono, e degli impulsi lungo le linee
  static HIGHLIGHT_SPEED_PER_SECOND = 6;
  static PULSE_TRIPS_PER_SECOND = 0.5;
  // Senza progetto scelto corre un impulso tenue su una linea ogni tre: la costellazione sembra viva
  static IDLE_PULSE_EVERY = 3;
  // Entrata: da quanto lontano arrivano i punti e quanto è rapida la ricomposizione
  static SCATTER_DISTANCE = 2.8;
  static ASSEMBLE_FOLLOW_PER_SECOND = 3.5;
  static MAX_FRAME_SECONDS = 0.05;
  // Con un progetto scelto la sfera gira più piano (si leggono meglio i nomi) e prima ruota da sola
  // per portare davanti i suoi strumenti, che si staccano un poco verso l'esterno
  static SELECTED_SPIN_RADIANS_PER_SECOND = 0.035;
  static TURN_TO_PROJECT_SECONDS = 1.4;
  static LIT_POP_DISTANCE = 0.12;
  // Nomi che si sovrappongono: resta quello più importante, gli altri sfumano a questa velocità
  static LABEL_FADE_PER_SECOND = 8;
  static LABEL_PADDING_PIXELS = 4;
  // Pulviscolo di stelle attorno alla sfera (raggi in unità della sfera esterna)
  static DUST_COUNT = 170;
  static DUST_MIN_RADIUS = 1.15;
  static DUST_MAX_RADIUS = 2.1;
  static MAX_PIXEL_RATIO = 2;
  // Grandezza del carattere a cui si misura una volta sola la larghezza di ogni nome (getLabelWidth)
  static MEASURE_FONT_PIXELS = 100;
  // Colori: gli stessi di --a2, --fg e --muted in base.css (come numeri r, g, b)
  static ACCENT = [99, 189, 255];
  static TEXT = [243, 245, 251];
  static MUTED = [142, 149, 172];

  constructor(environment, stackFilter) {
    this.environment = environment;
    this.gsap = environment.gsap;
    this.stackFilter = stackFilter;
    this.canvas = document.getElementById("stack-sky");
    this.stack = document.getElementById("stack");
    this.filter = document.getElementById("stack-filter");

    this.nodes = [];
    this.links = [];
    this.activeProject = StackFilter.ALL;
    this.hoveredNode = null;

    // Stato del movimento
    this.spinAngle = 0;
    this.spinSpeed = 0;
    this.isTurning = false;
    this.tilt = 0;
    this.tiltTarget = 0;
    this.yaw = 0;
    this.yawTarget = 0;
    this.drag = null;

    this.isAnimated = environment.canAnimateWithGsap();
    this.assemble = 1;
    this.assembleTarget = 1;
    this.isVisible = false;
    this.isRunning = false;
    this.lastTime = 0;
    this.elapsedSeconds = 0;
  }

  start() {
    if (this.canvas === null || this.stack === null) {
      return;
    }
    this.context = this.canvas.getContext("2d");
    if (this.context === null) {
      return;
    }

    // Nell'HTML il riquadro parte nascosto: senza JavaScript resterebbe un rettangolo vuoto
    this.canvas.parentElement.hidden = false;

    this.readNodes();
    this.placeNodes();
    this.findLinks();

    this.listenToFilter();
    this.listenToListHover();
    this.listenToPointer();
    this.watchSize();
    if (this.isAnimated) {
      this.assembleWhenScrolledIn();
    }
    this.watchVisibility();
    if (document.fonts) {
      document.fonts.ready.then(() => this.forgetLabelWidths());
    }
  }

  // ---------- Dati ----------

  // Una voce per ogni <li> dell'elenco. La prima riga dell'elenco (Linguaggi) va al centro.
  readNodes() {
    const rows = this.stack.querySelectorAll(".stack-row");
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const isLanguage = rowIndex === 0;
      const tools = rows[rowIndex].querySelectorAll(".stack-tools li");
      for (const tool of tools) {
        this.nodes.push(this.createNode(tool, isLanguage));
      }
    }
  }

  createNode(tool, isLanguage) {
    const projects = [];
    const usedIn = tool.dataset.used.split(" ");
    for (const project of usedIn) {
      if (project !== "") {
        projects.push(project);
      }
    }

    return {
      name: tool.textContent,
      element: tool,
      projects: projects,
      isLanguage: isLanguage,
      neighbors: [],
      home: null,
      scatter: null,
      delay: Math.random(),
      lit: 0,
      faded: 0,
      labelAlpha: 1,
      screen: { x: 0, y: 0, z: 0, scale: 1 },
    };
  }

  // I linguaggi su una sfera piccola, gli altri su una grande. L'ordine dell'elenco è per gruppo,
  // e la spirale riempie la sfera dall'alto in basso: così ogni gruppo forma una fascia.
  placeNodes() {
    const languages = [];
    const tools = [];
    for (const node of this.nodes) {
      if (node.isLanguage) {
        languages.push(node);
      } else {
        tools.push(node);
      }
    }
    this.placeOnSphere(languages, StackConstellation.LANGUAGE_RADIUS);
    this.placeOnSphere(tools, StackConstellation.TOOL_RADIUS);
    this.createDust();
  }

  // Pulviscolo: punti minuscoli sparsi tra due sfere più grandi. Girano con la costellazione e,
  // essendo più lontani dal centro, con la prospettiva danno profondità.
  createDust() {
    this.dust = [];
    const thickness = StackConstellation.DUST_MAX_RADIUS - StackConstellation.DUST_MIN_RADIUS;
    for (let index = 0; index < StackConstellation.DUST_COUNT; index++) {
      const height = Math.random() * 2 - 1;
      const angle = Math.random() * Math.PI * 2;
      const ringRadius = Math.sqrt(1 - height * height);
      const distance = StackConstellation.DUST_MIN_RADIUS + Math.random() * thickness;
      this.dust.push({
        x: Math.cos(angle) * ringRadius * distance,
        y: height * distance,
        z: Math.sin(angle) * ringRadius * distance,
        size: 0.6 + Math.random() * 1.1,
      });
    }
  }

  // Spirale di Fibonacci: distribuisce i punti in modo uniforme sulla superficie della sfera.
  placeOnSphere(nodes, radius) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let index = 0; index < nodes.length; index++) {
      const height = 1 - ((index + 0.5) / nodes.length) * 2;
      const ringRadius = Math.sqrt(1 - height * height);
      const angle = index * goldenAngle;
      const home = {
        x: Math.cos(angle) * ringRadius * radius,
        y: height * radius,
        z: Math.sin(angle) * ringRadius * radius,
      };
      nodes[index].home = home;
      nodes[index].scatter = this.getScatterPoint(home);
    }
  }

  // Punto di partenza dell'entrata: nella stessa direzione ma molto più lontano, con un po' di disordine.
  getScatterPoint(home) {
    const distance = 1 + Math.random() * StackConstellation.SCATTER_DISTANCE;
    const jitter = 0.6;
    return {
      x: home.x * distance + (Math.random() - 0.5) * jitter,
      y: home.y * distance + (Math.random() - 0.5) * jitter,
      z: home.z * distance + (Math.random() - 0.5) * jitter,
    };
  }

  // Una linea tra due voci usate nello stesso progetto, purché almeno una sia un linguaggio
  // (tra tutti gli strumenti le linee sarebbero centinaia e non si leggerebbe più nulla).
  findLinks() {
    for (let first = 0; first < this.nodes.length; first++) {
      for (let second = first + 1; second < this.nodes.length; second++) {
        this.linkIfRelated(this.nodes[first], this.nodes[second]);
      }
    }
  }

  linkIfRelated(nodeA, nodeB) {
    const touchesALanguage = nodeA.isLanguage || nodeB.isLanguage;
    if (!touchesALanguage) {
      return;
    }
    const sharedProjects = [];
    for (const project of nodeA.projects) {
      if (nodeB.projects.includes(project)) {
        sharedProjects.push(project);
      }
    }
    if (sharedProjects.length === 0) {
      return;
    }
    const hasIdlePulse = this.links.length % StackConstellation.IDLE_PULSE_EVERY === 0;
    this.links.push({
      from: nodeA,
      to: nodeB,
      projects: sharedProjects,
      strength: 0,
      pulseOffset: Math.random(),
      hasIdlePulse: hasIdlePulse,
    });
    nodeA.neighbors.push(nodeB);
    nodeB.neighbors.push(nodeA);
  }

  // ---------- Eventi ----------

  // StackFilter avvisa con l'evento "stackfilterchange" quale progetto è stato scelto
  listenToFilter() {
    if (this.filter === null) {
      return;
    }
    this.filter.addEventListener("stackfilterchange", (event) => {
      this.activeProject = event.detail.project;
      this.turnToward(this.activeProject);
      this.requestDraw();
    });
  }

  // Gira la sfera per portare davanti il gruppo di strumenti del progetto (il loro punto medio).
  turnToward(project) {
    if (project === StackFilter.ALL) {
      return;
    }
    let sumX = 0;
    let sumZ = 0;
    for (const node of this.nodes) {
      if (node.projects.includes(project)) {
        sumX += node.home.x;
        sumZ += node.home.z;
      }
    }
    if (sumX === 0 && sumZ === 0) {
      return;
    }

    // Con la rotazione di projectPoint un punto (x, z) finisce davanti quando l'angolo vale atan2(x, z).
    // Scegliamo il giro più corto (al massimo mezzo giro, in un senso o nell'altro).
    const frontAngle = Math.atan2(sumX, sumZ) - this.yaw;
    const fullTurn = Math.PI * 2;
    const difference = ((((frontAngle - this.spinAngle) % fullTurn) + fullTurn * 1.5) % fullTurn) - Math.PI;
    const targetAngle = this.spinAngle + difference;

    if (!this.isAnimated) {
      this.spinAngle = targetAngle;
      return;
    }
    this.spinSpeed = 0;
    this.isTurning = true;
    this.gsap.to(this, {
      spinAngle: targetAngle,
      duration: StackConstellation.TURN_TO_PROJECT_SECONDS,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: () => {
        this.isTurning = false;
      },
    });
  }

  // Passando sopra uno strumento dell'elenco si accende anche nella costellazione
  listenToListHover() {
    for (const node of this.nodes) {
      node.element.addEventListener("mouseenter", () => this.setHoveredNode(node, false));
      node.element.addEventListener("mouseleave", () => this.setHoveredNode(null, false));
    }
  }

  listenToPointer() {
    this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.canvas.addEventListener("pointercancel", () => this.endDrag());
    this.canvas.addEventListener("pointerleave", () => this.onPointerLeave());
  }

  onPointerMove(event) {
    const point = this.getPointerPosition(event);

    // Il mouse inclina la sfera verso di sé (i tocchi no: il dito serve a scorrere la pagina)
    if (event.pointerType === "mouse") {
      this.tiltTarget = (point.y / this.height - 0.5) * StackConstellation.POINTER_TILT_RADIANS;
      this.yawTarget = (point.x / this.width - 0.5) * StackConstellation.POINTER_TILT_RADIANS;
    }

    if (this.drag !== null) {
      this.dragTo(point);
      return;
    }
    if (event.pointerType === "mouse") {
      this.setHoveredNode(this.findNodeAt(point), true);
    }
  }

  onPointerDown(event) {
    if (!this.isAnimated) {
      return;
    }
    // Chi trascina comanda: fermiamo l'eventuale giro automatico verso un progetto
    this.gsap.killTweensOf(this);
    this.isTurning = false;
    const point = this.getPointerPosition(event);
    this.drag = { startX: point.x, lastX: point.x, lastTime: performance.now(), moved: 0 };
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.classList.add("is-dragging");
  }

  dragTo(point) {
    const now = performance.now();
    const deltaX = point.x - this.drag.lastX;
    const seconds = Math.max((now - this.drag.lastTime) / 1000, 0.001);
    const turn = deltaX * StackConstellation.DRAG_RADIANS_PER_PIXEL;

    this.spinAngle += turn;
    this.spinSpeed = turn / seconds;
    this.drag.moved = Math.abs(point.x - this.drag.startX);
    this.drag.lastX = point.x;
    this.drag.lastTime = now;
  }

  // Un tocco senza trascinamento (tipico del telefono) mostra dove è stato usato lo strumento toccato
  onPointerUp(event) {
    const wasTap = this.drag === null || this.drag.moved < StackConstellation.TAP_MAX_MOVE_PIXELS;
    this.endDrag();
    if (wasTap && event.pointerType !== "mouse") {
      this.setHoveredNode(this.findNodeAt(this.getPointerPosition(event)), true);
    }
  }

  endDrag() {
    this.drag = null;
    this.canvas.classList.remove("is-dragging");
  }

  onPointerLeave() {
    this.tiltTarget = 0;
    this.yawTarget = 0;
    if (this.drag === null) {
      this.setHoveredNode(null, true);
    }
  }

  getPointerPosition(event) {
    const box = this.canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  // fromCanvas = true quando il mouse è sul canvas: allora aggiorniamo anche la riga sotto il filtro
  setHoveredNode(node, fromCanvas) {
    if (node === this.hoveredNode) {
      return;
    }
    this.hoveredNode = node;
    this.canvas.classList.toggle("is-pointing", node !== null);

    if (fromCanvas && this.stackFilter !== null) {
      if (node === null) {
        this.stackFilter.restoreCount();
      } else {
        this.stackFilter.showWhereUsed(node.element);
      }
    }
    this.requestDraw();
  }

  // La voce più vicina al punto, se è abbastanza vicina
  findNodeAt(point) {
    let closestNode = null;
    let closestDistance = StackConstellation.HOVER_DISTANCE_PIXELS;
    for (const node of this.nodes) {
      const distance = Math.hypot(node.screen.x - point.x, node.screen.y - point.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNode = node;
      }
    }
    return closestNode;
  }

  // ---------- Dimensioni, scroll e visibilità ----------

  watchSize() {
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(this.canvas);
    this.resize();
  }

  resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, StackConstellation.MAX_PIXEL_RATIO);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.isCompact = this.width < StackConstellation.COMPACT_WIDTH_PIXELS;
    this.canvas.width = Math.round(this.width * pixelRatio);
    this.canvas.height = Math.round(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // Raggio della sfera in pixel: in verticale lo decide l'altezza, in orizzontale si allarga
    // finché c'è posto ai lati. Su schermi stretti l'altezza si limita, così la sfera resta tonda
    // invece di diventare un'ellisse lunga e sottile.
    const roomForLabels = this.width / 2 - StackConstellation.SIDE_MARGIN_PIXELS;
    this.radiusY = Math.min(this.height * 0.5, roomForLabels * 1.15);
    const wantedStretch = Math.min(Math.max((this.width / this.height) * 1.05, 1), StackConstellation.MAX_WIDTH_STRETCH);
    this.radiusX = Math.min(this.radiusY * wantedStretch, roomForLabels);

    this.requestDraw();
  }

  // Entrata: la ricomposizione segue lo scroll, da quando il canvas spunta in basso a quando è quasi al centro
  assembleWhenScrolledIn() {
    this.assemble = 0;
    this.assembleTarget = 0;
    const trigger = this.environment.scrollTrigger.create({
      trigger: this.canvas,
      start: "top bottom",
      end: "center 60%",
      onUpdate: (self) => {
        this.assembleTarget = self.progress;
      },
    });
    this.assembleTarget = trigger.progress;
  }

  // Il disegno continuo gira solo mentre il canvas è sullo schermo
  watchVisibility() {
    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      this.updateLoop();
    });
    observer.observe(this.canvas);
  }

  updateLoop() {
    const shouldRun = this.isAnimated && this.isVisible;
    if (shouldRun && !this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame((time) => this.loop(time));
    }
    if (!shouldRun) {
      this.isRunning = false;
    }
  }

  loop(time) {
    if (!this.isRunning) {
      return;
    }
    const seconds = Math.min((time - this.lastTime) / 1000, StackConstellation.MAX_FRAME_SECONDS);
    this.lastTime = time;
    this.drawFrame(seconds);
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  // Senza il disegno continuo (movimento ridotto o canvas fuori schermo) ridisegniamo una volta sola,
  // con le luci già al loro valore finale
  requestDraw() {
    if (this.isRunning) {
      return;
    }
    // Con le animazioni attive e il canvas fuori schermo non serve disegnare: lo farà il ciclo
    // appena il canvas diventa visibile (così all'apertura della pagina non lavoriamo per niente)
    const loopWillDraw = this.isAnimated && !this.isVisible;
    if (loopWillDraw) {
      return;
    }
    const jumpToTheEnd = 10;
    this.drawFrame(jumpToTheEnd);
  }

  // ---------- Disegno ----------

  drawFrame(seconds) {
    this.elapsedSeconds += seconds;
    this.updateMotion(seconds);
    this.updateHighlights(seconds);
    this.projectNodes();
    this.chooseVisibleLabels(seconds);

    this.context.clearRect(0, 0, this.width, this.height);
    this.drawDust();
    this.drawLinks();
    this.drawNodes();
  }

  // "follow" trasforma una velocità al secondo in quanto avvicinarsi al valore voluto in questo fotogramma
  getFollowAmount(speedPerSecond, seconds) {
    return 1 - Math.exp(-speedPerSecond * seconds);
  }

  updateMotion(seconds) {
    if (!this.isAnimated) {
      return;
    }
    const tiltFollow = this.getFollowAmount(StackConstellation.TILT_FOLLOW_PER_SECOND, seconds);
    this.tilt += (this.tiltTarget - this.tilt) * tiltFollow;
    this.yaw += (this.yawTarget - this.yaw) * tiltFollow;

    // Durante il trascinamento comanda il dito o il mouse; dopo, la spinta si esaurisce piano
    const isFree = this.drag === null && !this.isTurning;
    if (isFree) {
      let autoSpin = StackConstellation.AUTO_SPIN_RADIANS_PER_SECOND;
      if (this.activeProject !== StackFilter.ALL) {
        autoSpin = StackConstellation.SELECTED_SPIN_RADIANS_PER_SECOND;
      }
      this.spinAngle += (autoSpin + this.spinSpeed) * seconds;
      this.spinSpeed *= Math.exp(-StackConstellation.SPIN_FRICTION_PER_SECOND * seconds);
    }

    const assembleFollow = this.getFollowAmount(StackConstellation.ASSEMBLE_FOLLOW_PER_SECOND, seconds);
    this.assemble += (this.assembleTarget - this.assemble) * assembleFollow;
  }

  updateHighlights(seconds) {
    const follow = this.getFollowAmount(StackConstellation.HIGHLIGHT_SPEED_PER_SECOND, seconds);
    for (const node of this.nodes) {
      const isLit = this.isNodeLit(node);
      const somethingIsLit = this.hoveredNode !== null || this.activeProject !== StackFilter.ALL;
      let litTarget = 0;
      if (isLit) {
        litTarget = 1;
      }
      let fadedTarget = 0;
      if (somethingIsLit && !isLit) {
        fadedTarget = 1;
      }
      node.lit += (litTarget - node.lit) * follow;
      node.faded += (fadedTarget - node.faded) * follow;
    }
    for (const link of this.links) {
      let strengthTarget = 0;
      if (this.isLinkLit(link)) {
        strengthTarget = 1;
      }
      link.strength += (strengthTarget - link.strength) * follow;
    }
  }

  // Accesa: la voce sotto il mouse e quelle collegate, oppure le voci del progetto scelto nel filtro
  isNodeLit(node) {
    if (this.hoveredNode !== null) {
      return node === this.hoveredNode || this.hoveredNode.neighbors.includes(node);
    }
    if (this.activeProject === StackFilter.ALL) {
      return false;
    }
    return node.projects.includes(this.activeProject);
  }

  isLinkLit(link) {
    if (this.hoveredNode !== null) {
      return link.from === this.hoveredNode || link.to === this.hoveredNode;
    }
    if (this.activeProject === StackFilter.ALL) {
      return false;
    }
    return link.projects.includes(this.activeProject);
  }

  // Calcola dove cade ogni voce sullo schermo: posizione durante l'entrata, rotazione, prospettiva.
  projectNodes() {
    this.prepareRotation();
    for (const node of this.nodes) {
      node.screen = this.projectPoint(this.getAssembledPoint(node));
    }
  }

  // Seni e coseni della rotazione di questo fotogramma, calcolati una volta sola
  prepareRotation() {
    const angle = this.spinAngle + this.yaw;
    this.rotation = {
      cosAngle: Math.cos(angle),
      sinAngle: Math.sin(angle),
      cosTilt: Math.cos(this.tilt),
      sinTilt: Math.sin(this.tilt),
    };
  }

  // Da un punto 3D (coordinate della sfera, raggio esterno = 1) alla posizione sullo schermo
  projectPoint(point) {
    const rotation = this.rotation;
    const camera = StackConstellation.CAMERA_DISTANCE;
    // Divisore che riporta la voce più vicina alla misura del raggio (altrimenti uscirebbe dal canvas)
    const nearestScale = camera / (camera - 1);

    // Rotazione attorno all'asse verticale, poi inclinazione attorno a quello orizzontale
    const turnedX = point.x * rotation.cosAngle - point.z * rotation.sinAngle;
    const turnedZ = point.x * rotation.sinAngle + point.z * rotation.cosAngle;
    const tiltedY = point.y * rotation.cosTilt - turnedZ * rotation.sinTilt;
    const tiltedZ = point.y * rotation.sinTilt + turnedZ * rotation.cosTilt;

    const scale = camera / (camera - tiltedZ) / nearestScale;
    return {
      x: this.width / 2 + turnedX * this.radiusX * scale,
      y: this.height / 2 + tiltedY * this.radiusY * scale,
      z: tiltedZ,
      scale: scale,
    };
  }

  // Il colore si imposta una volta sola; per ogni puntino cambia solo globalAlpha
  // (scrivere "rgba(...)" per ognuno costringeva il browser a rileggere 170 colori a ogni fotogramma)
  drawDust() {
    const context = this.context;
    context.fillStyle = "rgb(" + this.toCssChannels(StackConstellation.TEXT) + ")";
    for (const speck of this.dust) {
      const point = this.projectPoint(speck);
      const isOutside = point.x < 0 || point.x > this.width || point.y < 0 || point.y > this.height;
      if (isOutside) {
        continue;
      }
      const depth = (point.z / StackConstellation.DUST_MAX_RADIUS + 1) / 2;
      const alpha = (0.06 + 0.3 * depth) * this.assemble;
      const size = speck.size * point.scale;
      context.globalAlpha = alpha;
      context.fillRect(point.x, point.y, size, size);
    }
    context.globalAlpha = 1;
  }

  // Durante l'entrata ogni voce viaggia dal suo punto lontano a quello sulla sfera, con un piccolo ritardo diverso
  getAssembledPoint(node) {
    const delaySpread = 0.4;
    const ownProgress = (this.assemble - node.delay * delaySpread) / (1 - delaySpread);
    const progress = Math.min(Math.max(ownProgress, 0), 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.arrival = progress;
    // Le voci accese si staccano un poco dalla sfera, verso l'esterno
    const pop = 1 + StackConstellation.LIT_POP_DISTANCE * node.lit;
    return {
      x: (node.scatter.x + (node.home.x - node.scatter.x) * eased) * pop,
      y: (node.scatter.y + (node.home.y - node.scatter.y) * eased) * pop,
      z: (node.scatter.z + (node.home.z - node.scatter.z) * eased) * pop,
    };
  }

  // Da 0 (in fondo alla sfera) a 1 (davanti)
  getDepth(node) {
    const depth = (node.screen.z + 1) / 2;
    return Math.min(Math.max(depth, 0), 1);
  }

  drawLinks() {
    const context = this.context;
    context.lineWidth = 1;
    for (const link of this.links) {
      const depth = (this.getDepth(link.from) + this.getDepth(link.to)) / 2;
      const arrival = Math.min(link.from.arrival, link.to.arrival);
      const faded = Math.max(link.from.faded, link.to.faded) * (1 - link.strength);
      const alpha = (0.11 + 0.55 * link.strength) * (0.35 + 0.65 * depth) * (1 - 0.8 * faded);
      const color = this.toCssChannels(this.mixColors(StackConstellation.TEXT, StackConstellation.ACCENT, link.strength));

      // All'entrata la linea si traccia dal primo capo (il linguaggio) verso l'altro
      const endX = link.from.screen.x + (link.to.screen.x - link.from.screen.x) * arrival;
      const endY = link.from.screen.y + (link.to.screen.y - link.from.screen.y) * arrival;
      context.strokeStyle = "rgba(" + color + ", " + alpha + ")";
      context.beginPath();
      context.moveTo(link.from.screen.x, link.from.screen.y);
      context.lineTo(endX, endY);
      context.stroke();

      this.drawPulseIfNeeded(link, alpha, depth, arrival);
    }
  }

  // Impulso pieno sulle linee accese; tenue, a riposo, su una linea ogni tre
  drawPulseIfNeeded(link, alpha, depth, arrival) {
    const isFullyDrawn = arrival > 0.99;
    if (!this.isAnimated || !isFullyDrawn) {
      return;
    }
    if (link.strength > 0.05) {
      this.drawPulse(link, alpha);
      return;
    }
    const nothingIsLit = this.hoveredNode === null && this.activeProject === StackFilter.ALL;
    if (link.hasIdlePulse && nothingIsLit) {
      this.drawPulse(link, 0.12 * (0.35 + 0.65 * depth));
    }
  }

  // Un punto luminoso che corre lungo la linea, da un capo all'altro
  drawPulse(link, alpha) {
    const trip = (this.elapsedSeconds * StackConstellation.PULSE_TRIPS_PER_SECOND + link.pulseOffset) % 1;
    const x = link.from.screen.x + (link.to.screen.x - link.from.screen.x) * trip;
    const y = link.from.screen.y + (link.to.screen.y - link.from.screen.y) * trip;
    const pulseAlpha = Math.min(alpha * 2, 1);

    this.context.fillStyle = "rgba(" + this.toCssChannels(StackConstellation.ACCENT) + ", " + pulseAlpha + ")";
    this.context.beginPath();
    this.context.arc(x, y, 2.4, 0, Math.PI * 2);
    this.context.fill();
  }

  // Dal fondo verso il davanti, così le voci vicine coprono quelle lontane
  drawNodes() {
    const sortedNodes = this.nodes.slice();
    sortedNodes.sort((nodeA, nodeB) => nodeA.screen.z - nodeB.screen.z);
    for (const node of sortedNodes) {
      this.drawNode(node);
    }
  }

  drawNode(node) {
    const context = this.context;
    const depth = this.getDepth(node);
    const alpha = (0.38 + 0.62 * depth) * (1 - 0.78 * node.faded) * node.arrival;
    if (alpha <= 0.01) {
      return;
    }

    // Colore: i linguaggi sono chiari, gli strumenti grigi che si schiariscono davanti; accesi diventano azzurri
    let baseColor = this.mixColors(StackConstellation.MUTED, StackConstellation.TEXT, depth);
    if (node.isLanguage) {
      baseColor = StackConstellation.TEXT;
    }
    const color = this.toCssChannels(this.mixColors(baseColor, StackConstellation.ACCENT, node.lit));
    const scale = node.screen.scale * (1 + 0.18 * node.lit);
    const x = node.screen.x;
    const y = node.screen.y;

    // Alone morbido attorno alle voci accese
    if (node.lit > 0.02) {
      context.fillStyle = "rgba(" + this.toCssChannels(StackConstellation.ACCENT) + ", " + 0.14 * node.lit * alpha + ")";
      context.beginPath();
      context.arc(x, y, 11 * scale, 0, Math.PI * 2);
      context.fill();
    }

    let dotRadius = 1.8;
    if (node.isLanguage) {
      dotRadius = 3.4;
    }
    context.fillStyle = "rgba(" + color + ", " + alpha + ")";
    context.beginPath();
    context.arc(x, y, dotRadius * scale, 0, Math.PI * 2);
    context.fill();

    if (node.labelAlpha < 0.02) {
      return;
    }

    // La scritta sta dalla parte del centro, così non esce mai dal bordo del canvas
    const labelGap = 9 * scale;
    context.fillStyle = "rgba(" + color + ", " + alpha * node.labelAlpha + ")";
    context.font = this.getFont(node, scale);
    context.textBaseline = "middle";
    if (x > this.width / 2) {
      context.textAlign = "right";
      context.fillText(node.name, x - labelGap, y);
    } else {
      context.textAlign = "left";
      context.fillText(node.name, x + labelGap, y);
    }
  }

  // Decide quali nomi si vedono: se due si sovrappongono vince il più importante (quello sotto il mouse,
  // poi gli accesi, poi i linguaggi, poi il più vicino) e l'altro sfuma. Il pallino resta sempre.
  chooseVisibleLabels(seconds) {
    const follow = this.getFollowAmount(StackConstellation.LABEL_FADE_PER_SECOND, seconds);
    const byImportance = this.nodes.slice();
    byImportance.sort((nodeA, nodeB) => this.getLabelImportance(nodeB) - this.getLabelImportance(nodeA));

    const takenBoxes = [];
    for (const node of byImportance) {
      const box = this.getLabelBox(node);
      const isAllowed = this.shouldShowLabel(node, this.getDepth(node));
      let wantedAlpha = 0;
      if (isAllowed && !this.overlapsAny(box, takenBoxes)) {
        wantedAlpha = 1;
        takenBoxes.push(box);
      }
      node.labelAlpha += (wantedAlpha - node.labelAlpha) * follow;
    }
  }

  getLabelImportance(node) {
    let importance = this.getDepth(node) + node.lit * 4;
    if (node.isLanguage) {
      importance += 2;
    }
    if (node === this.hoveredNode) {
      importance += 10;
    }
    return importance;
  }

  // Il rettangolo occupato dal nome sullo schermo (stesso calcolo di drawNode), con un piccolo margine
  getLabelBox(node) {
    const scale = node.screen.scale * (1 + 0.18 * node.lit);
    const gap = 9 * scale;
    const padding = StackConstellation.LABEL_PADDING_PIXELS;
    const fontSize = this.getFontSize(node) * scale;
    const width = this.getLabelWidth(node, fontSize);
    const height = fontSize;

    let left = node.screen.x + gap;
    if (node.screen.x > this.width / 2) {
      left = node.screen.x - gap - width;
    }
    return {
      left: left - padding,
      right: left + width + padding,
      top: node.screen.y - height / 2,
      bottom: node.screen.y + height / 2,
    };
  }

  // Larghezza del nome a una certa grandezza. measureText è lento e qui servirebbe per ogni nome
  // a ogni fotogramma: misuriamo una volta sola a 100px e poi facciamo la proporzione
  // (la larghezza del testo cresce in proporzione alla grandezza del carattere).
  getLabelWidth(node, fontSize) {
    if (node.widthAt100 === undefined) {
      const scaleFor100 = StackConstellation.MEASURE_FONT_PIXELS / this.getFontSize(node);
      this.context.font = this.getFont(node, scaleFor100);
      node.widthAt100 = this.context.measureText(node.name).width;
    }
    return node.widthAt100 * (fontSize / StackConstellation.MEASURE_FONT_PIXELS);
  }

  // Quando arrivano i font veri le larghezze cambiano: le misure vecchie si buttano
  forgetLabelWidths() {
    for (const node of this.nodes) {
      node.widthAt100 = undefined;
    }
  }

  overlapsAny(box, otherBoxes) {
    for (const other of otherBoxes) {
      const isApart = box.right < other.left || box.left > other.right || box.bottom < other.top || box.top > other.bottom;
      if (!isApart) {
        return true;
      }
    }
    return false;
  }

  shouldShowLabel(node, depth) {
    if (!this.isCompact || node.isLanguage) {
      return true;
    }
    const isLit = node.lit > 0.5;
    const isInFront = depth > StackConstellation.COMPACT_LABEL_MIN_DEPTH;
    return isLit || isInFront;
  }

  // I linguaggi in corsivo grande (lo stesso serif dei titoli), gli strumenti nel carattere del testo
  getFont(node, scale) {
    const size = this.getFontSize(node) * scale;
    if (node.isLanguage) {
      return "italic 400 " + size.toFixed(1) + "px 'Instrument Serif', Georgia, serif";
    }
    return "500 " + size.toFixed(1) + "px Geist, system-ui, sans-serif";
  }

  // Grandezza del testo prima della prospettiva: cresce con la sfera, entro un minimo e un massimo
  getFontSize(node) {
    if (node.isLanguage) {
      return Math.min(Math.max(this.radiusY * 0.15, 22), 52);
    }
    return Math.min(Math.max(this.radiusY * 0.062, 12), 20);
  }

  // Mescola due colori [r, g, b]: amount 0 = il primo, 1 = il secondo.
  mixColors(firstColor, secondColor, amount) {
    const channels = [];
    for (let index = 0; index < 3; index++) {
      const value = firstColor[index] + (secondColor[index] - firstColor[index]) * amount;
      channels.push(Math.round(value));
    }
    return channels;
  }

  // [99, 189, 255] → "99, 189, 255", da mettere dentro rgba(...)
  toCssChannels(color) {
    return color.join(", ");
  }
}
