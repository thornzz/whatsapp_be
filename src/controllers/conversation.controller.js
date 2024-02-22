import createHttpError from "http-errors";

import logger from "../configs/logger.config.js";
import {
  closeConversationById,
  createConversation,
  doesConversationExist,
  getClosedUserConversations,
  getConversationsByUser,
  getUserConversations,
  populateConversation,
  transferConversation as transferConvo,
} from "../services/conversation.service.js";

export const create_open_conversation = async (req, res, next) => {
  try {
    const sender_id = req.user._id;
    const { receiver_id, isGroup, waba_user_id, closed } = req.body;
    if (!isGroup) {
      //check if receiver_id is provided
      if (!receiver_id) {
        logger.error(
          "please provide the user id you wanna start a conversation with !"
        );
        throw createHttpError.BadGateway("Oops...Something went wrong !");
      }
      //check if chat exists
      const existed_conversation = await doesConversationExist(
        sender_id,
        receiver_id,
        false,
        closed
      );
      if (existed_conversation) {
        res.json(existed_conversation);
      } else {
        // let receiver_user = await findUser(receiver_id);
        let convoData = {
          name: "conversation name",
          picture: "conversation picture",
          isGroup: false,
          users: [sender_id, receiver_id],
        };
        const newConvo = await createConversation(convoData);
        const populatedConvo = await populateConversation(
          newConvo._id,
          "users",
          "-password"
        );
        res.status(200).json(populatedConvo);
      }
    } else {
      console.log("hnaaaaaaaaaa");
      //it's a group chat
      //check if group chat exists
      const existed_group_conversation = await doesConversationExist(
        "",
        "",
        isGroup,
        waba_user_id
      );
      res.status(200).json(existed_group_conversation);
    }
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    console.log(req.user, "get conversation");
    const user_id = req.user._id;
    const closed = req.query.closed;
    let conversations;
    if (closed) {
      //closed parametresi var ise kapatılmış konuşmaları getir
      conversations = await getClosedUserConversations(user_id);
    } else {
      console.log("closed false girdi");
      conversations = await getUserConversations(user_id);
    }
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getUserReceiverConversations = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const receiver_id = req.query.receiver;

    const conversations = await getConversationsByUser(user_id, receiver_id);

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};
export const transferConversation = async (req, res, next) => {
  try {
    const { convo_id, oldUserId, newUserId } = req.body;

    const transferredConvo = await transferConvo(
      convo_id,
      oldUserId,
      newUserId
    );
    res.status(200).json(transferredConvo);
  } catch (error) {
    next(error);
  }
};
export const closeConversation = async (req, res, next) => {
  try {
    const convo_id = req.body.convo_id;
    const closedConvo = await closeConversationById(convo_id);
    res.status(200).json(closedConvo);
  } catch (error) {
    next(error);
  }
};
export const createGroup = async (req, res, next) => {
  const { name, users } = req.body;
  //add current user to users
  users.push(req.user.userId);
  if (!name || !users) {
    throw createHttpError.BadRequest("Please fill all fields.");
  }
  if (users.length < 2) {
    throw createHttpError.BadRequest(
      "At least 2 users are required to start a group chat."
    );
  }
  let convoData = {
    name,
    users,
    isGroup: true,
    admin: req.user.userId,
    picture: process.env.DEFAULT_GROUP_PICTURE,
  };
  try {
    const newConvo = await createConversation(convoData);
    const populatedConvo = await populateConversation(
      newConvo._id,
      "users admin",
      "-password"
    );
    res.status(200).json(populatedConvo);
  } catch (error) {
    next(error);
  }
};
