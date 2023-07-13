import UserModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import jwt_decode from "jwt-decode"

// Register new user
export const registerUser = async (req, res) => {
  console.log("haii")

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt);
  req.body.password = hashedPass
  const newUser = new UserModel(req.body);
  const {username,email} = req.body
  try {
    // addition new
    const usernameUser = await UserModel.findOne({ username });
    const emailUser = await UserModel.findOne({   email });


    if (usernameUser)
      return res.status(400).json( "Username already exists" );

      if (emailUser)
      return res.status(400).json( "Email already exists" );

    // changed
    const user = await newUser.save();
    const token = jwt.sign(
      { username: user.username,email:user.email, id: user._id },
      process.env.JWTKEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Login User

// Changed
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // const user = await UserModel.findOne({ username: username });
    const user = await UserModel.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (user) {
      if(user.isBlocked){
        res.status(404).json("User is Blocked");

      }else{
      const validity = await bcrypt.compare(password, user.password);

      if (!validity) {
        res.status(400).json("Wrong password");
      } else {
        const token = jwt.sign(
          { username: user.username, id: user._id ,email:user.email},
          process.env.JWTKEY,
          { expiresIn: "1h" }
        );
        res.status(200).json({ user, token });
      }
    }
    } else {
      res.status(404).json("User not found");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const googleRegister = async (req, res) => {
  const { credential } = req.body;
  
  try {
    let decoded = await jwt_decode(credential);

    const { given_name,family_name, email, sub,picture } = decoded;
    const user = await UserModel.findOne({ googleId: sub });
    if (user) {
      if(user.isBlocked){
        res.status(404).json("User is Blocked");

      }else{
      const token = jwt.sign(
        {
          username: user.username,
          id: user._id,
        },
        process.env.JWTKEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({ user, token });
      }
    } else {
      const newUser = new UserModel({
        email: email,
        firstname: given_name,
        lastname:family_name,
        googleId: sub,
        profilePicture:picture,
        expiresAt: null,
      });
      const user = await newUser.save();
      const token = jwt.sign(
        {
          username: user.username,
          id: user._id,
        },
        process.env.JWTKEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({ user, token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
