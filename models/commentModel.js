import mongoose from "mongoose";
var ObjectId=mongoose.ObjectId

const commentSchema = mongoose.Schema(
  {
    userId: { type:ObjectId , required: true },
    postId: { type: ObjectId, required: true },
    comment: {type: String, required : true}
   
  },
  {
    timestamps: true,
  }
);

var commentModel = mongoose.model("comments", commentSchema);

export default commentModel;


