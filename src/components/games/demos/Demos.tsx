import React, { useEffect, useRef, useState } from "react";

// Simple Canvas Maze Demo
const MazeDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const cols = 15;
    const rows = 11;
    const cell = 28;
    const start = { x: 0, y: 0 };
    const end = { x: cols - 1, y: rows - 1 };

    // Build maze using DFS
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ v: false, w: { t: true, r: true, b: true, l: true } }))
    );
    const stack: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
    grid[0][0].v = true;

    const shuffle = <T,>(a: T[]) => a.sort(() => Math.random() - 0.5);
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const dirs = shuffle([
        { dx: 0, dy: -1, key: "t", opp: "b" },
        { dx: 1, dy: 0, key: "r", opp: "l" },
        { dx: 0, dy: 1, key: "b", opp: "t" },
        { dx: -1, dy: 0, key: "l", opp: "r" },
      ]);
      let moved = false;
      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !grid[ny][nx].v) {
          // knock walls
          (grid[cur.y][cur.x].w as any)[d.key] = false;
          (grid[ny][nx].w as any)[d.opp] = false;
          grid[ny][nx].v = true;
          stack.push({ x: nx, y: ny });
          moved = true;
          break;
        }
      }
      if (!moved) stack.pop();
    }

    const ctx = canvasRef.current!.getContext("2d")!;
    const W = cols * cell + 2;
    const H = rows * cell + 2;
    canvasRef.current!.width = W;
    canvasRef.current!.height = H;

    const player = { x: start.x, y: start.y };

    const draw = () => {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);

      // draw maze
      ctx.strokeStyle = "#7f1d1d"; // themed red
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const g = grid[y][x].w;
          const ox = x * cell + 1;
          const oy = y * cell + 1;
          if (g.t) {
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox + cell, oy);
          }
          if (g.r) {
            ctx.moveTo(ox + cell, oy);
            ctx.lineTo(ox + cell, oy + cell);
          }
          if (g.b) {
            ctx.moveTo(ox, oy + cell);
            ctx.lineTo(ox + cell, oy + cell);
          }
          if (g.l) {
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox, oy + cell);
          }
        }
      }
      ctx.stroke();

      // start/end
      ctx.fillStyle = "#064e3b"; // green-ish
      ctx.fillRect(start.x * cell + 6, start.y * cell + 6, cell - 12, cell - 12);
      ctx.fillStyle = "#1d4ed8"; // blue-ish
      ctx.fillRect(end.x * cell + 6, end.y * cell + 6, cell - 12, cell - 12);

      // player
      ctx.fillStyle = "#dc2626"; // red
      ctx.beginPath();
      ctx.arc(player.x * cell + cell / 2 + 1, player.y * cell + cell / 2 + 1, cell / 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const canMove = (nx: number, ny: number) => {
      const cur = grid[player.y][player.x].w;
      if (nx > player.x && cur.r) return false;
      if (nx < player.x && cur.l) return false;
      if (ny > player.y && cur.b) return false;
      if (ny < player.y && cur.t) return false;
      return true;
    };

    const onKey = (e: KeyboardEvent) => {
      if (won) return;
      let nx = player.x;
      let ny = player.y;
      if (e.key === "ArrowUp") ny--;
      if (e.key === "ArrowDown") ny++;
      if (e.key === "ArrowLeft") nx--;
      if (e.key === "ArrowRight") nx++;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
      // check walls around origin or target
      if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
        if (player.x === end.x && player.y === end.y) setWon(true);
        draw();
      }
    };

    draw();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [won]);

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="w-full border border-red-900/50 rounded" />
      <p className="text-xs text-red-300/70">Use arrow keys to reach the blue exit.</p>
      {won && <div className="text-green-400 text-sm">You escaped the maze!</div>}
    </div>
  );
};

// Minimal Pacman-like Demo
const PacmanDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const size = 16;
    const cols = 21;
    const rows = 15;
    const W = cols * size;
    const H = rows * size;
    const ctx = canvasRef.current!.getContext("2d")!;
    canvasRef.current!.width = W;
    canvasRef.current!.height = H;

    const grid: number[][] = Array.from({ length: rows }, (_, y) =>
      Array.from({ length: cols }, (_, x) => (y === 0 || x === 0 || y === rows - 1 || x === cols - 1 ? 1 : 0))
    );
    // scatter pellets
    const pellets = new Set<string>();
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (Math.random() > 0.15) pellets.add(`${x},${y}`);
      }
    }

    const player = { x: 1, y: 1 };
    const ghosts = [
      { x: cols - 2, y: rows - 2 },
      { x: cols - 2, y: 1 },
      { x: 1, y: rows - 2 },
    ];

    const draw = () => {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);

      // walls
      ctx.fillStyle = "#7f1d1d";
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) if (grid[y][x] === 1) ctx.fillRect(x * size, y * size, size, size);

      // pellets
      ctx.fillStyle = "#f59e0b";
      pellets.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        ctx.beginPath();
        ctx.arc(x * size + size / 2, y * size + size / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // player
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(player.x * size + size / 2, player.y * size + size / 2, size / 2 - 2, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.lineTo(player.x * size + size / 2, player.y * size + size / 2);
      ctx.fill();

      // ghosts
      ctx.fillStyle = "#22d3ee";
      ghosts.forEach((g) => ctx.fillRect(g.x * size + 2, g.y * size + 2, size - 4, size - 4));
    };

    const canMove = (x: number, y: number) => grid[y]?.[x] !== 1;

    const step = () => {
      // random ghost movement
      ghosts.forEach((g) => {
        const moves = [
          { x: g.x + 1, y: g.y },
          { x: g.x - 1, y: g.y },
          { x: g.x, y: g.y + 1 },
          { x: g.x, y: g.y - 1 },
        ].filter((m) => canMove(m.x, m.y));
        if (moves.length) Object.assign(g, moves[Math.floor(Math.random() * moves.length)]);
      });

      // check collisions
      for (const g of ghosts) {
        if (g.x === player.x && g.y === player.y) {
          setScore(0);
          player.x = 1;
          player.y = 1;
        }
      }

      draw();
    };

    const onKey = (e: KeyboardEvent) => {
      let nx = player.x;
      let ny = player.y;
      if (e.key === "ArrowUp") ny--;
      if (e.key === "ArrowDown") ny++;
      if (e.key === "ArrowLeft") nx--;
      if (e.key === "ArrowRight") nx++;
      if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
        const key = `${player.x},${player.y}`;
        if (pellets.has(key)) {
          pellets.delete(key);
          setScore((s) => s + 10);
        }
        draw();
      }
    };

    draw();
    const timer = setInterval(step, 400);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="w-full border border-red-900/50 rounded" />
      <p className="text-xs text-red-300/70">Use arrow keys. Score: {score}</p>
    </div>
  );
};

// Minimal Space Shooter Demo
const SpaceShooterDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const W = 420, H = 260;
    const ctx = canvasRef.current!.getContext("2d")!;
    canvasRef.current!.width = W;
    canvasRef.current!.height = H;

    const ship = { x: W / 2, y: H - 20 };
    const bullets: Array<{ x: number; y: number }> = [];
    const enemies: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < 12; i++) enemies.push({ x: 30 + i * 32, y: 20 + Math.floor(i / 6) * 30 });

    const draw = () => {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);
      // ship
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(ship.x - 10, ship.y - 6, 20, 12);
      // bullets
      ctx.fillStyle = "#fde047";
      bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 6, 4, 6));
      // enemies
      ctx.fillStyle = "#22d3ee";
      enemies.forEach((e) => ctx.fillRect(e.x - 8, e.y - 8, 16, 16));
    };

    const tick = () => {
      bullets.forEach((b) => (b.y -= 6));
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.abs(b.x - e.x) < 10 && Math.abs(b.y - e.y) < 10) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            setScore((s) => s + 50);
            break;
          }
        }
      }
      draw();
      requestAnimationFrame(tick);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") ship.x = Math.max(15, ship.x - 12);
      if (e.key === "ArrowRight") ship.x = Math.min(W - 15, ship.x + 12);
      if (e.key.toLowerCase() === " " || e.key.toLowerCase() === "z") bullets.push({ x: ship.x, y: ship.y - 10 });
    };

    draw();
    requestAnimationFrame(tick);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="w-full border border-red-900/50 rounded" />
      <p className="text-xs text-red-300/70">Arrows to move, Space/Z to shoot. Score: {score}</p>
    </div>
  );
};

export { MazeDemo, PacmanDemo, SpaceShooterDemo };
