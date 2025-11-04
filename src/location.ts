import { LocationType, LocationTypeValue } from './constants.js';

export class Location {
    private type: LocationTypeValue;
    private word: string | null;

    constructor(type: LocationTypeValue, word: string | null = null) {
        this.type = type;
        this.word = word;
    }

    isBad(): boolean {
        return this.type === LocationType.CURSE ||
            this.type === LocationType.TRAP;
    }

    isGood(): boolean {
        return this.type === LocationType.TREASURE ||
            this.type === LocationType.AMULET ||
            this.type === LocationType.WATER ||
            this.type === LocationType.EXIT;
    }

    isEmpty(): boolean {
        return this.type === LocationType.EMPTY;
    }

    isWord(): boolean {
        return this.type === LocationType.WORD;
    }

    getWord(): string {
        if (this.isWord()) {
            return this.word!;
        } else {
            throw new Error('Location is not a word');
        }
    }

    setWord(newWord: string): void {
        if (this.isWord()) {
            this.word = newWord;
        } else {
            throw new Error('Location is not a word');
        }
    }

    getType(): LocationTypeValue {
        return this.type;
    }

    setType(newType: LocationTypeValue): void {
        this.type = newType;
    }

    toString(): string {
        if (this.isWord()) {
            return `Location(WORD: ${this.word})`;
        }
        return `Location(${this.type})`;
    }
}