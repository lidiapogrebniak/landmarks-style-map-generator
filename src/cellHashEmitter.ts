export class CellHashEmitter {
    private cellHashes: string[];
    private usedIndices: number[];
    private currentIndex: number;

    constructor(cellHashes: string[]) {
        this.cellHashes = [...cellHashes]; // Create a copy of the array
        this.usedIndices = [];
        this.currentIndex = 0;
        this.shuffle();
    }

    emit(): string | null | undefined {
        if (this.currentIndex >= this.cellHashes.length) {
            return null; // No more hashes to emit
        }

        const hash = this.cellHashes[this.currentIndex];
        this.usedIndices.push(this.currentIndex);
        this.currentIndex++;
        return hash;
    }

    rollback(): void {
        if (this.usedIndices.length === 0) {
            return; // Nothing to rollback
        }
        this.currentIndex = this.usedIndices.pop()!;
        const hashArray = this.cellHashes.splice(this.currentIndex, 1);
        if (hashArray.length > 0) {
            this.cellHashes.push(hashArray[0]!); // Move the rolled back hash to the front
        }
    }

    hasNext(): boolean {
        return this.currentIndex < this.cellHashes.length;
    }

    reset(): void {
        this.currentIndex = 0;
        this.usedIndices = [];
        this.shuffle();
    }

    shuffle(): void {
        for (let i = this.cellHashes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cellHashes[i], this.cellHashes[j]] = [this.cellHashes[j]!, this.cellHashes[i]!];
        }
    }

    emitFirst(): string | null | undefined {
        if (this.cellHashes.length === 0) {
            return null; // No hashes available
        }
        this.currentIndex = 1; // Move index forward since we're emitting the first
        this.usedIndices.push(0);
        return this.cellHashes[0];
    }

    emitCertain(hash: string): boolean {
        // Move the requested hash to currentIndex if it exists
        if (this.currentIndex < this.cellHashes.length) {
            const foundIndex = this.cellHashes.indexOf(hash);
            if (foundIndex >= this.currentIndex) {
                [this.cellHashes[this.currentIndex], this.cellHashes[foundIndex]] =
                [this.cellHashes[foundIndex]!, this.cellHashes[this.currentIndex]!];
            }
        }

        this.usedIndices.push(this.currentIndex);
        this.currentIndex++;
        return true;
    }
}