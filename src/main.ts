// Vite turns this import into a production-safe URL. Keep it as a file so
// even this tiny example demonstrates a separately deployed asset.
// @deno-types="./asset-url.d.ts"
import tileUrl from "./assets/tile.svg?no-inline";

let counter: number = 0;

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D1 project";

const image = document.createElement("img");
image.src = tileUrl;
image.alt = "A teal tile with a cream circle";
image.width = 96;
image.height = 96;

const message = document.createElement("p");
message.textContent = " - start with a button and increment it";

app.innerHTML = `
  <button id="button" style="padding: 10px; font-size: 1.2rem;">BUTTON</button>
`;

const button = document.getElementById("button")!;
button.addEventListener("click", () => {
});

app.append(heading, image, message);
