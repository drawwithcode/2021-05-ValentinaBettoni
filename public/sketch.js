let clientSocket = io();

clientSocket.on("connect", newConnection);

clientSocket.on("mouseBroadcast", newBroadcast);

function newConnection() {
  console.log(clientSocket.id);
}

function newBroadcast(data) {
  console.log(data);

  fill("red");
  circle(data.x, data.y, 10);
}

function setup() {
  background(220);
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  fill("yellow");
  circle(mouseX, mouseY, 20);
}

function mouseMoved() {
  let message = {
    x: mouseX,
    y: mouseY,
  };

  clientSocket.emit("mouse", message);
}
