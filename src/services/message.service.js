import createHttpError from "http-errors";

import { ConversationModel, MessageModel } from "../models/index.js";

export const createMessage = async (data) => {
  let newMessage = await MessageModel.create(data);
  if (!newMessage)
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  return newMessage;
};

export const populateMessage = async (id) => {
  let msg = await MessageModel.findById(id)
    .populate({
      path: "sender",
      select: "name picture",
      model: "UserModel",
    })
    .populate({
      path: "conversation",
      select: "name picture isGroup users",
      model: "ConversationModel",
      populate: {
        path: "users",
        select: "name email picture status",
        model: "UserModel",
      },
    });
  if (!msg) throw createHttpError.BadRequest("Oops...Something went wrong !");
  return msg;
};

export const getConvoMessages = async (convo_id) => {
  const messages = await MessageModel.find({ conversation: convo_id })
    .populate("sender", "name picture email status type")
    .populate({
      path: "conversation",
      populate: {
        path: "transfers.from transfers.to",
        model: "UserModel",
        select: "name",
      },
    });
  if (!messages) {
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  }
  console.log(messages, "messagesssssss");
  return messages;
};

export const getClosedConvoMessages = async (convo_name, user_id) => {
  const conversations = await ConversationModel.find({
    name: convo_name,
    closed: true,
    users: { $elemMatch: { $eq: user_id } },
  }).lean();

  const conversationIds = conversations.map((conversation) => conversation._id);

  const messages = await MessageModel.find({
    conversation: { $in: conversationIds },
  })
    .populate("sender", "name picture email status type")
    .populate({
      path: "conversation",
      populate: {
        path: "transfers.from transfers.to",
        model: "UserModel",
        select: "name",
      },
    });

  if (!messages) {
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  }

  return messages;
};
