let color;

// scelgo i colori per i miei "pesciolini"
let colors = [
  "#0d0887",
  "#41049d",
  "#6a00a8",
  "#8f0da4",
  "#b12a90",
  "#cc4778",
  "#e16462",
  "#f2844b",
  "#fca636",
  "#fcce25",
  "#f0f921",
  "#6e40aa",
  "#963db3",
  "#bf3caf",
  "#e4419d",
  "#fe4b83",
  "#ff5e63",
  "#ff7847",
  "#fb9633",
  "#e2b72f",
  "#c6d63c",
  "#aff05b",
  "#fbb4ae",
  "#b3cde3",
  "#ccebc5",
  "#decbe4",
  "#fed9a6",
  "#ffffcc",
  "#e5d8bd",
  "#fddaec",
  "#f2f2f2",
];

let clientSocket = io();

clientSocket.on("connect", newConnection);

clientSocket.on("mouseBroadcast", newBroadcast);

function newConnection() {
  console.log(clientSocket.id);
}

function newBroadcast(data) {
  console.log(data);

  // data.c invia il colore del mio pesciolino
  flock.addBoid(new Boid(data.x, data.y, data.c));
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // prendo randomicamente un colore tra quelli che ho scelto prima
  color = random(colors);

  flock = new Flock();
}

function draw() {
  background(0);
  flock.run();
}

function mouseDragged() {
  // imposto che venga inviata al posizione e il colore del mio pesciolino
  let message = {
    x: mouseX,
    y: mouseY,
    c: color,
  };

  flock.addBoid(new Boid(mouseX, mouseY, color));

  clientSocket.emit("mouse", message);
}

//
//
//
//
//
//

// come creo i miei "pesciolini"

// creo un array per i miei boid
function Flock() {
  this.boids = [];
}

Flock.prototype.run = function () {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);
  }
};

Flock.prototype.addBoid = function (b) {
  this.boids.push(b);
};

// imposto come si muoveranno ed interagiranno tra di loro i miei boid
function Boid(x, y, c) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 3; // velocità massima
  this.maxforce = 0.05; // forza massima
  this.color = c;
}

Boid.prototype.run = function (boids) {
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
};

Boid.prototype.applyForce = function (force) {
  this.acceleration.add(force);
};

Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids);
  let ali = this.align(boids);
  let coh = this.cohesion(boids);
  // do un peso alle forze
  sep.mult(1.5);
  ali.mult(1.0);
  coh.mult(1.0);
  // aggiungo un vettore all'accelerazione
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
};

Boid.prototype.update = function () {
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  this.acceleration.mult(0);
};

Boid.prototype.seek = function (target) {
  let desired = p5.Vector.sub(target, this.position);
  desired.normalize();
  desired.mult(this.maxspeed);
  let steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce);
  return steer;
};

Boid.prototype.render = function () {
  // creo l'aspetto dei boids
  let theta = this.velocity.heading() + radians(90);

  // definisco il colore del boid prendendo quello che ho scelto randomicamente nel setup
  fill(this.color);
  noStroke;
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r * 2);
  vertex(-this.r, this.r * 2);
  vertex(this.r, this.r * 2);
  endShape(CLOSE);
  pop();
};

// per far rientrare nello schermo i boids dopo che sono usciti
Boid.prototype.borders = function () {
  if (this.position.x < -this.r) this.position.x = width + this.r;
  if (this.position.y < -this.r) this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
};

Boid.prototype.separate = function (boids) {
  let desiredseparation = 25.0;
  let steer = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < desiredseparation) {
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);
      steer.add(diff);
      count++;
    }
  }

  if (count > 0) {
    steer.div(count);
  }

  if (steer.mag() > 0) {
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
};

// Allineamento
// definisco la velocità dei pesciolini vicini tra di loro
Boid.prototype.align = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

// Scontro tra pesciolini
Boid.prototype.cohesion = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].position);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);
  } else {
    return createVector(0, 0);
  }
};

// Reference: The Nature of Code, Daniel Shiffman
