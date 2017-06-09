var express                 = require ("express"),
    app                     = express(),
    mongoose                = require("mongoose"),
    path                    = require("path"),
    passport                = require("passport"),
    bodyParser              = require("body-parser"),
    LocalStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    bodyParser              = require("body-parser"),
    methodOverride          = require("method-override"),
    Stroke                  = require("./models/stroke"),
    Sketch                  = require("./models/sketch"),
    User                    = require("./models/user");

mongoose.connect("mongodb://localhost/collab");
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

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
//Homepage
app.get("/", function(req, res) {
  res.render("landing");
});

// app.get("/canvas", isLoggedIn, function(req, res) {
//   // res.sendFile(path.join(__dirname + "/views/" + "index.html"));
//   //send username and user id to sketch ejs
//   res.render("canvas", { data: req.user });
// });

app.get("/workspace", isLoggedIn, function(req, res) {
  res.redirect("/workspace/" + req.user._id);
});

//User's Personal Workspace
app.get("/workspace/:id", isLoggedIn, function(req, res) {
  //Get all Sketches for user
  User.findOne({_id: mongoose.Types.ObjectId(req.params.id)}).populate("sketches").populate("sharedSketches").exec(function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      res.render("workspace/index", {user: req.user, sketches: foundUser.sketches, sharedSketches: foundUser.sharedSketches});
    }
  });
});

//New Sketch Page
app.get("/workspace/:id/new", function(req,res) {
  res.render("workspace/new");
});

//Create New Sketch and add to User DB
app.post("/workspace/:id", function(req, res) {
  var name = req.body.name;
  var desc = req.body.description;
  var type = req.body.type;
  var newSketch = {
    name: name,
    description: desc,
    strokes: []
  };
  //create sketch
  Sketch.create(newSketch, function(err, createdSketch) {
      if (err) {
        console.log(err);
      } else {
        //put sketch project into user in DB
        User.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            foundUser.sketches.push(createdSketch);
            foundUser.save();
            // console.log(data);
            res.redirect("/" + createdSketch._id + "/canvas");
          }
        });
      }
  });
});

//Delete Sketch
app.delete("/workspace/:id/:sketchId", function(req, res) {
  User.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      //get index of the sketch to delete in user
      var index = foundUser.sketches.findIndex(function(element) {
        return element.equals(req.params.sketchId);
      });
      //if index is found
      if (index > -1) {
        foundUser.sketches.splice(index, 1);
        foundUser.save();
        console.log("Deleted sketch");
        res.redirect("/workspace/" + req.params.id);
      } else {
        console.log("Did not find sketch");
      }

      var sharedWith = foundUser.sharedWith;
      //delete all instances of sketch in other users
      for (var i = 0; i < sharedWith.length; i++) {
        if (sharedWith[i].sketchId == req.params.sketchId) {
          User.findOne({username: sharedWith[i].user}).populate("sharedSketches").exec(function(err, sharedUser) {
            var sharedSketch = sharedUser.sharedSketches;
            for (var i = 0; i < sharedSketch.length; i++) {
              if (sharedSketch[i]._id == req.params.sketchId) {
                sharedSketch.splice(i, 1);
                sharedUser.save();
                console.log("Deleted sketch instance");
              }
            }
          });
          //delete instance in sharedWith
          foundUser.sharedWith.splice(i, 1);
          foundUser.save();
          console.log("Deleted in sharedWith");
        }
      }
    }
  });
});

//Canvas Route
app.get("/:sketchId/canvas", function(req, res) {
  res.render("canvas", { data: req.user });
});

//Share Route
app.get("/workspace/:id/:sketchId/share", function(req, res) {
  res.render("share");
});

//send invitation
app.post("/workspace/:id/:sketchId", function(req, res) {
  var user = req.body.user;

  //get user from DB and push in sketchId into invitations
  User.findOne({username: user}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      //TODO Check if no user when client typing
      if (foundUser != null) {
        foundUser.invitations.push({
          sketchId: req.params.sketchId,
          author: req.user.username
        });
        foundUser.save();
        console.log("Sent invitation");
        res.redirect("/workspace/" + req.params.id);
      } else {
        console.log("No User");
      }
    }
  });
});

//invitation response
app.put("/workspace/:id", function(req, res) {
  var invitation = req.body.invitation.split(",");
  var sketchId = invitation[0];
  var author = invitation[1];
  var response = Number(req.body.response);
  User.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      findInvite:
      for (var i = 0; i < foundUser.invitations.length; i++) {
        if (foundUser.invitations[i].sketchId == sketchId) {
          //if accept move invite to sharedSketches, if reject delete invitation
          if (response) {
            //add user and sketchId into sharedWith array of author
            User.findOne({username: author}, function(err, foundUser) {
              if (err) {
                console.log(err);
              } else {
                foundUser.sharedWith.push({
                  sketchId: sketchId,
                  user: req.user.username
                });
                foundUser.save();
                console.log("Saved shared user");
              }
            });

            //add to sharedSketches
            Sketch.findOne({_id: mongoose.Types.ObjectId(sketchId)}, function(err, foundSketch) {
              console.log(foundSketch);
              foundUser.sharedSketches.push(foundSketch);
              foundUser.invitations.splice(i, 1);
              foundUser.save();
              console.log("Accepted Invite");
            });
          } else {
            //remove invite
            foundUser.invitations.splice(i, 1);
            foundUser.save();
            console.log("Deleted Invite");
          }
          break findInvite;
        }
      }
    }
    //TODO asynch, make callback
    res.redirect("/workspace/" + req.params.id);
  });
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
           res.redirect("/workspace/" + req.user._id);
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
    // successRedirect: "/workspace",
    failureRedirect: "/login",
}), function(req, res) {
    res.redirect("/workspace/" + req.user._id);
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

//Have to fix storing to database
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
