import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "../models/index.js";

//ilk hali
// export const doesConversationExist = async (
//   sender_id,
//   receiver_id,
//   isGroup,
//   closed
// ) => {
//   if (isGroup === false) {
//     let convos = await ConversationModel.find({
//       isGroup: false,
//       closed: closed ?? false,
//       $and: [
//         { users: { $elemMatch: { $eq: sender_id } } },
//         { users: { $elemMatch: { $eq: receiver_id } } },
//       ],
//     })
//       .populate("users", "-password")
//       .populate("latestMessage");

//     if (!convos)
//       throw createHttpError.BadRequest("Oops...Something went wrong !");

//     //populate message model
//     convos = await UserModel.populate(convos, {
//       path: "latestMessage.sender",
//       select: "name email picture status",
//     });

//     return convos[0];
//   } else {
//     //it's a group chat
//     let convo = await ConversationModel.findById(isGroup)
//       .populate("users admin", "-password")
//       .populate("latestMessage");

//     if (!convo)
//       throw createHttpError.BadRequest("Oops...Something went wrong !");
//     //populate message model
//     convo = await UserModel.populate(convo, {
//       path: "latestMessage.sender",
//       select: "name email picture status",
//     });

//     return convo;
//   }
// };

// sonraki hali çalışıyor

// export const doesConversationExist = async (
//   sender_id,
//   receiver_id,
//   isGroup,
//   closed
// ) => {
//   if (isGroup === false) {
//     let convo = await ConversationModel.findOne({
//       isGroup: false,
//       closed: closed ?? false,
//       users: { $all: [sender_id, receiver_id] },
//     })
//       .populate("users", "-password")
//       .populate({
//         path: "latestMessage",
//         populate: { path: "sender", select: "name email picture status" },
//       })
//       .sort({ updatedAt: -1 })
//       .limit(1);

//     if (!convo) {
//       throw createHttpError.BadRequest("Oops...Something went wrong !");
//     }

//     return convo;
//   } else {
//     // it's a group chat
//     let convo = await ConversationModel.findById(isGroup)
//       .populate("users admin", "-password")
//       .populate({
//         path: "latestMessage",
//         populate: { path: "sender", select: "name email picture status" },
//       });

//     if (!convo) {
//       throw createHttpError.BadRequest("Oops...Something went wrong !");
//     }

//     return convo;
//   }
// };

export const doesConversationExist = async (
  sender_id,
  receiver_id,
  isGroup,
  closed
) => {
  let conversations;
  if (isGroup === false) {
    conversations = await ConversationModel.find({
      isGroup: false,
      closed: closed ?? false,
      users: { $all: [sender_id, receiver_id] },
    })
      .populate("users admin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email picture status" },
        options: { sort: { updatedAt: -1 } },
      })
      .sort({ updatedAt: -1 })
      .limit(1);
  } else {
    conversations = await ConversationModel.find({
      isGroup: isGroup,
      closed: closed ?? false,
    })
      .populate("users admin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email picture status" },
        options: { sort: { updatedAt: -1 } },
      })
      .sort({ updatedAt: -1 })
      .limit(1);
  }

  if (!conversations || conversations.length === 0) {
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  }
  console.log(conversations[0], "conversations[0]");
  return conversations[0];
};

export const doesWabaUserConversationExist = async (waba_user_id) => {
  let convos = await ConversationModel.find({
    isGroup: false,
    name: waba_user_id,
    closed: false,
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (!convos)
    throw createHttpError.BadRequest("Oops...Something went wrong !");

  //populate message model
  convos = await UserModel.populate(convos, {
    path: "latestMessage.sender",
    select: "name email picture status type",
  });

  return convos[0];
};

export const doesWabaGroupConversationExist = async (waba_user_id) => {
  let convos = await ConversationModel.find({
    isGroup: true,
    $and: [{ users: { $elemMatch: { $eq: waba_user_id } } }],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (!convos)
    throw createHttpError.BadRequest("Oops...Something went wrong !");

  //populate message model
  convos = await UserModel.populate(convos, {
    path: "latestMessage.sender",
    select: "name email picture status type",
  });

  return convos[0];
};

export const createConversation = async (data) => {
  const newConvo = await ConversationModel.create(data);
  if (!newConvo)
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  return newConvo;
};

export const populateConversation = async (
  id,
  fieldToPopulate,
  fieldsToRemove
) => {
  const populatedConvo = await ConversationModel.findOne({ _id: id }).populate(
    fieldToPopulate,
    fieldsToRemove
  );
  if (!populatedConvo)
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  return populatedConvo;
};

export const transferConversation = async (
  conversationId,
  oldUserId,
  newUserId
) => {
  try {
    console.log(conversationId, oldUserId, newUserId);
    // ObjectId kontrolü
    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(oldUserId) ||
      !mongoose.Types.ObjectId.isValid(newUserId)
    ) {
      throw new Error("Geçersiz conversationId, oldUserId veya newUserId");
    }

    // Kullanıcının ve konuşmanın varlığını kontrol et
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error("Konuşma bulunamadı");
    }

    // Eski kullanıcının konuşmada olup olmadığını kontrol et
    const oldUserIndex = conversation.users.indexOf(oldUserId);
    if (oldUserIndex === -1) {
      throw new Error("Eski kullanıcı bu konuşmanın bir parçası değil");
    }

    // Yeni kullanıcının zaten konuşmada olup olmadığını kontrol et
    if (conversation.users.includes(newUserId)) {
      throw new Error("Yeni kullanıcı zaten bu konuşmanın bir parçası");
    }

    // Konuşmayı yeni kullanıcıya transfer et
    conversation.users[oldUserIndex] = newUserId;
    conversation.transferred = true;
    const transferredAt = new Date();

    // Son mesajı bul ve latestBeforeTransfer özelliğine ata
    const latestMessage = await MessageModel.findOne({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .exec();
    if (latestMessage) {
      conversation.transfers.push({
        from: oldUserId,
        to: newUserId,
        at: transferredAt,
        latestMessageBeforeTransfer: latestMessage._id,
      });
    }

    await conversation.save();

    return "Konuşma başarıyla transfer edildi";
  } catch (error) {
    console.error(error);
  }
};
export const getUserConversations = async (user_id) => {
  let conversations;
  await ConversationModel.find({
    users: { $elemMatch: { $eq: user_id } },
    closed: false,
  })
    .populate("users", "-password")
    .populate("admin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      results = await UserModel.populate(results, {
        path: "latestMessage.sender",
        select: "name email picture status",
      });
      conversations = results;
    })
    .catch(() => {
      throw createHttpError.BadRequest("Oops...Something went wrong !");
    });
  console.log(conversations, "convolar getuserconversations");
  return conversations;
};

export const getConversationsByUser = async (user_id, receiver_id) => {
  let conversations = [];

  // Closed olan conversationları bulma
  const closedConversations = await ConversationModel.find({
    users: { $all: [user_id, receiver_id] },
    closed: true,
  })
    .populate("users", "-password")
    .populate("admin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email picture status",
      },
    })
    .lean();

  if (closedConversations.length > 0) {
    const latestClosedConversation = closedConversations[0];
    conversations.push(latestClosedConversation);
  }

  // Açık olan conversationları bulma
  const openConversations = await ConversationModel.find({
    users: { $all: [user_id, receiver_id] },
    closed: false,
  })
    .populate("users", "-password")
    .populate("admin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email picture status",
      },
    })
    .lean();

  conversations.push(...openConversations);

  console.log(conversations, "convolar getConversationsByUser");
  return conversations;
};
export const getClosedUserConversations = async (user_id) => {
  let conversations;
  try {
    conversations = await ConversationModel.find({
      users: { $elemMatch: { $eq: user_id } },
      closed: true,
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: "users",
        select: "-password",
      })
      .populate({
        path: "admin",
        select: "-password",
      })
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name email picture status",
        },
      })
      .lean();

    const uniqueConversations = conversations.reduce((acc, conv) => {
      const existingConv = acc.find((c) => c.name === conv.name);
      if (!existingConv) {
        acc.push(conv);
      }
      return acc;
    }, []);
    console.log(
      uniqueConversations,
      "kapatılmış convolar getuserconversations"
    );
    return uniqueConversations;
  } catch (error) {
    throw createHttpError.BadRequest("Oops...Something went wrong !");
  }
};

export const updateLatestMessage = async (convo_id, msg) => {
  const updatedConvo = await ConversationModel.findByIdAndUpdate(convo_id, {
    latestMessage: msg,
  });
  if (!updatedConvo)
    throw createHttpError.BadRequest("Oops...Something went wrong !");

  return updatedConvo;
};

export const closeConversationById = async (convo_id) => {
  console.log(convo_id);
  const closedConvo = await ConversationModel.findByIdAndUpdate(
    convo_id,
    {
      closed: true,
    },
    { new: true }
  );
  if (!closedConvo)
    throw createHttpError.BadRequest("Oops...Something went wrong !");

  return closedConvo;
};
