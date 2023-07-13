import mongoose from "mongoose";
var ObjectId=mongoose.ObjectId

const commentReplySchema = mongoose.Schema(
  {
    userId: { type:ObjectId , required: true },
    commentId: { type: ObjectId, required: true },
    reply: {type: String, required : true}
   
  },
  {
    timestamps: true,
  }
);

var commentReplyModel = mongoose.model("commentReplies", commentReplySchema);

export default commentReplyModel;


