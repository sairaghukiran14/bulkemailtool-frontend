const mongoose = require("mongoose");

const schedule_email_details = new mongoose.Schema({
  email_title: {
    type: "string",
    required: true,
  },
  email_subject: {
    type: "string",
    required: true,
  },
  email_content: {
    type: "string",
    required: true,
  },
  created_ByUser: {
    type: "string",
    required: true,
  },
  Send_timestamp: {
    type: "string",
    required: true,
  },
});
module.exports = mongoose.model(
  "schedule_email_details",
  schedule_email_details
);
