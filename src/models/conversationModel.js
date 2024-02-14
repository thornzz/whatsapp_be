import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;
const conversationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sohbet adı gereklidir."],
      trim: true,
    },
    picture: {
      type: String,
      required: true,
    },
    isGroup: {
      type: Boolean,
      required: true,
      default: false,
    },
    transferred: {
      type: Boolean,
      default: false,
    },
    transfers: [
      {
        from: { type: ObjectId, ref: "UserModel" },
        to: { type: ObjectId, ref: "UserModel" },
        at: { type: Date },
        latestMessageBeforeTransfer: { type: ObjectId, ref: "MessageModel" },
        firstMessageBeforeTransfer: { type: ObjectId, ref: "MessageModel" },
      },
    ],
    users: [
      {
        type: ObjectId,
        ref: "UserModel",
      },
    ],
    closed: {
      type: Boolean,
      required: true,
      default: false,
    },
    latestMessage: {
      type: ObjectId,
      ref: "MessageModel",
    },
    admin: {
      type: ObjectId,
      ref: "UserModel",
    },
  },
  {
    collection: "conversations",
    timestamps: true,
  }
);

const ConversationModel =
  mongoose.models.ConversationModel ||
  mongoose.model("ConversationModel", conversationSchema);

export default ConversationModel;
