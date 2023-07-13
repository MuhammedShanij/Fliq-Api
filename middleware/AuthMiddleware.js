import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserModel from "../models/userModel.js";

dotenv.config();
const secret = process.env.JWTKEY;
const authMiddleWare = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, secret);
      if (!decoded) {
        throw new Error("Invalid token");
      }
      req.body._id = decoded?.id;
      const user = await UserModel.findById(decoded?.id);
      if (user && user.isBlocked) {
        res.status(200).json("UserBlocked");
        return;
      }
      next();
    } else {
      throw new Error("Token not provided");
    }
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authMiddleWare;
