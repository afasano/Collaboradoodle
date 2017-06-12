var socket;
// function setup(){
//   createCanvas(600,400);
//   background(51);
var canvas;
//Button to clear canvas
var clear;
//Checks if the menu is already open
var open=false;
var side;
var options;
var rslider;
var rtext;
var rheader;
var bslider;
var btext;
var bheader;
var gslider;
var gtext;
var gheader;
var red;
var blue;
var green;
var colorButton;
var rgb;
//A boolean true is a circle false is a square
var brushtype=true;
//Group for the type buttons
var types;
//Circle button
var circleBrush;
var squareBrush;
//Size of brush
var size;
var sizeSlider;
var sizeText;
//To see if color should be read for color picker
var newColor=false;
function setup(){
  //1920,947
  canvas = createCanvas(windowWidth,windowHeight);
  canvas.position(0,0);
  //Complementary Colors
  //232,135,12
  //255,0,0
  //122,12,232
  //13,140,255
  background(255,252,191);
  //create button element to clear canvas
  clear = createButton("Clear Canvas");
  clear.addClass("huge ui primary button");
  clear.position(20,20);
  clear.mousePressed(clearCanvas);
  //Sets up a header for header
  rheader=createDiv('Red');
  rheader.addClass("ui red medium header");
  rheader.parent('#brushColor');
  //Slider for color
  rslider= createSlider(0,255,255);
  //Sets slider to div
  rslider.parent('#brushColor');
  //Input box for color sliders
  rtext=createInput(rslider.value()+"");
  //Sets the color of the words in the box
  rtext.style("color","black");
  //Sets input to div
  rtext.parent('#brushColor');
  rtext.input(redTextInputEvent);
  rslider.input(redSliderInputEvent);
  //Sets up green
  gheader=createDiv('Green');
  gheader.addClass("ui green medium header");
  gheader.parent('#brushColor');
  gslider= createSlider(0,255,255);
  //Sets slider to div
  gslider.parent('#brushColor');
  //Input box for color sliders
  gtext=createInput(gslider.value()+"");
  //Sets the color of the words in the box
  gtext.style("color","black");
  //Sets input to div
  gtext.parent('#brushColor');
  gtext.input(greenTextInputEvent);
  gslider.input(greenSliderInputEvent);
  //Sets up blue
  bheader=createDiv('Blue');
  bheader.addClass("ui blue medium header");
  bheader.parent('#brushColor');
  bslider= createSlider(0,255,255);
  //Sets slider to div
  bslider.parent('#brushColor');
  //Input box for color sliders
  btext=createInput(bslider.value()+"");
  //Sets the color of the words in the box
  btext.style("color","black");
  //Sets input to div
  btext.parent('#brushColor');
  btext.input(blueTextInputEvent);
  bslider.input(blueSliderInputEvent);
  //Sets ellipse example
  colorButton=createButton("Example");
  colorButton.addClass("circular medium ui button");
  colorButton.parent('#brushColor');
  //Sets up the types of brushes

  types=createDiv('\n');
  types.parent('#brushType');
  types.addClass("ui buttons");
  circleBrush= createButton("Circle");
  circleBrush.parent(types);
  circleBrush.addClass("circular ui button");
  circleBrush.mousePressed(setBrushTypeCircle);
  squareBrush= createButton("Square");
  squareBrush.parent(types);
  squareBrush.addClass("ui button");
  squareBrush.mousePressed(setBrushTypeSquare);
  //Creates Slider for size
  sizeSlider= createSlider(0,50,36);
  //Sets slider to div
  sizeSlider.parent('#brushSize');
  //Input box for color sliders
  sizeText=createInput(sizeSlider.value()+"");
  //Sets the color of the words in the box
  sizeText.style("color","black");
  //Sets input to div
  sizeText.parent('#brushSize');
  sizeText.input(sizeTextInputEvent);
  sizeSlider.input(sizeSliderInputEvent);
  //Sets up color picker
  picker=select('#picker');
  picker.mousePressed(findingColor);
  //Sets up eraser
  eraser=select('#eraser');
  eraser.mousePressed(beginErase);
  //Acess sidebar from html
  side=select('#side');
  //Acess menu button
  options=select('#options');
  //canvas.mouseClicked(canvasClicked);
  canvas.mouseMoved(canvasMoved);
  canvas.mouseClicked(canvasClicked);
  options.mousePressed(drawMenu);

  socket=io.connect('https://collaboradoodle.herokuapp.com/');
  // socket = io.connect("http://localhost:3000"); //For TESTING: LISTEN ON PORT 3000
  socket.on('mouse', newDrawing);

}

function clearCanvas(){
  background(255,252,191);
}

function newDrawing(data){
  noStroke();
  fill(data.color1,data.color2,data.color3);
  if(data.sendtype==true){
    ellipse(data.x, data.y,data.vol,data.vol);
  }
  else{
    console.log("Square");
    rect(data.x, data.y,data.vol,data.vol)
  }
  //ellipse(data.x, data.y, 36, 36);
}
// function mouseMoved(){
//   console.log('Sending: '+mouseX+','+mouseY);
function canvasClicked(){
  if(newColor==false)
  {
    var data={
      x:mouseX,
      y:mouseY,
      color1:red,
      color2:green,
      color3:blue,
      sendtype:brushtype,
      vol:size
    }
    socket.emit('mouse',data);
    noStroke();
    fill(red,green,blue);
    if(brushtype==true){
      ellipse(mouseX,mouseY,size);
    }
    else{
      console.log("Square");
      rect(mouseX,mouseY,size,size)
    }
  }
  else{
    var c=get(mouseX,mouseY);
    red = c[0];
    green=c[1];
    blue=c[3];
    rslider.value(c[0]);
    gslider.value(c[1]);
    bslider.value(c[2]);
    rtext.value(rslider.value());
    gtext.value(gslider.value());
    btext.value(bslider.value());
    newColor=false;
  }
}
function canvasMoved(){
  if(newColor==false)
  {
    if(mouseIsPressed){
      var data={
        x:mouseX,
        y:mouseY,
        color1:red,
        color2:green,
        color3:blue,
        sendtype:brushtype,
        vol:size
      }
      socket.emit('mouse',data);
      noStroke();
      fill(red,green,blue);
      if(brushtype==true){
        ellipse(mouseX,mouseY,size);
      }
      else{
        console.log("Square");
        rect(mouseX,mouseY,size,size)
      }
    //  ellipse(mouseX,mouseY,36,36);
    }
  }
  else{
    if(mouseIsPressed){
      var c=get(mouseX,mouseY);
      red = c[0];
      green=c[1];
      blue=c[3];
      rslider.value(c[0]);
      gslider.value(c[1]);
      bslider.value(c[2]);
      rtext.value(rslider.value());
      gtext.value(gslider.value());
      btext.value(bslider.value());
      newColor=false;
    }
  }
}
/*function mouseMoved(){
//  console.log('Sending: '+mouseX+','+mouseY);
  if(mouseIsPressed){
    var data={
      x:mouseX,
      y:mouseY,
      color1:red,
      color2:green,
      color3:blue,
      sendtype:brushtype,
      vol:size
    }
    socket.emit('mouse',data);
    noStroke();
    fill(red,green,blue);
    if(brushtype==true){
      ellipse(mouseX,mouseY,size);
    }
    else{
      console.log("Square");
      rect(mouseX,mouseY,size,size)
    }
  //  ellipse(mouseX,mouseY,36,36);
  }
}
*/
function draw(){
  red=rslider.value();
  green=gslider.value();
  blue=bslider.value();
  rgb="rgb("+red+", "+green+", "+blue+")";
  colorButton.style("background-color",rgb);
  //console.log("Red "+red);
  //console.log("Green "+green);
  //console.log("Blue "+blue);
  size=sizeSlider.value();
}

/*function mouseClicked(){
  //console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY,
    color1:red,
    color2:green,
    color3:blue,
    sendtype:brushtype,
    vol:size
  }
  socket.emit('mouse',data);
  noStroke();
  fill(red,green,blue);
  if(brushtype==true){
    ellipse(mouseX,mouseY,size);
  }
  else{
    console.log("Square");
    rect(mouseX,mouseY,size,size)
  }
}
*/

function touchStarted(){
  //console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY,
    color1:red,
    color2:green,
    color3:blue,
    sendtype:brushtype,
    vol:size
  }
  socket.emit('mouse',data);
  noStroke();
  fill(red,green,blue);
  if(brushtype==true){
    ellipse(mouseX,mouseY,size);
  }
  else{
    console.log("Square");
    rect(mouseX,mouseY,size,size)
  }
}
function touchMoved(){
  //console.log('Sending: '+mouseX+','+mouseY);
  var data={
    x:mouseX,
    y:mouseY,
    color1:red,
    color2:green,
    color3:blue,
    sendtype:brushtype,
    vol:size
  }
  socket.emit('mouse',data);
  noStroke();
  fill(red,green,blue);
  if(brushtype==true){
    ellipse(mouseX,mouseY,size);
  }
  else{
    console.log("Square");
    rect(mouseX,mouseY,size,size)
  }
}

function drawMenu(){
  //Adding and Removing the menu
  if(open==false){
    side.addClass("ui sidebar inverted vertical menu visible");
    open=true;
  }
  else{
    side.removeClass("ui sidebar inverted vertical menu visible")
    open=false;
  }
}
function redTextInputEvent(){
  rslider.value(rtext.value());
}
function redSliderInputEvent(){
  rtext.value(rslider.value());
}
function greenTextInputEvent(){
  gslider.value(gtext.value());
}
function greenSliderInputEvent(){
  gtext.value(gslider.value());
}
function blueTextInputEvent(){
  bslider.value(btext.value());
}
function blueSliderInputEvent(){
  btext.value(bslider.value());
}
function setBrushTypeCircle(){
  brushtype=true;
}
function setBrushTypeSquare(){
  brushtype=false;
}
function sizeTextInputEvent(){
  sizeSlider.value(sizeText.value());
}
function sizeSliderInputEvent(){
  sizeText.value(sizeSlider.value());
  console.log("Check");
}
function findingColor(){
  newColor=true;
}
function beginErase(){
  //255,252,191
  red = 255;
  green=252;
  blue=191;
  rslider.value(255);
  gslider.value(252);
  bslider.value(191);
  rtext.value(rslider.value());
  gtext.value(gslider.value());
  btext.value(bslider.value());
}
