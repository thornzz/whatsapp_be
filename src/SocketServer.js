import OnlineUsers from "./constants/onlineusers.js";

export default function (socket, io) {
  //user joins or opens the application
  socket.on("join", (user) => {
    OnlineUsers.addUser(user, socket, io);
    socket.join(user.userId);
    const onlineUsers = OnlineUsers.getUsers();
    // Send online users to frontend
    console.log("sending online users on join");
    io.emit("get-online-users", onlineUsers);

    // // Send socket id
    // io.emit("setup socket", socket.id);
  });

  //socket disconnect
  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);
    OnlineUsers.removeUserBySocketId(socket.id);
    const onlineUsers = OnlineUsers.getUsers();
    io.emit("get-online-users", onlineUsers);
  });

  //logout user
  socket.on("logout", (user) => {
    console.log("logout", user);
    OnlineUsers.removeUser(user);
    // io.emit("get-online-users", OnlineUsers.getUsers());
  });

  //new group created
  socket.on("new group notify", () => {
    io.emit("group created");
  });
  //join a conversation room
  socket.on("join conversation", (conversation) => {
    //console.log(conversation, "convoya yeni biri dahil oldu");
    socket.join(conversation);
  });

  socket.on("incoming-waba-message-server", ({ message, userId }) => {
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
}
