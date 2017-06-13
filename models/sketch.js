var mongoose = require("mongoose");
var strokeSchema = require("./stroke").schema;

var sketchSchema = new mongoose.Schema({
  name: String,
  description: String,
  strokes: [strokeSchema]
});

module.exports = mongoose.model("Sketch", sketchSchema);
