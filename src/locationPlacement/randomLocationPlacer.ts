import { Cell } from "../cell.js";
import { LocationPlacer } from "./base/locationPlacer.js";
export class RandomLocationPlacer extends LocationPlacer {
  private readonly cells: Cell[];

  constructor(cells: Cell[]) {
    super();
    this.cells = cells;
  }

  override pick(): Cell {
    if (this.cells.length === 0) {
      throw new Error("No cells available for selection.");
    }
    const randomIndex = Math.floor(Math.random() * this.cells.length);
    return this.cells[randomIndex]!;
  }

  override updateAfterPlacement(cell: Cell): void {
    const index = this.cells.indexOf(cell);
    if (index !== -1) {
      this.cells.splice(index, 1);
    }
  }
}
