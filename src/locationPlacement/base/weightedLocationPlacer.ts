import { Cell } from "../../cell.js";
import { LocationPlacer } from "./locationPlacer.js";
export class WeightedLocationPlacer extends LocationPlacer {
  protected weights: Map<Cell, number>;

  constructor(cells: Cell[], initialWeight: number = 1) {
    super();
    this.weights = new Map<Cell, number>();
    for (const cell of cells) {
      this.weights.set(cell, initialWeight);
    }
  }

  override pick(): Cell {
    const totalWeight = Array.from(this.weights.values()).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    if (totalWeight === 0) {
      throw new Error("No cells available for selection.");
    }

    let randomValue = Math.random() * totalWeight;
    for (const [cell, weight] of this.weights.entries()) {
      randomValue -= weight;
      if (randomValue <= 0) {
        return cell;
      }
    }

    throw new Error("Failed to pick a cell. This should not happen.");
  }

  override updateAfterPlacement(cell: Cell): void {
    this.weights.delete(cell);
  }
}
