// Set up the canvas

const canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  dropZone = document.getElementById("drop-zone"),
  image = new Image(),
  handleRadius = 6,
  handleColor = "#fff",
  handleStrokeColor = "#028bff",
  handleStrokeWidth = 2,
  hoverColor = "#fff",
  toolButtons = document.querySelectorAll("#tools button"),
  clearButton = document.getElementById("clear-canvas"),
  saveButton = document.getElementById("save-image");

let brightness = 100,
  mouseX = 0,
  mouseY = 0,
  mouseIsDown = false,
  handles = [],
  offsetX = canvas.offsetLeft,
  offsetY = canvas.offsetTop;

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Set up the tools

class Tool {
  static Brightness = new Tool("brightness", { popup: "brightness-container" });
  static Crop = new Tool("crop", { cursor: "move" });
  static Edit = new Tool("edit", {});
  static Line = new Tool("line", { cursor: "crosshair" });
  static Rectangle = new Tool("rectangle", { cursor: "crosshair" });
  static Polygon = new Tool("polygon", { cursor: "crosshair" });
  static Text = new Tool("text", { cursor: "text" });

  constructor(name, properties) {
    this.name = name;
    this.cursor = properties.cursor;
    this.popup = properties.popup;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw() {
    ctx.fillStyle = handleColor;
    ctx.strokeStyle = handleStrokeColor;
    ctx.lineWidth = handleStrokeWidth;
    ctx.beginPath();
    ctx.arc(this.x, this.y, handleRadius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
  }
}

class Shape {
  constructor() {
    this.hovered = false;
    this.selected = false;
    this.type = this.toString();
  }

  containsPoint() {
    throw `containsPoint() isn't implemented for ${this.toString()}`;
  }

  draw() {
    throw `draw() isn't implemented for ${this.toString()}`;
  }

  setEnd() {
    throw `setEnd() isn't implemented for ${this.toString()}`;
  }

  toString() {
    return Object.getPrototypeOf(this).constructor.name;
  }
}

class Line extends Shape {
  constructor(start, end, color = drawingColor, width = 4) {
    super();
    this.start = start;
    this.end = end;
    this.color = color;
    this.width = width;
  }

  containsPoint(x, y, affordance = 8) {
    if (this.start.x > this.end.x) {
      const start = this.end;
      this.end = this.start;
      this.start = start;
    }

    const yMin = Math.min(this.start.y, this.end.y);
    const yMax = Math.max(this.start.y, this.end.y);

    if (x < this.start.x || x > this.end.x || y < yMin || y > yMax)
      return false;

    const deltaX = this.end.x - this.start.x;
    const deltaY = this.end.y - this.start.y;
    const xPct = (x - this.start.x) / deltaX;
    const expectedY = deltaY * xPct + this.start.y;
    console.log({ xPct, expectedY, x, y, yMin, deltaY });
    return y > expectedY - affordance && y < expectedY + affordance;
  }

  draw() {
    ctx.strokeStyle = this.color;
    if (this.hovered) ctx.strokeStyle = hoverColor;

    ctx.lineWidth = this.width;
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();

    if (this.selected) this.drawHandles();
  }

  drawHandles() {
    this.start.draw();
    this.end.draw();
  }

  setEnd(end) {
    this.end = end;
  }
}

class Rectangle extends Shape {
  constructor(topLeft, bottomRight, color = drawingColor) {
    super();
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.color = color;
  }

  containsPoint(x, y) {
    return (
      x > this.topLeft.x &&
      x < this.bottomRight.x &&
      y > this.topLeft.y &&
      y < this.bottomRight.y
    );
  }

  draw() {
    ctx.fillStyle = this.color;
    if (this.hovered) ctx.fillStyle = hoverColor;
    ctx.beginPath();
    ctx.fillRect(this.topLeft.x, this.topLeft.y, this.width(), this.height());
    ctx.fill();

    if (this.selected) this.drawHandles();
  }

  drawHandles() {
    this.topLeft.draw();
    this.bottomRight.draw();
    const topRight = new Point(this.bottomRight.x, this.topLeft.y);
    topRight.draw();
    const bottomLeft = new Point(this.topLeft.x, this.bottomRight.y);
    bottomLeft.draw();
  }

  height() {
    return Math.abs(this.bottomRight.y - this.topLeft.y);
  }

  setEnd(end) {
    this.bottomRight = end;
  }

  width() {
    return Math.abs(this.bottomRight.x - this.topLeft.x);
  }
}

class Polygon extends Shape {
  constructor(start, color = drawingColor, width = 4) {
    super();
    this.lines = [];
    this.closed = false;
    this.start = start;
    this.color = color;
    this.width = width;
  }

  containsPoint(x, y) {
    for (const line of this.lines) {
      if (line.containsPoint(x, y)) {
        console.log("hit");
        return true;
      }
    }
    return false;
  }

  draw() {
    for (const line of this.lines) {
      line.hovered = this.hovered;
      line.draw();
      line.hovered = false;
      if (this.selected) line.drawHandles();
    }
  }

  addLine(line) {
    if (
      this.lines.length > 2 &&
      Math.abs(this.start.x - line.end.x) < 20 &&
      Math.abs(this.start.y - line.end.y) < 20
    ) {
      this.lines[this.lines.length - 1].end.x = this.start.x;
      this.lines[this.lines.length - 1].end.y = this.start.y;
      this.closed = true;
      return;
    }
    this.lines.push(line);
  }

  setEnd(end) {
    this.end = end;
  }
}

class Text extends Shape {
  constructor(
    start,
    text = "",
    color = drawingColor,
    size = 24,
    font = "serif"
  ) {
    super();
    this.color = color;
    this.font = font;
    this.size = size;
    // start refers to the start point of the baseline, rather than the top
    // left corner
    this.start = start;
    this.text = text;
  }

  addChar(str) {
    this.text += str;
  }

  containsPoint(x, y) {
    ctx.font = `${this.size}px ${this.font}`;
    const measurements = ctx.measureText(this.text);
    const xMin = this.start.x;
    const xMax = this.start.x + measurements.width;
    const yMin = this.start.y - measurements.actualBoundingBoxAscent;
    const yMax = this.start.y + measurements.actualBoundingBoxDescent;

    return x > xMin && x < xMax && y > yMin && y < yMax;
  }

  deleteLastChar() {
    this.text = this.text.slice(0, -1);
  }

  draw() {
    ctx.fillStyle = this.color;
    if (this.hovered) ctx.fillStyle = hoverColor;
    ctx.font = `${this.size}px ${this.font}`;
    ctx.fillText(this.text, this.start.x, this.start.y);

    if (this.selected) this.drawHandles();
  }

  drawHandles() {
    ctx.font = `${this.size}px ${this.font}`;
    const measurements = ctx.measureText(this.text);

    const xMin = this.start.x;
    const xMax = this.start.x + measurements.width;
    const yMin = this.start.y - measurements.actualBoundingBoxAscent;
    const yMax = this.start.y + measurements.actualBoundingBoxDescent;

    const topLeft = new Point(xMin, yMin);
    const topRight = new Point(xMax, yMin);
    const bottomLeft = new Point(xMin, yMax);
    const bottomRight = new Point(xMax, yMax);

    topLeft.draw();
    topRight.draw();
    bottomLeft.draw();
    bottomRight.draw();
  }
}

let activeTool = null,
  activeShape = null,
  activePolygon = null,
  shapes = [];

function handleToolClick(event) {
  event.preventDefault();
  const btn = event.currentTarget;

  let tool = null;
  switch (btn.dataset.tool) {
    case "brightness":
      tool = Tool.Brightness;
      break;
    case "crop":
      tool = Tool.Crop;
      break;
    case "edit":
      tool = Tool.Edit;
      break;
    case "line":
      tool = Tool.Line;
      break;
    case "rectangle":
      tool = Tool.Rectangle;
      break;
    case "polygon":
      tool = Tool.Polygon;
      break;
    case "text":
      tool = Tool.Text;
      break;
  }

  setActiveTool(tool);
}

function setActiveTool(tool) {
  if (tool === activeTool) {
    clearActiveTool();
  } else {
    if (activeTool) {
      clearActiveTool();
    }
    activeTool = tool;
    document
      .querySelector(`#tools button[data-tool=${tool.name}`)
      .classList.add("active");
    canvas.style.cursor = activeTool.cursor || "default";
    if (tool.popup) {
      document.getElementById(tool.popup).style.display = "block";
    }
  }
}

function clearActiveTool() {
  const activeButton = document.querySelector("#tools button.active");
  if (activeButton) activeButton.classList.remove("active");
  canvas.style.cursor = "default";
  if (activeTool.popup) {
    document.getElementById(activeTool.popup).style.display = "none";
  }
  if (activeShape) activeShape.selected = false;
  activeShape = null;
  activeTool = null;
  drawShapes();
}

for (const btn of toolButtons) {
  btn.addEventListener("click", handleToolClick);
}

clearButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to start over?")) {
    clearCanvas();
    editor.style.display = "none";
    dropZone.style.display = "flex";
  }
});

saveButton.addEventListener("click", () => {
  const data = canvas.toDataURL("image/jpeg");
  saveButton.href = data;
});

const colorPicker = document.getElementById("color-picker");
var drawingColor = colorPicker.value;

colorPicker.addEventListener("change", (event) => {
  drawingColor = event.target.value;
  if (activeShape) {
    activeShape.color = drawingColor;
    drawShapes();
  }
});

const brightnessSlider = document.getElementById("brightness-slider");

brightnessSlider.addEventListener("change", (event) => {
  brightness = parseInt(event.target.value);
  drawShapes();
});

// Handle images being dragged and dropped or selected

function drawImageToFit(image) {
  const xScale = canvas.width / image.width;
  const yScale = canvas.height / image.height;
  const scale = Math.min(xScale, yScale);

  if (scale === xScale) {
    canvas.height = image.height * scale;
  } else {
    canvas.width = image.width * scale;
  }

  const x = canvas.width / 2 - (image.width / 2) * scale;
  const y = canvas.height / 2 - (image.height / 2) * scale;

  ctx.filter = `brightness(${brightness}%)`;
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
  ctx.filter = "none";
}

image.addEventListener("load", function () {
  clearCanvas();
  drawImageToFit(image);

  editor.style.display = "block";
  dropZone.style.display = "none";

  offsetX = canvas.offsetLeft + canvas.offsetParent.offsetLeft;
  offsetY = canvas.offsetTop + canvas.offsetParent.offsetTop;

  // if (handles.length === 0) {
  //   handles = handles.concat([
  //     {
  //       cursor: "move",
  //       x: canvas.width / 3,
  //       y: canvas.height / 3,
  //     },
  //     {
  //       cursor: "move",
  //       x: (canvas.width * 2) / 3,
  //       y: canvas.height / 3,
  //     },
  //     {
  //       cursor: "move",
  //       x: canvas.width / 3,
  //       y: (canvas.height * 2) / 3,
  //     },
  //     {
  //       cursor: "move",
  //       x: (canvas.width * 2) / 3,
  //       y: (canvas.height * 2) / 3,
  //     },
  //   ]);

  //   drawShapes();
  // }
});

function setImageToFile(file) {
  var reader = new FileReader();
  reader.onload = function (event) {
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function dragEnterHandler(event) {
  event.preventDefault();
  event.target.classList.add("over");
}

function dragLeaveHandler(event) {
  event.preventDefault();
  event.target.classList.remove("over");
}

function dragOverHandler(event) {
  event.preventDefault();
}

function dropHandler(event) {
  event.preventDefault();
  event.target.classList.remove("over");

  if (event.dataTransfer.files.length === 0) {
    return alert("No images were provided");
  } else if (event.dataTransfer.files.length > 1) {
    return alert("Only one image can be edited at a time.");
  }

  var file = event.dataTransfer.files[0];
  var allowedFiletypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedFiletypes.includes(file.type)) {
    return alert("Only .jpg, .png, and .webp images can be edited");
  }

  setImageToFile(file);
}

function selectHandler(event) {
  setImageToFile(event.target.files[0]);
}

// Handle mouse actions

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouseX = parseInt(event.clientX - offsetX);
    mouseY = parseInt(event.clientY - offsetY);
    lastX = mouseX;
    lastY = mouseY;
    mouseIsDown = true;

    if (activeTool === Tool.Line) {
      const start = new Point(mouseX, mouseY);
      activeShape = new Line(start, start);
      shapes.push(activeShape);
    } else if (activeTool === Tool.Rectangle) {
      const start = new Point(mouseX, mouseY);
      activeShape = new Rectangle(start, start);
      shapes.push(activeShape);
    } else if (activeTool === Tool.Text && !activeShape) {
      console.log("BEGIN FLASHING");
      const start = new Point(mouseX, mouseY);
      activeShape = new Text(start);
      shapes.push(activeShape);
    } else if (activeTool === Tool.Polygon) {
      const start = new Point(mouseX, mouseY);
      activeShape = new Line(start, start);
      if (!activePolygon) {
        activePolygon = new Polygon(start);
      }
      activePolygon.addLine(activeShape);
      if (activePolygon.closed) {
        shapes.push(activePolygon);
        activePolygon = null;
      }
      // shapes.push(activeShape);
    } else if (activeTool === Tool.Text) {
      activeShape = null;
      clearActiveTool();
    }
  }
});

const IGNORED_TOOLS = [Tool.Brightness, Tool.Edit, Tool.Text];
window.addEventListener("mouseup", () => {
  mouseIsDown = false;

  if (activeTool === Tool.Edit && !activeShape) {
    for (const shape of shapes) {
      if (shape.containsPoint(mouseX, mouseY)) {
        activeShape = shape;
        shape.selected = true;
        shape.hovered = false;
        return;
      }
    }
  } else if (activeTool === Tool.Polygon && activePolygon) {
    return;
  } else if (activeTool && !IGNORED_TOOLS.includes(activeTool)) {
    clearActiveTool();
  }
});

const IGNORED_KEYS = ["Alt", "Shift", "Ctrl", "Meta"];

window.addEventListener("keyup", (event) => {
  if (activeTool && event.key === "Escape") {
    return clearActiveTool();
  }
  if (activeTool === Tool.Text && activeShape) {
    event.preventDefault();

    const str = event.key;
    if (IGNORED_KEYS.includes(str)) {
      return;
    } else if (str === "Enter" || str === "Escape") {
      clearActiveTool();
    } else if (str === "Backspace") {
      console.log("hitting backspace");
      activeShape.deleteLastChar();
    } else {
      console.log("adding key", str);
      activeShape.addChar(str);
    }

    drawShapes();
  }
});

canvas.addEventListener("mousemove", (event) => {
  mouseX = parseInt(event.clientX - offsetX);
  mouseY = parseInt(event.clientY - offsetY);

  if (!mouseIsDown) updateCursor(mouseX, mouseY);

  if (activeShape && (mouseIsDown || activeTool === Tool.Polygon)) {
    activeShape.setEnd(new Point(mouseX, mouseY));
  } else if (!mouseIsDown && activeTool === Tool.Edit && !activeShape) {
    shapes.forEach((shape) => {
      shape.hovered = false;
    });
    for (const shape of shapes) {
      if (shape.containsPoint(mouseX, mouseY)) {
        shape.hovered = true;
        break;
      }
    }
  } else {
    for (const handle of handles) {
      // The handle has to be drawn temporarily for the context to be able to
      // check if the mouse point is in its path
      drawHandle(handle);

      if (ctx.isPointInPath(lastX, lastY)) {
        if (!activeTool) {
          cursor = handle.cursor;
        }

        handle.x += mouseX - lastX;
        handle.y += mouseY - lastY;
      }
    }
  }

  lastX = mouseX;
  lastY = mouseY;

  drawShapes();
});

// Redraw canvas elements

function updateCursor(mouseX, mouseY) {
  if (activeTool) return;
  let cursor = "default";

  for (const handle of handles) {
    // The handle has to be drawn temporarily for the context to be able to
    // check if the mouse point is in its path
    drawHandle(handle);

    if (ctx.isPointInPath(mouseX, mouseY)) {
      cursor = handle.cursor;
    }
  }

  canvas.style.cursor = cursor;
}

function drawHandle(handle) {
  ctx.fillStyle = handleColor;
  ctx.strokeStyle = handleStrokeColor;
  ctx.lineWidth = handleStrokeWidth;
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, handleRadius, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
}

function drawShapes() {
  image.dispatchEvent(new Event("load"));
  for (const handle of handles) {
    drawHandle(handle);
  }

  for (const shape of shapes) {
    shape.draw();
  }

  if (activePolygon) {
    for (const line of activePolygon.lines) {
      line.draw();
    }
  }
}

document.addEventListener("keydown", function (event) {
  if (
    (event.ctrlKey && event.key === "z") ||
    (event.metaKey && event.key === "z")
  ) {
    if (shapes.length > 0) {
      shapes.pop();
      drawShapes();
    }
  }
});
