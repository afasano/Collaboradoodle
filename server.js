var express = require ('express');
var app = express();

app.use(express.static('public'));

var server = app.listen(process.env.PORT, process.env.IP, function() {
  console.log("Server is running");
});

//For TESTING: LISTEN ON PORT 3000
// var server = app.listen(3000, function() {
//   console.log("Port 3000 Server is running");
// });

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('new connection: ' + socket.id);

  socket.on('mouse', mouseMsg)

  function mouseMsg(data){
    socket.broadcast.emit('mouse', data);
    console.log(data);
  }
}
