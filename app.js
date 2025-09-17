const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const drawBtn = document.getElementById("draw-btn");
const eraseBtn = document.getElementById("erase-btn");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const colorPicker = document.getElementById("color-picker");
const brushSizeInput = document.getElementById("brush-size");

// Set canvas size to fill window
function resizeCanvas() {
  // Save current content before resizing
  const tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - document.querySelector(".toolbar").offsetHeight;

  // Restore saved content after resizing
  ctx.putImageData(tempImage, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); 

// Drawing state
let drawing = false;
let currentMode = "draw"; // or "erase"
let currentColor = colorPicker.value;
let currentBrushSize = brushSizeInput.value;

let undoStack = [];
let redoStack = [];

// Save current canvas state for undo
function saveState(stack, keepRedo = false) {
  if (!keepRedo) {
    redoStack = [];
    redoBtn.disabled = true;
  }
  stack.push(canvas.toDataURL());
  undoBtn.disabled = false;
}

// Restore canvas from a data URL
function restoreState(dataURL) {
  const img = new Image();
  img.src = dataURL;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// Start drawing
function startDrawing(event) {
  drawing = true;
  ctx.beginPath();
  const { x, y } = getCoordinates(event);
  ctx.moveTo(x, y);
  event.preventDefault();
}

// Draw or erase
function draw(event) {
  if (!drawing) return;
  const { x, y } = getCoordinates(event);
  if (currentMode === "erase") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  event.preventDefault();
}

// Stop drawing
function stopDrawing(event) {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
  saveState(undoStack);
  undoBtn.disabled = false;
  redoBtn.disabled = true;
}

// Get mouse/touch coordinates relative to canvas
function getCoordinates(event) {
  let x, y;
  if (event.touches) {
    x = event.touches[0].clientX - canvas.offsetLeft;
    y = event.touches[0].clientY - canvas.offsetTop;
  } else {
    x = event.clientX - canvas.offsetLeft;
    y = event.clientY - canvas.offsetTop;
  }
  return { x, y };
}

// Undo action
function undo() {
  if (undoStack.length > 0) {
    const lastState = undoStack.pop();
    redoStack.push(canvas.toDataURL());
    restoreState(lastState);

    redoBtn.disabled = false;
    if (undoStack.length === 0) {
      undoBtn.disabled = true;
    }
  }
}

// Redo action
function redo() {
  if (redoStack.length > 0) {
    const lastRedo = redoStack.pop();
    undoStack.push(canvas.toDataURL());
    restoreState(lastRedo);

    undoBtn.disabled = false;
    if (redoStack.length === 0) {
      redoBtn.disabled = true;
    }
  }
}

// Event Listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("touchstart", startDrawing, { passive: false });

canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchmove", draw, { passive: false });

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("touchend", stopDrawing);

drawBtn.addEventListener("click", () => {
  currentMode = "draw";
  drawBtn.classList.add("active");
  eraseBtn.classList.remove("active");
});

eraseBtn.addEventListener("click", () => {
  currentMode = "erase";
  eraseBtn.classList.add("active");
  drawBtn.classList.remove("active");
});

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

colorPicker.addEventListener("change", e => {
  currentColor = e.target.value;
});

brushSizeInput.addEventListener("change", e => {
  currentBrushSize = e.target.value;
});

// Initialize by saving blank state for undo
saveState(undoStack);
