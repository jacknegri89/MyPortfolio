/*
 * Onda di particelle 3D nello sfondo dell'hero (libreria Three.js).
 * Le particelle sono una griglia di punti che ondeggia nel tempo
 * e si solleva vicino al mouse. Con lo scroll la camera si allontana.
 *
 * Prestazioni: l'altezza di ogni punto viene calcolata dalla scheda grafica (GPU)
 * dentro un piccolo programma chiamato "vertex shader". Così il processore non deve
 * ricalcolare migliaia di punti a ogni fotogramma: aggiorna solo due numeri (tempo e mouse).
 */
class ParticleWave {
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
    };

    this.time = 0;
    this.isVisible = true;
    this.animationFrameId = 0;
  }

  start() {
    if (!window.THREE || !this.canvas) {
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    } catch (error) {
      // Il browser non supporta WebGL: niente onda, il resto del sito funziona lo stesso.
      return;
    }

    this.hero = this.canvas.parentElement;

    // Oltre 1.5 (telefono) o 2 (computer) la differenza non si vede, ma il lavoro della GPU cresce molto
    let maxPixelRatio = 2;
    if (this.isSmallScreen) {
      maxPixelRatio = 1.5;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));

    this.shaderValues.uMouse.value = new THREE.Vector2(0, 0);

    this.createScene();
    this.createPoints();
    this.listenToMouse();

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.drawFrame();
    this.pauseWhenHeroIsHidden();
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

    const waveCode = [
      "vec3 transformed = vec3(position);",
      "float wave = sin(position.x * 0.55 + uTime) * 0.32 + cos(position.z * 0.7 + uTime * 1.3) * 0.26;",
      "float distanceX = position.x - uMouse.x;",
      "float distanceZ = position.z - uMouse.y;",
      "float bumpNearMouse = exp(-(distanceX * distanceX + distanceZ * distanceZ) * 0.18) * 0.9;",
      "transformed.y = wave + bumpNearMouse;",
    ].join("\n");

    shader.vertexShader =
      "uniform float uTime;\nuniform vec2 uMouse;\n" + shader.vertexShader.replace("#include <begin_vertex>", waveCode);
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

  resize() {
    const width = this.hero.clientWidth;
    const height = this.hero.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  drawFrame() {
    this.time += 0.012;

    // Il punto seguito dal mouse si avvicina piano al mouse vero (movimento morbido)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Quanto abbiamo scrollato l'hero: 0 = in cima, 1 = hero passato
    const scrollProgress = Math.min(window.scrollY / this.hero.clientHeight, 1);

    this.updateShaderValues();
    this.moveCamera(scrollProgress);
    this.renderer.render(this.scene, this.camera);

    if (this.isVisible && !this.environment.reduceMotion) {
      this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
    }
  }

  // Passa allo shader il tempo e la posizione del mouse nel mondo 3D
  updateShaderValues() {
    const mouseWorldX = this.mouse.x * ((this.columns * this.gap) / 2.4);
    const mouseWorldZ = this.mouse.y * ((this.rows * this.gap) / 3) + 2;

    this.shaderValues.uTime.value = this.time;
    this.shaderValues.uMouse.value.set(mouseWorldX, mouseWorldZ);
  }

  moveCamera(scrollProgress) {
    this.camera.position.set(
      this.mouse.x * 1.4,
      2.6 - this.mouse.y * 0.5 + scrollProgress * 2.2,
      9 - scrollProgress * 3
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
      cancelAnimationFrame(this.animationFrameId);
      if (this.isVisible) {
        this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
      }
    });
    observer.observe(this.hero);
  }
}
