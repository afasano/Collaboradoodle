"use strict";

function setup(){
  createCanvas(600, 400)
  background(0);
}

function draw() {
  noStroke();
  fill(255, 30);
  ellipse(mouseX, mouseY, 20, 20);
}
