const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  number: Number,
  name: String,
  photo: String,
  drawn: { type: Boolean, default: false },
  givesTo: { type: String, default: null },
  receivedFrom: { type: String, default: null }
});

// Le 3ème argument "participants" est CRUCIAL pour pointer vers ta collection Atlas
module.exports = mongoose.model("Member", memberSchema, "participants");