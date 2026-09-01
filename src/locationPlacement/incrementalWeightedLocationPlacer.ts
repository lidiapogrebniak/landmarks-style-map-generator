import { Cell } from "../cell.js";
import { WeightedLocationPlacer } from "./base/weightedLocationPlacer.js";
export type RelatedCellsFunction = (cell: Cell) => Cell[];
export type UpdateWeightFunction = (weight: number) => number;
export class IncrementalWeightedLocationPlacer extends WeightedLocationPlacer {
  private getUpdatedCells: (cell: Cell) => Cell[];
  private updateWeights: (weight: number) => number;

  constructor(
    cells: Cell[],
    getUpdatedCells: RelatedCellsFunction,
    updateWeights: UpdateWeightFunction,
    initialWeight: number = 1,
  ) {
    super(cells, initialWeight);
    this.getUpdatedCells = getUpdatedCells;
    this.updateWeights = updateWeights;
  }

  override updateAfterPlacement(cell: Cell): void {
    this.weights.delete(cell);
    const relatedCells = this.getUpdatedCells(cell);
    for (const relatedCell of relatedCells) {
      if (this.weights.has(relatedCell)) {
        const currentWeight = this.weights.get(relatedCell)!;
        const newWeight = this.updateWeights(currentWeight);
        this.weights.set(relatedCell, newWeight);
      }
    }
  }
}
