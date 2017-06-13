var mongoose = require("mongoose");

var strokeSchema = new mongoose.Schema({
  stroke: [
    {
      x: Number,
      y: Number,
      color1: Number,
      color2: Number,
      color3: Number,
      sendtype: Boolean,
      vol: Number
    }
  ],
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }
});

module.exports = mongoose.model("Stroke", strokeSchema);
