"use strict";

function setup(){
  createCanvas(600, 400)
  background(0);
}

function draw() {

}

function mouseDragged() {
  noStroke();
  fill(255);
  ellipse(mouseX, mouseY, 20, 20);
}
