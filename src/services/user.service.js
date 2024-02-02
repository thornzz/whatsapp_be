import createHttpError from "http-errors";
import {ConversationModel, UserModel} from "../models/index.js";
import OnlineUsers from "../constants/onlineusers.js";

export const findUser = async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) throw createHttpError.BadRequest("Please fill all fields.");
    return user;
};

export const searchUsers = async (keyword, userId) => {

    // arama anahtar kelime büyük i büyük ı harfi var ise küçük hallerine görede bir düzenleme yapılıyor
    const convertedKeyword = keyword.replace(/i/gi, '[İi]')
        .replace(/I/g, '[İI]');
    const users = await UserModel.find({
        $or: [
            {name: {$regex: convertedKeyword, $options: 'i'}},
            {phonenumber: {$regex: keyword, $options: 'i'}},
        ],
        type: 'waba',
        _id: {$ne: userId},
    });

    const userIds = users.map(user => user._id);

    let conversations = [];
    if (userIds.length > 0) {
        conversations = await ConversationModel.find({'users': {$in: userIds}});
    }
    const filteredConversations = conversations.filter(conversation =>
        conversation.users.some(user => user._id.toString() === userId)
    );

    const filteredUsers = users.filter(user =>
        filteredConversations.some(conversation =>
            conversation.users.some(u => u._id.toString() === user._id.toString())
        )
    );

    return filteredUsers;
};

export const getAllUsers = async () => {
    const users = await UserModel.find(
        {phonenumber: {$in: [null, "", undefined]}},
        "name _id"
    );
    return users;
};
export const getSocketStatus = async () => {
    return OnlineUsers.getUsers();
};
