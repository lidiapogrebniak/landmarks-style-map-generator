import { GameConfig } from "./gameConfig.js";
import { LocationCount } from "./locationCountConfig.js";
import { Grid } from "./grid.js";
import { Cell } from "./cell.js";
import { LocationPlacerBuilder } from "./locationPlacement/locationPlacerBuilder.js";
import { Location } from "./location/location.js";
import { WordsProvider } from "./words/wordsProvider.js";
import { LocationType } from "./location/locationType.js";
export class BoardGenerator {
  private readonly gameConfig: GameConfig;
  private readonly locationCount: LocationCount;
  private readonly grid: Grid;
  private readonly locationPlacerBuilder: LocationPlacerBuilder;
  private readonly wordsProvider: WordsProvider;

  constructor(gConfig: GameConfig, lCount: LocationCount, words: string[]) {
    this.gameConfig = gConfig;
    this.locationCount = lCount;
    this.grid = new Grid(this.gameConfig);
    this.locationPlacerBuilder = new LocationPlacerBuilder(this.grid);
    if (words.length === 0) {
      throw new Error("Words array cannot be empty.");
    }
    this.wordsProvider = new WordsProvider(words);
  }

  generateBoard(): Cell[] {
    this.grid.generateEmptyCellsMap();
    const goodCells: Cell[] = [];

    goodCells.push(...this.placeWordsOnBoard());

    const goodLocationPlacer = this.locationPlacerBuilder
      .withFilterAllFree()
      .weightedIncrementalWithUpdateNeighbors(0.2);

    goodCells.push(
      ...goodLocationPlacer.placeLocations(
        this.locationCount.WATER_COUNT,
        LocationType.WATER,
      ),
    );

    goodCells.push(
      ...goodLocationPlacer.placeLocations(
        this.locationCount.TREASURE_COUNT,
        LocationType.TREASURE,
      ),
    );

    goodCells.push(
      goodLocationPlacer.place(Location.ofType(LocationType.AMULET)),
    );
    goodCells.push(
      goodLocationPlacer.place(Location.ofType(LocationType.EXIT)),
    );

    const centerCell: Cell | null = this.grid.getGeometricCenter(goodCells);
    if (centerCell === null) {
      throw new Error("Could not determine the center.");
    }

    const badLocationPlacer = this.locationPlacerBuilder
      .withFilterAllFree()
      .weightedStatic((cell) =>
        Math.exp(
          -this.grid.getDistance(cell, centerCell) /
            this.gameConfig.DISTANCE_DECAY_FACTOR,
        ),
      );

    const badLocations = Array.from(
      { length: this.locationCount.CURSE_COUNT },
      () => Location.ofType(LocationType.CURSE),
    ).concat(
      Array.from({ length: this.locationCount.TRAP_COUNT }, () =>
        Location.ofType(LocationType.TRAP),
      ),
    );

    badLocations.forEach(badLocationPlacer.place.bind(badLocationPlacer));

    return Array.from(this.grid.getCells());
  }

  placeWordsOnBoard(): Cell[] {
    const words = this.wordsProvider.getRandomWords(
      this.locationCount.WORD_COUNT,
    );

    const firstWordCell = this.locationPlacerBuilder
      .withFilterAllFree()
      .random()
      .place(Location.withWord(words[0]!));

    const wordCells = [firstWordCell];

    for (let i = 1; i < words.length; i++) {
      const wordCell = this.locationPlacerBuilder
        .withFilterCellArrayNeighborsFree(wordCells)
        .random()
        .place(Location.withWord(words[i]!));

      wordCells.push(wordCell);
    }

    return wordCells;
  }
}
