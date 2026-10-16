// Vite turns this import into a production-safe URL. Keep it as a file so
// even this tiny example demonstrates a separately deployed asset.
// @deno-types="./asset-url.d.ts"
import stoneUrl from "./assets/stone.png?no-inline";
// @deno-types="./asset-url.d.ts"
import ironUrl from "./assets/iron.png?no-inline";
// @deno-types="./asset-url.d.ts"
import diamondUrl from "./assets/diamond.png?no-inline";
// @deno-types="./asset-url.d.ts"
import rubyUrl from "./assets/ruby.png?no-inline";
import mineUrl from "./assets/Stone_dig1.ogg?no-inline";

// all variables & databases

let numTiles: number = 0;
let totalOreThisLife: number = 0;
let souls: number = 0;
let reincarnationCount: number = 0;
let growthRate: number = 0;
let lastTime: number = performance.now();
let currentOreUrl: string = "";

let isMuted: boolean = false;

interface Ore {
  name: string;
  minRate: number;
  url: string;
}

const ores: Ore[] = [
  { name: "stone", minRate: 0, url: stoneUrl },
  { name: "iron", minRate: 5, url: ironUrl },
  { name: "diamond", minRate: 10, url: diamondUrl },
  { name: "ruby", minRate: 15, url: rubyUrl },
];

interface Item {
  name: string;
  baseCost: number;
  rate: number;
  owned: number;
  description: string;
}

const availableItems: Item[] = [
  {
    name: "Apprentice Miner",
    baseCost: 10,
    rate: 1,
    owned: 0,
    description: "A helper with a pickaxe",
  },
  {
    name: "Mine Cart",
    baseCost: 100,
    rate: 5,
    owned: 0,
    description: "Hauls ore out of the mine faster",
  },
  {
    name: "Drill Rig",
    baseCost: 500,
    rate: 25,
    owned: 0,
    description: "Heavy machinery to mine nonstop",
  },
];

interface PickaxeClass {
  name: string;
  upside: string;
  downside: string;
  unlockReincarnations: number;
  clickMult: number;
  idleMult: number;
  rareChance: number;
  critChance: number;
  soulMult: number;
}

const pickaxeClasses: PickaxeClass[] = [
  {
    name: "Rusty Pickaxe",
    upside: "Baseline",
    downside: "None",
    unlockReincarnations: 0,
    clickMult: 1,
    idleMult: 1,
    rareChance: 0,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Copper Pick",
    upside: "+50% click yield",
    downside: "-10% idle production",
    unlockReincarnations: 1,
    clickMult: 1.5,
    idleMult: 0.9,
    rareChance: 0,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Speed Hammer",
    upside: "+100% click rate",
    downside: "-30% yield/click",
    unlockReincarnations: 2,
    clickMult: 1.4,
    idleMult: 1,
    rareChance: 0,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Heavy Maul",
    upside: "+200% yield/click",
    downside: "-50% click rate",
    unlockReincarnations: 3,
    clickMult: 3.0,
    idleMult: 0.8,
    rareChance: 0,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Prospector's Pick",
    upside: "+20% rare ore chance (x10 value)",
    downside: "-15% base yield",
    unlockReincarnations: 5,
    clickMult: 0.85,
    idleMult: 0.85,
    rareChance: 0.2,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Auto-Digger Rig",
    upside: "+100% idle production",
    downside: "-50% click yield",
    unlockReincarnations: 8,
    clickMult: 0.5,
    idleMult: 2.0,
    rareChance: 0,
    critChance: 0,
    soulMult: 1,
  },
  {
    name: "Gambler's Pick",
    upside: "10% crit for x25",
    downside: "-30% yield otherwise",
    unlockReincarnations: 12,
    clickMult: 0.7,
    idleMult: 0.7,
    rareChance: 0,
    critChance: 0.1,
    soulMult: 1,
  },
  {
    name: "Soul-Touched Pick",
    upside: "+50% Souls on reincarnate",
    downside: "-25% mining speed",
    unlockReincarnations: 15,
    clickMult: 0.75,
    idleMult: 0.75,
    rareChance: 0,
    critChance: 0,
    soulMult: 1.5,
  },
  {
    name: "Diamond Pickaxe",
    upside: "+300% to everything",
    downside: "None",
    unlockReincarnations: 25,
    clickMult: 4.0,
    idleMult: 4.0,
    rareChance: 0,
    critChance: 0,
    soulMult: 4.0,
  },
];

let currentClass: PickaxeClass = pickaxeClasses[0];

interface SoulPerk {
  name: string;
  level: number;
  description: string;
}

const soulPerks: SoulPerk[] = [
  {
    name: "Eternal Swing",
    level: 0,
    description: "+20% click yield per level",
  },
  {
    name: "Endless Patience",
    level: 0,
    description: "+20% idle production per level",
  },
  {
    name: "Starting Fortune",
    level: 0,
    description: "Start each life with +50 Ores per level",
  },
  {
    name: "Soul Magnet",
    level: 0,
    description: "+20% Souls earned per level",
  },
  {
    name: "Deep Knowledge",
    level: 0,
    description: "Skip starting ore depth tiers (+25% depth bonus/lvl)",
  },
  {
    name: "Second Chance",
    level: 0,
    description: "Keep 10% of buildings on reset per level",
  },
];

// all UI/UX Code

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap');
  body {
    margin: 0;
    background-color: #000000;
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
  }
  h1, h3 {
    font-family: "Silkscreen";
    font-weight: 400;
    letter-spacing: 0.5px;
  }
  img {
    image-rendering: pixelated;
  }
  button {
    background-color: #000000;
    color: #ffffff;
    border: 1px solid #ffffff;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, transform 0.05s;
  }
  button * {
    pointer-events: none;
  }
  button:hover:not(:disabled) {
    background-color: #000000;
    border-color: #2284fc;
  }
  button:active:not(:disabled) {
    transform: scale(0.98);
  }
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    width: 100%;
    max-width: 1300px;
    padding: 0 20px;
    box-sizing: border-box;
    align-items: start;
  }
  .panel {
    background-color: #000000;
    border: 1px solid #ffffff;
    border-radius: 12px;
    padding: 18px;
    display: flex;
    flex-direction: column;
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-warp: warp;
    gap: 6px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
  }
  .card-sub {
    font-size: 12px;
    color: #ffffff;
  }
  @media (max-width: 950px) {
    .dashboard {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.append(style);

const app = document.querySelector<HTMLElement>("#app")!;
app.style.display = "flex";
app.style.flexDirection = "column";
app.style.alignItems = "center";
app.style.paddingBottom = "40px";

// Title & main displays
const heading = document.createElement("h1");
heading.textContent = "People Yearn For the Mines or Reincarnate?";
heading.style.margin = "20px 0";
heading.style.color = "";

const image = document.createElement("img");
image.src = stoneUrl;
image.alt = "A grey stone ore";
image.width = 96;
image.height = 96;
image.style.cursor = "pointer";
image.style.userSelect = "none";

const counterDisplay = document.createElement("div");
counterDisplay.style.fontSize = "28px";
counterDisplay.style.fontWeight = "bold";
counterDisplay.style.color = "#fbbf24";
counterDisplay.style.margin = "10px 0 4px 0";

const rateDisplay = document.createElement("div");
rateDisplay.style.color = "#ffffff";

const soulDisplay = document.createElement("div");
soulDisplay.style.marginTop = "8px";
soulDisplay.style.fontWeight = "bold";
soulDisplay.style.color = "#5850ff";

const classDisplay = document.createElement("div");
classDisplay.style.marginTop = "8px";
classDisplay.style.color = "#ffffff";
classDisplay.style.textAlign = "center";

// Ore click event
image.addEventListener("click", (event: MouseEvent) => {
  const gained = getClickYield();
  numTiles += gained;
  totalOreThisLife += gained;
  if (!isMuted) {
    const mineSound = new Audio(mineUrl);
    mineSound.play();
  }
  spawnFallingOre(image.src);
  spawnFloatingText(event.clientX, event.clientY, `+${gained.toFixed(1)}`);
  image.animate(
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(0.92) rotate(-6deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    120,
  );
  updateUI();
});

// Mute button
const muteButton = document.createElement("button");
muteButton.textContent = "🔊 Sound: On";
muteButton.setAttribute("aria-pressed", "false");

muteButton.style.position = "fixed";
muteButton.style.top = "10px";
muteButton.style.left = "10px";
muteButton.style.zIndex = "10";

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇 Sound: Off" : "🔊 Sound: On";
  muteButton.setAttribute("aria-pressed", String(isMuted));
});

// Mining Upgrades section
const upgradesHeading = document.createElement("h3");
upgradesHeading.textContent = "Mining Upgrades";
upgradesHeading.style.marginTop = "20px";
upgradesHeading.style.marginBottom = "10px";
upgradesHeading.style.alignSelf = "stretch";

const upgradesContainer = document.createElement("div");
upgradesContainer.style.display = "flex";
upgradesContainer.style.flexDirection = "column";
upgradesContainer.style.gap = "10px";
upgradesContainer.style.alignSelf = "stretch";

for (let i = 0; i < availableItems.length; i++) {
  const item = availableItems[i];
  const button = document.createElement("button");
  button.id = `upgrade-${i}`;
  button.style.textAlign = "left";

  button.addEventListener("click", () => {
    const currentCost = calculateCost(item);
    if (numTiles >= currentCost) {
      numTiles -= currentCost;
      item.owned++;
      growthRate += item.rate;
      renderButtons();
      updateUI();
    }
  });

  upgradesContainer.append(button);
}

// Reincarnate button
const reincarnateButton = document.createElement("button");
reincarnateButton.style.marginTop = "20px";
reincarnateButton.style.borderColor = "#5850ff";
reincarnateButton.style.width = "100%";

reincarnateButton.addEventListener("click", () => {
  if (totalOreThisLife < 1000) return;

  const pendingSouls = calculatePendingSouls();
  souls += pendingSouls;
  reincarnationCount++;

  // Reset current life progress and apply perks
  numTiles = soulPerks[2].level * 50;
  totalOreThisLife = 0;
  growthRate = 0;

  const keepRatio = Math.min(0.9, soulPerks[5].level * 0.1);
  for (let i = 0; i < availableItems.length; i++) {
    availableItems[i].owned = Math.floor(availableItems[i].owned * keepRatio);
    growthRate += availableItems[i].owned * availableItems[i].rate;
  }

  renderButtons();
  updateUI();
});

// Pickaxe Classes section
const classesHeading = document.createElement("h3");
classesHeading.textContent = "Pickaxe Classes";
classesHeading.style.marginTop = "0";
classesHeading.style.marginBottom = "10px";

const classesContainer = document.createElement("div");
classesContainer.style.display = "flex";
classesContainer.style.flexDirection = "column";
classesContainer.style.gap = "6px";

for (let i = 0; i < pickaxeClasses.length; i++) {
  const pickClass = pickaxeClasses[i];
  const button = document.createElement("button");
  button.id = `class-${i}`;
  button.style.textAlign = "left";

  button.addEventListener("click", () => {
    if (reincarnationCount >= pickClass.unlockReincarnations) {
      currentClass = pickClass;
      renderButtons();
      updateUI();
    }
  });

  classesContainer.append(button);
}

// Soul Shop section
const shopHeading = document.createElement("h3");
shopHeading.textContent = "Soul Shop (Permanent Perks)";
shopHeading.style.marginTop = "0";
shopHeading.style.marginBottom = "10px";

const perksContainer = document.createElement("div");
perksContainer.style.display = "flex";
perksContainer.style.flexDirection = "column";
perksContainer.style.gap = "6px";

for (let i = 0; i < soulPerks.length; i++) {
  const perk = soulPerks[i];
  const button = document.createElement("button");
  button.id = `perk-${i}`;
  button.style.textAlign = "left";

  button.addEventListener("click", () => {
    const cost = calculatePerkCost(perk);
    if (souls >= cost) {
      souls -= cost;
      perk.level++;
      renderButtons();
      updateUI();
    }
  });

  perksContainer.append(button);
}

// Column system (leftpanel, centerpanel, rightpanel)
const dashboard = document.createElement("div");
dashboard.className = "dashboard";

const leftPanel = document.createElement("div");
leftPanel.className = "panel";
leftPanel.append(classesHeading, classesContainer);

const centerPanel = document.createElement("div");
centerPanel.className = "panel";
centerPanel.style.alignItems = "center";
centerPanel.append(
  image,
  counterDisplay,
  rateDisplay,
  soulDisplay,
  classDisplay,
  reincarnateButton,
  upgradesHeading,
  upgradesContainer,
);

const rightPanel = document.createElement("div");
rightPanel.className = "panel";
rightPanel.append(shopHeading, perksContainer);

dashboard.append(leftPanel, centerPanel, rightPanel);
app.append(heading, muteButton, dashboard);

// all the functions and game loop logic

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

function calculateCost(item: Item): number {
  return item.baseCost * Math.pow(1.15, item.owned);
}

function calculatePerkCost(perk: SoulPerk): number {
  return Math.round(5 * Math.pow(1.4, perk.level));
}

function calculatePendingSouls(): number {
  const baseSouls = Math.floor(Math.sqrt(totalOreThisLife / 1000));
  const soulMagnetMult = 1 + soulPerks[3].level * 0.2;
  return Math.floor(baseSouls * currentClass.soulMult * soulMagnetMult);
}

function getClickYield(): number {
  const eternalSwingMult = 1 + soulPerks[0].level * 0.2;
  const depthMult = 1 + soulPerks[4].level * 0.25;
  let amount = 1 * currentClass.clickMult * eternalSwingMult * depthMult;

  if (Math.random() < currentClass.rareChance) {
    amount *= 10;
  }
  if (Math.random() < currentClass.critChance) {
    amount *= 25;
  }
  return amount;
}

function getEffectiveIdleRate(): number {
  const endlessPatienceMult = 1 + soulPerks[1].level * 0.2;
  const depthMult = 1 + soulPerks[4].level * 0.25;
  return growthRate * currentClass.idleMult * endlessPatienceMult * depthMult;
}

function spawnFloatingText(x: number, y: number, text: string) {
  const floatEl = document.createElement("div");
  floatEl.textContent = text;
  floatEl.style.position = "fixed";
  floatEl.style.left = `${x}px`;
  floatEl.style.top = `${y}px`;
  floatEl.style.color = "#ff5500";
  floatEl.style.fontWeight = "bold";
  floatEl.style.fontSize = "18px";
  floatEl.style.pointerEvents = "none";
  floatEl.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
  document.body.append(floatEl);

  floatEl.animate(
    [
      { transform: "translateY(0px)", opacity: 1 },
      { transform: "translateY(-45px)", opacity: 0 },
    ],
    700,
  ).onfinish = () => {
    floatEl.remove();
  };
}

function spawnFallingOre(url: string) {
  const ore = document.createElement("img");
  ore.src = url;
  ore.width = 48;
  ore.style.position = "fixed";
  ore.style.top = "-50px";
  ore.style.left = `${Math.random() * 90}vw`;
  ore.style.pointerEvents = "none";
  document.body.append(ore);

  ore.animate(
    [{ transform: "translateY(0vh)" }, { transform: "translateY(110vh)" }],
    2500,
  ).onfinish = () => {
    ore.remove();
  };
}

// Updates button HTML only when purchases or class changes happen
function renderButtons() {
  classDisplay.innerHTML =
    `Equipped: <strong>${currentClass.name}</strong><br><span style="color:#4ade80; font-size:12px;">▲ ${currentClass.upside}</span> • <span style="color:#f87171; font-size:12px;">▼ ${currentClass.downside}</span>`;

  for (let i = 0; i < availableItems.length; i++) {
    const item = availableItems[i];
    const currentCost = calculateCost(item);
    const button = document.getElementById(`upgrade-${i}`) as HTMLButtonElement;

    if (button) {
      button.innerHTML = `
        <div class="card-top">
          <span>${item.name}</span>
          <span style="color:#fbbf24;">Owned: ${item.owned}</span>
        </div>
        <div class="card-sub">
          Cost: <strong style="color:#fbbf24;">${
        currentCost.toFixed(
          1,
        )
      } Ores</strong>   <span style="color:#4ade80;">+${item.rate}/sec</span><br>
          ${item.description}
        </div>
      `;
    }
  }

  for (let i = 0; i < pickaxeClasses.length; i++) {
    const pickClass = pickaxeClasses[i];
    const button = document.getElementById(`class-${i}`) as HTMLButtonElement;
    const isEquipped = currentClass.name === pickClass.name;

    // added ^ or v for pros and con
    if (button) {
      button.style.borderColor = isEquipped ? "#ff5500" : "#4d4d4d";
      button.innerHTML = `
        <div class="card-top">
          <span>${pickClass.name}${isEquipped ? " (Equipped)" : ""}</span>
          <span style="color:#9ca3af; font-weight:normal; font-size:12px;">Req: ${pickClass.unlockReincarnations} Reincarnations</span>
        </div>
        <div class="card-sub">
          <span style="color:#4ade80;">▲ ${pickClass.upside}</span> | <span style="color:#f87171;">▼ ${pickClass.downside}</span>
        </div>
      `;
    }
  }

  for (let i = 0; i < soulPerks.length; i++) {
    const perk = soulPerks[i];
    const cost = calculatePerkCost(perk);
    const button = document.getElementById(`perk-${i}`) as HTMLButtonElement;

    // added Souls and level as colored words
    if (button) {
      button.innerHTML = `
        <div class="card-top">
          <span>${perk.name}</span>
          <span style="color:#5850ff;">Lvl ${perk.level}</span>
        </div>
        <div class="card-sub">
          Cost: <strong style="color:#5850ff;">${cost} Souls</strong><br>
          ${perk.description}
        </div>
      `;
    }
  }
}

function updateUI() {
  document.title = `${formatNumber(numTiles)} Ores - Mines`;
  counterDisplay.textContent = `${formatNumber(numTiles)} Ores`;
  rateDisplay.textContent = `${getEffectiveIdleRate().toFixed(1)} Ores/sec`;
  soulDisplay.textContent = `Souls: ${
    formatNumber(
      souls,
    )
  } | Reincarnations: ${reincarnationCount}`;

  const pendingSouls = calculatePendingSouls();
  reincarnateButton.textContent =
    `Reincarnate (+${pendingSouls} Souls) — Mined: ${
      formatNumber(
        totalOreThisLife,
      )
    } / 1.0K`;
  reincarnateButton.disabled = totalOreThisLife < 1000;

  // Update ore image only when tier changes
  const bonusRate = soulPerks[4].level * 5;
  const ore = ores.findLast(
    (ore) =>
      growthRate + bonusRate >= ore.minRate || numTiles >= ore.minRate * 5,
  )!;
  if (currentOreUrl !== ore.url) {
    currentOreUrl = ore.url;
    image.src = ore.url;
    image.alt = `A ${ore.name} ore`;
  }

  // Update button without rebuilding HTML
  for (let i = 0; i < availableItems.length; i++) {
    const item = availableItems[i];
    const button = document.getElementById(`upgrade-${i}`) as HTMLButtonElement;
    if (button) {
      button.disabled = numTiles < calculateCost(item);
    }
  }

  for (let i = 0; i < pickaxeClasses.length; i++) {
    const pickClass = pickaxeClasses[i];
    const button = document.getElementById(`class-${i}`) as HTMLButtonElement;
    const unlocked = reincarnationCount >= pickClass.unlockReincarnations;
    const isEquipped = currentClass.name === pickClass.name;
    if (button) {
      button.disabled = !unlocked || isEquipped;
    }
  }

  for (let i = 0; i < soulPerks.length; i++) {
    const perk = soulPerks[i];
    const button = document.getElementById(`perk-${i}`) as HTMLButtonElement;
    if (button) {
      button.disabled = souls < calculatePerkCost(perk);
    }
  }
}

function gameLoop(timestamp: number) {
  const deltaSeconds = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const effectiveRate = getEffectiveIdleRate();
  if (effectiveRate > 0) {
    const gained = effectiveRate * deltaSeconds;
    numTiles += gained;
    totalOreThisLife += gained;
    updateUI();
  }

  requestAnimationFrame(gameLoop);
}

// Initialize and start loop
renderButtons();
updateUI();
requestAnimationFrame(gameLoop);
