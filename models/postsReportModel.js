import mongoose from "mongoose";
var ObjectId = mongoose.ObjectId;

const postsReportSchema = mongoose.Schema(
  {
    postId: { type: ObjectId, required: true },
    postUserId: { type: ObjectId, required: true },
    reports: [{ 
      userId: { type: ObjectId },
       reason: { type: String } ,
       createdAt: { type: Date, default: Date.now }
      }],
  },
  {
    timestamps: true,
  }
);

var postsReportModel = mongoose.model("reports", postsReportSchema);

export default postsReportModel;
