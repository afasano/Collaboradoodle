var socket;
var canvas;
var button;
const backgroundColor = 51;

function setup(){
  //1920,947
  canvas = createCanvas(windowWidth,windowHeight);
  canvas.position(0,0);
  background(backgroundColor);

  //create button element to clear canvas
  button = createButton("Clear Canvas");
  button.addClass("huge ui primary button");
  button.position(20,20);
  button.mousePressed(clearCanvas);

  socket = io.connect('https://collaboradoodle.herokuapp.com/');
  // socket = io.connect("http://localhost:3000"); //For TESTING: LISTEN ON PORT 3000
  socket.on('mouse', newDrawing);

}

function clearCanvas(){
  background(backgroundColor);
}

function newDrawing(data){
  noStroke();
  fill(255,0,100);
  ellipse(data.x, data.y, 36, 36);
}

function mouseMoved(){
  console.log('Sending: '+mouseX+','+mouseY);
  if(mouseIsPressed){
    var data={
      x:mouseX,
      y:mouseY
    }
    socket.emit('mouse',data);
    noStroke();
    fill(255);
    ellipse(mouseX,mouseY,36,36);
  }
}

function draw(){
//  console.log(mouseX+','+mouseY);

}

function mouseClicked(){
  console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY
  }
  socket.emit('mouse',data);
  noStroke();
  fill(255);
  ellipse(mouseX,mouseY,36,36);
}


function touchStarted(){
  console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY
  }
  socket.emit('mouse',data);
  noStroke();
  fill(255);
  ellipse(mouseX,mouseY,36,36);
}
function touchMoved(){
  console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY
  }
  socket.emit('mouse',data);
  noStroke();
  fill(255);
  ellipse(mouseX,mouseY,36,36);
}
