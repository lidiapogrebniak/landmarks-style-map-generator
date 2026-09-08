import { BoardGenerator } from "./boardGenerator.js";
import { SvgRenderer } from "./render/svgRenderer.js";
import { GAME_CONFIG } from "./gameConfig.js";
import {
  BasicLocationCount,
  AdvancedLocationCount,
} from "./locationCountConfig.js";
import { LOCATION_IMAGES } from "./location/locationImages.js";

// Elements

const complexityInput = document.querySelector(
  'input[name="complexity"]:checked',
);

const words: string[] = await loadWords();
const mapContainer: HTMLElement = document.getElementById("hexGrid")!;
const generateBtn: HTMLElement = document.getElementById("generateBtn")!;

const noneGeneratedText: HTMLElement =
  document.getElementById("noneGeneratedText")!;
const svg: SVGSVGElement = document.getElementById(
  "hexmap",
) as unknown as SVGSVGElement;

async function loadWords() {
  return fetch(GAME_CONFIG.WORDS_FILE_PATH)
    .then((response) => response.json())
    .then((data) => {
      if (!data.words || !Array.isArray(data.words)) {
        throw new Error("Invalid words data format");
      }
      return data.words;
    })
    .catch((error) => {
      console.error("Error loading words:", error);
      return [];
    });
}

function generateMap(words: string[]) {
  const complexityValue = (
    document.querySelector(
      'input[name="complexity"]:checked',
    ) as HTMLInputElement
  )?.value;
  const complexity =
    complexityValue === "advanced"
      ? new AdvancedLocationCount()
      : new BasicLocationCount();
  const boardGenerator = new BoardGenerator(GAME_CONFIG, complexity, words);
  const cells = boardGenerator.generateBoard();
  const svgRenderer = new SvgRenderer(
    svg,
    GAME_CONFIG.HEX_RADIUS_IN_PIXEL,
    LOCATION_IMAGES,
  );

  noneGeneratedText.style.display = "none";

  try {
    svgRenderer.renderGrid(cells);
  } catch (error) {
    console.error("Error rendering grid:", error);
  }
}

// --- Buttons ---
generateBtn.addEventListener("click", () => {
  generateMap(words);
});
