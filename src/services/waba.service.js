import { parseIncomingWabaMessage } from "../utils/waba.util.js";
import { getGlobalSocket, getGlobalIO } from "../constants/index.js";
import { ConversationModel, UserModel } from "../models/index.js";
import {
  createConversation,
  doesConversationExist,
  getUserConversations,
  doesWabaGroupConversationExist,
  populateConversation,
  updateLatestMessage,
} from "../services/conversation.service.js";
import {
  createMessage,
  getConvoMessages,
  populateMessage,
} from "../services/message.service.js";
import { MessageModel } from "../models/index.js";
import axios from "axios";
import logger from "../configs/logger.config.js";

export const handleIncomingWabaMessage = async (data) => {
  try {
    const io = getGlobalIO();
    const RECEIVER_ID = "6580b04a77619666cff59a34";
    let CONVO_ID;
    const incomingWabaMessage = await parseIncomingWabaMessage(data);

    if (incomingWabaMessage?.messagetype === "newmessage") {
      const phoneNumberExists = await UserModel.checkPhoneNumberExists(
        incomingWabaMessage.from
      );

      if (!phoneNumberExists) {
        const newUserData = {
          name: incomingWabaMessage.name,
          phonenumber: incomingWabaMessage.from,
          email: `${incomingWabaMessage.from}@wabaemail.com`,
          password: incomingWabaMessage.from,
          picture: `https://ui-avatars.com/api/?background=random&color=${incomingWabaMessage.name}&name=${incomingWabaMessage.name}`,
        };
        const newUser = await UserModel.create(newUserData);
      }
      const wabaUser = await UserModel.findByPhoneNumber(
        incomingWabaMessage.from
      );

      // send incoming message to users

      const sender_id = wabaUser._id;

      // individual chat için

      // const existed_conversation = await doesConversationExist(
      //   sender_id,
      //   RECEIVER_ID,
      //   false
      // );

      // if (!existed_conversation) {
      //   let convoData = {
      //     name: incomingWabaMessage.from,
      //     picture: "waba picture",
      //     isGroup: false,
      //     users: [sender_id, RECEIVER_ID],
      //   };
      //   const newConvo = await createConversation(convoData);
      //   CONVO_ID = newConvo._id;
      // }

      //gelen mesajı tüm üyelere göndermek için group chat gibi

      const existed_conversation = await doesWabaGroupConversationExist(
        sender_id
      );

      if (!existed_conversation) {
        let convoData = {
          name: incomingWabaMessage.name,
          users: [
            sender_id,
            "6583f8f1145c51a1e554342f",
            "6580b04a77619666cff59a34",
            "6580b03177619666cff59a30",
            "65818ef79b08099a3b78692a",
            "658872ec60fbdd5c06ac54c3"
          ],
          isGroup: true,
          admin: wabaUser._id,
          picture: wabaUser.picture,
          waba_user_id: wabaUser.phonenumber,
        };
        const newConvo = await createConversation(convoData);
        const populatedConvo = await populateConversation(
          newConvo._id,
          "users admin",
          "-password"
        );
        CONVO_ID = newConvo._id;
      } else CONVO_ID = existed_conversation._id;

      const msgData = {
        sender: sender_id,
        message: incomingWabaMessage.message,
        conversation: CONVO_ID,
        waba_id: incomingWabaMessage.waba_id,
        files: [],
      };
      let newMessage = await createMessage(msgData);
      let populatedMessage = await populateMessage(newMessage._id);
      await updateLatestMessage(CONVO_ID, newMessage);

      console.log('incoming-waba-message tetikleniyor');

      io.emit("incoming-waba-message", {
        message: populatedMessage,
        waba_user_id: sender_id,
      });
    } else if (
      incomingWabaMessage?.messagetype === "status" &&
      incomingWabaMessage?.status !== "sent"
    ) {
      try {
        // waba_id'ye göre ilgili mesajı bulma
        const message = await MessageModel.findOne({
          waba_id: incomingWabaMessage.waba_id,
        });
        if (!message) {
          return;
        }
        // Status sütununu güncelleme
        message.status = incomingWabaMessage.status;
        // Güncellenen mesajı kaydetme
        await message.save();

        const queryMessage = MessageModel.findOne({
          waba_id: incomingWabaMessage.waba_id,
        });

        queryMessage.select("_id waba_id sender");

        const queryMessageResult = await queryMessage.exec();

        let populatedMessage = await populateMessage(queryMessageResult._id);

        //await updateLatestMessage(CONVO_ID, message);
        // logger.error(queryMessageResult);
        //logger.error(queryMessageResult.sender._id)
        io.to(populatedMessage.sender._id.toString()).emit(
          "incoming-waba-status",
          {
            message: populatedMessage,
          }
        );
      } catch (error) {
        console.error("Hata:", error.message);
      }
    } else {
      return;
    }
    // console.log(incomingWabaMessage);
  } catch (error) {
    console.log(error);
  }
};

export const sendMessageToWabauser = async (parameters) => {
  const { DIALOG360_API_KEY, DIALOG360_ENDPOINT_URL } = process.env;

  try {
    const postData = {
      recipient_type: "individual",
      to: parameters.to,
      type: "text",
      text: {
        body: parameters.message,
      },
    };

    const { data } = await axios.post(
      `${DIALOG360_ENDPOINT_URL}/messages`,
      postData,
      {
        headers: {
          "D360-API-KEY": DIALOG360_API_KEY,
        },
      }
    );

    return data;
  } catch (error) {
    return error;
  }
};
