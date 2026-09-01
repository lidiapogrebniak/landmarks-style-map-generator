import { Location } from "./location/location.js";
import { LocationType } from "./location/locationType.js";

export class HexCoordinates {
  readonly q: number;
  readonly r: number;

  get s(): number {
    return -this.q - this.r;
  }

  constructor(q: number, r: number) {
    this.q = q;
    this.r = r;
  }
}

export class Cell extends HexCoordinates {
  location: Location | null = null;

  constructor(q: number, r: number) {
    super(q, r);
  }

  get locationType(): LocationType | null {
    return this.location?.type ?? null;
  }

  getLocation(): Location | null {
    return this.location;
  }

  setLocation(location: Location): void {
    this.location = location;
  }

  get isLocationEmpty(): boolean {
    return !this.location;
  }

  cleanLocation(): void {
    this.location = null;
  }

  override toString(): string {
    if (this.location) {
      return `Cell(q:${this.q}, r:${this.r}, type:${this.locationType})`;
    }
    return `Cell(q:${this.q}, r:${this.r})`;
  }
}
