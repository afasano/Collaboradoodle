var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  //Sketches User created
  sketches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sketch"
    }
  ],
  //List of invitations from other users
  invitations: [
    {
      sketchId: String,
      author: String
    }
  ],
  //Sketches User accepted when shared with
  sharedSketches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sketch"
    }
  ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
