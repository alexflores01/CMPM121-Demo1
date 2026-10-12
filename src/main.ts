// Vite turns this import into a production-safe URL. Keep it as a file so
// even this tiny example demonstrates a separately deployed asset.
// @deno-types="./asset-url.d.ts"

let counter: number = 0;

const style = document.createElement("style");
style.textContent = `
  body { margin: 0; font-family: system-ui, sans-serif; background-color: #2f3334; color: #1ec2d4; }

  /* using CSS grid */
  #app {
    display: grid;
    min-height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    gap: 20px;

    /* mobile mode */
    grid-template-areas:
      "top-left"
      "top-right"
      "center"
      "bottom-left"
      "bottom-right";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;

    /* desktop mode */
    @media (min-width: 800px) {
      #app {
        grid-template-areas:
          "top-left center top right"
          "bottom-left center bottom-right";
        grid-template-columns: 320px 1fr 320px;
        grid-template-rows: 1fr 1fr;
      }
    }
    
    .zone {display: flex; flex-direction; column; gap: 15px; }

    #top-left-zone { grid-area: top-left; }
    #top-right-zone { grid-area: top-right; align-items: flex-end; }
    #center-zone {grid-area: center; align-items: center; justify-content: center; text-align: center; }
    #bottom-left-zone { grid-area: bottom-left; justify-content: flex-end; }
    #bottom-right-zone { grid-area: bottom-right; align-items: flex-end; justify-content: flex-end; }

    .action-button {
      padding: 40px 80px; font-size: 1.2rem; cursor: pointer; border-radius: 8px; border: none;
      background: #007acc; color: white; transition: transform 0.1s, opacity 0.2s;
    }
    .action-button:active { transform: scale(0.95); }
    .action-button:diabled { opacity: 0.5; cursor: not-allowed; }
  }
`;
document.head.appendChild(style);

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div id="top-left-zone" class="zone"></div>
  <div id="top-right-zone" class="zone"></div>
  <div id="center-zone" class="zone">
    <h1 style="margin:0; font-size: 3.5rem;">Startup</h1>
    <div id="counter" style="font-size: 2.5rem; font-weight: bold; color: #220afd;">0 number</div>
    <div id="rate" style="font-size: 1.2rem; color: #880909;">0 num / sec</div>
  </div>
  <div id="bottom-left-zone" class="zone"></div>
  <div id="bottom-right-zone" class="zone"></div>
`;

// element consts
const counterDisplay = document.getElementById("counter")!;

function createButton(
  zoneId: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const container = document.getElementById(zoneId);
  if (!container) throw new Error("Zone ${zoneId} not found");

  const button = document.createElement("button");
  button.className = "action-button";
  button.innerText = text;
  button.addEventListener("click", onClick);

  container.appendChild(button);
  return button;
}

// buttons
createButton("bottom-left-zone", "ADD", () => {
  counter++;
  updateDisplay();
});

function updateDisplay() {
  counterDisplay.innerText = `${Math.floor(counter)} number`;
}
