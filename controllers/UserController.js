import UserModel from "../models/userModel.js";
import mongoose from "mongoose";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Get a User
export const getUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await UserModel.findById(id);
    if (user) {
      const { password, ...otherDetails } = user._doc;

      res.status(200).json(otherDetails);
    } else {
      res.status(404).json("No such User");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getBlockStatus = async (req, res, next) => {
  const userId = req.params.id;

  try {
    // Retrieve the user from the database
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assuming the user model has a property named "isBlocked"
    const isBlocked = user.isBlocked;

    // Return the block status
    res.json({ isBlocked });
  } catch (error) {
    console.error('Error retrieving block status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    let users = await UserModel.find();
    users = users.map((user) => {
      const { password, ...otherDetails } = user._doc;
      return otherDetails;
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get all users dynamically

export const getAllUsersDynamically = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const skip = (page - 1) * limit;
    const users = await UserModel.find().skip(skip).limit(limit);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
};

// udpate a user

export const updateUser = async (req, res) => {
  const { _id,  password ,id} = req.body;
  if (id === _id) {
    try {
      // if we also have to update password then password will be bcrypted again
      if (password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(password, salt);
      }
      // have to change this
      const user = await UserModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      const token = jwt.sign(
        { username: user.username, id: user._id },
        process.env.JWTKEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({ user, token });
    } catch (error) {
      console.log("Error agya hy", error);
      res.status(500).json(error);
    }
  } else {
    res
      .status(403)
      .json("Access Denied! You can update only your own Account.");
  }
};

export const changeUsername = async (req, res) => {
  const { userId,username } = req.body;
    try {
      const oldUser = await UserModel.findOne({ username });

      if (oldUser)
        return res.status(400).json( "User already exists" );
      const user = await UserModel.findByIdAndUpdate(userId, {username}, {
        new: true,
      });
      const token = jwt.sign(
        { username: user.username, id: user._id },
        process.env.JWTKEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({ user, token });
    } catch (error) {
      console.log("Error agya hy", error);
      res.status(500).json(error);
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const id = req.params.id;

  const { currentUserId, currentUserAdmin } = req.body;

  if (currentUserId == id || currentUserAdmin) {
    try {
      await UserModel.findByIdAndDelete(id);
      res.status(200).json("User Deleted Successfully!");
    } catch (error) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("Access Denied!");
  }
};

// Follow a User
// changed
export const followUser = async (req, res) => {
  const id = req.params.id;
  const { _id } = req.body;
  if (_id == id) {
    res.status(403).json("Action Forbidden");
  } else {
    try {
      const followUser = await UserModel.findById(id);
      const followingUser = await UserModel.findById(_id);

      if (!followUser.followers.includes(_id)) {
        await followUser.updateOne({ $push: { followers: _id } });
        await followingUser.updateOne({ $push: { following: id } });
        res.status(200).json("User followed!");
      } else {
        res.status(403).json("you are already following this id");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
};

// Unfollow a User
// changed
export const unfollowUser = async (req, res) => {
  const id = req.params.id;
  const { _id } = req.body;

  if (_id === id) {
    res.status(403).json("Action Forbidden");
  } else {
    try {
      const unFollowUser = await UserModel.findById(id);
      const unFollowingUser = await UserModel.findById(_id);

      if (unFollowUser.followers.includes(_id)) {
        await unFollowUser.updateOne({ $pull: { followers: _id } });
        await unFollowingUser.updateOne({ $pull: { following: id } });
        res.status(200).json("Unfollowed Successfully!");
      } else {
        res.status(403).json("You are not following this User");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
};

export const followersList = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await UserModel.findById(id);

    const followerObjectIds = user.followers.map((id) =>
      mongoose.Types.ObjectId(id)
    );

    const followersData = await UserModel.aggregate([
      { $match: { _id: { $in: followerObjectIds } } },
    ]);

    res.status(200).json(followersData);
  } catch (error) {
    res.status(500).json(error);
  }
};
export const followingList = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await UserModel.findById(id);

    const followingObjectIds = user.following.map((id) =>
      mongoose.Types.ObjectId(id)
    );

    const followingData = await UserModel.aggregate([
      { $match: { _id: { $in: followingObjectIds } } },
    ]);

    res.status(200).json(followingData);
  } catch (error) {
    res.status(500).json(error);
  }
};
