var express   = require ("express"),
    app       = express(),
    mongoose  = require("mongoose");

mongoose.connect("mongodb://localhost/collab");
app.use(express.static('public'));

var strokeSchema = new mongoose.Schema({
  stroke: [
    {
      x: Number,
      y: Number
    }
  ]
});

var Stroke = mongoose.model("Stroke", strokeSchema);

//remove all drawings from database
Stroke.remove({}, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Removed strokes");
  }
});


// var server = app.listen(process.env.PORT, process.env.IP, function() {
//   console.log("Server is running");
// });

// For TESTING: LISTEN ON PORT 3000
var server = app.listen(3000, function() {
  console.log("Port 3000 Server is running");
});

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('new connection: ' + socket.id);

  //send strokes in database to new connection
  Stroke.find({}, function(err, allStrokes) {
    if(err) {
      console.log(err);
    } else {
      //send allStrokes to sender-client only
      socket.emit('presentCanvas', allStrokes);
      console.log("Sent allStrokes to: " + socket.id);
    }
  });

  socket.on('mouse', function(data) {
    socket.broadcast.emit('mouse', data);
    console.log(data);
  })

  //recieve line drawn from client and store into database
  socket.on('stroke', function(line) {
    var newLine = {stroke: line}

    Stroke.create(newLine, function(err, createdLine) {
      if (err) {
        console.log(err);
      } else {
        console.log("Line Stored");
      }
    });
  });

  //clear database and all client canvases
  socket.on('clearDB', function() {
    Stroke.remove({}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Cleared Database");
      }
    });
    socket.broadcast.emit('clearCanvas');
  });
}
