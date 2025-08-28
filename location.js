import { LocationType } from './constants.js';

export class Location {
    constructor(type, word = null) {
        if (Object.values(LocationType).includes(type)) {
            this.type = type;
        } else {
            throw new Error('Invalid location type');
        }
        this.word = word; // Initialize word to null

    }

    isBad(){
        return this.type === LocationType.CURSE ||
            this.type === LocationType.TRAP;
    }

    isGood(){
        return this.type === LocationType.TREASURE ||
            this.type === LocationType.AMULET ||
            this.type === LocationType.WATER ||
            this.type === LocationType.EXIT;
    }
    isEmpty(){
        return this.type === LocationType.EMPTY;
    }
    isWord(){
        return this.type === LocationType.WORD;
    }
    getWord() {
        if (this.isWord()) {
            return this.word;
        } else {
            throw new Error('Location is not a word');
        }
    }
    setWord(newWord) {
        if (this.isWord()) {
            this.word = newWord;
        } else {
            throw new Error('Location is not a word');
        }
    }

    getType() {
        return this.type;
    }

    setType(newType) {
        if (Object.values(LocationType).includes(newType)) {
            this.type = newType;
        } else {
            throw new Error('Invalid location type');
        }
    }

    toString() {
        if (this.isWord()) {
            return `Location(WORD: ${this.word})`;
        } else {
            return `Location(${this.type})`;
        }
        return `Location(${this.type})`;
    }
}