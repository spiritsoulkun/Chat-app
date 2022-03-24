const express = require("express"); //gọi thư viện express đã được cài sẵn
const path = require("path"); // gọi module có sẵn là path
const http = require("http"); // gọi module http
const socketio = require("socket.io"); // gọi module socket
const Filter = require("bad-words"); // gọi module bad-words (thư viện)
const app = express(); // khởi tạo thư viên express
const port = process.env.PORT || 3000; // thiết lập công port là 3000
const { generateMessage, generateLocationMessage } = require("./untils/moment");
const publicDirectoryPath = path.join(__dirname, "../public"); // tạo liên kết truy cập đến file public
const {
  addUser,
  removeUser,
  getuser,
  getUserRoom,
  getUser,
} = require("./untils/users");

app.use(express.static(publicDirectoryPath)); // sử dụng static tới phương thức truy cập đó

const server = http.createServer(app); // khỏi tạo server
const io = socketio(server); // Cổng io lắng nghe từ server

// let count = 0;
io.on("connection", (socket) => {
  //hàm này để kết nối giữa server và client
  console.log("new websocket connection"); // kết nối thành công sẽ chạy lệnh này
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit(
      "message",
      generateMessage(`Welcome ${user.username} join room ${user.room}`)
    ); //hàm generateMessage sẽ nhận 1 đối số là text sau đó trả về text và time
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined!`)); // khi một người tham gia tin nhắn sẽ gửi lại hết những người còn lại

    io.to(user.room).emit("listroom", {
      room: user.room,
      users: getUserRoom(user.room),
    });

    callback();
  });
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id); // 2 việc 1: nhắn tin cùng phòng 2: xác định được người nhắn tin
    const filter = new Filter(); // khởi tạo thư viện kiểm tra dùng ngôn từ đả kích
    if (filter.isProfane(message)) {
      return callback("Profane not allow!");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));

    // nhận dữ liệu từ client
    //hàm này để xác nhận tin nhắn đã được gửi
    //Còn phía người nhận tin nhắn không đọc được
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });
  //Thiết lập người dùng ngắt kết nối (discornnect)
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      // những người trong phòng còn lại sẽ thấy
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );

      io.to(user.room).emit("listroom", {
        room: user.room,
        users: getUserRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  // server nghe port đó và chạy theo port
  console.log(`server is ${port}`);
});
