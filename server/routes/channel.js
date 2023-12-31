const express = require("express");
const router = express.Router();
const { connect, db, close } = require("./app");
const ObjectId = require("mongodb").ObjectId;

router.post("/", async (req, res) => {
  await connect();
  const { groupId, name, userId } = req.body;

  const newChannel = {
    _id: new ObjectId(),
    name: name,
    history: [],
  };

  // Insert the new channel into the 'channels' collection
  await db().collection("channels").insertOne(newChannel);

  // Push the new channel's ID to the group's channels array
  await db()
    .collection("groups")
    .updateOne(
      { _id: new ObjectId(groupId) },
      { $push: { channels: newChannel._id.toString() } }
    );

  res.json({ message: "Channel created!" });
  close();
});

router.post("/:channelId/addUser", async (req, res) => {
  await connect();
  const channelId = new ObjectId(req.params.channelId);
  const { groupId, userId } = req.body;

  const group = await db()
    .collection("groups")
    .findOne({ _id: new ObjectId(groupId) });

  if (!group) {
    return res.status(404).json({
      message: "Group not found.",
    });
  }

  if (!group.channels.includes(channelId.toString())) {
    return res.status(400).json({
      message: "Channel not part of the specified group.",
    });
  }

  if (!group.users.includes(userId)) {
    return res.status(400).json({
      message: "User is not part of the specified group.",
    });
  }

  await db()
    .collection("channels")
    .updateOne(
      { _id: channelId },
      { $addToSet: { users: userId } } // $addToSet to ensure no duplicates
    );

  res.json({ message: "User added to channel!" });
  close();
});

router.delete("/:channelId/removeUser", async (req, res) => {
  await connect();
  const channelId = new ObjectId(req.params.channelId);
  const { userId } = req.body;

  // Remove the user from the channel's users array
  await db()
    .collection("channels")
    .updateOne({ _id: channelId }, { $pull: { users: userId } });

  res.json({ message: "User removed from channel!" });
  close();
});

router.get("/", async (req, res) => {
  await connect();

  try {
    const channels = await db().collection("channels").find({}).toArray();
    res.json(channels);
  } catch (err) {
    console.error("Error fetching channels:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
  }
});

router.get("/getAllUsers", async (req, res) => {
  await connect();

  try {
    const users = await db().collection("users").find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
  }
});

router.delete("/:channelId", async (req, res) => {
  await connect();
  const channelId = new ObjectId(req.params.channelId);

  // Remove the channel from the 'channels' collection
  await db().collection("channels").deleteOne({ _id: channelId });

  // Pull the channel's ID from all groups' channels arrays
  await db()
    .collection("groups")
    .updateMany(
      { channels: channelId.toString() },
      { $pull: { channels: channelId.toString() } }
    );

  res.json({ message: "Channel deleted!" });
  close();
});
router.post("/:channelId/addMessage", async (req, res) => {
  try {
    console.log("CSRF token received in headers:", req.headers["csrf-token"]);

    await connect();
    const channelId = new ObjectId(req.body.channelId);
    const { message } = req.body;
    console.log("channelID and message.content:", channelId, message);

    await db()
      .collection("channels")
      .updateOne({ _id: channelId }, { $addToSet: { history: message } });

    res.json({ message: "Message added to channel!" });
  } catch (error) {
    console.error("Error adding message to channel:", error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the message." });
  } finally {
    close();
  }
});

module.exports = router;
