var express                 = require ("express"),
    app                     = express(),
    mongoose                = require("mongoose"),
    path                    = require("path"),
    passport                = require("passport"),
    bodyParser              = require("body-parser"),
    LocalStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    Stroke                  = require("./models/stroke"),
    User                    = require("./models/user");;

mongoose.connect("mongodb://localhost/collab");
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "collaboradoodle",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//remove all drawings from database
Stroke.remove({}, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Removed strokes")
  }
});

//ROUTES
app.get("/", function(req, res) {
  res.render("landing");
});

app.get("/canvas", isLoggedIn, function(req, res) {
  res.sendFile(path.join(__dirname + "/views/" + "index.html"));
});

//Auth Routes
//show sign up form
app.get("/register", function(req, res) {
    res.render("register");
});

//handling user sign up
app.post("/register", function(req, res) {
   User.register(new User({username: req.body.username}), req.body.password, function(err, user){
       if(err) {
           console.log(err);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function() {
           res.redirect("/canvas");
       });
   });
});

//LOGIN ROUTES
//render login form
app.get("/login", function(req, res) {
    res.render("login");
});
//login logic
app.post("/login", passport.authenticate("local", {
    successRedirect: "/canvas",
    failureRedirect: "/login",
}), function(req, res) {

});

app.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

// var server = app.listen(process.env.PORT, process.env.IP, function() {
//   console.log("Server is running");
// });

// For TESTING: LISTEN ON PORT 3000
var server = app.listen(3000, function() {
  console.log("Port 3000 Server is running");
});


//==========
// SOCKETS
//==========
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

  //mouse data
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
