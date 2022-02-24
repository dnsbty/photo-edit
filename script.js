// Set up the canvas

const canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  dropZone = document.getElementById("drop-zone"),
  image = new Image(),
  handleRadius = 12;

let mouseX = 0,
  mouseY = 0,
  mouseIsDown = false,
  handles = [],
  offsetX = canvas.offsetLeft,
  offsetY = canvas.offsetTop;

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Handle images being dragged and dropped or selected

image.addEventListener("load", function () {
  clearCanvas();

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0, image.width, image.height);

  canvas.style.display = "block";
  dropZone.style.display = "none";

  offsetX = canvas.offsetLeft;
  offsetY = canvas.offsetTop;

  if (handles.length === 0) {
    handles = handles.concat([
      {
        cursor: "move",
        x: canvas.width / 3,
        y: canvas.height / 3,
      },
      {
        cursor: "move",
        x: (canvas.width * 2) / 3,
        y: canvas.height / 3,
      },
      {
        cursor: "move",
        x: canvas.width / 3,
        y: (canvas.height * 2) / 3,
      },
      {
        cursor: "move",
        x: (canvas.width * 2) / 3,
        y: (canvas.height * 2) / 3,
      },
    ]);

    drawShapes();
  }
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
  }
});

window.addEventListener("mouseup", () => {
  mouseIsDown = false;
});

canvas.addEventListener("mousemove", (event) => {
  mouseX = parseInt(event.clientX - offsetX);
  mouseY = parseInt(event.clientY - offsetY);

  if (!mouseIsDown) return updateCursor(mouseX, mouseY);

  for (const handle of handles) {
    // The handle has to be drawn temporarily for the context to be able to
    // check if the mouse point is in its path
    drawHandle(handle);

    if (ctx.isPointInPath(lastX, lastY)) {
      cursor = handle.cursor;
      handle.x += mouseX - lastX;
      handle.y += mouseY - lastY;
    }
  }

  lastX = mouseX;
  lastY = mouseY;

  drawShapes();
});

function updateCursor(mouseX, mouseY) {
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
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, handleRadius, 0, Math.PI * 2, false);
  ctx.fill();
}

function drawShapes() {
  image.dispatchEvent(new Event("load"));
  for (const handle of handles) {
    drawHandle(handle);
  }
}
