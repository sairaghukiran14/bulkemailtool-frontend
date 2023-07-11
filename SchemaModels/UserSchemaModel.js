const mongoose = require("mongoose");
const email_user = new mongoose.Schema({
  fullname: {
    type: "string",
    required: true,
  },
  email_address: {
    type: "string",
    required: true,
  },
  password: {
    type: "string",
    required: true,
  },
});

module.exports = mongoose.model("email_user", email_user);
