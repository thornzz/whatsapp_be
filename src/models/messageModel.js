import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: ObjectId,
      ref: "UserModel",
    },
    waba_id:{
      type:String,
      trim:true,
      default:''
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default:'sent'
    },
    conversation: {
      type: ObjectId,
      ref: "ConversationModel",
    },
    files: [],
  },
  {
    collection: "messages",
    timestamps: true,
  }
);

const MessageModel =
  mongoose.models.MessageModel || mongoose.model("MessageModel", messageSchema);

export default MessageModel;
