import PostModel from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import CommentModel from "../models/commentModel.js";
import CommentReplyModel from "../models/commentReplyModel.js"
import ReportModel from "../models/postsReportModel.js";
import mongoose from "mongoose";

// creating a post

export const createPost = async (req, res) => {
  const newPost = new PostModel(req.body);
  try {
    await newPost.save();

    const post = JSON.parse(JSON.stringify(newPost));
    post.userInfo = {};
    let users = await UserModel.find();
    users.forEach((user) => {
      if (user._id.toString() === post.userId.toString()) {
        post.userInfo.username = user.username;
        if (user.profilePicture)
          post.userInfo.profilePicture = user.profilePicture;
      }
    });
    post.comments = [];

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// get a post

export const getPost = async (req, res) => {
  const id = req.params.id;

  try {
    const post = await PostModel.findById(id);

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
};

// update post
export const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(postId);
    console.log("req.body",post.userId,userId)
    if (post.userId === userId) {
    await post.updateOne({ $set: req.body },{new:true});
     
      res.status(200).json(req.body.desc);
    } else {
      res.status(403).json("Authentication failed");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

//update an existing comment
export const updateComment = async (req, res) => {
  const { userId,commentId,newComment } = req.body;
  try {
    const existingComment = await CommentModel.findById(commentId);
    if (existingComment.userId.equals(mongoose.Types.ObjectId(userId))) {
      await existingComment.updateOne({ $set: {comment :newComment}},{new:true});
      res.status(200).json(req.body)
    } else {
      res.status(403).json("Authentication failed");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// delete a post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(id);
    if (post.userId === userId) {
      await post.deleteOne();
      res.status(200).json(post);
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

export const deleteComment = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  try {
    const comment = await CommentModel.findById(id);
    if (comment.userId.equals(mongoose.Types.ObjectId(userId))) {
      await comment.deleteOne();
      await CommentReplyModel.deleteMany({commentId:id})
      const user = await UserModel.findById(userId);
      const followingIds = user.following;
      followingIds.push(userId);

      const postsWithComments = await PostModel.aggregate([
        {
          $addFields: {
            userId: { $toObjectId: "$userId" },
          },
        },
        {
          $match: {
            userId: {
              $in: followingIds.map((id) => mongoose.Types.ObjectId(id)),
            },
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
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.userId",
            foreignField: "_id",
            as: "commentUsers",
          },
        },
        {
          $lookup: {
            from: "commentreplies",
            localField: "comments._id",
            foreignField: "commentId",
            as: "commentReplies",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "commentReplies.userId",
            foreignField: "_id",
            as: "commentReplyUsers",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            desc: 1,
            likes: 1,
            image: 1,
            video: 1,
            status: 1,
            createdAt: 1,
            "userInfo.username": 1,
            "userInfo.profilePicture": 1,
            comments: {
              $map: {
                input: "$comments",
                as: "comment",
                in: {
                  $mergeObjects: [
                    "$$comment",
                    {
                      commentUser: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentUsers",
                              cond: { $eq: ["$$this._id", "$$comment.userId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    { _id: "$$comment._id" },
                    {
                      commentReplies: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$commentReplies",
                              cond: {
                                $eq: ["$$this.commentId", "$$comment._id"],
                              },
                            },
                          },
                          as: "reply",
                          in: {
                            $mergeObjects: [
                              "$$reply",
                              {
                                replyUser: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$commentReplyUsers",
                                        cond: {
                                          $eq: ["$$this._id", "$$reply.userId"],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
     
      ]);

      const allPosts = postsWithComments.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      res.status(200).json(allPosts);
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

export const deleteCommentReply = async (req, res) => {
  console.log("hi",req.body)

  const id = req.params.id;
  const { userId } = req.body;
  console.log("hi")
  try {
    const reply = await CommentReplyModel.findById(id);
    if (reply.userId.equals(mongoose.Types.ObjectId(userId))) {
      await reply.deleteOne();

      const user = await UserModel.findById(userId);
      const followingIds = user.following;
      followingIds.push(userId);

      const postsWithComments = await PostModel.aggregate([
        {
          $addFields: {
            userId: { $toObjectId: "$userId" },
          },
        },
        {
          $match: {
            userId: {
              $in: followingIds.map((id) => mongoose.Types.ObjectId(id)),
            },
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
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.userId",
            foreignField: "_id",
            as: "commentUsers",
          },
        },
        {
          $lookup: {
            from: "commentreplies",
            localField: "comments._id",
            foreignField: "commentId",
            as: "commentReplies",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "commentReplies.userId",
            foreignField: "_id",
            as: "commentReplyUsers",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            desc: 1,
            likes: 1,
            image: 1,
            video: 1,
            status: 1,
            createdAt: 1,
            "userInfo.username": 1,
            "userInfo.profilePicture": 1,
            comments: {
              $map: {
                input: "$comments",
                as: "comment",
                in: {
                  $mergeObjects: [
                    "$$comment",
                    {
                      commentUser: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentUsers",
                              cond: { $eq: ["$$this._id", "$$comment.userId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    { _id: "$$comment._id" },
                    {
                      commentReplies: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$commentReplies",
                              cond: {
                                $eq: ["$$this.commentId", "$$comment._id"],
                              },
                            },
                          },
                          as: "reply",
                          in: {
                            $mergeObjects: [
                              "$$reply",
                              {
                                replyUser: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$commentReplyUsers",
                                        cond: {
                                          $eq: ["$$this._id", "$$reply.userId"],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
     
      ]);

      const allPosts = postsWithComments.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      res.status(200).json(allPosts);
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// like/dislike a post
export const likePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  try {
    const post = await PostModel.findById(id);
    if (post.likes.includes(userId)) {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json("Post disliked");
    } else {
      await post.updateOne({ $push: { likes: userId } });
      res.status(200).json("Post liked");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get timeline posts
export const getTimelinePosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await UserModel.findById(userId);
    const followingIds = user.following;
    followingIds.push(userId);
    const postsWithComments = await PostModel.aggregate([
      {
        $addFields: {
          userId: { $toObjectId: "$userId" },
        },
      },
      {
        $match: {
          userId: {
            $in: followingIds.map((id) => mongoose.Types.ObjectId(id)),
          },
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
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.userId",
          foreignField: "_id",
          as: "commentUsers",
        },
      },
      {
        $lookup: {
          from: "commentreplies",
          localField: "comments._id",
          foreignField: "commentId",
          as: "commentReplies",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentReplies.userId",
          foreignField: "_id",
          as: "commentReplyUsers",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          desc: 1,
          likes: 1,
          image: 1,
          video: 1,
          status: 1,
          createdAt: 1,
          "userInfo.username": 1,
          "userInfo.profilePicture": 1,
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                $mergeObjects: [
                  "$$comment",
                  {
                    commentUser: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$commentUsers",
                            cond: { $eq: ["$$this._id", "$$comment.userId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  { _id: "$$comment._id" },
                  {
                    commentReplies: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$commentReplies",
                            cond: {
                              $eq: ["$$this.commentId", "$$comment._id"],
                            },
                          },
                        },
                        as: "reply",
                        in: {
                          $mergeObjects: [
                            "$$reply",
                            {
                              replyUser: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$commentReplyUsers",
                                      cond: {
                                        $eq: ["$$this._id", "$$reply.userId"],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);
    
    
    

    const allPosts = postsWithComments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.status(200).json(allPosts);
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
  }
};
export const addComment = async (req, res) => {
  console.log(req.body)
  req.body.userId = mongoose.Types.ObjectId(req.body.userId);
  req.body.postId = mongoose.Types.ObjectId(req.body.postId);
  const newComment = new CommentModel(req.body);
  const user = await UserModel.findById(req.body.userId);
  const followingIds = user.following;
  followingIds.push(req.body.userId);

  try {
    await newComment.save();
     const postsWithComments = await PostModel.aggregate([
      
      {
        $addFields: {
          userId: { $toObjectId: "$userId" },
        },
      },
      {
        $match: {
          userId: {
            $in: followingIds.map((id) => mongoose.Types.ObjectId(id)),
          },
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
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.userId",
          foreignField: "_id",
          as: "commentUsers",
        },
      },
      {
        $lookup: {
          from: "commentreplies",
          localField: "comments._id",
          foreignField: "commentId",
          as: "commentReplies",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentReplies.userId",
          foreignField: "_id",
          as: "commentReplyUsers",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          desc: 1,
          likes: 1,
          image: 1,
          video: 1,
          status: 1,
          createdAt: 1,
          "userInfo.username": 1,
          "userInfo.profilePicture": 1,
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                $mergeObjects: [
                  "$$comment",
                  {
                    commentUser: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$commentUsers",
                            cond: { $eq: ["$$this._id", "$$comment.userId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  { _id: "$$comment._id" },
                  {
                    commentReplies: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$commentReplies",
                            cond: {
                              $eq: ["$$this.commentId", "$$comment._id"],
                            },
                          },
                        },
                        as: "reply",
                        in: {
                          $mergeObjects: [
                            "$$reply",
                            {
                              replyUser: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$commentReplyUsers",
                                      cond: {
                                        $eq: ["$$this._id", "$$reply.userId"],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);
    const allPosts = postsWithComments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json(allPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export const addCommentReply = async (req, res) => {
  console.log("req.body",req.body)
  req.body.userId = mongoose.Types.ObjectId(req.body.userId);
  req.body.commentId = mongoose.Types.ObjectId(req.body.commentId);
  const newReply = new CommentReplyModel(req.body);
  const user = await UserModel.findById(req.body.userId);
  
  const followingIds = user.following;
  followingIds.push(req.body.userId);
  
  try {
    await newReply.save();
    const postsWithComments = await PostModel.aggregate([
      
      {
        $addFields: {
          userId: { $toObjectId: "$userId" },
        },
      },
      {
        $match: {
          userId: {
            $in: followingIds.map((id) => mongoose.Types.ObjectId(id)),
          },
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
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.userId",
          foreignField: "_id",
          as: "commentUsers",
        },
      },
      {
        $lookup: {
          from: "commentreplies",
          localField: "comments._id",
          foreignField: "commentId",
          as: "commentReplies",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentReplies.userId",
          foreignField: "_id",
          as: "commentReplyUsers",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          desc: 1,
          likes: 1,
          image: 1,
          video: 1,
          status: 1,
          createdAt: 1,
          "userInfo.username": 1,
          "userInfo.profilePicture": 1,
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                $mergeObjects: [
                  "$$comment",
                  {
                    commentUser: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$commentUsers",
                            cond: { $eq: ["$$this._id", "$$comment.userId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  { _id: "$$comment._id" },
                  {
                    commentReplies: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$commentReplies",
                            cond: {
                              $eq: ["$$this.commentId", "$$comment._id"],
                            },
                          },
                        },
                        as: "reply",
                        in: {
                          $mergeObjects: [
                            "$$reply",
                            {
                              replyUser: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$commentReplyUsers",
                                      cond: {
                                        $eq: ["$$this._id", "$$reply.userId"],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);
    
    const allPosts = postsWithComments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json(allPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

//report post
export const reportPost = async (req, res) => {
  const reportInfo = { userId: req.body.userId, reason: req.body.reason };

  const postExist = await ReportModel.findOne({ postId: req.body.postId });
  if (!postExist) {
    const reportData = {
      postId: req.body.postId,
      postUserId: req.body.postUserId,
      reports: [reportInfo],
    };
    const newReport = new ReportModel(reportData);
    try {
      await newReport.save();
      res.status(200).json("Reported");
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  } else {
    const alreadyReported = postExist.reports.some((report) =>report.userId.equals(mongoose.Types.ObjectId(req.body.userId)));
    if (alreadyReported) {
      res.status(200).json("Already Reported");
    } else {
      try {
        const post = await ReportModel.findByIdAndUpdate(
          postExist._id,
          {
            $push: { reports: reportInfo },
          },
          { new: true }
        );
        if (post.reports.length > 10) {
          await PostModel.findByIdAndUpdate(req.body.postId, { status: false });
        }
        res.status(200).json("Reported");
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    }
  }
};
