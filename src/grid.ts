import { Cell } from "./cell.js";
import { HexCoordinates } from "./cell.js";

export class Grid {
  private readonly gameConfig: { GRID_RADIUS_IN_HEX: number };
  private cellsMap: Map<string, Cell> = new Map();

  constructor(gameConfig: { GRID_RADIUS_IN_HEX: number }) {
    this.gameConfig = gameConfig;
    this.generateEmptyCellsMap();
  }

  get(coordinates: HexCoordinates): Cell | undefined {
    return this.cellsMap.get(this.toCoordinateKey(coordinates));
  }

  set(coordinates: HexCoordinates, cell: Cell): void {
    this.cellsMap.set(this.toCoordinateKey(coordinates), cell);
  }

  private toCoordinateKey(coordinates: HexCoordinates): string {
    return `q=${coordinates.q}r=${coordinates.r}`;
  }

  generateEmptyCellsMap(): Map<string, Cell> {
    const R = this.gameConfig.GRID_RADIUS_IN_HEX;
    let id = 0;

    for (let q = -R; q <= R; q++) {
      const r1 = Math.max(-R, -q - R);
      const r2 = Math.min(R, -q + R);
      for (let r = r1; r <= r2; r++) {
        const cell: Cell = new Cell(q, r);
        this.cellsMap.set(this.toCoordinateKey(cell), cell);
        id++;
      }
    }

    return this.cellsMap;
  }

  cleanCellsLocations(): void {
    this.cellsMap.forEach((cell) => cell.cleanLocation());
  }

  getNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const directions: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ];

    for (const [dq, dr] of directions) {
      const nq = cell.q + dq;
      const nr = cell.r + dr;
      const key = this.toCoordinateKey(new HexCoordinates(nq, nr));
      const neighbor = this.cellsMap.get(key);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  getAvailableNeighbors(cell: Cell): Cell[] {
    return this.getNeighbors(cell).filter(
      (neighbor) => neighbor.isLocationEmpty,
    );
  }

  getAvailableCells(): Cell[] {
    return Array.from(this.cellsMap.values()).filter(
      (cell) => cell.isLocationEmpty,
    );
  }

  getGeometricCenter(cells: Cell[]): Cell | null {
    if (cells.length === 0) {
      return null;
    }

    let sumQ = 0;
    let sumR = 0;

    for (const cell of cells) {
      sumQ += cell.q;
      sumR += cell.r;
    }

    const avgQ = Math.round(sumQ / cells.length);
    const avgR = Math.round(sumR / cells.length);

    return this.get(new HexCoordinates(avgQ, avgR)) || null;
  }

  getDistance(cellA: Cell, cellB: Cell): number {
    return (
      (Math.abs(cellA.q - cellB.q) +
        Math.abs(cellA.q + cellA.r - cellB.q - cellB.r) +
        Math.abs(cellA.r - cellB.r)) /
      2
    );
  }

  getCells(): Cell[] {
    return Array.from(this.cellsMap.values());
  }
}
