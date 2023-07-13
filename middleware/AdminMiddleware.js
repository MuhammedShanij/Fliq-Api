import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
      
      next();
    } else {
      throw new Error("Token not provided");
    }
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default authMiddleWare;
