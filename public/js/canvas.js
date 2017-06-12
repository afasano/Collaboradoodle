"use strict";

var canvas;
var socket;
var clearBtn;
var downloadBtn;
var undoButton;
var redoButton;
var line;
var undos;
const backgroundColor = 51;

function setup(){
  //1920,947
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  background(backgroundColor);

  //TODO Create button on ejs page instead of setup and just add mousepressed function here
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

  undoButton = createElement("button", "<i class='arrow left icon'></i>").addClass("ui icon button").position(20, 150);
  undoButton.mousePressed(undo);
  redoButton = createElement("button", "<i class='arrow right icon'></i>").addClass("ui icon button").position(80, 150);
  redoButton.mousePressed(redo);


  //socket = io.connect("https://collaboradoodle.herokuapp.com/");
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
    var message = createDiv(
      "<div class='ui icon message hidden'>" +
        "<i class='user icon'></i>" +
        "<div class='content'>" +
          "<div class='header'>" +
            "New connection" +
          "</div>" +
          "<p>" + user.username + " has joined the sketch</p>" +
        "</div>" +
      "</div>"
    ).position(1000,20);
    $('.icon.message').transition('fade down');
    setTimeout(function() {
      $('.icon.message').transition('fade down', () => message.remove());
    }, 3500);
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

function drawDatabase(allStrokes) {
  console.log("Recieved allStrokes");
  for(let strokeObject of allStrokes) {
    var strokes = strokeObject.stroke;
    for(let stroke of strokes) {
      newDrawing(stroke);
    }
  }
}

function clearCanvas(){
  background(backgroundColor);
  if (redoButton.class().includes("blue")) {
    redoButton.removeClass("blue");
  }
  if (undoButton.class().includes("blue")) {
    undoButton.removeClass("blue");
  }
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

function newDrawing(data) {
  noStroke();
  fill(255, 0, 100);
  ellipse(data.x, data.y, 36, 36);
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
    //bug??
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
    var data = {
      x: mouseX,
      y: mouseY
    }
    //stores all the shapes(drawings) into a line array
    line.push(data);
    socket.emit("mouse", data);
    noStroke();
    fill(255);
    ellipse(mouseX,mouseY,36,36);
  }

  //create tooltip of user if mouse moves over a previously drawn stroke
}

function mouseReleased() {
  if (document.activeElement == document.body){
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
  }
}

//can probably shorten this
function touchMoved(){
  var data = {
    x: mouseX,
    y: mouseY
  }
  line.push(data);
  socket.emit("mouse", data);
  noStroke();
  fill(255);
  ellipse(mouseX, mouseY, 36, 36);
}

function touchEnded() {
  mouseReleased();
}
