var express                 = require ("express"),
    app                     = express(),
    mongoose                = require("mongoose"),
    path                    = require("path"),
    passport                = require("passport"),
    bodyParser              = require("body-parser"),
    LocalStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    Stroke                  = require("./models/stroke"),
    User                    = require("./models/user");

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

//FOR TESTING: remove all drawings from database
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
  // res.sendFile(path.join(__dirname + "/views/" + "index.html"));
  //send username and user id to sketch ejs
  res.render("sketch", { data: req.user });
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
var socket = require("socket.io");
var io = socket(server);

io.sockets.on("connection", newConnection);

function newConnection(socket) {
  console.log("new connection: " + socket.id);

  //send strokes in database to new connection
  Stroke.find({}, function(err, allStrokes) {
    if (err) {
      console.log(err);
    } else {
      //send allStrokes to sender-client only
      socket.emit("presentCanvas", allStrokes);
      // console.log("Sent allStrokes to: " + socket.id);
    }
  });

  //send new connected username to all clients
  socket.on("newUser", function(data) {
    socket.broadcast.emit("newUser", data)
  });

  //mouse data
  socket.on("mouse", function(data) {
    socket.broadcast.emit("mouse", data);
    // console.log(data);
  });

  //recieve line drawn from client and store into database
  socket.on("stroke", function(strokeData) {
    // console.log(strokeData);
    storeStroke(strokeData);
  });

  //clear database and all client canvases
  socket.on("clearDB", function() {
    Stroke.remove({}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Cleared Database");
        socket.broadcast.emit("clearCanvas");
      }
    });
  });

  //recieve undo command
  socket.on("undo", function(user) {
    var author = {
      author: {
        id: mongoose.Types.ObjectId(user._id),
        username: user.username
      }
    };
    //Can probably shorten with sort, but not working
    //finds all strokes by user
    Stroke.find(author, function(err, strokes) {
      if (err) {
        console.log(err);
      } else {
        if (strokes.length > 0) {
          //get the id of the most recent stroke
          var id = strokes[strokes.length - 1]._id;

          var data = {};
          if (strokes.length == 1) {
            data.noMore = true;
          }
          data.stroke = strokes[strokes.length - 1];
          //send the most recent stroke to store in array in client
          socket.emit("undo", data);

          //removes the most recent stroke
          Stroke.remove({_id: id}, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Undo");

              //returns all strokes
              getCanvas();
            }
          });
        } else {
          socket.emit("undo", false);
        }
      }
    });
  });

  //receive redo command
  socket.on("redo", function(stroke) {
    storeStroke(stroke, getCanvas);
    console.log("redo");
  });

  //stores given stroke in DB
  function storeStroke(stroke, callback = 0) {
    Stroke.create(stroke, function(err, createdStroke) {
      if (err) {
        console.log(err);
      } else {
        console.log("Line Stored");
        if (callback != 0) {
          callback();
        }
      }
    });
  }

  //gets all strokes in DB and returns it to all clients
  function getCanvas() {
    Stroke.find({}, function(err, allStrokes) {
      if (err) {
        console.log(err);
      } else {
        // console.log("Got Canvas");
        io.sockets.emit("refreshCanvas", allStrokes);
      }
    });
  }
}
