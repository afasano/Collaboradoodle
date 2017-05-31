"use strict";

var canvas;
var socket;
var clearBtn;
var downloadBtn
var line;
const backgroundColor = 51;

function setup(){
  //1920,947
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  background(backgroundColor);

  //create button element to clear canvas
  clearBtn = createButton("Clear Canvas");
  clearBtn.addClass("huge negative ui button");
  clearBtn.position(20, 20);
  clearBtn.mousePressed(clearDatabase);

  //button to download canvas
  downloadBtn = createButton("Download");
  downloadBtn.addClass("huge ui button");
  downloadBtn.position(20, 80);
  downloadBtn.mousePressed(download);

  // socket = io.connect('https://collaboradoodle.herokuapp.com/');
  socket = io.connect("http://localhost:3000"); //For TESTING: LISTEN ON PORT 3000
  socket.on('mouse', newDrawing);

  //clear canvas
  socket.on('clearCanvas', clearCanvas);

  //draw all strokes already in database
  socket.on('presentCanvas', function(allStrokes) {
    console.log("Recieved allStrokes");
    for(let strokeObject of allStrokes) {
      var strokes = strokeObject.stroke;
      for(let stroke of strokes) {
        newDrawing(stroke);
      }
    }
  });

  line = [];
}

function clearCanvas(){
  background(backgroundColor);
}

function clearDatabase() {
  clearCanvas();
  socket.emit('clearDB');
}

function download() {
  var name = prompt("Name of Drawing: ", "Drawing");
  if (name != null) {
      saveCanvas('canvas', name, 'jpg');
  }
}

function newDrawing(data){
  noStroke();
  fill(255, 0, 100);
  ellipse(data.x, data.y, 36, 36);
}

function mouseMoved(){
  //makes sure the element in focus is the body (fixes bug with drawing when click on button and with prompt)
  if(mouseIsPressed && document.activeElement == document.body){
    var data = {
      x: mouseX,
      y: mouseY
    }
    //stores all the shapes(drawings) into a line array
    line.push(data);
    socket.emit('mouse',data);
    noStroke();
    fill(255);
    ellipse(mouseX,mouseY,36,36);
  }
}

function mouseReleased() {
  //send from client to server the line just drawn
  socket.emit('stroke', line);
  // empty line array
  line = [];
}

function draw(){
//  console.log(mouseX+','+mouseY);
}

function touchMoved(){
  var data = {
    x: mouseX,
    y: mouseY
  }
  line.push(data);
  socket.emit('mouse', data);
  noStroke();
  fill(255);
  ellipse(mouseX, mouseY, 36, 36);
}

function touchEnded() {
  mouseReleased();
}
