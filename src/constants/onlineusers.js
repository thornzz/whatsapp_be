class OnlineUsers {
  constructor() {
    if (OnlineUsers.instance == null) {
      this.users = [];
      OnlineUsers.instance = this;
    }

    return OnlineUsers.instance;
  }

  addUser(user, socket) {
    console.log(user, "userrrr");
    const existingUserIndex = this.users.findIndex(
      (u) => u.socketId === socket.id
    );

    if (existingUserIndex !== -1) {
      this.users[existingUserIndex].userId = user.userId;
    } else {
      this.users.push({ ...user, socketId: socket.id });
    }
  }

  removeUser(socketId) {
    this.users = this.users.filter((user) => user.socketId !== socketId);
  }

  getUsers() {
    return this.users;
  }
}

const instance = new OnlineUsers();

export default instance;
