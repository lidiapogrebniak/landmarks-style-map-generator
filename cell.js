import { Location } from './location.js';
import { LocationType } from './constants.js';

export class Cell {
    constructor(id, q, r) {
        this.id = id;        // unique identifier for the cell
        this.q = q;          // q coordinate in hexagonal grid
        this.r = r;          // r coordinate in hexagonal grid
        this.s = -q - r;     // s coordinate (computed)
        this.location = new Location(LocationType.EMPTY);
    }

    getCoordinates() {
        return {
            q: this.q,
            r: this.r,
            s: this.s
        };
    }

    getLocation() {
        return this.location;
    }

    setLocation(location) {
        if (location instanceof Location) {
            this.location = location;
        } else {
            throw new Error('Invalid location type');
        }
    }

    toString() {
        return `Cell(q:${this.q}, r:${this.r}, type:${this.location.type})`;
    }
}