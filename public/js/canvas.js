"use strict";

var canvas;
var socket;
var clearBtn;
var downloadBtn;
var undoButton;
var redoButton;
var line;
var undos;

//Checks if menu is already open
var open = false;
var picker;
var eraser;
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
var brushtype = true;
//Group for the type buttons
var types;
//Group for undo redo buttons
var undoRedo;
//Circle button
var circleBrush;
var squareBrush;
//Size of brush
var size;
var sizeSlider;
var sizeText;
//To see if color should be read for color picker
var newColor = false;

// const backgroundColor = rgb;

//setup all buttons in menu
function setup(){
  //1920,947
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  // background(backgroundColor);
  background(255,252,191);

  //history buttons for undo and redo
  undoRedo = createDiv('\n');
  undoRedo.parent("#undo-redo");
  undoButton = createElement("button", "<i class='arrow left icon'></i>").addClass("ui icon button");
  undoButton.parent(undoRedo);
  undoButton.mousePressed(undo);
  redoButton = createElement("button", "<i class='arrow right icon'></i>").addClass("ui icon button");
  redoButton.parent(undoRedo)
  redoButton.mousePressed(redo);

  //Sets ellipse example
  colorButton = createButton(" ");
  colorButton.addClass("circular medium ui button");
  colorButton.parent('#brushColor');

  //Sets up a header for header
  rheader = createDiv('Red');
  rheader.addClass("ui red medium header");
  rheader.parent('#brushColor');
  //Slider for color
  rslider = createSlider(0,255,255);
  //Sets slider to div
  rslider.parent('#brushColor');
  //Input box for color sliders
  rtext = createInput(rslider.value()+"");
  //Sets the color of the words in the box
  rtext.style("color","black");
  //Sets input to div
  rtext.parent('#brushColor');
  rtext.input(redTextInputEvent);
  rslider.input(redSliderInputEvent);
  //Sets up green
  gheader = createDiv('Green');
  gheader.addClass("ui green medium header");
  gheader.parent('#brushColor');
  gslider = createSlider(0,255,255);
  //Sets slider to div
  gslider.parent('#brushColor');
  //Input box for color sliders
  gtext = createInput(gslider.value()+"");
  //Sets the color of the words in the box
  gtext.style("color","black");
  //Sets input to div
  gtext.parent('#brushColor');
  gtext.input(greenTextInputEvent);
  gslider.input(greenSliderInputEvent);
  //Sets up blue
  bheader = createDiv('Blue');
  bheader.addClass("ui blue medium header");
  bheader.parent('#brushColor');
  bslider = createSlider(0,255,255);
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

  //Sets up the types of brushes
  types = createDiv('\n');
  types.parent('#brushType');
  // types.addClass("ui buttons");
  circleBrush = createButton("Circle");
  circleBrush.parent(types);
  circleBrush.addClass("circular compact ui button");
  circleBrush.mousePressed(setBrushTypeCircle);
  squareBrush = createButton("Square");
  squareBrush.parent(types);
  squareBrush.addClass("ui compact button");
  squareBrush.mousePressed(setBrushTypeSquare);
  //Creates Slider for size
  sizeSlider = createSlider(0,100,36);
  //Sets slider to div
  sizeSlider.parent('#brushSize');
  //Input box for color sliders
  sizeText = createInput(sizeSlider.value() + "");
  //Sets the color of the words in the box
  sizeText.style("color","black");
  //Sets input to div
  sizeText.parent('#brushSize');
  sizeText.input(sizeTextInputEvent);
  sizeSlider.input(sizeSliderInputEvent);
  //Sets up color picker
  picker = select('#picker');
  picker.mousePressed(findingColor);
  //Sets up eraser
  eraser = select('#eraser');
  eraser.mousePressed(beginErase);

  //button to download canvas
  downloadBtn = createButton("Download");
  downloadBtn.addClass("circular ui button");
  downloadBtn.parent("#other");
  downloadBtn.mousePressed(download);

  //create button element to clear canvas
  clearBtn = createButton("Clear Canvas");
  clearBtn.addClass("circular negative ui button");
  clearBtn.parent("#other");
  clearBtn.mousePressed(clearDatabase);

  //Acess sidebar from html
  side = select('#side');
  //Acess menu button
  options = select('#options');
  //draw menu when option icon is pressed
  options.mousePressed(drawMenu);

  // socket = io.connect("https://collaboradoodle.herokuapp.com/");
  socket = io.connect("http://localhost:3000"); //For TESTING: LISTEN ON PORT 3000

  //connect client to room specific to sketchId
  socket.on("connect", function() {
    socket.emit("room", sketchId);
  });

  //send username of client to server
  socket.emit("newUser", { user: user.username });

  //recieve new connected usernames and display notice
  socket.on("newUser", function(data) {
    //make position relative with %
    // var message = createDiv(
    //   "<div class='ui icon message hidden'>" +
    //     "<i class='user icon'></i>" +
    //     "<div class='content'>" +
    //       "<div class='header'>" +
    //         "New connection" +
    //       "</div>" +
    //       "<p>" + user.username + " has joined the sketch</p>" +
    //     "</div>" +
    //   "</div>"
    // ).position(1000,20);
    // $('.icon.message').transition('fade down');
    // setTimeout(function() {
    //   $('.icon.message').transition('fade down', () => message.remove());
    // }, 3500);
  });

  //draw all strokes already in database
  socket.on("presentCanvas", (data) => drawDatabase(data));

  //recieve mouse data
  socket.on("mouse", newDrawing);

  //clear canvas
  socket.on("clearCanvas", clearCanvas);

  //recieve refresh canvas command
  socket.on("refreshCanvas", function(data) {
    clearCanvas();
    drawDatabase(data);
  });

  undos = [];
  //recieve undo to store in local array
  socket.on("undo", function(data) {
    if (data) {
      if(data.noMore) {
        undoButton.removeClass("blue");
      }

      undos.push(data.stroke);

      //make redo button active color
      if (!redoButton.class().includes("blue")) {
        redoButton.addClass("blue");
      }

      //remove blue undo after 6 times
      if (undos.length > 5) {
        undoButton.removeClass("blue");
      }
    }
  });

  line = [];
}

function redTextInputEvent() {
  rslider.value(rtext.value());
}
function redSliderInputEvent() {
  rtext.value(rslider.value());
}
function greenTextInputEvent() {
  gslider.value(gtext.value());
}
function greenSliderInputEvent() {
  gtext.value(gslider.value());
}
function blueTextInputEvent() {
  bslider.value(btext.value());
}
function blueSliderInputEvent() {
  btext.value(bslider.value());
}
function setBrushTypeCircle() {
  brushtype = true;
}
function setBrushTypeSquare() {
  brushtype = false;
}
function sizeTextInputEvent() {
  sizeSlider.value(sizeText.value());
}
function sizeSliderInputEvent() {
  sizeText.value(sizeSlider.value());
  console.log("Check");
}
function findingColor() {
  newColor = true;
}
function beginErase() {
  //255,252,191
  red = 255;
  green = 252;
  blue = 191;
  rslider.value(255);
  gslider.value(252);
  bslider.value(191);
  rtext.value(rslider.value());
  gtext.value(gslider.value());
  btext.value(bslider.value());
}

function drawDatabase(allStrokes) {
  // console.log("Recieved allStrokes");
  for(let strokeObject of allStrokes) {
    var strokes = strokeObject.stroke;
    for(let stroke of strokes) {
      newDrawing(stroke);
    }
  }
}

function clearCanvas(){
  // background(backgroundColor);
  background(255,252,191);
}

function clearDatabase() {
  clearCanvas();
  if (undoButton.class().includes("blue")) {
    undoButton.removeClass("blue");
  }
  if (redoButton.class().includes("blue")) {
    redoButton.removeClass("blue");
  }
  socket.emit("clearDB");
}

function download() {
  var name = prompt("Name of Drawing: ", "Drawing");
  if (name != null) {
      saveCanvas("canvas", name, "jpg");
  }
}

function newDrawing(data){
  noStroke();
  fill(data.color1, data.color2, data.color3);
  //if sendtype is true then draw ellipse if false draw square
  if(data.sendtype == true){
    ellipse(data.x, data.y, data.vol, data.vol);
  }
  else{
    rect(data.x, data.y, data.vol, data.vol)
  }
  //ellipse(data.x, data.y, 36, 36);
}

function undo() {
  //can only undo six times
  if(undos.length < 6) {
    socket.emit("undo", user);
  }
}

function redo() {
  if (undos.length > 0) {
    socket.emit("redo", undos.pop());

    if (undos.length == 0) {
      if (redoButton.class().includes("blue")) {
        redoButton.removeClass("blue");
      }
      if (!undoButton.class().includes("blue")) {
        undoButton.addClass("blue");
      }
    } else {
      if (!undoButton.class().includes("blue")) {
        undoButton.addClass("blue");
      }
    }
  }
}

function mouseMoved(){
  //makes sure the element in focus is the body (fixes bug with drawing when click on button and with prompt)
  if (mouseIsPressed && document.activeElement == document.body){
    if(newColor == false) {
      var data = {
        x: mouseX,
        y: mouseY,
        color1: red,
        color2: green,
        color3: blue,
        sendtype: brushtype,
        vol: size
      }
      //stores all the shapes(drawings) into a line array
      line.push(data);
      socket.emit("mouse", data);
      noStroke();
      fill(red, green, blue);
      if(brushtype == true){
        ellipse(mouseX, mouseY, size);
      }
      else{
        rect(mouseX, mouseY, size, size)
      }
    } else {
      if(mouseIsPressed){
        getColor();
      }
    }
  }
}

function mouseReleased() {
  if (document.activeElement == document.body){
    if (newColor == false ) {
      var strokeData = {
        stroke: line,
        author: {
          id: user._id,
          username: user.username
        }
      };

      //send from client to server the line just drawn
      socket.emit("stroke", strokeData);
      // empty line array
      line = [];

      //change color of history buttons
      if (undos.length == 0)  {
        if (!undoButton.class().includes("blue")) {
          undoButton.addClass("blue");
        }
      } else {
        //if new stroke is drawn then undo history cleared
        undos = [];
        if (redoButton.class().includes("blue")) {
          redoButton.removeClass("blue");
        }
      }
    } else {
      getColor();
    }
  }
}

function getColor() {
  var c = get(mouseX,mouseY);
  red = c[0];
  green = c[1];
  blue = c[3];
  rslider.value(c[0]);
  gslider.value(c[1]);
  bslider.value(c[2]);
  rtext.value(rslider.value());
  gtext.value(gslider.value());
  btext.value(bslider.value());
  newColor = false;
}

//can probably shorten this
function touchMoved(){
  var data = {
    x: mouseX,
    y: mouseY,
    color1: red,
    color2: green,
    color3: blue,
    sendtype: brushtype,
    vol: size
  }
  line.push(data);
  socket.emit("mouse", data);
  noStroke();
  fill(red, green, blue);
  if(brushtype == true){
    ellipse(mouseX,mouseY,size);
  }
  else{
    rect(mouseX,mouseY,size,size)
  }
}

function touchEnded() {
  mouseReleased();
}

//constantly get rgb value and size
function draw(){
  red = rslider.value();
  green = gslider.value();
  blue = bslider.value();
  rgb = "rgb(" + red + ", " + green + ", " + blue +")";
  colorButton.style("background-color", rgb);
  size = sizeSlider.value();
}

function drawMenu(){
  //Adding and Removing the menu
  if(open == false){
    side.addClass("ui sidebar inverted vertical menu visible");
    open = true;
  }
  else{
    side.removeClass("ui sidebar inverted vertical menu visible")
    open = false;
  }
}
