import { parseIncomingWabaMessage } from "../utils/waba.util.js";
import { getGlobalSocket, getGlobalIO } from "../constants/index.js";
import { ConversationModel, UserModel } from "../models/index.js";
import {
  createConversation,
  doesConversationExist,
  doesWabaUserConversationExist,
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
const { PRIVATE_KEY, PASSPHRASE = "", FLOW_ID } = process.env;
import { getNextScreen } from "../utils/flow.util.js";
import { decryptRequest, encryptResponse } from "../utils/encryption.util.js";

export const handleIncomingWabaMessage = async (data) => {
  try {
    const io = getGlobalIO();
    let RECEIVER_ID = null;
    let CONVO_ID;

    const incomingWabaMessage = await parseIncomingWabaMessage(data);
    console.log(incomingWabaMessage, "incomingwaba message");

    //YENİ MESAJLARI BURADA HANDLE EDİYORUZ
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

      const existed_conversation = await doesWabaUserConversationExist(
        incomingWabaMessage.from
      );

      if (!existed_conversation) {
        await sendStarterFlowMessageToWabauser(incomingWabaMessage.from);
        return null;

        // let convoData = {
        //   name: incomingWabaMessage.from,
        //   picture: "waba picture",
        //   isGroup: false,
        //   users: [sender_id, RECEIVER_ID],
        // };
        // const newConvo = await createConversation(convoData);
        // CONVO_ID = newConvo._id;
      } else CONVO_ID = existed_conversation._id;

      //#region Reciever ID
      const conversation = await ConversationModel.findOne({
        isGroup: false,
        name: incomingWabaMessage.from,
        closed: false,
      }).populate("users", "-password");

      const findReceiverUser = conversation.users.find(
        (user) => user.phonenumber === null || user.phonenumber === ""
      );
      RECEIVER_ID = findReceiverUser._id.toString();
      //#endregion

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
      console.log(RECEIVER_ID);

      io.to(RECEIVER_ID).emit("incoming-waba-message", {
        message: populatedMessage,
        waba_user_id: sender_id,
      });

      //gelen mesajı tüm üyelere göndermek için group chat gibi

      // const existed_conversation = await doesWabaGroupConversationExist(
      //   sender_id
      // );

      // if (!existed_conversation) {
      //   let convoData = {
      //     name: incomingWabaMessage.name,
      //     users: [
      //       sender_id,
      //       "6583f8f1145c51a1e554342f",
      //       "6580b04a77619666cff59a34",
      //       "6580b03177619666cff59a30",
      //       "65818ef79b08099a3b78692a",
      //       "658872ec60fbdd5c06ac54c3"
      //     ],
      //     isGroup: true,
      //     admin: wabaUser._id,
      //     picture: wabaUser.picture,
      //     waba_user_id: wabaUser.phonenumber,
      //   };
      //   const newConvo = await createConversation(convoData);
      //   const populatedConvo = await populateConversation(
      //     newConvo._id,
      //     "users admin",
      //     "-password"
      //   );
      //   CONVO_ID = newConvo._id;
      // } else CONVO_ID = existed_conversation._id;

      // const msgData = {
      //   sender: sender_id,
      //   message: incomingWabaMessage.message,
      //   conversation: CONVO_ID,
      //   waba_id: incomingWabaMessage.waba_id,
      //   files: [],
      // };
      // let newMessage = await createMessage(msgData);
      // let populatedMessage = await populateMessage(newMessage._id);
      // await updateLatestMessage(CONVO_ID, newMessage);

      // console.log('incoming-waba-message tetikleniyor');

      // io.emit("incoming-waba-message", {
      //   message: populatedMessage,
      //   waba_user_id: sender_id,
      // });
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
    } else if (incomingWabaMessage?.messagetype === "flow") {
      try {
        const { from, selected_agent, name } = incomingWabaMessage;

        //Seçili agent yok ise devam ettirme.
        if (selected_agent) {
          const wabaUser = await UserModel.findByPhoneNumber(
            incomingWabaMessage.from
          );
          // const existed_conversation = await doesConversationExist(
          //   wabaUser._id,
          //   selected_agent,
          //   false
          // );
          const existed_conversation = await doesWabaUserConversationExist(
            incomingWabaMessage.from
          );

          if (!existed_conversation) {
            let convoData = {
              name: incomingWabaMessage.from,
              isGroup: false,
              picture: "waba picture",
              users: [wabaUser._id, selected_agent],
            };
            const newConvo = await createConversation(convoData);
          }
          sendMessageToWabauser({to:from,message:'Merhaba size nasıl yardımcı olabilirim?'});

        } else return;

        // const msgData = {
        //   sender: wabaUser._id,
        //   message: incomingWabaMessage.message,
        //   conversation: CONVO_ID,
        //   waba_id: incomingWabaMessage.waba_id,
        //   files: [],
        // };
        // let newMessage = await createMessage(msgData);
        // let populatedMessage = await populateMessage(newMessage._id);
        // console.log(populatedMessage,'populated message');
        // await updateLatestMessage(CONVO_ID, newMessage);

        // io.emit("incoming-waba-message", {
        //   message: populatedMessage,
        //   waba_user_id: wabaUser._id,
        // });
        // // waba_id'ye göre ilgili mesajı bulma
        // const message = await MessageModel.findOne({
        //   waba_id: incomingWabaMessage.waba_id,
        // });
        // if (!message) {
        //   return;
        // }
        // // Status sütununu güncelleme
        // message.status = incomingWabaMessage.status;
        // // Güncellenen mesajı kaydetme
        // await message.save();

        // const queryMessage = MessageModel.findOne({
        //   waba_id: incomingWabaMessage.waba_id,
        // });

        // queryMessage.select("_id waba_id sender");

        // const queryMessageResult = await queryMessage.exec();

        // let populatedMessage = await populateMessage(queryMessageResult._id);

        // //await updateLatestMessage(CONVO_ID, message);
        // // logger.error(queryMessageResult);
        // //logger.error(queryMessageResult.sender._id)
        // io.to(populatedMessage.sender._id.toString()).emit(
        //   "incoming-waba-status",
        //   {
        //     message: populatedMessage,
        //   }
        // );
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

export const parseIncomingWabaFlowMessages = async (data) => {
  if (!PRIVATE_KEY) {
    throw new Error("Private key is empty.");
  }
  const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(
    data,
    PRIVATE_KEY,
    PASSPHRASE
  );

  console.log("💬 Decrypted Request:", decryptedBody);
  const screenResponse = await getNextScreen(decryptedBody);
  //console.log("👉 Response to Encrypt:", screenResponse);
  const encryptedResponse = encryptResponse(
    screenResponse,
    aesKeyBuffer,
    initialVectorBuffer
  );

  return encryptedResponse;

  // res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
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
export const sendStarterFlowMessageToWabauser = async (to) => {
  const { DIALOG360_API_KEY, DIALOG360_ENDPOINT_URL } = process.env;

  try {
    const postData = {
      recipient_type: "individual",
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "flow",
        header: {
          type: "text",
          text: "K2M Canlı Sohbet",
        },
        body: {
          text: "Size nasıl yardımcı olabiliriz?",
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
            flow_id: FLOW_ID,
            flow_cta: "Sohbete başla",
            flow_action: "data_exchange",
          },
        },
      },
    };

    const { data } = await axios.post(
      DIALOG360_ENDPOINT_URL + "/messages",
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
