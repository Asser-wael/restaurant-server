import { Server } from "socket.io";

let io;
let onlineUsers = 0;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    onlineUsers++;

    // إرسال العدد لكل العملاء
    io.emit("onlineUsers", onlineUsers);

    socket.on("join-table", (tableNumber) => {
      socket.join(`table-${tableNumber}`);
    });

    socket.on("joinAdminRoom", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");

      onlineUsers--;

      io.emit("onlineUsers", onlineUsers);
    });
  });

  return io;
};

export const getIO = () => io;