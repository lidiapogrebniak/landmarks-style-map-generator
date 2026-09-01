import { LocationType } from "./locationType.js";

export const LOCATION_IMAGES: Partial<Record<LocationType, string>> = {
  [LocationType.TREASURE]: "./images/treasure.png",
  [LocationType.WATER]: "./images/water.png",
  [LocationType.AMULET]: "./images/amulet.png",
  [LocationType.EXIT]: "./images/exit.png",
  [LocationType.TRAP]: "./images/trap.png",
  [LocationType.CURSE]: "./images/curse.png",
} as const;
