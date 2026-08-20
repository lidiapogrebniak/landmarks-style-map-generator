import {
  LocationCount,
  GAME_CONFIG,
  LocationType,
  GameConfig,
} from "./constants.js";
import { Location } from "./location.js";
import { Cell } from "./cell.js";
import { CellHashEmitter } from "./cellHashEmitter.js";

export class GridGenerator {
  private gameConfig: GameConfig;
  private locationCount: LocationCount;
  private cellsMap: Map<string, Cell> = new Map();
  private emitter: CellHashEmitter = new CellHashEmitter([]);

  constructor(
    private gConfig: GameConfig,
    private lCount: LocationCount,
  ) {
    this.gameConfig = gConfig;
    this.locationCount = lCount;
  }

  generateEmptyCellsMap(): Map<string, Cell> {
    const R = this.gameConfig.GRID_RADIUS_IN_HEX;
    let id = 0;

    for (let q = -R; q <= R; q++) {
      const r1 = Math.max(-R, -q - R);
      const r2 = Math.min(R, -q + R);
      for (let r = r1; r <= r2; r++) {
        this.cellsMap.set(this.getLocationHash(q, r), new Cell(id, q, r));
        id++;
      }
    }

    return this.cellsMap;
  }

  distance(cellA: Cell, cellB: Cell): number {
    return (
      (Math.abs(cellA.getQ() - cellB.getQ()) +
        Math.abs(cellA.getR() - cellB.getR()) +
        Math.abs(cellA.getS() - cellB.getS())) /
      2
    );
  }

  getLocationHash(q: number, r: number): string {
    return `${q},${r}`;
  }

  async populateWords(): Promise<Set<string>> {
    const wordSet: Set<string> = new Set();
    const wordBank = await fetch("../wordBank.json").then((response) =>
      response.json(),
    );
    const wordCells: Cell[] = this.pickWordCells();
    wordCells.forEach((wordCell) => {
      wordSet.add(wordCell.getHash());
      this.emitter.emitCertain(wordCell.getHash());

      wordCell.getLocation().setType(LocationType.WORD);
      wordCell
        .getLocation()
        .setWord(this.pickRandomWord(wordBank, wordSet, this.cellsMap));
    });

    return Promise.resolve(wordSet);
  }

  pickWordCells(): Cell[] {
    const neighbors: Cell[] = [];
    const wordCells: Cell[] = [];
    let currentWordHash = this.emitter.emitFirst()!;
    const wordCell: Cell = this.cellsMap.get(currentWordHash)!;
    wordCells.push(wordCell);
    let i = 0;

    while (i < this.locationCount.WORD_COUNT - 1) {
      neighbors.push(...this.getNeighbors(wordCell.getQ(), wordCell.getR()));
      wordCells.push(this.returnRandomElementAndCutItFromArray(neighbors));
      i++;
    }

    return wordCells;
  }

  returnRandomElementAndCutItFromArray(mas: Cell[]): Cell {
    const randomNeighborIndex = Math.floor(Math.random() * mas.length);
    const element = mas[randomNeighborIndex]!;
    mas.splice(randomNeighborIndex, 1);
    return element;
  }

  pickRandomWord(
    wordBank: { words: string[] },
    wordSet: Set<string>,
    cellsMap: Map<string, Cell>,
  ): string {
    const words = wordBank.words;
    if (words.length === 0) {
      throw new Error("Word bank is empty");
    }

    while (true) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const word = words[randomIndex]!;
      const isUsed = Array.from(wordSet).some((hash) => {
        const cell = cellsMap.get(hash);
        return cell?.getLocation().getWord() === word;
      });

      if (!isUsed) return word;
    }
  }

  cleanCellsLocations(): void {
    this.cellsMap.forEach((cell) => cell.cleanLocation());
  }

  //TBD
  bfsWhichGoodLocationsReachable(
    cellsMap: Map<string, Cell>,
    starts: [string, Cell][],
  ): Set<string> {
    const visited = new Map<string, boolean>();
    cellsMap.forEach((_, key) => visited.set(key, false));

    const queue: [string, number, number][] = [];
    starts.forEach(([hash, cell]) => {
      queue.push([hash, cell.getQ(), cell.getR()]);
      visited.set(hash, true);
    });

    const reachableHashes = new Set<string>();

    while (queue.length > 0) {
      const [hash, q, r] = queue.shift()!;
      reachableHashes.add(hash);

      const neighbors = this.getNeighbors(q, r);
      for (const neighbor of neighbors) {
        const neighborHash = neighbor.getHash();
        if (
          visited.get(neighborHash) === false &&
          !neighbor.getLocation().isBad()
        ) {
          visited.set(neighborHash, true);
          queue.push([neighborHash, neighbor.getQ(), neighbor.getR()]);
        }
      }
    }

    return reachableHashes;
  }

  getNeighbors(cellQ: number, cellR: number): Cell[] {
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
      const nq = cellQ + dq;
      const nr = cellR + dr;
      const hash = this.getLocationHash(nq, nr);
      const neighbor = this.cellsMap.get(hash);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  //TBD
  findCloserFreeCell(
    start: [string, Cell],
    target: Cell,
  ): [string, Cell] | null {
    let best: [string, Cell] | null = null;

    let currentDist = this.distance(start[1], target);

    const neighbors = this.getNeighbors(start[1].getQ(), start[1].getR());

    let betterNeighbor: [string, Cell] | null = null;
    for (const neighbor of neighbors) {
      if (neighbor.isLocationEmpty()) {
        const neighborDistance = this.distance(neighbor, target);
        if (neighborDistance < currentDist) {
          const neighborHash = neighbor.getHash();
          betterNeighbor = [neighborHash, neighbor];
          currentDist = neighborDistance;
        }
      }
    }

    return betterNeighbor;
  }

  //TBD
  moveLocationsTowardTarget(
    nonWordNotEmptylocations: [string, Cell][],
    target: Cell,
  ): void {
    for (const loc of nonWordNotEmptylocations) {
      const newLoc = this.findCloserFreeCell(loc, target);
      if (newLoc) {
        newLoc[1].setLocation(loc[1].getLocation());
        loc[1].cleanLocation();
      }
    }
  }

  isGoodLocationValid(
    cell: Cell,
    goodSet: Set<string>,
    wordSet: Set<string>,
  ): boolean {
    // current cell is not closer to any other good locations or words
    // then GOOD_LOCATION_MIN_DISTANCE
    let isValid = ![...goodSet, ...wordSet].some(
      (hash) =>
        this.distance(cell, this.cellsMap.get(hash)!) <
        GAME_CONFIG.GOOD_LOCATION_MIN_DISTANCE,
    );

    // If all words are too far (distance >= 4), the location is not valid
    if (isValid && goodSet.size === this.locationCount.TREASURE_COUNT + 1) {
      const allWordsAreTooFar = Array.from(wordSet).every(
        (hash) => this.distance(cell, this.cellsMap.get(hash)!) >= 4,
      );
      if (allWordsAreTooFar) {
        isValid = false;
      }
    }

    return isValid;
  }

  async generateCellsWithLocations(): Promise<Iterator<Cell>> {
    this.cellsMap = this.generateEmptyCellsMap();
    const cellsHashes = Array.from(this.cellsMap.keys());
    this.emitter = new CellHashEmitter(cellsHashes);

    let wordSet: Set<string> = new Set();
    let goodSet: Set<string> = new Set();
    const badSet: Set<string> = new Set();
    let retryCount = 0;

    try {
      while (true) {
        if (retryCount > 10) {
          throw new Error("Failed to generate valid layout after 10 retries");
        }
        this.cleanCellsLocations();

        goodSet.clear();
        badSet.clear();

        try {
          // Place words
          wordSet = await this.populateWords();
          goodSet = this.populateGoodLocations(wordSet);

          if (goodSet.size < this.locationCount.GOOD_TOTAL) {
            continue;
            retryCount++;
          }
          this.populateBadLocations(goodSet, wordSet, badSet);

          return this.cellsMap.values();
        } catch (error) {
          console.error("Failed to generate valid layout:", error);
          continue;
        }
      }
    } catch (error) {
      alert(
        "Failed to generate valid layout {message:" +
          (error as Error).message +
          "}. Please refresh the page to try again.",
      );
      return Promise.reject(error);
    }
  }

  populateGoodLocations(wordSet: Set<string>): Set<string> {
    const goodSet: Set<string> = new Set<string>();
    // Place good locations
    let tries = 0;
    while (goodSet.size < this.locationCount.GOOD_TOTAL) {
      const hash = this.emitter.emit();
      if (!hash) break;
      const cell: Cell = this.cellsMap.get(hash)!;
      if (this.isGoodLocationValid(cell, goodSet, wordSet)) {
        goodSet.add(hash);
        this.assignGoodLocationType(cell, goodSet.size);
      } else {
        tries++;
        if (tries > 10) {
          break;
        }
        this.emitter.rollback();
      }
    }
    return goodSet;
  }

  availableCellsWithDistance(
    availableHashes: string[],
    wordSet: Set<string>,
    goodSet: Set<string>,
  ): Array<{ hash: string; cell: Cell; distanceToCenter: number }> {
    type Coord = {
      Q: number;
      R: number;
    };

    const wordAndGoodLocationCells = [...wordSet, ...goodSet].map(
      (usedHash) => this.cellsMap.get(usedHash)!,
    );

    const coordSum: Coord = wordAndGoodLocationCells
      .map((cell) => ({ Q: cell.getQ(), R: cell.getR() }))
      .reduce(
        (acc, coord) => {
          acc.Q += coord.Q;
          acc.R += coord.R;
          return acc;
        },
        { Q: 0, R: 0 },
      );

    const center: Coord = {
      Q: Math.round(coordSum.Q / wordAndGoodLocationCells.length),
      R: Math.round(coordSum.R / wordAndGoodLocationCells.length),
    };

    const centerCell = this.cellsMap.get(
      this.getLocationHash(center.Q, center.R),
    );
    if (!centerCell) {
      throw new Error("Center cell not found in cellsMap");
    }

    return availableHashes.map((hash) => {
      const cell = this.cellsMap.get(hash)!;
      return {
        hash: hash,
        cell: cell,
        distanceToCenter: this.distance(cell, centerCell),
      };
    });
  }

  availableHashesWithProbability(
    availableHashes: string[],
    wordSet: Set<string>,
    goodSet: Set<string>,
  ): Map<string, number> {
    const availableCellsWithDistance = this.availableCellsWithDistance(
      availableHashes,
      wordSet,
      goodSet,
    );

    const availableCellsWithWeights = availableCellsWithDistance.map((item) => {
      /*
            alpha = 1.5
            weight = math.exp(-alpha * item.distanceToCenter)
            */
      const alpha = 1.5;
      const weight = Math.exp(-alpha * item.distanceToCenter);
      return {
        hash: item.hash,
        weight: weight,
      };
    });

    const sumOfWeights = availableCellsWithWeights
      .map((item) => item.weight)
      .reduce((a, b) => a + b, 0);

    return new Map(
      availableCellsWithWeights.map((item) => {
        return [item.hash, item.weight / sumOfWeights];
      }),
    );
  }

  populateBadLocations(
    goodSet: Set<string>,
    wordSet: Set<string>,
    badSet: Set<string>,
  ): void {
    const availableHashesWithProbability = this.availableHashesWithProbability(
      this.emitter.getRemainingHashes(),
      wordSet,
      goodSet,
    );

    while (badSet.size < this.locationCount.BAD_TOTAL) {
      const hash = this.emitter.emitWithWeight(availableHashesWithProbability);
      if (!hash) break;

      availableHashesWithProbability.delete(hash);
      badSet.add(hash);
      this.assignBadLocationType(this.cellsMap.get(hash)!, badSet.size);
    }
  }

  private assignGoodLocationType(cell: Cell, count: number): void {
    const location = cell.getLocation();
    if (count <= this.locationCount.TREASURE_COUNT) {
      location.setType(LocationType.TREASURE);
    } else if (
      count <=
      this.locationCount.TREASURE_COUNT + this.locationCount.WATER_COUNT
    ) {
      location.setType(LocationType.WATER);
    } else if (
      count <=
      this.locationCount.TREASURE_COUNT +
        this.locationCount.WATER_COUNT +
        this.locationCount.AMULET_COUNT
    ) {
      location.setType(LocationType.AMULET);
    } else {
      location.setType(LocationType.EXIT);
    }
  }

  private assignBadLocationType(cell: Cell, count: number): void {
    const location = cell.getLocation();
    if (count <= this.locationCount.CURSE_COUNT) {
      location.setType(LocationType.CURSE);
    } else {
      location.setType(LocationType.TRAP);
    }
  }

  //TBD
  private isAllGoodLocationsReachable(
    wordSet: Set<string>,
    goodSet: Set<string>,
  ): boolean {
    const starts = Array.from(wordSet).map(
      (h) => [h, this.cellsMap.get(h)!] as [string, Cell],
    );
    if (starts.length === 0) {
      throw new Error("No starting points for BFS");
    }

    const reachable = this.bfsWhichGoodLocationsReachable(
      this.cellsMap,
      starts,
    );
    return Array.from(goodSet).every((g) => reachable.has(g));
  }

  // ...existing code...
}
