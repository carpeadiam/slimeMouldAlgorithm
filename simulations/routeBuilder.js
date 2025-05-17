let agentColor = new Uint8Array([0, 0, 0]);
let agentsNum = 1500;
let sensorOffset = 15;
let sensorAngle = Math.PI / 7;
let turnAngle = Math.PI / 5;
let agents;
let input, button, imgInput, stopButton;
let img;
let simulationRunning = false;
let simulationStopped = false;
let canvasSet = false;
let importantPoints = [];
const foodDetectionRange = 100; 
let capturedDrawing;

function setup() {
  createCanvas(720, 720); 
  pixelDensity(1);
  background(0);

  
  input = createInput();
  input.position(10, height + 10);

  button = createButton('Set Points and Size');
  button.position(input.x + input.width + 10, height + 10);
  button.mousePressed(parseInput);

  
  imgInput = createFileInput(handleFile);
  imgInput.position(button.x + button.width + 10, height + 10);

  
  stopButton = createButton('Stop Simulation');
  stopButton.position(imgInput.x + imgInput.width + 10, height + 10);
  stopButton.mousePressed(stopSimulation);

  agents = new Agents();
}

function draw() {
  if (simulationRunning && !simulationStopped) {
    background(255, 10);

   
    fill(0, 0, 0); 
    for (const point of importantPoints) {
      ellipse(point.x, point.y, 20, 20); 
    }

    if (mouseIsPressed) {
      line(pmouseX, pmouseY, mouseX, mouseY);
    }

    loadPixels();
    for (let i = 10; i--; ) {
      agents.update();
    }
    updatePixels();
  } else if (simulationStopped && capturedDrawing) {
    background(255);
    if (img) {
      image(img, 0, 0, width, height);
    }
    tint(255, 127); 
    image(capturedDrawing, 0, 0);
    noTint(); 
  }
}

function parseInput() {
  const inputText = input.value();
  const regex = /\((\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)\)|\((\d+\.?\d*),\s*(\d+\.?\d*)\)/g;
  let match;

  importantPoints = [];
  canvasSet = false;

  while ((match = regex.exec(inputText)) !== null) {
    if (match[1] && match[2]) {
      
      const newWidth = parseFloat(match[1]);
      const newHeight = parseFloat(match[2]);
      resizeCanvas(newWidth, newHeight);
      input.position(10, newHeight + 10);
      button.position(input.x + input.width + 10, newHeight + 10);
      imgInput.position(button.x + button.width + 10, newHeight + 10);
      stopButton.position(imgInput.x + imgInput.width + 10, newHeight + 10);
      canvasSet = true;
    } else if (match[3] && match[4]) {
      
      const x = parseFloat(match[3]);
      const y = parseFloat(match[4]);
      importantPoints.push({ x, y });
    }
  }

  if (!canvasSet) {
    alert('Canvas size please set');
  } else {
    simulationRunning = true;
    simulationStopped = false;
    agents = new Agents();
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data);
  } else {
    img = null;
  }
}

function stopSimulation() {
  simulationRunning = false;
  simulationStopped = true;
  capturedDrawing = get(0, 0, width, height); 
}

class Agent {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.dir = random(TWO_PI);
    this.hasReachedPoint = false;
  }

  updateDirection() {
    const foodDirection = this.getFoodDirection();
    if (foodDirection) {
      this.dir = foodDirection;
    } else {
      const right = this.sense(sensorAngle);
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
    x = (x + width) % width;
    y = (y + height) % height;

    const index = (x + y * width) * 4;
    return pixels[index];
  }

  updatePosition() {
    this.x += cos(this.dir);
    this.y += sin(this.dir);
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;

    const index = floor(this.x) + floor(this.y) * width;
    pixels.set(agentColor, index * 4);
  }

  getFoodDirection() {
    if (!this.hasReachedPoint) {
      let closestDistance = Infinity;
      let closestPoint = null;

      for (const point of importantPoints) {
        const distance = dist(this.x, this.y, point.x, point.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      }

      if (closestDistance < foodDetectionRange) {
        this.hasReachedPoint = true;
        return atan2(closestPoint.y - this.y, closestPoint.x - this.x);
      }
    }

    return null;
  }
}

class Agents {
  constructor() {
    this.agents = Array(agentsNum)
      .fill()
      .map(() => new Agent());
  }

  update() {
    this.agents.forEach((agent) => {
      agent.updateDirection();
      agent.updatePosition();
    });
  }
}
