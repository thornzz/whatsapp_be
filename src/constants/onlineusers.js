class OnlineUsers {
  constructor() {
    if (OnlineUsers.instance == null) {
      this.users = [];
      OnlineUsers.instance = this;
      console.log("ilk instance oluşturuldu");
    }
    console.log("mevcut instance veriliyor");
    return OnlineUsers.instance;
  }

  addUser(user, socket, io) {
    //console.log(user);
    //console.log(this.users, "tüm kullanıcılar");
    const existingUserIndex = this.users.findIndex(
      (u) => u.userId === user.userId
    );
    // const existingSocketIndex = this.users.findIndex(
    //   (u) => u.socketId === socket.id
    // );

    if (existingUserIndex !== -1) {
      io.to(this.users[existingUserIndex].socketId).emit(
        "existing_user",
        user.userId
      );
      //eski kullanıcıyı sil
      this.removeUserBySocketId(this.users[existingUserIndex].socketId);
      //yeni kullanıcıyı ekle
      this.users.push({ ...user, socketId: socket.id });
    }
    // else if (existingSocketIndex !== -1) {
    //   this.users[existingUserIndex].userId = user.userId;
    // }
    else {
      this.users.push({ ...user, socketId: socket.id });
    }
  }
  removeUser(userToBeRemoved) {
    this.users = this.users.filter((user) => {
      return !(
        user.socketId === userToBeRemoved.socketId ||
        user.userId === userToBeRemoved.userId
      );
    });
  }
  removeUserBySocketId(userSocketIndex) {
    this.users = this.users.filter((user) => user.socketId !== userSocketIndex);
  }

  getUsers() {
    return this.users;
  }
}

const instance = new OnlineUsers();

export default instance;
