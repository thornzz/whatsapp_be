import logger from "../configs/logger.config.js";
import { updateLatestMessage } from "../services/conversation.service.js";
import {
  createMessage,
  getClosedConvoMessages,
  getConvoMessages,
  populateMessage,
} from "../services/message.service.js";
import { sendMessageToWabauser } from "../services/waba.service.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { message, convo_id, files, waba_user_phonenumber, type } = req.body;
    console.log(type, "typeeee");
    //send message to waba-user
    const responseFromWABA = await sendMessageToWabauser({
      to: waba_user_phonenumber,
      message,
      files: files || [],
    });

    // Update MongoDB messages

    const user_id = req.user._id;
    //const user_id = waba_user_id ;
    if (!convo_id || (!message && !files)) {
      logger.error("Please provider a conversation id and a message body");
      return res.sendStatus(400);
    }
    const msgData = {
      sender: user_id,
      message,
      waba_id: responseFromWABA?.messages[0]?.id,
      conversation: convo_id,
      files: files || [],
      type,
    };

    let newMessage = await createMessage(msgData);

    let populatedMessage = await populateMessage(newMessage._id);
    await updateLatestMessage(convo_id, newMessage);
    res.json(populatedMessage);
  } catch (error) {
    next(error);
  }
};
export const getMessages = async (req, res, next) => {
  try {
    const convo_id = req.params.convo_id;
    const convo_name = req.query.convo_name;
    const user_id = req.user._id;
    if (!convo_id && !convo_name) {
      logger.error("Please add a conversation id in params.");
      res.sendStatus(400);
    }
    let messages;
    if (convo_id) {
      messages = await getConvoMessages(convo_id);
      res.json(messages);
    } else if (convo_name) {
      messages = await getClosedConvoMessages(convo_name, user_id);
      res.json(messages);
    }
    // const user_id = req.user.userId;
    // const closed = req.query.closed;
    // let conversations;
    // if (closed)
    //   //closed parametresi var ise kapatılmış konuşmaları getir
    //   conversations = await getClosedUserConversations(user_id, closed);
    // else conversations = await getUserConversations(user_id);
    // res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};
