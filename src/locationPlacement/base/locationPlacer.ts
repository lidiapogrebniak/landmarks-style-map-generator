import { LocationType } from "./../../location/locationType.js";
import { Cell } from "./../../cell.js";
import { Location } from "./../../location/location.js";
export class LocationPlacer {
  pick(): Cell {
    throw new Error("Method not implemented.");
  }
  updateAfterPlacement(cell: Cell): void {
    throw new Error("Method not implemented.");
  }
  place(Location: Location): Cell {
    const cell: Cell = this.pick();
    cell.setLocation(Location);
    this.updateAfterPlacement(cell);
    return cell;
  }

  placeLocations(locationCount: number, locationType: LocationType): Cell[] {
    const placedCells: Cell[] = [];
    for (let i = 0; i < locationCount; i++) {
      const cell: Cell = this.place(Location.ofType(locationType));
      placedCells.push(cell);
    }
    return placedCells;
  }
}
