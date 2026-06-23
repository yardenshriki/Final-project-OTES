//yarden shriki, lior zahavi
var activeChatTaskId = null;
var chatApiUrl = "http://localhost:5000/api/chat";
var chatMessagesByTask = {};

function ensureChatLayout() {
  if (document.getElementById("chatDrawer") != null) {
    connectChatActions();
    return;
  }

  fetch("chat.html")
    .then(function (response) {
      return response.text();
    })
    .then(function (html) {
      document.body.insertAdjacentHTML("beforeend", html);
      connectChatActions();
      renderChatList();
    });
}

function getTaskChats() {
  var tasks = getChatSourceTasks();
  var chats = [];

  for (var i = 0; i < tasks.length; i++) {
    if (taskHasChatParticipants(tasks[i])) {
      chats.push(createChatFromTask(tasks[i]));
    }
  }

  return chats;
}

function saveTaskChats(chats) {
  return chats;
}

function createChatReadState(senderRole) {
  var readBy = {};
  readBy[senderRole] = true;
  return readBy;
}

function isChatMessageUnread(message, roleName) {
  if (message.senderRole == roleName) {
    return false;
  }

  if (
    message.receiver_id != null &&
    message.receiver_id != getCurrentChatUserId()
  ) {
    return false;
  }

  if (message.is_read == 1 || message.is_read == true) {
    return false;
  }

  if (message.readBy != null && message.readBy[roleName] == true) {
    return false;
  }

  return true;
}

function getChatUnreadCount(chat) {
  var unreadCount = 0;

  for (var i = 0; i < chat.messages.length; i++) {
    if (isChatMessageUnread(chat.messages[i], getCurrentChatRole())) {
      unreadCount++;
    }
  }

  return unreadCount;
}

function getTotalChatUnreadCount() {
  var chats = getVisibleChats();
  var unreadCount = 0;

  for (var i = 0; i < chats.length; i++) {
    unreadCount += getChatUnreadCount(chats[i]);
  }

  return unreadCount;
}

function ensureChatUnreadBadge() {
  var chatButton = document.getElementById("chatButton");

  if (
    chatButton == null ||
    document.getElementById("chatUnreadBadge") != null
  ) {
    return;
  }

  var badge = document.createElement("span");
  badge.id = "chatUnreadBadge";
  badge.className = "chatUnreadBadge";
  badge.innerHTML = "0";
  chatButton.appendChild(badge);
}

function updateChatUnreadBadge() {
  ensureChatUnreadBadge();

  var badge = document.getElementById("chatUnreadBadge");

  if (badge == null) {
    return;
  }

  var unreadCount = getTotalChatUnreadCount();
  badge.innerHTML = unreadCount;
  badge.style.display = unreadCount > 0 ? "block" : "none";
}

function markTaskChatAsRead(taskId) {
  var currentUserId = getCurrentChatUserId();

  if (currentUserId == null) {
    return;
  }

  if (chatMessagesByTask[taskId] != null) {
    for (var i = 0; i < chatMessagesByTask[taskId].length; i++) {
      if (chatMessagesByTask[taskId][i].receiver_id == currentUserId) {
        chatMessagesByTask[taskId][i].is_read = 1;
      }
    }
  }

  fetch(chatApiUrl + "/task/" + taskId + "/read", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: currentUserId,
    }),
  });
}

function getChatTimeText() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();

  if (hours < 10) {
    hours = "0" + hours;
  }

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return hours + ":" + minutes;
}

function getCurrentChatUserName() {
  var savedName = localStorage.getItem("loggedInUsername");

  if (savedName != null && savedName != "") {
    return savedName;
  }

  if (getCurrentChatRole() == "Performer") {
    return "John Designer";
  }

  return "Sarah Johnson";
}

function getCurrentChatRole() {
  if (typeof userRole != "undefined" && userRole != null && userRole != "") {
    return userRole;
  }

  var savedRole = localStorage.getItem("userRole");

  if (savedRole != null && savedRole != "") {
    return savedRole;
  }

  return "Requester";
}

function getCurrentChatUserId() {
  var savedId = localStorage.getItem("loggedInUserId");

  if (savedId != null && savedId != "") {
    return Number(savedId);
  }

  if (getCurrentChatRole() == "Performer") {
    return 2;
  }

  return 1;
}

function getTaskTitle(task) {
  return task.title || task.taskTitle || "";
}

function getTaskRequesterId(task) {
  return task.requester_id || task.requesterId || null;
}

function getTaskPerformerId(task) {
  return task.performer_id || task.performerId || null;
}

function getTaskRequesterName(task) {
  return task.requester_name || task.requesterName || "Requester";
}

function getTaskPerformerName(task) {
  return task.performer_name || task.performerName || "Performer";
}

function getChatSourceTasks() {
  var tasks = [];

  if (typeof requesterTasks != "undefined" && requesterTasks != null) {
    tasks = tasks.concat(requesterTasks);
  }

  if (typeof performerTasks != "undefined" && performerTasks != null) {
    tasks = tasks.concat(performerTasks);
  }

  return removeDuplicateChatTasks(tasks);
}

function removeDuplicateChatTasks(tasks) {
  var uniqueTasks = [];
  var taskIds = {};

  for (var i = 0; i < tasks.length; i++) {
    if (
      tasks[i] != null &&
      tasks[i].id != null &&
      taskIds[tasks[i].id] != true
    ) {
      uniqueTasks.push(tasks[i]);
      taskIds[tasks[i].id] = true;
    }
  }

  return uniqueTasks;
}

function getTaskByChatId(taskId) {
  var tasks = getChatSourceTasks();

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id == taskId) {
      return tasks[i];
    }
  }

  return null;
}

function getChatReceiverId(chat) {
  if (getCurrentChatUserId() == chat.requesterId) {
    return chat.performerId;
  }

  return chat.requesterId;
}

function getMessageRole(message, task) {
  if (message.sender_id == getTaskPerformerId(task)) {
    return "Performer";
  }

  if (message.sender_id == getTaskRequesterId(task)) {
    return "Requester";
  }

  return getCurrentChatRole();
}

function getMessageTimeText(createdAt) {
  if (createdAt == null || createdAt == "") {
    return getChatTimeText();
  }

  var messageDate = new Date(createdAt);
  var hours = messageDate.getHours();
  var minutes = messageDate.getMinutes();

  if (hours < 10) {
    hours = "0" + hours;
  }

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return hours + ":" + minutes;
}

function mapServerMessageToChatMessage(message, task) {
  return {
    id: message.id,
    sender_id: message.sender_id,
    receiver_id: message.receiver_id,
    senderRole: getMessageRole(message, task),
    senderName: message.sender_name || getCurrentChatUserName(),
    text: message.message,
    time: getMessageTimeText(message.created_at),
    isSystem: false,
    is_read: message.is_read,
  };
}

function parseServerJson(response) {
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Server request failed");
  }

  return response.json();
}

function loadTaskMessages(taskId) {
  var task = getTaskByChatId(taskId);

  if (task == null || taskHasChatParticipants(task) == false) {
    chatMessagesByTask[taskId] = [];
    return Promise.resolve([]);
  }

  return fetch(chatApiUrl + "/task/" + taskId)
    .then(parseServerJson)
    .then(function (messages) {
      var mappedMessages = [];

      for (var i = 0; i < messages.length; i++) {
        mappedMessages.push(mapServerMessageToChatMessage(messages[i], task));
      }

      chatMessagesByTask[taskId] = mappedMessages;
      return mappedMessages;
    })
    .catch(function () {
      chatMessagesByTask[taskId] = chatMessagesByTask[taskId] || [];
      return chatMessagesByTask[taskId];
    });
}

function loadVisibleChatMessages() {
  var chats = getVisibleChats();
  var requests = [];

  for (var i = 0; i < chats.length; i++) {
    requests.push(loadTaskMessages(chats[i].taskId));
  }

  return Promise.all(requests);
}

function saveChatMessageToServer(chat, message) {
  var senderId = getCurrentChatUserId();
  var receiverId = getChatReceiverId(chat);

  return fetch(chatApiUrl + "/task/" + chat.taskId + "/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.text,
    }),
  })
    .then(parseServerJson)
    .then(function (result) {
      return {
        id: result.messageId,
        sender_id: senderId,
        receiver_id: receiverId,
        senderRole: message.senderRole,
        senderName: message.senderName,
        text: message.text,
        time: getChatTimeText(),
        isSystem: message.isSystem == true,
        is_read: 0,
      };
    });
}

function escapeChatText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOtherChatUserName(chat) {
  if (getCurrentChatRole() == "Performer") {
    return chat.requesterName;
  }

  return chat.performerName;
}

function taskHasChatParticipants(task) {
  return (
    getTaskRequesterId(task) != null &&
    getTaskRequesterId(task) != "" &&
    getTaskPerformerId(task) != null &&
    getTaskPerformerId(task) != ""
  );
}

function findTaskChat(taskId) {
  var chats = getTaskChats();

  for (var i = 0; i < chats.length; i++) {
    if (chats[i].taskId == taskId) {
      return chats[i];
    }
  }

  return null;
}

function createTaskChat(task) {
  if (taskHasChatParticipants(task) == false) {
    return null;
  }

  return createChatFromTask(task);
}

function createChatFromTask(task) {
  var chat = {
    taskId: task.id,
    taskTitle: getTaskTitle(task),
    requesterId: getTaskRequesterId(task),
    requesterName: getTaskRequesterName(task),
    performerId: getTaskPerformerId(task),
    performerName: getTaskPerformerName(task),
    messages: chatMessagesByTask[task.id] || [],
  };

  return chat;
}

function addTaskChatSystemMessage(task, messageText) {
  if (taskHasChatParticipants(task) == false) {
    return;
  }

  var chat = findTaskChat(task.id);

  if (chat == null) {
    chat = createTaskChat(task);
  }

  if (chat == null) {
    return;
  }

  addTaskChatMessage(task.id, {
    senderRole: "Performer",
    senderName: chat.performerName,
    text: messageText,
    time: getChatTimeText(),
    isSystem: true,
    readBy: createChatReadState("Performer"),
  });
}

function addTaskChatMessage(taskId, message) {
  var chat = findTaskChat(taskId);

  if (chat == null) {
    return;
  }

  if (message.readBy == null) {
    message.readBy = createChatReadState(message.senderRole);
  }

  saveChatMessageToServer(chat, message).then(function (serverMessage) {
    var currentMessages = chatMessagesByTask[taskId] || [];
    currentMessages.push(serverMessage);
    chatMessagesByTask[taskId] = currentMessages;
    renderChatList();
    updateChatUnreadBadge();

    if (activeChatTaskId == taskId) {
      renderChatConversation(taskId);
    }
  });
}

function getVisibleChats() {
  var chats = getTaskChats();
  var visibleChats = [];

  for (var i = 0; i < chats.length; i++) {
    visibleChats.push(chats[i]);
  }

  return visibleChats;
}

function renderChatList() {
  var chatList = document.getElementById("chatList");

  if (chatList == null) {
    return;
  }

  var chats = getVisibleChats();
  chatList.innerHTML = "";

  if (chats.length == 0) {
    chatList.innerHTML = '<div class="emptyChatList">No task chats yet</div>';
    updateChatUnreadBadge();
    return;
  }

  for (var i = chats.length - 1; i >= 0; i--) {
    var lastMessage = chats[i].messages[chats[i].messages.length - 1] || {
      text: "No messages yet",
    };
    var unreadCount = getChatUnreadCount(chats[i]);
    var unreadBadge = "";

    if (unreadCount > 0) {
      unreadBadge =
        '<span class="chatListUnreadBadge">' + unreadCount + "</span>";
    }

    chatList.innerHTML +=
      '<button type="button" class="chatListItem" onclick="openTaskChat(' +
      chats[i].taskId +
      ')">' +
      unreadBadge +
      "<h4>" +
      escapeChatText(chats[i].taskTitle) +
      "</h4>" +
      "<p>To: " +
      escapeChatText(getOtherChatUserName(chats[i])) +
      "</p>" +
      "<small>" +
      escapeChatText(lastMessage.text) +
      "</small>" +
      "</button>";
  }

  updateChatUnreadBadge();
}

function openChatDrawer() {
  if (document.getElementById("chatDrawer") == null) {
    ensureChatLayout();
    setTimeout(openChatDrawer, 200);
    return;
  }

  loadVisibleChatMessages().then(renderChatList);
  document.getElementById("chatOverlay").style.display = "block";
  document.getElementById("chatDrawer").style.display = "block";
}

function closeChatDrawer() {
  document.getElementById("chatOverlay").style.display = "none";
  document.getElementById("chatDrawer").style.display = "none";
  showChatListView();
}

function showChatListView() {
  if (activeChatTaskId != null) {
    markTaskChatAsRead(activeChatTaskId);
  }

  activeChatTaskId = null;
  document.getElementById("chatDrawerSubtitle").innerHTML = "Task discussions";
  document.getElementById("chatListView").style.display = "block";
  document.getElementById("chatConversationView").style.display = "none";
  renderChatList();
  updateChatUnreadBadge();
}

function openTaskChat(taskId) {
  activeChatTaskId = taskId;
  document.getElementById("chatListView").style.display = "none";
  document.getElementById("chatConversationView").style.display = "block";
  openChatDrawer();

  loadTaskMessages(taskId).then(function () {
    renderChatConversation(taskId);
    renderChatList();
    updateChatUnreadBadge();
  });
}

function renderChatConversation(taskId) {
  var chat = findTaskChat(taskId);
  var chatMessages = document.getElementById("chatMessages");

  if (chat == null || chatMessages == null) {
    return;
  }

  document.getElementById("chatDrawerSubtitle").innerHTML = escapeChatText(
    chat.taskTitle,
  );
  chatMessages.innerHTML = "";

  for (var i = 0; i < chat.messages.length; i++) {
    var messageClass = "chatMessage";

    if (chat.messages[i].isSystem == true) {
      messageClass += " chatMessageSystem";
    } else if (chat.messages[i].senderRole == getCurrentChatRole()) {
      messageClass += " chatMessageMine";
    }

    chatMessages.innerHTML +=
      '<div class="' +
      messageClass +
      '">' +
      "<b>" +
      escapeChatText(chat.messages[i].senderName) +
      "</b>" +
      "<p>" +
      escapeChatText(chat.messages[i].text) +
      "</p>" +
      "<small>" +
      escapeChatText(chat.messages[i].time) +
      "</small>" +
      "</div>";
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendCurrentChatMessage(event) {
  event.preventDefault();

  var chatInput = document.getElementById("chatMessageInput");

  if (activeChatTaskId == null || chatInput.value.trim() == "") {
    return false;
  }

  addTaskChatMessage(activeChatTaskId, {
    senderRole: getCurrentChatRole(),
    senderName: getCurrentChatUserName(),
    text: chatInput.value.trim(),
    time: getChatTimeText(),
    isSystem: false,
  });

  chatInput.value = "";
  return false;
}

function openCurrentTaskChat(task) {
  if (taskHasChatParticipants(task) == false) {
    return;
  }

  if (findTaskChat(task.id) == null) {
    createTaskChat(task);
  }

  openTaskChat(task.id);
}

function connectChatActions() {
  var closeButton = document.getElementById("closeChatDrawer");
  var chatOverlay = document.getElementById("chatOverlay");
  var backButton = document.getElementById("backToChatsButton");
  var chatForm = document.getElementById("chatMessageForm");

  if (closeButton != null) {
    closeButton.onclick = closeChatDrawer;
  }

  if (chatOverlay != null) {
    chatOverlay.onclick = closeChatDrawer;
  }

  if (backButton != null) {
    backButton.onclick = showChatListView;
  }

  if (chatForm != null) {
    chatForm.onsubmit = sendCurrentChatMessage;
  }
}

var chatPreviousWindowOnload = window.onload;

window.onload = function () {
  if (typeof chatPreviousWindowOnload == "function") {
    chatPreviousWindowOnload();
  }

  setTimeout(ensureChatLayout, 350);
  setTimeout(function () {
    loadVisibleChatMessages().then(updateChatUnreadBadge);
  }, 650);
};

document.addEventListener("click", function (event) {
  var clickedElement = event.target;

  while (clickedElement != null) {
    if (clickedElement.id == "chatButton") {
      openChatDrawer();
      return;
    }

    clickedElement = clickedElement.parentNode;
  }
});
