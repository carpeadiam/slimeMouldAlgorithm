const agentColor = new Uint8Array([0, 0, 0]);
const agentsNum = 2500;
const sensorOffset = 15;
const sensorAngle = Math.PI / 7;
const turnAngle = Math.PI / 5;
const foodDetectionRange = 100;
const agentsReachedThreshold = 0.0001; 
let agents;
let maze;
const mazeCols = 25;
const mazeRows = 25;
const cellSize = 20;
const mazeTimeout = 10000; // 10 seconds timeout for maze generation
const endPointRadius = 25; // Black dot radius
const endPointX = (3 * mazeCols * cellSize) / 4; // X-coordinate of black dot
const endPointY = (3 * mazeRows * cellSize) / 4; // Y-coordinate of black dot
let agentsStopped = false; // Flag to stop agent updates once goal is reached


function setup() {
  createCanvas(mazeCols * cellSize, mazeRows * cellSize);
  pixelDensity(1);
  background(255);
  agents = new Agents();
  maze = generateMaze(mazeCols, mazeRows, mazeTimeout);
  drawMaze();
}

function draw() {
  if (!agentsStopped) {
    loadPixels();
    for (let i = 10; i--; ) {
      agents.update();
    }
    updatePixels();

    // Fade away the trails gradually
    fadeTrails();

    // Draw start and end points
    fill(0, 255, 0);
    ellipse(10, 10, endPointRadius, endPointRadius);

    fill(0); // Black color for the end point
    ellipse(endPointX, endPointY, endPointRadius, endPointRadius);

    if (agents.haveMostAgentsReachedGoal()) {
      highlightBestPath();
      agentsStopped = true; // Stop updating agents once the goal is reached
    }
  }
}

function fadeTrails() {
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0) {
      pixels[i + 3] -= 5;
    }
  }
}

class Agent {
  constructor() {
    this.x = 10;
    this.y = 10;
    this.dir = random(TWO_PI);
    this.hasReachedPoint = false;
    this.path = [];
  }

  updateDirection() {
    const foodDirection = this.getFoodDirection();
    if (foodDirection) {
      this.dir = foodDirection;
    } else {
      const right = this.sense(+sensorAngle);
      const center = this.sense(0);
      const left = this.sense(-sensorAngle);

      const threeWays = [left, center - 1, right];
      const minIndex = threeWays.indexOf(min(...threeWays));
      this.dir += turnAngle * (minIndex - 1);
    }
  }

  sense(dirOffset) {
    const angle = this.dir + dirOffset;
    let x = floor(this.x + sensorOffset * cos(angle));
    let y = floor(this.y + sensorOffset * sin(angle));
    x = constrain(x, 0, width - 1);
    y = constrain(y, 0, height - 1);

    const index = (x + y * width) * 4;
    return pixels[index];
  }

  updatePosition() {
    const nextX = this.x + cos(this.dir);
    const nextY = this.y + sin(this.dir);

    // Check if the next position is a wall
    if (!isWall(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    }

    this.x = constrain(this.x, 0, width - 1);
    this.y = constrain(this.y, 0, height - 1);

    const index = floor(this.x) + floor(this.y) * width;
    pixels.set(agentColor, index * 4);

    this.path.push({ x: this.x, y: this.y });
  }

  getFoodDirection() {
    if (!this.hasReachedPoint) {
      const distance = dist(this.x, this.y, endPointX, endPointY);
      if (distance < 0.1 * foodDetectionRange) {
        this.hasReachedPoint = true;
        return atan2(endPointY - this.y, endPointX - this.x);
      }
    }
    return null;
  }
}

class Agents {
  constructor() {
    this.agents = Array(agentsNum)
      .fill()
      .map((e) => new Agent());
  }

  update() {
    this.agents.forEach((e) => {
      e.updateDirection();
      e.updatePosition();
    });
  }

  haveMostAgentsReachedGoal() {
    const reachedCount = this.agents.filter(agent => agent.hasReachedPoint).length;
    return reachedCount / this.agents.length >= agentsReachedThreshold;
  }
}

function isWall(x, y) {
  const col = floor(x / cellSize);
  const row = floor(y / cellSize);
  if (col < 0 || col >= mazeCols || row < 0 || row >= mazeRows) {
    return true;
  }
  return !maze[col][row];
}

function generateMaze(cols, rows, timeout) {
  let grid = Array(cols).fill().map(() => Array(rows).fill(false));
  let stack = [];
  let current = { x: 0, y: 0 };
  stack.push(current);
  const startTime = millis();

  while (stack.length > 0) {
    if (millis() - startTime > timeout) {
      console.error("Maze generation timeout.");
      break;
    }

    let { x, y } = current;
    grid[x][y] = true;

    let neighbors = [];
    if (x > 0 && !grid[x - 1][y]) neighbors.push({ x: x - 1, y });
    if (x < cols - 1 && !grid[x + 1][y]) neighbors.push({ x: x + 1, y });
    if (y > 0 && !grid[x][y - 1]) neighbors.push({ x, y: y - 1 });
    if (y < rows - 1 && !grid[x][y + 1]) neighbors.push({ x, y: y + 1 });

    if (neighbors.length > 0) {
      let next = random(neighbors);
      stack.push(current);
      removeWall(current, next);
      current = next;
    } else {
      current = stack.pop();
    }
  }

  return grid;
}

function removeWall(a, b) {
  let x = ((a.x + b.x) / 2) * cellSize;
  let y = ((a.y + b.y) / 2) * cellSize;
  noStroke();
  fill(150); // Different color for maze walls
  rect(x, y, cellSize, cellSize);
}

function drawMaze() {
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[0].length; j++) {
      if (!maze[i][j]) {
        let x = i * cellSize;
        let y = j * cellSize;
        fill(150); // Different color for maze walls
        rect(x, y, cellSize, cellSize);
      }
    }
  }
}

function highlightBestPath() {
  let shortestPath = [];
  let minLength = Infinity;

  agents.agents.forEach(agent => {
    if (agent.hasReachedPoint && agent.path.length < minLength) {
      minLength = agent.path.length;
      shortestPath = agent.path;
    }
  });

  // Remove loops from the shortest path
  let optimizedPath = removeLoops(shortestPath);

  if (optimizedPath.length > 0) {
    noFill();
    stroke(255, 255, 0); // Yellow color for the best path
    strokeWeight(2);
    beginShape();
    optimizedPath.forEach(p => vertex(p.x, p.y));
    endShape();
  }
}

function removeLoops(path) {
  let visited = new Map();
  let optimizedPath = [];

  path.forEach(point => {
    let key = `${floor(point.x)}-${floor(point.y)}`;
    if (visited.has(key)) {
      // Remove loop by slicing the path
      optimizedPath = optimizedPath.slice(0, visited.get(key) + 1);
    }
    optimizedPath.push(point);
    visited.set(key, optimizedPath.length - 1);
  });

  return optimizedPath;
}
