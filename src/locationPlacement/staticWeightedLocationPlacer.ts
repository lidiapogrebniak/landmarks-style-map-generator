import { WeightedLocationPlacer } from "./base/weightedLocationPlacer.js";
import { Cell } from "../cell.js";
export type WeightCalculationFunction = (cell: Cell) => number;
export class StaticWeightedLocationPlacer extends WeightedLocationPlacer {
  constructor(
    cells: Cell[],
    weightCalculationFunction: WeightCalculationFunction,
    initialWeight: number = 1,
  ) {
    super(cells, initialWeight);
    this.reinitializeWeights(weightCalculationFunction);
  }

  reinitializeWeights(
    weightCalculationFunction: WeightCalculationFunction,
  ): void {
    for (const cell of this.weights.keys()) {
      const newWeight = weightCalculationFunction(cell);
      this.weights.set(cell, newWeight);
    }
  }
}
