import { Location } from './location.js';
import { LocationType } from './constants.js';

interface Coordinates {
    q: number;
    r: number;
    s: number;
}

export class Cell {
    private id: number;
    private q: number;
    private r: number;
    private s: number;
    private location: Location;

    constructor(id: number, q: number, r: number) {
        this.id = id;        // unique identifier for the cell
        this.q = q;          // q coordinate in hexagonal grid
        this.r = r;          // r coordinate in hexagonal grid
        this.s = -q - r;     // s coordinate (computed)
        this.location = new Location(LocationType.EMPTY);
    }

    getCoordinates(): Coordinates {
        return {
            q: this.q,
            r: this.r,
            s: this.s
        };
    }

    getQ(): number {
        return this.q;
    }

    getR(): number {
        return this.r;
    }

    getS(): number {
        return this.s;
    }

    getLocation(): Location {
        return this.location;
    }

    setLocation(location: Location): void {
        if (location instanceof Location) {
            this.location = location;
        } else {
            throw new Error('Invalid location type');
        }
    }

    cleanLocation(): void {
        this.location = new Location(LocationType.EMPTY);
    }

    toString(): string {
        return `Cell(q:${this.q}, r:${this.r}, type:${this.location.getType()})`;
    }
}