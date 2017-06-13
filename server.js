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

//local mongodb
mongoose.connect("mongodb://localhost/collab");

// mongoose.connect("mongodb://richard:password@ds127391.mlab.com:27391/collaboradoodle");
//mongodb://richard:password@ds127391.mlab.com:27391/collaboradoodle

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

//=========
//ROUTES
//=========
//Homepage
app.get("/", function(req, res) {
  res.render("landing", {user: req.user});
});

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
  //delete all strokes
  Sketch.findOne({_id: mongoose.Types.ObjectId(req.params.sketchId)}, function(err, foundSketch) {
    if (err) {
      console.log(err);
    } else {
      var strokes = foundSketch.strokes;
      for (var i = 0; i < strokes.length; i++) {
        Stroke.remove({_id: strokes[i]._id}, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Removed Strokes");
          }
        });
      }
      //delete sketch
      removeSketch();
    }
  });

  //fixes asynchronus issue
  function removeSketch() {
    //delete the sketch (because embeded all references become unallocated)
    Sketch.remove({_id: mongoose.Types.ObjectId(req.params.sketchId)}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted sketch");
        res.redirect("/workspace/" + req.params.id);
      }
    });
  }
});

//Canvas Route
app.get("/:sketchId/canvas", function(req, res) {
  res.render("canvas", { data: req.user, id: req.params.sketchId });
});

//Share Route
app.get("/workspace/:id/:sketchId/share", function(req, res) {
  res.render("workspace/share", {notFound: false});
});

//send invitation
app.post("/workspace/:id/:sketchId", function(req, res) {
  var user = req.body.user;

  //get user from DB and push in sketchId into invitations
  User.findOne({username: user}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
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
        res.render("workspace/share", {notFound: true});
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
            //add to sharedSketches
            Sketch.findOne({_id: mongoose.Types.ObjectId(sketchId)}, function(err, foundSketch) {
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
      res.redirect("/workspace/" + req.params.id);
    }
  });
});

//======================
//AUTHENTICATION ROUTES
//======================
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

//================
//LOGIN ROUTES
//===============
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
//creates new server listening to port passed in
var io = socket(server);

// //name of room for sketch
// var roomId;

// io.sockets.on("connection", newConnection);
//io.sockets is same as io (gets the default namespace / that clients connect to by default)
io.on("connection", newConnection);

//detects when user connects with a socket.io client side (sketch)
function newConnection(socket) {

  //name of room for sketch
  var roomId;

  console.log("new connection: " + socket.id);

  //connect client to sketch room
  socket.on("room", function(room) {
    roomId = room;
    socket.join(room);

    console.log("Joined room: " + roomId);

    //send strokes in database to new connection
    Sketch.findOne({_id: mongoose.Types.ObjectId(roomId)}, function(err, foundSketch) {
      if (err) {
        console.log(err);
      } else {
        //send allStrokes to sender-client only
        socket.emit("presentCanvas", foundSketch.strokes);
        // console.log("Sent allStrokes to: " + socket.id);
      }
    });
  });


  //send new connected username to all clients in room
  socket.on("newUser", function(data) {
    socket.to(roomId).emit("newUser", data)
  });

  //mouse data
  socket.on("mouse", function(data) {
    socket.to(roomId).emit("mouse", data);
    // console.log(data);
  });

  //recieve line drawn from client and store into database
  socket.on("stroke", function(strokeData) {
    // console.log(strokeData);
    storeStroke(strokeData);
  });

  //clear database and all client canvases
  socket.on("clearDB", function() {
    //get all ids for strokes in sketch and delete each stroke
      Sketch.findOne({_id: mongoose.Types.ObjectId(roomId)}, function(err, foundSketch) {
        var strokes = foundSketch.strokes;
        for (var i = 0; i < strokes.length; i++) {
          //remove stroke in Stroke collection
          Stroke.remove({_id: strokes[i]._id}, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Cleared Database");
            }
          });
        }
      });

      //deletes strokes in sketch
      Sketch.findByIdAndUpdate(
        mongoose.Types.ObjectId(roomId),
        { $pull : {strokes: {} } },
        { safe: true },
        function(err, obj){}
      );

      socket.to(roomId).emit("clearCanvas")
  });

  //recieve undo command
  socket.on("undo", function(user) {
    var author = {
      author: {
        id: mongoose.Types.ObjectId(user._id),
        username: user.username
      }
    };

    //Can probably shorten with sort flag, but not working
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

              //remove stroke in sketch
              Sketch.findOne({_id: mongoose.Types.ObjectId(roomId)}, function(err, foundSketch) {
                if (err) {
                  console.log(err);
                } else {
                  var sketchStrokes = foundSketch.strokes;
                  //finds the most recent stroke by user id
                  findUndo:
                  for (var i = sketchStrokes.length - 1; i >= 0 ; i--) {
                    console.log("here");
                    if (sketchStrokes[i]._id.equals(id)) {
                      console.log("Matched ID Undo");
                      sketchStrokes.splice(i, 1);
                      foundSketch.save(function() {
                        console.log("Refresh Canvas");
                        //refresh canvas for all users
                        getCanvas();
                      });
                      break findUndo;
                    }
                  }
                }
              });
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
    //stores stroke and refreshes canvas
    storeStroke(stroke, getCanvas);
    console.log("redo");
  });

  //stores given stroke in DB
  function storeStroke(stroke, callback = 0) {
    //create new stroke
    Stroke.create(stroke, function(err, createdStroke) {
      if (err) {
        console.log(err);
      } else {
        //pushes new stroke into sketch
        Sketch.findOne({_id: mongoose.Types.ObjectId(roomId)}, function(err, foundSketch) {
          if (err) {
            console.log(err);
          } else {
            foundSketch.strokes.push(createdStroke);
            foundSketch.save(callback);
            console.log("Line Stored");
          }
        });
      }
    });
  }

  //gets all strokes of sketch in DB and returns it to all clients
  function getCanvas() {
    Sketch.findOne({_id: mongoose.Types.ObjectId(roomId)}, function(err, foundSketch) {
      if (err) {
        console.log(err);
      } else {
        io.in(roomId).emit("refreshCanvas", foundSketch.strokes);
      }
    });
  }
}
