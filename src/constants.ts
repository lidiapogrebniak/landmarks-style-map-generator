export type LocationTypeKey = 'TREASURE' | 'WATER' | 'AMULET' | 'CURSE' | 'TRAP' | 'EXIT' | 'WORD' | 'EMPTY';
export type LocationTypeValue = 'treasure' | 'water' | 'amulet' | 'curse' | 'trap' | 'exit' | 'word' | 'empty';

export const enum LocationType {
    TREASURE = 'treasure',
    WATER = 'water',
    AMULET = 'amulet',
    CURSE = 'curse',
    TRAP = 'trap',
    EXIT = 'exit',
    WORD = 'word',
    EMPTY = 'empty',
}

export const LOCATION_IMAGES: Partial<Record<LocationTypeValue, string>> = {
    [LocationType.TREASURE]: './images/treasure.png',
    [LocationType.WATER]: './images/water.png',
    [LocationType.AMULET]: './images/amulet.png',
    [LocationType.EXIT]: './images/exit.png',
    [LocationType.TRAP]: './images/trap.png',
    [LocationType.CURSE]: './images/curse.png'
} as const;

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
        return this.WATER_COUNT + this.TREASURE_COUNT + this.AMULET_COUNT + this.EXIT_COUNT;
    }
    get BAD_TOTAL() {
        return this.CURSE_COUNT + this.TRAP_COUNT;
    }
};

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

    private constructor() {
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

    private constructor() {
        super();
    }
}

export interface GameConfig {
    GRID_RADIUS_IN_HEX: number;
    HEX_RADIUS_IN_PIXEL: number;
    GOOD_LOCATION_MIN_DISTANCE: number;
}

export const GAME_CONFIG: GameConfig = {
    GRID_RADIUS_IN_HEX: 3,
    HEX_RADIUS_IN_PIXEL: 48,
    GOOD_LOCATION_MIN_DISTANCE: 1,
} as const;