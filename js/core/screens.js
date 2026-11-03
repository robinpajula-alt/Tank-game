const SCREEN_IDS = [
  "mainMenu",
  "levelSelect",
  "storyScreen",
  "pauseScreen",
  "gameOverScreen",
];

/** Kõik menüüd ja kaardid (DOM). Ei tea midagi mängureeglitest: kutsub ainult Game'i antud käsitlejaid. */
export class Screens {
  constructor(handlers) {
    this.handlers = handlers;
    this.screens = {};
    SCREEN_IDS.forEach((id) => {
      this.screens[id] = document.getElementById(id);
    });

    const $ = (id) => document.getElementById(id);
    this.btnContinue = $("btnContinue");
    this.btnLevels = $("btnLevels");
    this.levelList = $("levelList");
    this.storyTitle = $("storyTitle");
    this.storyText = $("storyText");
    this.storyBtn = $("storyBtn");

    $("btnStart").onclick = () => handlers.onStart();
    this.btnContinue.onclick = () => handlers.onContinue();
    this.btnLevels.onclick = () => handlers.onOpenLevelSelect();
    $("btnLevelsBack").onclick = () => handlers.onMenu();
    $("btnResume").onclick = () => handlers.onResume();
    $("btnPauseMenu").onclick = () => handlers.onMenu();
    $("btnRetry").onclick = () => handlers.onRetry();
    $("btnGameOverMenu").onclick = () => handlers.onMenu();
  }

  hideAll() {
    SCREEN_IDS.forEach((id) => this.screens[id].classList.add("hidden"));
    if (document.activeElement && document.activeElement.blur)
      document.activeElement.blur();
  }

  show(id, focusId) {
    this.screens[id].classList.remove("hidden");
    const focusEl = focusId && document.getElementById(focusId);
    if (focusEl && focusEl.focus) focusEl.focus();
  }

  showMainMenu({ continueLabel, canContinue, completed }) {
    this.hideAll();
    this.btnContinue.classList.toggle("hidden", !canContinue);
    this.btnContinue.textContent = continueLabel;
    this.btnLevels.classList.toggle("hidden", !completed);
    this.show("mainMenu", canContinue ? "btnContinue" : "btnStart");
  }

  showLevelSelect(levelNames) {
    this.hideAll();
    this.levelList.innerHTML = "";
    levelNames.forEach((name, index) => {
      const button = document.createElement("button");
      button.textContent = `${index + 1}. ${name}`;
      button.onclick = () => this.handlers.onPickLevel(index);
      this.levelList.appendChild(button);
    });
    this.show("levelSelect");
  }

  showStory({ title, text, button }, onDone) {
    this.hideAll();
    this.storyTitle.textContent = title;
    this.storyText.textContent = text;
    this.storyBtn.textContent = button;
    this.storyBtn.onclick = () => {
      this.hideAll();
      onDone();
    };
    this.show("storyScreen", "storyBtn");
  }

  showPause(visible) {
    if (visible) this.show("pauseScreen", "btnResume");
    else this.screens.pauseScreen.classList.add("hidden");
  }

  showGameOver() {
    this.hideAll();
    this.show("gameOverScreen", "btnRetry");
  }
}
