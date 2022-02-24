const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d");

// canvas.width = window.innerWidth;

// ctx.fillStyle = "#656A72";
// ctx.fillRect(20, 20, 150, 100);
// ctx.fillStyle = "#AC5B00";
// ctx.fillRect(200, 20, 150, 100);

const image = document.getElementById("storage-unit");
console.log(image);
canvas.width = image.width;
canvas.height = image.height;

function drawImage() {
  ctx.drawImage(image, 0, 0, image.width, image.height);
}

drawImage();

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

handle = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   ctx.drawImage(image, 0, 0, image.width, image.height);
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, handle.radius, 0, Math.PI * 2, false);
  ctx.fill();
}

document.body.addEventListener("mousedown", function (event) {
  if (utils.circlePointCollision(event.clientX, event.clientY, handle)) {
    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp);
  }
});

function onMouseMove(event) {
  handle.x = event.clientX;
  handle.y = event.clientY;
  draw();
}

function onMouseUp(event) {
  document.body.removeEventListener("mousemove", onMouseMove);
  document.body.removeEventListener("mouseup", onMouseUp);
}
// draw();
