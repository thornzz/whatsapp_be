import OnlineUsers from "./constants/onlineusers.js";

export default function (socket, io) {

  //user joins or opens the application
  socket.on("join", (user) => {
    socket.join(user);
    console.log(user, "user odaya katıldı");
    // Check if a user with the same socketId already exists in onlineUsers
console.log(socket.id,'socket id');
    OnlineUsers.addUser(user, socket);
    // Send online users to frontend
    io.emit("get-online-users", OnlineUsers.getUsers());
    // Send socket id
    io.emit("setup socket", socket.id);
  });

  //socket disconnect
  socket.on("disconnect", () => {

    OnlineUsers.removeUser(socket.id);

    io.emit("get-online-users", OnlineUsers.getUsers());
  });
  //new group created
  socket.on("new group notify", () => {
    io.emit("group created");
  });
  //join a conversation room
  socket.on("join conversation", (conversation) => {
    console.log(conversation, "convoya yeni biri dahil oldu");
    socket.join(conversation);
  });

  socket.on("incoming-waba-message-server", ({ message, userId }) => {
    console.log("incoming-waba-msg-server tetiklendi");
    //  socket.in(userId).emit('receive message',message,userId);
    io.to(userId).emit("receive message", message);
  });
  socket.on("incoming-waba-statues-server", ({ message, userId }) => {
    io.to(userId).emit("update statues", message);
  });

  //send and receive message
  socket.on("send message", (message) => {
    
    // socket.on("send message", ({message,user,socketId}) => {
    //  console.log(JSON.stringify(message))
    let conversation = message?.conversation;
    if (!conversation?.users) return;
    conversation.users.forEach((user) => {
      if (user._id === message.sender._id) return;
      socket.in(user._id).emit("receive message", message);
    });
  });

  //typing
  // socket.on("typing", (conversation) => {
  //   console.log("yazma başladı");
  //   socket.in(conversation).emit("typing", conversation);
  // });
  // socket.on("stop typing", (conversation) => {
  //   console.log("yazma bitti");
  //   socket.in(conversation).emit("stop typing");
  // });

  //call
  //---call user
  socket.on("call user", (data) => {
    let userId = data.userToCall;
    let userSocketId = onlineUsers.find((user) => user.userId == userId);
    io.to(userSocketId.socketId).emit("call user", {
      signal: data.signal,
      from: data.from,
      name: data.name,
      picture: data.picture,
    });
  });
  //---answer call
  socket.on("answer call", (data) => {
    io.to(data.to).emit("call accepted", data.signal);
  });

  //---end call
  socket.on("end call", (id) => {
    io.to(id).emit("end call");
  });
}
