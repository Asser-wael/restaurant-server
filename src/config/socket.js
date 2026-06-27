import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);
    socket.on("join-table", (tableNumber) => {
      socket.join(`table-${tableNumber}`);
    });
    socket.on("joinAdminRoom", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });

  return io;
};

export const getIO = () => io;