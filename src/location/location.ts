import { LocationType } from "./locationType.js";

export class Location {
  public readonly type: LocationType;
  public readonly word: string | null;

  private constructor(type: LocationType, word?: string) {
    this.type = type;
    this.word = word || null;
  }

  static ofType(type: LocationType): Location {
    return new Location(type);
  }

  static withWord(word: string): Location {
    return new Location(LocationType.WORD, word);
  }

  get isBad(): boolean {
    return this.type === LocationType.CURSE || this.type === LocationType.TRAP;
  }

  get isGood(): boolean {
    return (
      this.type === LocationType.TREASURE ||
      this.type === LocationType.AMULET ||
      this.type === LocationType.WATER ||
      this.type === LocationType.EXIT
    );
  }

  get isWord(): boolean {
    return this.type === LocationType.WORD;
  }

  get isTreasure(): boolean {
    return this.type === LocationType.TREASURE;
  }

  toString(): string {
    if (this.isWord) {
      return `Location(WORD: ${this.word})`;
    }
    return `Location(${this.type})`;
  }
}
