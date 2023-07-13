import ChatModel from "../models/chatModel.js";
import UserModel from "../models/userModel.js";

export const createChat = async (req, res) => {
  const newChat = new ChatModel({
    members: [req.body.senderId, req.body.receiverId],
  });
  try {
    const result = await newChat.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const userChats = async (req, res) => {
  try {
    const chat = await ChatModel.find({
      members: { $in: [req.params.userId] },
    }).sort({ createdAt: -1 });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const findChat = async (req, res) => {
  try {
    const chat = await ChatModel.findOne({
      members: { $all: [req.params.firstId, req.params.secondId] },
    });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
   
    let users = await UserModel.find({
      $and: [
        { username: { $regex: new RegExp(req.query.search), $options: "i" } },
        { followers: { $in: [userId] } } 
      ]
    });


    users = users.map((user) => {
      const { password, ...otherDetails } = user._doc;
      return { ...otherDetails };
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
};
