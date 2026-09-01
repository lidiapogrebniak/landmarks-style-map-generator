import { Cell } from "../cell.js";
import { Grid } from "../grid.js";
import { RandomLocationPlacer } from "./randomLocationPlacer.js";
import { IncrementalWeightedLocationPlacer } from "./incrementalWeightedLocationPlacer.js";
import { StaticWeightedLocationPlacer } from "./staticWeightedLocationPlacer.js";
import { WeightCalculationFunction } from "./staticWeightedLocationPlacer.js";
export class LocationPlacerBuilder {
  private readonly grid: Grid;
  private availableCells: Cell[] = [];

  constructor(grid: Grid) {
    this.grid = grid;
  }

  withFilterAllFree(): LocationPlacerBuilder {
    this.availableCells = this.grid.getAvailableCells();
    return this;
  }

  withFilterCellNeighborsFree(cell: Cell): LocationPlacerBuilder {
    this.availableCells = this.grid.getAvailableNeighbors(cell);
    return this;
  }

  withFilterCellArrayNeighborsFree(cells: Cell[]): LocationPlacerBuilder {
    const neighborsSet = new Set<Cell>();
    for (const cell of cells) {
      const neighbors = this.grid.getAvailableNeighbors(cell);
      for (const neighbor of neighbors) {
        neighborsSet.add(neighbor);
      }
    }
    this.availableCells = Array.from(neighborsSet);
    return this;
  }

  random(): RandomLocationPlacer {
    return new RandomLocationPlacer(this.availableCells);
  }

  weightedIncrementalWithUpdateNeighbors(
    weightIncrement: number = 0.2,
  ): IncrementalWeightedLocationPlacer {
    return new IncrementalWeightedLocationPlacer(
      this.availableCells,
      this.grid.getAvailableNeighbors.bind(this.grid),
      (weight) => Math.abs(weight - weightIncrement),
    );
  }

  weightedStatic(
    weightCalculationFunction: WeightCalculationFunction,
  ): StaticWeightedLocationPlacer {
    return new StaticWeightedLocationPlacer(
      this.availableCells,
      weightCalculationFunction,
    );
  }
}
