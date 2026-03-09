export interface HaradaGrid {
  goal: string;
  pillars: Pillar[];
  highImpact?: string[]; // task keys like "0-Task text"
}

export interface Pillar {
  name: string;
  tasks: string[];
}

// The grid is 9x9. Center is the goal. 
// The 8 cells around center are pillars.
// Each pillar has its own 3x3 block where the pillar name is center and 8 tasks surround it.
// Layout mapping:
// Block positions (row, col) of 3x3 blocks in the 9x9:
// (0,0) (0,1) (0,2)
// (1,0) (1,1) (1,2)   <- (1,1) is the center block
// (2,0) (2,1) (2,2)
//
// In center block (1,1), the center cell (4,4) is the goal.
// Surrounding cells in center block map to pillar indices:
// Pillar order (in center block): 
// 0(TL) 1(T) 2(TR)
// 3(L)  G    4(R)
// 5(BL) 6(B) 7(BR)
//
// Each pillar's 3x3 block position maps:
// Pillar 0 -> block(0,0), Pillar 1 -> block(0,1), Pillar 2 -> block(0,2)
// Pillar 3 -> block(1,0),                         Pillar 4 -> block(1,2)
// Pillar 5 -> block(2,0), Pillar 6 -> block(2,1), Pillar 7 -> block(2,2)

const PILLAR_BLOCK_MAP: Record<number, [number, number]> = {
  0: [0, 0],
  1: [0, 1],
  2: [0, 2],
  3: [1, 0],
  4: [1, 2],
  5: [2, 0],
  6: [2, 1],
  7: [2, 2],
};

const CENTER_PILLAR_OFFSETS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

const TASK_OFFSETS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function buildGridCells(data: HaradaGrid): GridCell[][] {
  const grid: GridCell[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ type: 'empty' as const, text: '' }))
  );

  // Center cell = goal
  grid[4][4] = { type: 'center', text: data.goal };

  // Pillar names in center block
  data.pillars.forEach((pillar, i) => {
    const [dr, dc] = CENTER_PILLAR_OFFSETS[i];
    grid[4 + dr][4 + dc] = { type: 'pillar', text: pillar.name, pillarIndex: i };
  });

  // Each pillar's 3x3 block
  data.pillars.forEach((pillar, i) => {
    const [blockRow, blockCol] = PILLAR_BLOCK_MAP[i];
    const centerR = blockRow * 3 + 1;
    const centerC = blockCol * 3 + 1;

    // Pillar name at center of its block
    grid[centerR][centerC] = { type: 'pillar', text: pillar.name, pillarIndex: i };

    // 8 tasks around it
    TASK_OFFSETS.forEach(([dr, dc], taskIdx) => {
      grid[centerR + dr][centerC + dc] = {
        type: 'task',
        text: pillar.tasks[taskIdx] || '',
        pillarIndex: i,
      };
    });
  });

  return grid;
}

export interface GridCell {
  type: 'center' | 'pillar' | 'task' | 'empty';
  text: string;
  pillarIndex?: number;
}
