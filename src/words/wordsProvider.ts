export class WordsProvider {
  private words: string[] = [];

  constructor(words: string[]) {
    this.words = words;
  }

  public getRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex]!;
  }

  public getRandomWords(count: number): string[] {
    const shuffledWords = [...this.words].sort(() => 0.5 - Math.random());
    return shuffledWords.slice(0, count);
  }
}
