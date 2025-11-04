import {
  BASIC_LOCATION_COUNT,
  GAME_CONFIG,
  LocationType,
} from "./dist/constants.js";
import { Location } from "./dist/location.js";
import { Cell } from "./dist/cell.js";

export class GridGenerator {
  generateCellsMap() {
    const cellsMap = new Map();
    const R = GAME_CONFIG.GRID_RADIUS_IN_HEX;
    let id = 0;
    // Генерируем ячейки в шестиугольной решетке
    // q - горизонтальная координата, r - вертикальная координата
    // s - диагональная координата (вычисляется как -q-r)
    // q и r могут принимать значения от -R до R, но не все комбинации
    // допустимы, поэтому мы используем два вложенных цикла для генерации
    // всех возможных ячеек в пределах радиуса R.
    for (let q = -R; q <= R; q++) {
      const r1 = Math.max(-R, -q - R);
      const r2 = Math.min(R, -q + R);
      for (let r = r1; r <= r2; r++) {
        cellsMap.set(this.getLocationHash(q, r), new Cell(id, q, r));
        id++;
      }
    }

    return cellsMap;
  }

  distance(cellA, cellB) {
    return (
      (Math.abs(cellA.q - cellB.q) +
        Math.abs(cellA.r - cellB.r) +
        Math.abs(cellA.s - cellB.s)) /
      2
    );
  }

  getLocationHash(q, r) {
    // Преобразуем координаты q и r в строку для использования в качестве ключ
    return `${q},${r}`;
  }

  // BFS для проверки достижимости
  bfsWhichGoodLocationsReachable(cellsMap, starts) {
    const visited = new Map();
    for (const key of cellsMap.keys()) {
      visited.set(key, false);
    }

    const queue = [];
    for (const [hash, cell] of starts) {
      queue.push([hash, cell.getQ(), cell.getR()]);
      visited.set(hash, true);
    }

    const reachableHashes = new Set();

    while (queue.length > 0) {
      const [hash, q, r] = queue.shift();
      reachableHashes.add(hash);

      const neighbors = this.getNeighbors(q, r, cellsMap);
      for (const [neighborHash, neighbor] of neighbors) {
        if (visited.get(neighborHash) === false && !neighbor.getLocation().isBad()) {
          visited.set(neighborHash, true);
          queue.push([neighborHash, neighbor.q, neighbor.r]);
        }
      }
    }

    return reachableHashes; // возвращаем хеши достижимых локаций
  }

  getNeighbors(cellQ, cellR, cellsMap) {
    const neighbors = [];
    for (const [dq, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const nq = cellQ + dq,
        nr = cellR + dr;
      const hash = this.getLocationHash(nq, nr);
      const neighbor = cellsMap.get(hash);
      if (neighbor) {
        neighbors.push([hash, neighbor]);
      }
    }
    return neighbors;
  }

  fillCellWithWord(wordHash, wordBank, wordSet, cellsMap) {
    let word = cellsMap.get(wordHash);
    if (!word) {
      throw new Error(
        `Cell with hsh ${wordHash} does not exist in the ${wordSet} set`
      );
    }
    word.getLocation().setType(LocationType.WORD);
    word
      .getLocation()
      .setWord(this.pickRandomWord(wordBank, wordSet, cellsMap));
  }

  async populateWords(cellsMap, cellsHashes, wordCount) {
    // --- Размещение слов ---
    const wordBank = await fetch("./wordBank.json").then((response) =>
      response.json()
    );

    const wordSet = new Set();
    let currentWordHash = cellsHashes[0];
    let neighbors = [];

    for (let i = 0; i < wordCount; i++) {
      wordSet.add(currentWordHash);
      this.fillCellWithWord(currentWordHash, wordBank, wordSet, cellsMap);

      const cell = cellsMap.get(currentWordHash);
      neighbors.push(...this.getNeighbors(cell.getQ(), cell.getR(), cellsMap));
      neighbors = neighbors.filter(([neighborHash]) => !wordSet.has(neighborHash));

      const randomNeighborIndex = Math.floor(Math.random() * neighbors.length);
      const [nextWordNeighborHash] = neighbors[randomNeighborIndex];
      currentWordHash = nextWordNeighborHash;
    }

    return wordSet;
  }

  pickRandomWord(wordBank, wordSet, cellsMap) {
    const words = wordBank.words;
    if (words.length === 0) {
      throw new Error("Word bank is empty");
    }

    while (true) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const word = words[randomIndex];
      // Проверяем, что слово не было использовано
      const isUsed = Array.from(wordSet).some((hash) => {
        return cellsMap.get(hash).getLocation().getWord() === word;
      });

      if (isUsed) continue;
      else return word;
    }
  }

  cleanCellsLocations(cellsMap) {
    cellsMap.forEach((cell, hash) => cell.cleanLocation());
  }

  async generateCellsWithLocations() {
    const cellsMap = this.generateCellsMap();
    const cellsHashes = Array.from(cellsMap.keys());

    while (true) {
      // очистка ячеек от предыдущих попыток
      this.cleanCellsLocations(cellsMap);

      // Перемешиваем хеши ячеек
      shuffle(cellsHashes);

      const wordSet = await this.populateWords(
        cellsMap,
        cellsHashes,
        BASIC_LOCATION_COUNT.WORD_COUNT
      );
      const goodSet = new Set();
      const badSet = new Set();
      //TODO: move to parameters
      const numWater = BASIC_LOCATION_COUNT.WATER_COUNT;
      const numTreasure = BASIC_LOCATION_COUNT.TREASURE_COUNT;
      const numAmulet = BASIC_LOCATION_COUNT.AMULET_COUNT;
      const numCurse = BASIC_LOCATION_COUNT.CURSE_COUNT;
      const numTrap = BASIC_LOCATION_COUNT.TRAP_COUNT;
      const numExit = BASIC_LOCATION_COUNT.EXIT_COUNT;
      const numGood = numWater + numTreasure + numAmulet + numExit;
      const numBad = numCurse + numTrap;

      // --- Размещение Good locaions ---
      for (let hash of cellsHashes) {
        if (wordSet.has(hash)) continue; // пропускаем ячейки с WORD
        if (goodSet.size >= numGood) break;
        let ok = true;
        for (let g of goodSet) {
          const distance = this.distance(cellsMap.get(hash), cellsMap.get(g));
          if (distance < GAME_CONFIG.GOOD_LOCATION_MIN_DISTANCE) {
            ok = false;
            break;
          }
        }
        if (ok) {
          goodSet.add(hash);
          const location = cellsMap.get(hash).getLocation();
          if (goodSet.size <= numTreasure) {
            location.setType(LocationType.TREASURE); // Устанавливаем тип TREASURE
          } else if (goodSet.size <= numTreasure + numWater) {
            location.setType(LocationType.WATER); // Устанавливаем тип WATER
          } else if (goodSet.size <= numTreasure + numWater + numAmulet) {
            location.setType(LocationType.AMULET); // Устанавливаем тип AMULET
          } else if (
            goodSet.size <=
            numTreasure + numWater + numAmulet + numExit
          ) {
            location.setType(LocationType.EXIT); // Устанавливаем тип EXIT
          } else {
            throw new Error("Too many good locations");
          }
        }
      }
      if (goodSet.size < numGood) continue; // не влезли -> пробуем снова

      // --- Размещение B ---
      for (let hash of cellsHashes) {
        if (badSet.size >= numBad) break;
        if (!goodSet.has(hash) && !wordSet.has(hash)) {
          badSet.add(hash);
          const location = cellsMap.get(hash).getLocation();
          if (badSet.size <= numCurse) {
            location.setType(LocationType.CURSE); // Устанавливаем тип CURSE
          } else if (badSet.size <= numCurse + numTrap) {
            location.setType(LocationType.TRAP); // Устанавливаем тип TRAP
          } else {
            throw new Error("Too many bad locations");
          }
        }
      }

      // --- Проверка BFS ---
      const starts = Array.from(wordSet).map((h) => {
        return [h, cellsMap.get(h)];
      });
      if (starts.length === 0) {
        throw new Error("No starting points for BFS");
      }

      const reachable = this.bfsWhichGoodLocationsReachable(cellsMap, starts); // старт = (0,0)
      let allReachable = true;
      for (let g of goodSet) {
        if (!reachable.has(g)) {
          allReachable = false;
          break;
        }
      }

      if (allReachable) return cellsMap.values(); // успех, возвращаем карту
      // иначе -> цикл продолжится и сгенерит новую карту
    }
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
