import { BASIC_LOCATION_COUNT, GAME_CONFIG, LocationType } from "./constants.js";
import { Location } from "./location.js";
import { Cell } from "./cell.js";

export class GridGenerator {

  generateCellsArray() {
    const cells = [];
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
        cells.push(
          new Cell(id, q, r)
        );
        id++;
      }
    }

    return cells;
  }

  cellsArrayToMap(cells) {
    return new Map(
        cells.map(cell => [
            this.getLocationHash(cell.q, cell.r),
            cell
        ])
    );
  }

  distance(cellA, cellB) {
    return (Math.abs(cellA.q - cellB.q) +
        Math.abs(cellA.r - cellB.r) + Math.abs(cellA.s - cellB.s)) / 2;
  }

  getLocationHash(q, r) {
  // Преобразуем координаты q и r в строку для использования в качестве ключ
    return `${q},${r}`
}

  // BFS для проверки достижимости
  bfsWhichGoodLocationsReachable(map, starts) {

    const visited = new Map();
    for (const entry of map.entries()) {
      const [key, cell] = entry;
        visited.set(key, false);
    }

    const queue = [];
    for (const [startQ, startR] of starts) {
        queue.push([startQ, startR]);
        visited.set(this.getLocationHash(startQ,startR), true);

    }

    const reachable = new Set();

    while (queue.length > 0) {
      const [q, r] = queue.shift();
      const cell = map.get(this.getLocationHash(q, r));
      if (!cell) continue; // если ячейка не найдена, пропускаем
      reachable.add(cell);

      const neighbors = this.getNeighbors(cell, map);
      for (const neighbor of neighbors) {

        const hash = this.getLocationHash(neighbor.q, neighbor.r);
        if (visited.get(hash) === false && !neighbor.getLocation().isBad()) {
            visited.set(hash, true);
            queue.push([neighbor.q, neighbor.r]);
        }
      }
    }
      return new Set(
          Array.from(reachable)
          .map((cell) => cell.id)); // возвращаем индексы достижимых локаций
    }

    getNeighbors(cell, map) {
      const neighbors = [];
      for (const [dq, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]) {
        const nq = cell.q + dq, nr = cell.r + dr;
        const hash = this.getLocationHash(nq, nr);
        const neighbor = map.get(hash);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
      return neighbors;
    }

    fillCellWithWord(cells, index, wordBank, wordSet) {
      if (cells[index] === undefined) {
        throw new Error(`Cell with index ${index} does not exist in the ${cells} array`);
      }
      cells[index].getLocation().setType(LocationType.WORD);
      cells[index].getLocation().setWord(
        this.pickRandomWord(wordBank, wordSet, cells)
      );

    }

    async populateWords(cells, map, cellsIndexes) {
      const wordSet = new Set();
      // --- Размещение слов ---
      const wordBank = await fetch('./wordBank.json')
        .then(response => response.json());

      const firstWordIndex = cellsIndexes[0];
      wordSet.add(firstWordIndex);
      this.fillCellWithWord(cells, firstWordIndex, wordBank, wordSet);

      const neighbors = this.getNeighbors(cells[firstWordIndex], map);
      const randomNeighborIndex = Math.floor(Math.random() * neighbors.length)
      const secondWordNeighbor = neighbors[randomNeighborIndex];
      const secondWordIndex = cells.findIndex(cell => cell.id === secondWordNeighbor.id);
      wordSet.add(secondWordIndex);
      this.fillCellWithWord(cells, secondWordIndex, wordBank, wordSet);

      const secondWordNeighbors = this.getNeighbors(cells[secondWordIndex], map);
      const thirdWordNeighbors = this.getNeighbors(cells[firstWordIndex], map)
        .concat(secondWordNeighbors)
        .filter(n =>
          n.id !== cells[firstWordIndex].id &&
          n.id !== cells[secondWordIndex].id
        );

      if (thirdWordNeighbors.length > 0) {
        const thirdWordIndex = cells.findIndex(
          cell => cell.id === thirdWordNeighbors[Math.floor(Math.random() * thirdWordNeighbors.length)].id
        );
        wordSet.add(thirdWordIndex);
        this.fillCellWithWord(cells, thirdWordIndex, wordBank, wordSet);
      }
      return wordSet;
    }

    pickRandomWord(wordBank, wordSet, cells) {
        const words = wordBank.words;
        if (words.length === 0) {
          throw new Error('Word bank is empty');
        }

        while (true) {
        const randomIndex = Math.floor(Math.random() * words.length);
        const word = words[randomIndex];
        // Проверяем, что слово не было использовано
        const isUsed = Array.from(wordSet).some(index => {
          return cells[index].getLocation().getWord() === word;
        });

        if(isUsed) continue; else return word;
      }
    }

    async generateCellsWithLocations() {

      /*const wordBank = await fetch('./wordBank.json')
        .then(response => response.json());*/
      const cells = this.generateCellsArray();
      const map = this.cellsArrayToMap(cells);

        while (true) { // пробуем, пока не получится корректная карта
            cells.forEach(cell => {
                cell.setLocation(new Location(LocationType.EMPTY));
            });
            // Перемешиваем индексы ячеек, чтобы случайно выбирать яч
            const cellsIndexes = Array.from({ length: cells.length },
                (_, i) => i);
            shuffle(cellsIndexes);

            const wordSet = await this.populateWords(cells, map, cellsIndexes);
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
            for (let idx of cellsIndexes) {
                if (wordSet.has(idx)) continue; // пропускаем ячейки с WORD
                if (goodSet.size >= numGood) break;
                let ok = true;
                for (let g of goodSet) {
                    const distance = this.distance(cells[idx], cells[g]);
                    if (distance < GAME_CONFIG.GOOD_LOCATION_MIN_DISTANCE) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    goodSet.add(idx);
                    const location = cells[idx].getLocation();
                    if (goodSet.size <= numTreasure) {
                      location.setType(LocationType.TREASURE); // Устанавливаем тип TREASURE
                    } else if (goodSet.size <= numTreasure + numWater) {
                      location.setType(LocationType.WATER); // Устанавливаем тип WATER
                    } else if (goodSet.size <= numTreasure + numWater + numAmulet) {
                      location.setType(LocationType.AMULET); // Устанавливаем тип AMULET
                    } else if (goodSet.size <= numTreasure + numWater + numAmulet + numExit) {
                      location.setType(LocationType.EXIT); // Устанавливаем тип EXIT
                    } else {
                        throw new Error('Too many good locations');
                    }
                }
            }
            if (goodSet.size < numGood) continue; // не влезли -> пробуем снова

            // --- Размещение B ---
            for (let idx of cellsIndexes) {
                if (badSet.size >= numBad) break;
                if (!goodSet.has(idx) && !wordSet.has(idx)) {
                    badSet.add(idx);
                    const location = cells[idx].getLocation();
                    if (badSet.size <= numCurse) {
                      location.setType(LocationType.CURSE); // Устанавливаем тип CURSE
                    } else if (badSet.size <= numCurse + numTrap) {
                      location.setType(LocationType.TRAP); // Устанавливаем тип TRAP
                    } else {
                        throw new Error('Too many bad locations');
                    }
                }
            }

            // --- Проверка BFS ---
            const starts = Array.from(wordSet).map(id => {
                const cell = cells[id];
                return [cell.q, cell.r];
            });
            if (starts.length === 0) {
                throw new Error('No starting points for BFS');
            }

            const reachable = this.bfsWhichGoodLocationsReachable(map, starts); // старт = (0,0)
            let allReachable = true;
            for (let g of goodSet) {
                if (!reachable.has(g)) {
                    allReachable = false;
                    break;
                }
            }

            if (allReachable) return cells; // успех, возвращаем карту
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