import { Cell } from "../cell";
import { LocationTypeWithImage } from "../location/locationImages";
import { LocationType } from "../location/locationType.js";

export class SvgRenderer {
  private readonly W: number;
  private readonly H: number;
  private readonly VERT: number;

  private readonly svg: SVGSVGElement;
  private readonly hexRadiusInPixel: number;
  private readonly locationImages: Record<LocationTypeWithImage, string>;

  constructor(
    svg: SVGSVGElement,
    hexRadiusInPixel: number,
    locationImages: Record<LocationTypeWithImage, string>,
  ) {
    this.svg = svg;
    this.hexRadiusInPixel = hexRadiusInPixel;
    this.locationImages = locationImages;
    this.W = Math.sqrt(3) * this.hexRadiusInPixel;
    this.H = 2 * this.hexRadiusInPixel;
    this.VERT = (3 / 4) * this.H;
  }
  // --- geometry helpers (pointy-top axial) ---

  axialToPixel(q: number, r: number) {
    const x = (3 / 2) * q * this.hexRadiusInPixel + 300; // center near middle
    const y = this.W * ((1 / 2) * q + r) + 300;
    return { x, y };
  }

  hexPath(cx: number, cy: number): string {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const x = cx + this.hexRadiusInPixel * Math.sin(angle);
      const y = cy + this.hexRadiusInPixel * Math.cos(angle);
      pts.push([x, y]);
    }
    return "M" + pts.map((p) => p.join(",")).join(" L ") + " Z";
  }

  createSVGElement(type: string, attributes = {}) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      type,
    );
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, "" + value);
    });

    return element;
  }

  // --- draw ---
  renderGrid(cells: Cell[]) {
    this.svg.style.display = "block";
    this.svg.innerHTML = "";
    let words = "";

    for (const c of cells) {
      const { x, y } = this.axialToPixel(c.q, c.r);
      const g = this.createSVGElement("g", { filter: "url(#soft)" });

      const poly = this.createSVGElement("path", {
        d: this.hexPath(x, y),
        class: "hex",
      });

      let textContent = `${c.getLocation()}`;
      if (!c.isLocationEmpty && c.getLocation()!.isWord) {
        poly.classList.add("word-hex");
        const word = c.getLocation()!.word;
        textContent = word!;
        if (words) {
          words += " - " + word;
        } else {
          words = word!;
        }

        const wordText = this.createSVGElement("text", {
          x: x,
          y: y + 5,
          "text-anchor": "middle",
          class: "word-label",
          "font-size": "26px",
        });

        wordText.appendChild(document.createTextNode(word!.substring(0, 3)));
        g.appendChild(wordText);
      }
      g.appendChild(poly);

      // tooltip title
      const title = this.createSVGElement("title", {
        textContent: textContent,
      });
      title.appendChild(document.createTextNode(textContent));

      g.appendChild(title);

      if (!c.isLocationEmpty && c.locationType !== LocationType.WORD) {
        const location = this.createSVGElement("image", {
          width: this.H,
          height: this.W,
          x: x - this.H / 2,
          y: y - this.W / 2,
        });

        location.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          this.locationImages[c.locationType!],
        );

        g.appendChild(location);
      }
      this.svg.appendChild(g);
    }

    const textElement = this.createSVGElement("text", {
      x: 10,
      y: 610,
      class: "words-label",
    });

    textElement.appendChild(
      document.createTextNode(`Стартовые слова: ${words}`),
    );

    this.svg.appendChild(textElement);
  }
}
