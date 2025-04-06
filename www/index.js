import init, { Universe } from "../pkg/wasm_game_of_life.js";

const wasm = await init();
const memory = wasm.memory;

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.height = (CELL_SIZE + 1) * height + 1;

let isPaused = false;
let isFrameLocked = true;
let lastFrameTime = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
const fpsDisplay = document.getElementById("fps");

const toggleBtn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");

const ctx = canvas.getContext('2d');

// Button handlers
toggleBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    toggleBtn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
});

resetBtn.addEventListener("click", () => {
    universe.randomize(); // You need to add this to Rust side!
});

const renderLoop = (timestamp) => {
    if (!isPaused) {
        if (timestamp - lastFrameTime >= 1000 / 60) {
            universe.tick();
            drawGrid();
            drawCells();
            lastFrameTime = timestamp;
        }

        frameCount++;
        if (timestamp - lastFpsUpdate >= 1000) {
            fpsDisplay.textContent = `FPS: ${frameCount}`;
            frameCount = 0;
            lastFpsUpdate = timestamp;
        }
    }
    requestAnimationFrame(renderLoop);
};

requestAnimationFrame(renderLoop);

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const bitIsSet = (n, arr) => {
    const byte = Math.floor(n / 8);
    const mask = 1 << (n % 8);
    return (arr[byte] & mask) === mask;
};

const drawCells = () => {
    const cellsPtr = universe.cells();

    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = bitIsSet(idx, cells)
                ? ALIVE_COLOR
                : DEAD_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
}

drawGrid();
drawCells();
requestAnimationFrame(renderLoop);

