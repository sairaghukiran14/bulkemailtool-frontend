require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const email_user = require("./SchemaModels/UserSchemaModel");
const sent_email_schemas = require("./SchemaModels/EmailSchemaModel");
const schedule_email_schema = require("./SchemaModels/ScheduledSchemaModel");
const jwt = require("jsonwebtoken");

app.use(express.json());
mongoose
  .connect(
    `mongodb+srv://raghukiran1414:${process.env.MONGODB_PASSWORD_SECRET}@cluster0.m82pxwz.mongodb.net/${process.env.MONGODB_DATABASE_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => console.log(err));

// Creating a transporter

let transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  auth: {
    user: "lovelyraghucr7@gmail.com",
    pass: process.env.SECRET_KEY,
  },
});
app.get("/", (req, res) => {
  res.send("Server Started");
});

// New User Registration Implementation

app.post("/registration", async (req, res) => {
  try {
    const { fullname, email_address, password, confirm_password } = req.body;

    const findexists = await email_user.findOne({
      email_address: email_address,
    });
    if (findexists) {
      return res.send("Account Already Exits");
    }
    if (password !== confirm_password) {
      return res.send("Password doesn't match");
    }
    const hashpassword = bcrypt.hashSync(password, 13);
    let newUser = new email_user({
      fullname,
      email_address,
      password: hashpassword,
    });
    newUser.save();
    return res.send("user Registered");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Server Error");
  }
});

// Login Functionality Implementation
app.post("/login", async (req, res) => {
  const { email_address, password } = req.body;
  const findUser = await email_user.findOne({ email_address: email_address });
  if (!findUser) {
    res.send("Invalid Login Details");
    return;
  }
  const isValid = bcrypt.compare(password, findUser.password);
  if (!isValid) {
    res.send("Invalid password");
    return;
  }

  const payload = {
    user: {
      id: findUser.id,
    },
  };

  const accessToken = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: 36000000 },
    (err, token) => {
      if (err) throw err;
      return res.json({ token });
    }
  );
});

app.get("/userslist", middleware_Authenticate_Token, async (req, res) => {
  let users_list = await email_user.find();
  return res.send(users_list);
});

//Sent email Details
app.post("/sendmail", middleware_Authenticate_Token, (req, res) => {
  const {
    email_title,
    email_subject,
    email_content,
    created_ByUser,
    email_list,
  } = req.body;
  let NewSentEmail = new sent_email_schemas({
    email_title,
    email_subject,
    email_content,
    created_ByUser,
    email_list,
  });

  let mailOptions = {
    from: "lovelyraghucr7@gmail.com",
    to: email_list,
    subject: email_subject,
    html: email_content,
  };
  NewSentEmail.save();
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);

      res.send("Email has been sent successfully");
    }
  });
});
app.get("/myprofile", middleware_Authenticate_Token, async (req, res) => {
  try {
    let present_user = await email_user.findById(req.user.id);
    return res.json(present_user);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Error");
  }
});
app.get("/displayemails", middleware_Authenticate_Token, async (req, res) => {
  const all_emails = await sent_email_schemas.find();
  res.send(all_emails);
});
app.post("/schedulemail", middleware_Authenticate_Token, (req, res) => {
  const {
    email_title,
    email_subject,
    email_content,
    created_ByUser,
    Send_timestamp,
  } = req.body;
  let NewSentEmail = new schedule_email_schema({
    email_title,
    email_subject,
    email_content,
    created_ByUser,
    Send_timestamp,
  });
  NewSentEmail.save();

  const cronSchedule = convertToCron(Send_timestamp);
  console.log(cronSchedule);
  cron.schedule(cronSchedule, () => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        const inserting_email_details =
          sent_email_schema.insertOne(NewSentEmail);

        const deleting_email_details = schedule_email_schema.deleteOne({
          email_title: NewSentEmail.email_title,
        });
        res.send("Email has been sent successfully");
      }
    });
  });
});
const convertToCron = (dateTime) => {
  const [date, time] = dateTime.split("T");
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");

  const cronSchedule = `${minute} ${hour} ${day} ${month} *`;

  return cronSchedule;
};
function middleware_Authenticate_Token(req, res, next) {
  try {
    let checktoken = req.header(`token`);
    if (!checktoken) {
      return res.status(400).send("Token not found");
    }
    let decoded_token = jwt.verify(checktoken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded_token.user;
    next();
  } catch (error) {
    if (error) throw error;
  }
}
app.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});
