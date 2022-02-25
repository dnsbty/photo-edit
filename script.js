// Set up the canvas

const canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  dropZone = document.getElementById("drop-zone"),
  image = new Image(),
  handleRadius = 6,
  handleColor = "#fff",
  handleStrokeColor = "#028bff",
  handleStrokeWidth = 2,
  toolButtons = document.querySelectorAll("#tools button"),
  clearButton = document.getElementById("clear-canvas"),
  saveButton = document.getElementById("save-image");

let mouseX = 0,
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
  static Crop = new Tool("crop", { cursor: "move" });
  static Line = new Tool("line", { cursor: "crosshair" });
  static Rectangle = new Tool("rectangle", { cursor: "crosshair" });
  static Text = new Tool("text", { cursor: "text" });

  constructor(name, properties) {
    this.name = name;
    this.cursor = properties.cursor;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Line {
  constructor(start, end, color = "#fff", width = 4) {
    this.start = start;
    this.end = end;
    this.color = color;
    this.width = width;
  }

  draw() {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
  }
}

let activeTool = null,
  activeShape = null,
  shapes = [];

function handleToolClick(event) {
  event.preventDefault();
  const btn = event.currentTarget;

  let tool = null;
  switch (btn.dataset.tool) {
    case "crop":
      tool = Tool.Crop;
      break;
    case "line":
      tool = Tool.Line;
      break;
    case "rectangle":
      tool = Tool.Rectangle;
      break;
    case "text":
      tool = Tool.Text;
      break;
  }

  if (tool === activeTool) {
    activeTool = null;
    btn.classList.remove("active");
    canvas.style.cursor = "default";
  } else {
    activeTool = tool;
    const activeButton = document.querySelector("#tools button.active");
    if (activeButton) activeButton.classList.remove("active");
    btn.classList.add("active");
    canvas.style.cursor = activeTool.cursor;
  }
}

function clearActiveTool() {
  activeTool = null;
  const activeButton = document.querySelector("#tools button.active");
  if (activeButton) activeButton.classList.remove("active");
  canvas.style.cursor = "default";
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
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}

image.addEventListener("load", function () {
  clearCanvas();
  drawImageToFit(image);

  editor.style.display = "block";
  dropZone.style.display = "none";

  offsetX = canvas.offsetLeft;
  offsetY = canvas.offsetTop;

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

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouseX = parseInt(event.clientX - offsetX);
    mouseY = parseInt(event.clientY - offsetY);
    lastX = mouseX;
    lastY = mouseY;
    mouseIsDown = true;

    if (activeTool === Tool.Line) {
      const start = new Point(mouseX, mouseY);
      activeShape = new Line(start, start, "#ff0000", 4);
      shapes.push(activeShape);
    }
  }
});

window.addEventListener("mouseup", () => {
  mouseIsDown = false;

  if (activeTool) {
    activeTool = null;
  }
});

canvas.addEventListener("mousemove", (event) => {
  mouseX = parseInt(event.clientX - offsetX);
  mouseY = parseInt(event.clientY - offsetY);

  if (!mouseIsDown) return updateCursor(mouseX, mouseY);

  if (activeShape) {
    if (activeTool === Tool.Line) {
      activeShape.end = new Point(mouseX, mouseY);
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
}
