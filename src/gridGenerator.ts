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

    constructor(
        private gConfig: GameConfig,
        private lCount: LocationCount
    ) {
        this.gameConfig = gConfig;
        this.locationCount = lCount;
    }

    generateEmptyCellsMap(): Map<string, Cell> {
        const cellsMap = new Map<string, Cell>();
        const R = this.gameConfig.GRID_RADIUS_IN_HEX;
        let id = 0;

        for (let q = -R; q <= R; q++) {
            const r1 = Math.max(-R, -q - R);
            const r2 = Math.min(R, -q + R);
            for (let r = r1; r <= r2; r++) {
                cellsMap.set(this.getLocationHash(q, r), new Cell(id, q, r));
                id++;
            }
        }

        return cellsMap;
    }

    distance(cellA: Cell, cellB: Cell): number {
        return (
            (Math.abs(cellA.getQ() - cellB.getQ()) +
            Math.abs(cellA.getR() - cellB.getR()) +
            Math.abs(cellA.getS() - cellB.getS())) / 2
        );
    }

    getLocationHash(q: number, r: number): string {
        return `${q},${r}`;
    }

    async populateWords(
        cellsMap: Map<string, Cell>,
        emitter: CellHashEmitter,
        wordSet: Set<string>
    ): Promise<void> {
        const wordBank = await fetch("../wordBank.json").then(response => response.json());

        let currentWordHash = emitter.emitFirst()!;
        let neighbors:[string, Cell][] = [];

        for (let i = 0; i < this.locationCount.WORD_COUNT; i++) {
            const wordCell:Cell = cellsMap.get(currentWordHash)!;

            wordSet.add(currentWordHash);

            wordCell.getLocation().setType(LocationType.WORD);
            wordCell.getLocation()
                .setWord(this.pickRandomWord(wordBank, wordSet, cellsMap));

            if(i < this.locationCount.WORD_COUNT - 1) {
                currentWordHash = this.updateNeighborsAndPickNextWordCell(
                    neighbors,
                    wordSet,
                    emitter,
                    wordCell,
                    cellsMap
                );
            }
        }
    }

    updateNeighborsAndPickNextWordCell(
        neighbors: [string, Cell][],
        wordSet: Set<string>,
        emitter: CellHashEmitter,
        wordCell: Cell,
        cellsMap: Map<string, Cell>): string
    {
        neighbors.push(...this.getNeighbors(wordCell.getQ(), wordCell.getR(), cellsMap));
        neighbors = neighbors.filter(([neighborHash]) => !wordSet.has(neighborHash));

        if (!neighbors || neighbors.length === 0) {
            throw new Error("No valid neighbors found");
        }

        const randomNeighborIndex = Math.floor(Math.random() * neighbors.length);
        const [nextWordNeighborHash] = neighbors[randomNeighborIndex]!;
        emitter.emitCertain(nextWordNeighborHash);
        return nextWordNeighborHash;
    }

    pickRandomWord(wordBank: { words: string[] }, wordSet: Set<string>, cellsMap: Map<string, Cell>): string {
        const words = wordBank.words;
        if (words.length === 0) {
            throw new Error("Word bank is empty");
        }

        while (true) {
            const randomIndex = Math.floor(Math.random() * words.length);
            const word = words[randomIndex]!;
            const isUsed = Array.from(wordSet).some(hash => {
                const cell = cellsMap.get(hash);
                return cell?.getLocation().getWord() === word;
            });

            if (!isUsed) return word;
        }
    }

    cleanCellsLocations(cellsMap: Map<string, Cell>): void {
        cellsMap.forEach(cell => cell.cleanLocation());
    }

    //TBD
    bfsWhichGoodLocationsReachable(
        cellsMap: Map<string, Cell>,
        starts: [string, Cell][]
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

            const neighbors = this.getNeighbors(q, r, cellsMap);
            for (const [neighborHash, neighbor] of neighbors) {
                if (visited.get(neighborHash) === false && !neighbor.getLocation().isBad()) {
                    visited.set(neighborHash, true);
                    queue.push([neighborHash, neighbor.getQ(), neighbor.getR()]);
                }
            }
        }

        return reachableHashes;
    }

    getNeighbors(cellQ: number, cellR: number, cellsMap: Map<string, Cell>): [string, Cell][] {
        const neighbors: [string, Cell][] = [];
        const directions: [number, number][] = [
            [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]
        ];

        for (const [dq, dr] of directions) {
            const nq = cellQ + dq;
            const nr = cellR + dr;
            const hash = this.getLocationHash(nq, nr);
            const neighbor = cellsMap.get(hash);
            if (neighbor) {
                neighbors.push([hash, neighbor]);
            }
        }
        return neighbors;
    }

    //TBD
    findCloserFreeCell(
        start: [string, Cell],
        target: Cell,
        cellsMap: Map<string, Cell>
      ): [string, Cell] | null {

        let best: [string, Cell] | null = null;

        let currentDist = this.distance(start[1], target);

        const neighbors = this.getNeighbors(
            start[1].getQ(),
            start[1].getR(),
            cellsMap);

        let betterNeighbor:[string, Cell] | null = null;
          for (const [neighborHash, neighbor] of neighbors) {
            if (neighbor.isLocationEmpty()) {
                const neighborDistance = this.distance(neighbor, target);
                if (neighborDistance < currentDist) {
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
        cellsMap: Map<string, Cell>
    ): void {
        for (const loc of nonWordNotEmptylocations) {
            const newLoc = this.findCloserFreeCell(loc, target, cellsMap);
            if (newLoc) {
                newLoc[1].setLocation(loc[1].getLocation());
                loc[1].cleanLocation();
            }
        }
    }

    isGoodLocationValid(cell:Cell,
        cellsMap: Map<string, Cell>,
        goodSet: Set<string>,
        wordSet:Set<string>
    ): boolean {
        // current cell is not closer to any other good locations or words
        // then GOOD_LOCATION_MIN_DISTANCE
        let isValid = ![...goodSet, ...wordSet].some(hash =>
            this.distance(cell, cellsMap.get(hash)!) < GAME_CONFIG.GOOD_LOCATION_MIN_DISTANCE);

        // If all words are too far (distance >= 4), the location is not valid
        if (isValid && goodSet.size === this.locationCount.TREASURE_COUNT + 1) {
            const allWordsAreTooFar = Array.from(wordSet).every(hash =>
                this.distance(cell, cellsMap.get(hash)!) >= 4
            );
            if (allWordsAreTooFar) {
                isValid = false;
            }
        }

        return isValid;
    }

    async generateCellsWithLocations(): Promise<Iterator<Cell>> {
        const cellsMap = this.generateEmptyCellsMap();
        const cellsHashes = Array.from(cellsMap.keys());
        const emitter = new CellHashEmitter(cellsHashes);

        const wordSet:Set<string> = new Set();
        const goodSet:Set<string> = new Set();
        const badSet:Set<string> = new Set();

        while (true) {
            this.cleanCellsLocations(cellsMap);

            wordSet.clear();
            goodSet.clear();
            badSet.clear();

            try {
                // Place words
                await this.populateWords(cellsMap, emitter, wordSet);

                // Place good locations
                let tries = 0;
                while (goodSet.size < this.locationCount.GOOD_TOTAL) {
                    const hash = emitter.emit();
                    if (!hash) break;
                    const cell:Cell = cellsMap.get(hash)!;
                    if (this.isGoodLocationValid(cell, cellsMap, goodSet, wordSet)) {
                        goodSet.add(hash);
                        this.assignGoodLocationType(cell, goodSet.size);
                    } else {
                        tries++;
                        if (tries > 10) {
                            break;
                        }
                        emitter.rollback();
                    }
                }

                this.populateBadLocations(emitter, goodSet, wordSet, badSet, cellsMap);

               if (goodSet.size < this.locationCount.GOOD_TOTAL) {
                continue;
               }
                return cellsMap.values();
            } catch (error) {
                console.error('Failed to generate valid layout:', error);
                //continue;
            }
        }
    }

    populateBadLocations(emitter: CellHashEmitter, goodSet:Set<string>, wordSet:Set<string>, badSet:Set<string>, cellsMap:Map<string,Cell>): void {
        const availableHashes:string[] = emitter.getRemainingHashes()
        const wordAndGoodLocationCells = [...wordSet, ...goodSet].map(usedHash =>
            cellsMap.get(usedHash)!);
        const coordSum:number[] = wordAndGoodLocationCells.map(
            cell => [cell.getQ(), cell.getR()]
        ).reduce((acc: number[], curr: number[]): number[] => {
            return [acc[0]! + curr[0]!, acc[1]! + curr[1]!];
        }, [0, 0]);
        const center = coordSum.map(coord => Math.round(coord / wordAndGoodLocationCells.length)) as [number, number];

        const availableCellsWithDistance = availableHashes.map(hash => {
            const cell = cellsMap.get(hash)!;
            return {
                hash: hash,
                cell: cell,
                distanceToCenter:
                this.distance(cell, cellsMap.get(
                    this.getLocationHash(center[0]!, center[1]!))!)
            };
        });

        const availableCellsWithWeights = availableCellsWithDistance.map(item => {
            /*
            alpha = 1.5
            weight = math.exp(-alpha * item.distanceToCenter)
            */
            const alpha = 1.5;
            const weight = Math.exp(-alpha * item.distanceToCenter);
            return {
                hash: item.hash,
                weight: weight
            };
        });

        const sumOfWeights = availableCellsWithWeights.map(item => item.weight).reduce((a, b) => a + b, 0);

        const availableHashesWithProbability = new Map(
            availableCellsWithWeights.map(item => {
                return [
                    item.hash,
                    item.weight / sumOfWeights
                ];
            })
        );

        while (badSet.size < this.locationCount.BAD_TOTAL) {
            const hash = emitter.emitWithWeight(availableHashesWithProbability);
            if (!hash) break;

            availableHashesWithProbability.delete(hash);
            badSet.add(hash);
            this.assignBadLocationType(cellsMap.get(hash)!, badSet.size);
        }

    }

    private assignGoodLocationType(cell: Cell, count: number): void {
        const location = cell.getLocation();
        if (count <= this.locationCount.TREASURE_COUNT) {
            location.setType(LocationType.TREASURE);
        } else if (count <= this.locationCount.TREASURE_COUNT + this.locationCount.WATER_COUNT) {
            location.setType(LocationType.WATER);
        } else if (count <= this.locationCount.TREASURE_COUNT + this.locationCount.WATER_COUNT + this.locationCount.AMULET_COUNT) {
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
    private isAllGoodLocationsReachable(cellsMap: Map<string, Cell>, wordSet: Set<string>, goodSet: Set<string>): boolean {
        const starts = Array.from(wordSet).map(h => [h, cellsMap.get(h)!] as [string, Cell]);
        if (starts.length === 0) {
            throw new Error("No starting points for BFS");
        }

        const reachable = this.bfsWhichGoodLocationsReachable(cellsMap, starts);
        return Array.from(goodSet).every(g => reachable.has(g));
    }

    // ...existing code...
}