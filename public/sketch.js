var socket;
function setup(){
  //1920,947
  createCanvas(windowWidth,windowHeight);
  background(51);

  socket=io.connect('https://collaboradoodle.herokuapp.com/');
  socket.on('mouse', newDrawing);

}
function newDrawing(data){
  noStroke();
  fill(255,0,100);
  ellipse(data.x, data.y, 36, 36);
}
/*
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
*/
function draw(){
//  console.log(mouseX+','+mouseY);

}
/*
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
*/
function mousePressed(){
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
