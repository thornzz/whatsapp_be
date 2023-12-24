

let globalIO;
let globalSocket;

export function setGlobalSocketIO(io,socket) {
  globalIO = io;
  globalSocket = socket;
}

export function getGlobalSocket() {
  return globalSocket;
}
export function getGlobalIO() {
  return globalIO;
}