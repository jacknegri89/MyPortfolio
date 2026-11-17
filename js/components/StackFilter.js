/*
 * Filtro della sezione Strumenti: scegli un progetto e si evidenziano gli strumenti usati lì.
 *
 * In index.html ogni strumento dichiara dove è stato usato:
 *   <li data-used="renova sito">JavaScript</li>
 * e ogni pulsante dichiara quale progetto rappresenta:
 *   <button data-stack-filter="renova">Renova</button>   ("all" = tutti)
 * Per aggiungere uno strumento o un progetto basta quindi toccare l'HTML.
 * Al contrario, passando con il mouse sopra uno strumento si legge in quali progetti è stato usato.
 * I colori dei due stati sono in css/skills.css (.is-filtered, .is-used).
 */
class StackFilter {
  static ALL = "all";

  constructor(environment) {
    this.environment = environment;
    this.filter = document.getElementById("stack-filter");
    this.stack = document.getElementById("stack");
    this.count = document.getElementById("stack-count");
  }

  start() {
    if (this.filter === null || this.stack === null) {
      return;
    }
    this.buttons = this.filter.querySelectorAll("button");
    this.tools = this.stack.querySelectorAll(".stack-tools li");

    // Nell'HTML il filtro parte nascosto: senza JavaScript i pulsanti non farebbero nulla
    this.filter.hidden = false;

    for (const button of this.buttons) {
      button.addEventListener("click", () => this.select(button));
    }
    for (const tool of this.tools) {
      tool.addEventListener("mouseenter", () => this.showWhereUsed(tool));
      tool.addEventListener("mouseleave", () => this.restoreCount());
    }
    this.showCount("", this.tools.length);
  }

  select(chosenButton) {
    const project = chosenButton.dataset.stackFilter;

    for (const button of this.buttons) {
      const isChosen = button === chosenButton;
      button.setAttribute("aria-pressed", String(isChosen));
    }

    const usedTools = this.markUsedTools(project);

    // Avvisa chi ascolta (la costellazione in StackConstellation) del progetto scelto
    const changeEvent = new CustomEvent("stackfilterchange", { detail: { project: project } });
    this.filter.dispatchEvent(changeEvent);

    if (project === StackFilter.ALL) {
      this.stack.classList.remove("is-filtered");
      this.showCount("", this.tools.length);
      return;
    }

    this.stack.classList.add("is-filtered");
    this.showCount(chosenButton.textContent, usedTools.length);
    this.popTools(usedTools);
  }

  // Mette la classe .is-used sugli strumenti del progetto e restituisce l'elenco di quelli trovati.
  markUsedTools(project) {
    const usedTools = [];
    for (const tool of this.tools) {
      const projects = tool.dataset.used.split(" ");
      const isUsed = projects.includes(project);
      tool.classList.toggle("is-used", isUsed);
      if (isUsed) {
        usedTools.push(tool);
      }
    }
    return usedTools;
  }

  // Scrive "LogLens: 14 strumenti" (oppure "37 strumenti" quando non c'è un progetto scelto).
  showCount(projectName, howMany) {
    let word = "strumenti";
    if (howMany === 1) {
      word = "strumento";
    }

    let text = howMany + " " + word;
    if (projectName !== "") {
      text = projectName + ": " + text;
    }
    this.count.textContent = text;
    this.currentCountText = text; // serve a restoreCount(), dopo il passaggio del mouse su uno strumento
  }

  // Es. "Playwright: usato in JobScraper, LogLens". I nomi sono quelli scritti sui pulsanti del filtro.
  showWhereUsed(tool) {
    const projectNames = [];
    for (const button of this.buttons) {
      const project = button.dataset.stackFilter;
      const isUsedThere = tool.dataset.used.split(" ").includes(project);
      if (isUsedThere) {
        projectNames.push(button.textContent);
      }
    }
    if (projectNames.length === 0) {
      return;
    }
    this.count.textContent = tool.textContent + ": usato in " + projectNames.join(", ");
  }

  restoreCount() {
    this.count.textContent = this.currentCountText;
  }

  // Gli strumenti evidenziati fanno un piccolo salto uno dopo l'altro: l'occhio li trova subito.
  popTools(usedTools) {
    if (!this.environment.canAnimateWithGsap()) {
      return;
    }
    this.environment.gsap.fromTo(
      usedTools,
      { y: 10 },
      { y: 0, duration: 0.6, ease: "expo.out", stagger: 0.025, overwrite: "auto", clearProps: "transform" }
    );
  }
}
