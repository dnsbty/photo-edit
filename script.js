// Set up the canvas

const canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  dropZone = document.getElementById("drop-zone"),
  image = new Image();

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

  drawShapes();
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

function drawShapes() {
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#00427B"; //blue-90
  ctx.fillStyle = "#61BDFF"; //blue-30
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(150, 50);
  ctx.lineTo(200, 100);
  ctx.lineTo(100, 100);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  handle1 = {
    x: canvas.width / 2 - 100,
    y: canvas.height / 2 - 100,
    radius: 20,
  };

  handle2 = {
    x: canvas.width / 2 + 100,
    y: canvas.height / 2 - 100,
    radius: 20,
  };

  handle3 = {
    x: canvas.width / 2 - 100,
    y: canvas.height / 2 + 100,
    radius: 20,
  };

  handle4 = {
    x: canvas.width / 2 + 100,
    y: canvas.height / 2 + 100,
    radius: 20,
  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(handle1.x, handle1.y, handle1.radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(handle2.x, handle2.y, handle2.radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(handle3.x, handle3.y, handle3.radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(handle4.x, handle4.y, handle4.radius, 0, Math.PI * 2, false);
    ctx.fill();
  }

  document.body.addEventListener("mousedown", function (event) {
    const canvasWindowLocation = canvas.getBoundingClientRect();
    if (
      utils.circlePointCollision(
        event.clientX - canvasWindowLocation.left,
        event.clientY - canvasWindowLocation.top,
        handle1
      )
    ) {
      document.body.addEventListener("mousemove", onMouseMove);
      document.body.addEventListener("mouseup", onMouseUp);
    }
  });

  function onMouseMove(event) {
    const canvasWindowLocation = canvas.getBoundingClientRect();
    handle1.x = event.clientX - canvasWindowLocation.left;
    handle1.y = event.clientY - canvasWindowLocation.top;
    draw();
  }

  function onMouseUp(event) {
    document.body.removeEventListener("mousemove", onMouseMove);
    document.body.removeEventListener("mouseup", onMouseUp);
  }
  draw();
}
