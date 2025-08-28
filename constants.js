export const LocationType = Object.freeze({
    TREASURE: 'treasure',
    WATER: 'water',
    AMULET: 'amulet',
    CURSE: 'curse',
    TRAP: 'trap',
    EXIT: 'exit',
    WORD: 'word',
    EMPTY: 'empty',
});

export const LOCATION_IMAGES = {
    [LocationType.TREASURE]: './images/treasure.png',
    [LocationType.WATER]: './images/water.png',
    [LocationType.AMULET]: './images/amulet.png',
    [LocationType.EXIT]: './images/exit.png',
    [LocationType.TRAP]: './images/trap.png',
    [LocationType.CURSE]: './images/curse.png'
};

export const BASIC_LOCATION_COUNT = {
    WATER_COUNT: 3,
    TREASURE_COUNT: 3,
    AMULET_COUNT: 1,
    CURSE_COUNT: 3,
    TRAP_COUNT: 4,
    EXIT_COUNT: 1,

};

export const GAME_CONFIG = {
    GRID_RADIUS_IN_HEX: 3,                 // radius of the map in hexes
    HEX_RADIUS_IN_PIXEL: 48,
    GOOD_LOCATION_MIN_DISTANCE: 2,
}