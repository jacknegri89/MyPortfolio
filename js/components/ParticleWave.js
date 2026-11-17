/*
 * Onda di particelle 3D nello sfondo dell'hero (libreria Three.js).
 * Le particelle sono una griglia di punti che ondeggia nel tempo
 * e si solleva vicino al mouse. Con lo scroll la camera si allontana.
 * All'apertura la camera arriva in volo da lontano mentre l'onda prende forza (startFlyIn).
 * Un click (o un tocco) nell'hero fa partire un'onda circolare da quel punto (startRipple).
 *
 * Prestazioni: l'altezza di ogni punto viene calcolata dalla scheda grafica (GPU)
 * dentro un piccolo programma chiamato "vertex shader". Così il processore non deve
 * ricalcolare migliaia di punti a ogni fotogramma: aggiorna solo due numeri (tempo e mouse).
 */
class ParticleWave {
  // Volo d'ingresso: da quanto in alto e da quanto lontano parte la camera, quanto dura e dopo quanto parte
  // (il ritardo si conta da quando il sipario del loader comincia a salire: vedi startFlyIn)
  static FLY_IN_HEIGHT = 5;
  static FLY_IN_DEPTH = 11;
  static FLY_IN_SECONDS = 3;
  static FLY_IN_DELAY_SECONDS = 0.15;
  static MAX_PIXEL_RATIO = 1.5;
  // Forza dell'onda quando la camera è ancora lontana (1 = forza normale)
  static FLY_IN_START_STRENGTH = 0.15;
  // Onda al click: di quanto invecchia a ogni fotogramma, e l'età "da ferma" (così vecchia che non si vede)
  static RIPPLE_AGE_STEP = 0.016;
  static RIPPLE_IDLE_AGE = 99;

  constructor(canvas, environment) {
    this.canvas = canvas;
    this.environment = environment;

    // Su schermi piccoli usiamo meno punti e meno risoluzione per non appesantire il telefono
    this.isSmallScreen = window.innerWidth < 700;
    this.columns = 180;
    this.rows = 84;
    if (this.isSmallScreen) {
      this.columns = 90;
      this.rows = 46;
    }
    this.gap = 0.2;
    this.pointCount = this.columns * this.rows;

    // Posizione del mouse: "x/y" è quella attuale, "targetX/targetY" quella da raggiungere
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Valori passati allo shader a ogni fotogramma
    this.shaderValues = {
      uTime: { value: 0 },
      uMouse: { value: null }, // creato in start(), quando Three.js è sicuramente caricato
      uStrength: { value: 1 }, // forza dell'onda: cresce durante il volo d'ingresso
      uRipple: { value: null }, // onda al click: x e z del centro, più l'età (creato in start())
    };

    // 1 = camera lontana (inizio del volo d'ingresso), 0 = camera al suo posto
    this.flyIn = { distance: 0 };
    this.rippleAge = ParticleWave.RIPPLE_IDLE_AGE;

    this.time = 0;
    this.isVisible = true;
    // Il ciclo di disegno parte solo quando si alza il sipario: sotto il loader non si vede nulla
    this.isRevealed = !environment.canAnimateWithGsap() || environment.root.classList.contains("is-revealed");
    this.animationFrameId = 0;
    this.heroHeight = 1;
  }

  start() {
    if (!window.THREE || !this.canvas) {
      return;
    }

    try {
      // antialias false: i punti sono quadratini sfumati, l'antialiasing non si nota ma costa molto alla GPU
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true });
    } catch (error) {
      // Il browser non supporta WebGL: niente onda, il resto del sito funziona lo stesso.
      return;
    }

    this.hero = this.canvas.parentElement;

    // Oltre 1.5 la differenza sui punti non si vede, ma il lavoro della GPU cresce molto (schermi retina)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ParticleWave.MAX_PIXEL_RATIO));

    this.shaderValues.uMouse.value = new THREE.Vector2(0, 0);
    this.shaderValues.uRipple.value = new THREE.Vector3(0, 0, ParticleWave.RIPPLE_IDLE_AGE);

    this.createScene();
    this.createPoints();
    this.listenToMouse();
    this.listenToClicks();
    this.startFlyIn();

    this.resize();
    window.addEventListener("resize", () => this.resize());
    // Posizione dello scroll salvata a ogni scroll: leggere window.scrollY dentro drawFrame, dopo che
    // altre animazioni hanno cambiato la pagina, costringeva il browser a ricalcolare il layout
    this.scrollY = window.scrollY;
    window.addEventListener("scroll", () => this.rememberScroll(), { passive: true });

    // Il primo fotogramma prepara lo shader (il lavoro più pesante) mentre il loader copre ancora la pagina
    this.drawFrame();
    this.waitForReveal();
    this.pauseWhenHeroIsHidden();
    // L'onda compare in dissolvenza (css/hero.css): se Three.js arriva tardi non spunta di colpo
    this.canvas.classList.add("is-ready");
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04050a, 0.06);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  }

  createPoints() {
    // I punti partono tutti piatti (altezza 0): l'onda la aggiunge lo shader
    const positions = new Float32Array(this.pointCount * 3);
    const colors = new Float32Array(this.pointCount * 3);

    const leftColor = new THREE.Color("#3B8BEB");
    const rightColor = new THREE.Color("#8FD0FF");
    const mixedColor = new THREE.Color();

    let index = 0;
    for (let column = 0; column < this.columns; column++) {
      for (let row = 0; row < this.rows; row++) {
        positions[index * 3] = (column - this.columns / 2) * this.gap; // x
        positions[index * 3 + 2] = (row - this.rows / 2) * this.gap; // z

        // Colore sfumato da sinistra (azzurro scuro) a destra (azzurro chiaro)
        mixedColor.copy(leftColor).lerp(rightColor, column / this.columns);
        colors[index * 3] = mixedColor.r;
        colors[index * 3 + 1] = mixedColor.g;
        colors[index * 3 + 2] = mixedColor.b;

        index++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    material.onBeforeCompile = (shader) => this.addWaveToShader(shader);

    const points = new THREE.Points(geometry, material);
    points.position.y = -1.6;
    // L'onda alza i punti dentro lo shader: Three.js non lo sa, quindi non deve escluderli dal disegno
    points.frustumCulled = false;
    this.scene.add(points);
  }

  // Modifica lo shader standard dei punti di Three.js aggiungendo il calcolo dell'onda.
  // Il testo tra virgolette è codice GLSL (il linguaggio della scheda grafica): la formula
  // è la stessa che prima veniva eseguita in JavaScript per ogni punto.
  addWaveToShader(shader) {
    shader.uniforms.uTime = this.shaderValues.uTime;
    shader.uniforms.uMouse = this.shaderValues.uMouse;
    shader.uniforms.uStrength = this.shaderValues.uStrength;
    shader.uniforms.uRipple = this.shaderValues.uRipple;

    const waveCode = [
      "vec3 transformed = vec3(position);",
      "float wave = sin(position.x * 0.55 + uTime) * 0.32 + cos(position.z * 0.7 + uTime * 1.3) * 0.26;",
      "float distanceX = position.x - uMouse.x;",
      "float distanceZ = position.z - uMouse.y;",
      "float bumpNearMouse = exp(-(distanceX * distanceX + distanceZ * distanceZ) * 0.18) * 0.9;",
      // Onda al click: un cerchio che si allarga dal punto cliccato e si spegne con il tempo.
      // uRipple.z è l'età dell'onda; "rippleFront" è fin dove è arrivata.
      "float rippleDistance = distance(position.xz, uRipple.xy);",
      "float rippleFront = uRipple.z * 6.0;",
      "float insideRipple = 1.0 - smoothstep(rippleFront - 1.2, rippleFront + 0.6, rippleDistance);",
      "float ripple = sin(rippleDistance * 2.6 - uRipple.z * 9.0) * 0.6 * exp(-uRipple.z * 1.3) * insideRipple;",
      "transformed.y = (wave + bumpNearMouse) * uStrength + ripple;",
    ].join("\n");

    // I punti sulle creste diventano più grandi: l'onda sembra più profonda
    const pointSizeCode = "#include <fog_vertex>\ngl_PointSize *= 1.0 + max(transformed.y, 0.0) * 0.8;";

    const uniformsCode = "uniform float uTime;\nuniform vec2 uMouse;\nuniform float uStrength;\nuniform vec3 uRipple;\n";
    const shaderWithWave = shader.vertexShader.replace("#include <begin_vertex>", waveCode);
    shader.vertexShader = uniformsCode + shaderWithWave.replace("#include <fog_vertex>", pointSizeCode);
  }

  // Volo d'ingresso: la camera parte alta e lontana e scende al suo posto, mentre l'onda prende forza.
  // Senza animazioni (o senza GSAP) la camera è già al suo posto.
  startFlyIn() {
    if (!this.environment.canAnimateWithGsap()) {
      return;
    }

    this.flyIn.distance = 1;
    this.shaderValues.uStrength.value = ParticleWave.FLY_IN_START_STRENGTH;

    // Il volo parte quando si alza il sipario (IntroAnimation avvisa con l'evento "introreveal").
    // Se il sipario è già su (Three.js arrivato tardi), parte subito.
    const fly = () => {
      const duration = ParticleWave.FLY_IN_SECONDS;
      const delay = ParticleWave.FLY_IN_DELAY_SECONDS;
      this.environment.gsap.to(this.flyIn, { distance: 0, duration: duration, delay: delay, ease: "expo.out" });
      this.environment.gsap.to(this.shaderValues.uStrength, { value: 1, duration: duration, delay: delay, ease: "expo.out" });
    };
    const curtainIsUp = this.environment.root.classList.contains("is-revealed");
    if (curtainIsUp) {
      fly();
      return;
    }
    document.addEventListener("introreveal", fly, { once: true });
  }

  // Un click o un tocco nell'hero fa partire un'onda circolare da quel punto.
  listenToClicks() {
    this.hero.addEventListener("pointerdown", (event) => this.startRipple(event), { passive: true });
  }

  startRipple(event) {
    const pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    const pointerY = (event.clientY / window.innerHeight) * 2 - 1;

    this.shaderValues.uRipple.value.x = this.toWorldX(pointerX);
    this.shaderValues.uRipple.value.y = this.toWorldZ(pointerY);
    this.rippleAge = 0;
  }

  // Convertono la posizione del puntatore (da -1 a 1) nelle coordinate della griglia di punti.
  toWorldX(pointerX) {
    return pointerX * ((this.columns * this.gap) / 2.4);
  }

  toWorldZ(pointerY) {
    return pointerY * ((this.rows * this.gap) / 3) + 2;
  }

  listenToMouse() {
    window.addEventListener(
      "pointermove",
      (event) => {
        // Converte la posizione del mouse in un valore tra -1 e 1
        this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = (event.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );
  }

  rememberScroll() {
    this.scrollY = window.scrollY;
  }

  waitForReveal() {
    if (this.isRevealed) {
      return;
    }
    document.addEventListener(
      "introreveal",
      () => {
        this.isRevealed = true;
        this.startLoop();
      },
      { once: true }
    );
  }

  startLoop() {
    cancelAnimationFrame(this.animationFrameId);
    const canRun = this.isVisible && this.isRevealed && !this.environment.reduceMotion;
    if (canRun) {
      this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
    }
  }

  resize() {
    const width = this.hero.clientWidth;
    const height = this.hero.clientHeight;
    // Salvata qui: leggerla a ogni fotogramma costringerebbe il browser a ricalcolare la pagina
    this.heroHeight = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  drawFrame() {
    this.time += 0.012;
    if (this.rippleAge < ParticleWave.RIPPLE_IDLE_AGE) {
      this.rippleAge += ParticleWave.RIPPLE_AGE_STEP;
    }

    // Il punto seguito dal mouse si avvicina piano al mouse vero (movimento morbido)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Quanto abbiamo scrollato l'hero: 0 = in cima, 1 = hero passato
    const scrollProgress = Math.min(this.scrollY / this.heroHeight, 1);

    this.updateShaderValues();
    this.moveCamera(scrollProgress);
    this.renderer.render(this.scene, this.camera);

    const canRun = this.isVisible && this.isRevealed && !this.environment.reduceMotion;
    if (canRun) {
      this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
    }
  }

  // Passa allo shader il tempo, la posizione del mouse nel mondo 3D e l'età dell'onda al click
  updateShaderValues() {
    this.shaderValues.uTime.value = this.time;
    this.shaderValues.uMouse.value.set(this.toWorldX(this.mouse.x), this.toWorldZ(this.mouse.y));
    this.shaderValues.uRipple.value.z = this.rippleAge;
  }

  moveCamera(scrollProgress) {
    // Durante il volo d'ingresso la camera è più in alto e più lontana del normale
    const extraHeight = this.flyIn.distance * ParticleWave.FLY_IN_HEIGHT;
    const extraDepth = this.flyIn.distance * ParticleWave.FLY_IN_DEPTH;

    this.camera.position.set(
      this.mouse.x * 1.4,
      2.6 - this.mouse.y * 0.5 + scrollProgress * 2.2 + extraHeight,
      9 - scrollProgress * 3 + extraDepth
    );
    this.camera.lookAt(0, -0.6 - scrollProgress * 1.5, 0);
  }

  // Quando l'hero esce dallo schermo fermiamo l'animazione per risparmiare batteria.
  pauseWhenHeroIsHidden() {
    if (this.environment.reduceMotion || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      this.startLoop();
    });
    observer.observe(this.hero);
  }
}
