const socket = io(); // khởi tạo io
const $messageForm = document.querySelector("#messager-form");
const $messageFormButton = $messageForm.querySelector("button");
const $messageFormInput = $messageForm.querySelector("input");
const $sendLocationButton = document.querySelector("#send-location");
const $message = document.querySelector("#message");
//templates
const $messageTemplate = document.querySelector("#message-template").innerHTML; // lấy cả nội dung html vào messageTemplate
const $locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML; // template chỉ ra địa điểm của mình
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
//Option
//sử dụng thư viện lấy username và room ở đây
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

const autoScroll = () => {
  // New message element
  const $newMessage = $message.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $message.offsetHeight;

  // Height of messages container
  const containerHeight = $message.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $message.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $message.scrollTop = $message.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render($messageTemplate, {
    username: message.username,
    //mustache thiết lập template + text để hiển thị trên html
    message: message.text,
    createAt: moment(message.createAt).format("h:mm a"), //thiết lập thời gian ở đây
  }); // sử dụng thư viện Mustache để lấy nội dung và văn bản
  $message.insertAdjacentHTML("beforeend", html); // hiển thị nó lên khi dữ liệu trước đã hoàn thành
  autoScroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render($locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createAt: moment(message.createAt).format("h:mm a"),
  });
  $message.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled"); // vô hiệu hóa
  const message = e.target.elements.message.value; // lấy target name là messege

  //callback() nằm ở đây
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled"); // mở khóa
    $messageFormInput.value = ""; //chuyển ô form rỗng
    $messageFormInput.focus(); //nháy chuột vẫn ở ô form
    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    // kiểm tra xem browser có hỗ trợ chia sẻ địa điểm không
    return alert("Your browser not support geolocation");
  }
  $sendLocationButton.setAttribute("disabled", "disabled");
  //Thiết lập gửi vị trí tọa độ cuả mình
  navigator.geolocation.getCurrentPosition((posstion) => {
    socket.emit(
      "sendLocation",
      {
        latitude: posstion.coords.latitude,
        longitude: posstion.coords.longitude,
      },
      () => {
        setTimeout(() => {
          $sendLocationButton.removeAttribute("disabled");
        }, 10000); //không được gửi vị trí liên tục, sau 10s gửi 1 lần
        console.log("Shared location!");
      }
    );
  });
});

socket.on("listroom", ({ room, users }) => {
  const html = Mustache.render($sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
