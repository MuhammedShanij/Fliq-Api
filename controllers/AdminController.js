import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import PostModel from "../models/postModel.js";
import postsReportModel from "../models/postsReportModel.js";
import dotenv from "dotenv";
dotenv.config();

//admin login
export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (username === process.env.ADMIN_USERNAME) {
      if (password != process.env.ADMIN_PASSWORD) {
        res.status(400).json("wrong password");
      } else {
        const token = jwt.sign({ username: username }, process.env.JWTKEY, {
          expiresIn: "1h",
        });
        res.status(200).json({ token });
      }
    } else {
      res.status(404).json("Admin not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
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

export const getAllSearchUsers = async (req, res) => {
  try {
    console.log("reeq.body",req.body)
    // let users = await UserModel.find();
    // users = users.map((user) => {
    //   const { password, ...otherDetails } = user._doc;
    //   return otherDetails;
    // });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const blockManagement = async (req, res) => {
  const userId = req.body._id;
  const blockStatus = req.body.isBlocked;
  try {
    let user = await UserModel.findByIdAndUpdate(
      userId,
      { isBlocked: !blockStatus },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const blockPost = async (req, res) => {
  const id = req.params.id;
  try {
    await PostModel.findByIdAndUpdate(id, { status: !req.body.status });
    res.status(200).json("Success");
  } catch (error) {
    res.status(500).json(error);
  }
};
export const getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.aggregate([
      {
        $addFields: {
          userId: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          desc: 1,
          likes: 1,
          image: 1,
          createdAt: 1,
          status: 1,
          "userInfo.username": 1,
          "userInfo.profilePicture": 1,
        },
      },
    ]);
    const allPosts = posts.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json(allPosts);
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
  }
};

export const getAllReportedPost = async (req, res) => {
  try {
    const reportedPosts = await postsReportModel
      .aggregate([
        {
          $lookup: {
            from: "posts",
            localField: "postId",
            foreignField: "_id",
            as: "post",
          },
        },
        {
          $unwind: "$post",
        },
        {
          $lookup: {
            from: "users",
            localField: "postUserId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $lookup: {
            from: "users",
            let: { userIds: "$reports.userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$userIds"],
                  },
                },
              },
            ],
            as: "reportUsers",
          },
        },
        {
          $project: {
            post: 1,
            user: 1,
            reports: {
              $map: {
                input: "$reports",
                as: "report",
                in: {
                  $mergeObjects: [
                    "$$report",
                    {
                      user: {
                        $arrayElemAt: [
                          "$reportUsers",
                          {
                            $indexOfArray: [
                              "$reportUsers._id",
                              "$$report.userId",
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ])
      .exec();
      console.log("reported post ",reportedPosts)
    res.status(200).json(
      reportedPosts.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    );
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
  }
};
