const BUTTON_LOCK_MS = 1200;

const SCREEN_IDS = [
  "mainMenu",
  "levelSelect",
  "storyScreen",
  "pauseScreen",
  "gameOverScreen",
  "upgradeScreen",
  "settingsScreen",
];

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

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.repeat && e.target instanceof HTMLButtonElement) e.preventDefault();
      },
      true,
    );
    this.unlockTimer = null;

    $("btnStart").onclick = () => handlers.onStart();
    this.btnContinue.onclick = () => handlers.onContinue();
    this.btnLevels.onclick = () => handlers.onOpenLevelSelect();
    $("btnLevelsBack").onclick = () => handlers.onMenu();
    $("btnResume").onclick = () => handlers.onResume();
    $("btnPauseMenu").onclick = () => handlers.onMenu();
    $("btnRetry").onclick = () => handlers.onRetry();
    $("btnGameOverMenu").onclick = () => handlers.onMenu();
    $("btnSettings").onclick = () => handlers.onOpenSettings("menu");
    $("btnPauseSettings").onclick = () => handlers.onOpenSettings("pause");
  }

  hideAll() {
    SCREEN_IDS.forEach((id) => this.screens[id].classList.add("hidden"));
    if (document.activeElement && document.activeElement.blur)
      document.activeElement.blur();
  }

  show(id, focusId, lockMs = 0) {
    const screen = this.screens[id];
    screen.classList.remove("hidden");
    const focusEl = focusId && document.getElementById(focusId);
    const buttons = [...screen.querySelectorAll("button")];
    clearTimeout(this.unlockTimer);
    if (lockMs > 0) {
      buttons.forEach((b) => (b.disabled = true));
      this.unlockTimer = setTimeout(() => {
        buttons.forEach((b) => (b.disabled = false));
        if (focusEl && focusEl.focus) focusEl.focus();
      }, lockMs);
      return;
    }
    buttons.forEach((b) => (b.disabled = false));
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
    this.show("storyScreen", "storyBtn", BUTTON_LOCK_MS);
  }

  showPause(visible) {
    if (visible) {
      this.screens.settingsScreen.classList.add("hidden");
      this.show("pauseScreen", "btnResume");
    } else {
      this.screens.pauseScreen.classList.add("hidden");
      this.screens.settingsScreen.classList.add("hidden");
    }
  }

  showSettings(values, onChange, onBack) {
    this.hideAll();
    const STEPS = 10;
    const render = () => {
      for (const key of ["music", "sfx"]) {
        const bar = document.getElementById(`bar-${key}`);
        const level = Math.round(values[key] * STEPS);
        bar.replaceChildren(...Array.from({ length: STEPS }, (_, i) => {
          const seg = document.createElement("span");
          seg.className = i < level ? "on" : "";
          return seg;
        }));
      }
    };
    document.querySelectorAll("#settingsScreen .step").forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.key;
        const level = Math.round(values[key] * STEPS) + Number(button.dataset.step);
        onChange(key, Math.min(Math.max(level, 0), STEPS) / STEPS);
        render();
      };
    });
    document.getElementById("btnSettingsBack").onclick = () => onBack();
    render();
    this.show("settingsScreen", "btnSettingsBack");
  }

  showUpgrade(choices, onPick) {
    this.hideAll();
    const list = document.getElementById("upgradeList");
    list.innerHTML = "";
    choices.forEach((choice, i) => {
      const button = document.createElement("button");
      button.className = "upgrade";
      button.id = `upgrade${i}`;
      const name = document.createElement("strong");
      name.textContent = choice.name;
      const text = document.createElement("span");
      text.textContent = choice.text;
      const cost = document.createElement("em");
      cost.textContent = choice.cost;
      button.append(name, text, cost);
      button.onclick = () => {
        this.hideAll();
        onPick(choice.key);
      };
      list.appendChild(button);
    });
    this.show("upgradeScreen", "upgrade0", BUTTON_LOCK_MS);
  }

  showGameOver(score = null) {
    this.hideAll();
    const el = document.getElementById("gameOverScore");
    if (el) el.textContent = score === null ? "" : `Score: ${score}`;
    this.show("gameOverScreen", "btnRetry", BUTTON_LOCK_MS);
  }
}
