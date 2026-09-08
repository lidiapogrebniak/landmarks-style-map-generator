export interface LocationCount {
  WORD_COUNT: number;
  WATER_COUNT: number;
  TREASURE_COUNT: number;
  AMULET_COUNT: number;
  CURSE_COUNT: number;
  TRAP_COUNT: number;
  EXIT_COUNT: number;
  GOOD_TOTAL: number;
  BAD_TOTAL: number;
}

abstract class BaseLocationCount implements LocationCount {
  abstract get WATER_COUNT(): number;
  abstract get TREASURE_COUNT(): number;
  abstract get CURSE_COUNT(): number;
  abstract get TRAP_COUNT(): number;

  get WORD_COUNT(): number {
    return 3;
  }
  get AMULET_COUNT(): number {
    return 1;
  }
  get EXIT_COUNT(): number {
    return 1;
  }

  get GOOD_TOTAL() {
    return (
      this.WATER_COUNT +
      this.TREASURE_COUNT +
      this.AMULET_COUNT +
      this.EXIT_COUNT
    );
  }
  get BAD_TOTAL() {
    return this.CURSE_COUNT + this.TRAP_COUNT;
  }
}

export class BasicLocationCount extends BaseLocationCount {
  get WATER_COUNT() {
    return 3;
  }
  get TREASURE_COUNT() {
    return 3;
  }
  get CURSE_COUNT() {
    return 3;
  }
  get TRAP_COUNT() {
    return 4;
  }

  constructor() {
    super();
  }
}

export class AdvancedLocationCount extends BaseLocationCount {
  get WATER_COUNT() {
    return 4;
  }
  get TREASURE_COUNT() {
    return 4;
  }
  get CURSE_COUNT() {
    return 5;
  }
  get TRAP_COUNT() {
    return 6;
  }

  constructor() {
    super();
  }
}
