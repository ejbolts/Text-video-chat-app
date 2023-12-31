// register.js
const express = require("express");
const router = express.Router();
const { connect, db, close } = require("./app");
const User = require("../user.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.post("/", async (req, res) => {
  await connect();
  const userData = req.body;
  const existingUser = await db()
    .collection("users")
    .findOne({ username: userData.username });

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists." });
  }

  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  userData.password = hashedPassword;
  const user = new User(
    null,
    userData.username,
    userData.email,
    userData.password,
    userData.role,
    userData.profilePic
  );
  const result = await db().collection("users").insertOne(user);

  res.json({ message: "User registered!", _id: result.insertedId });
  close();
});

module.exports = router;
