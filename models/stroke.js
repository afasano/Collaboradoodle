var mongoose = require("mongoose");

var strokeSchema = new mongoose.Schema({
  stroke: [
    {
      x: Number,
      y: Number
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
