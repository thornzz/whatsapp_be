let onlineUsers = [];
export default function (socket, io) {
  //user joins or opens the application
  socket.on("join", (user) => {
    socket.join(user);

    // Check if a user with the same socketId already exists in onlineUsers
    const existingUserIndex = onlineUsers.findIndex(
      (u) => u.socketId === socket.id
    );

    if (existingUserIndex !== -1) {
      // If a user with the same socketId exists, update its userId
      onlineUsers[existingUserIndex].userId = user;
    } else {
      // If not, add the new user to onlineUsers
      onlineUsers.push({ userId: user, socketId: socket.id });
    }

    // Send online users to frontend
    io.emit("get-online-users", onlineUsers);

    // Send socket id
    io.emit("setup socket", socket.id);
  });

  //socket disconnect
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });
  //new group created
  socket.on("new group notify", () => {
    io.emit("group created");
  });
  //join a conversation room
  socket.on("join conversation", (conversation) => {
    socket.join(conversation);
  });

  //send and receive message
  socket.on("send message", (message) => {
    let conversation = message.conversation;
    if (!conversation.users) return;
    conversation.users.forEach((user) => {
      if (user._id === message.sender._id) return;
      socket.in(user._id).emit("receive message", message);
    });
  });

  //typing
  socket.on("typing", (conversation) => {
    console.log("yazma başladı");
    socket.in(conversation).emit("typing", conversation);
  });
  socket.on("stop typing", (conversation) => {
    console.log("yazma bitti");
    socket.in(conversation).emit("stop typing");
  });

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
