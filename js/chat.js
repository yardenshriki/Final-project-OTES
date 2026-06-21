//yarden shriki, lior zahavi
var activeChatTaskId = null;

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
    var savedChats = localStorage.getItem("taskChats");

    if (savedChats == null || savedChats == "") {
        return [];
    }

    return JSON.parse(savedChats);
}

function saveTaskChats(chats) {
    localStorage.setItem("taskChats", JSON.stringify(chats));
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

    if (message.readBy != null && message.readBy[roleName] == true) {
        return false;
    }

    return true;
}

function getChatUnreadCount(chat) {
    var unreadCount = 0;

    for (var i = 0; i < chat.messages.length; i++) {
        if (isChatMessageUnread(chat.messages[i], userRole)) {
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

    if (chatButton == null || document.getElementById("chatUnreadBadge") != null) {
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
    var chats = getTaskChats();
    var wasUpdated = false;

    for (var i = 0; i < chats.length; i++) {
        if (chats[i].taskId == taskId) {
            for (var j = 0; j < chats[i].messages.length; j++) {
                if (isChatMessageUnread(chats[i].messages[j], userRole)) {
                    if (chats[i].messages[j].readBy == null) {
                        chats[i].messages[j].readBy = {};
                    }

                    chats[i].messages[j].readBy[userRole] = true;
                    wasUpdated = true;
                }
            }
        }
    }

    if (wasUpdated) {
        saveTaskChats(chats);
    }
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
    if (userRole == "Performer") {
        return "John Designer";
    }

    return "Sarah Johnson";
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
    if (userRole == "Performer") {
        return chat.requesterName;
    }

    return chat.performerName;
}

function taskHasChatParticipants(task) {
    return task.requesterName != null &&
        task.requesterName != "" &&
        task.performerName != null &&
        task.performerName != "";
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

    var chats = getTaskChats();

    for (var i = 0; i < chats.length; i++) {
        if (chats[i].taskId == task.id) {
            return chats[i];
        }
    }

    var chat = {
        taskId: task.id,
        taskTitle: task.taskTitle,
        requesterName: task.requesterName,
        performerName: task.performerName,
        messages: []
    };

    chat.messages.push({
        senderRole: "Performer",
        senderName: chat.performerName,
        text: "Task accepted by " + chat.performerName,
        time: getChatTimeText(),
        isSystem: true,
        readBy: createChatReadState("Performer")
    });

    chats.push(chat);
    saveTaskChats(chats);
    renderChatList();
    updateChatUnreadBadge();
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

    addTaskChatMessage(task.id, {
        senderRole: "Performer",
        senderName: chat.performerName,
        text: messageText,
        time: getChatTimeText(),
        isSystem: true,
        readBy: createChatReadState("Performer")
    });
}

function addTaskChatMessage(taskId, message) {
    var chats = getTaskChats();

    for (var i = 0; i < chats.length; i++) {
        if (chats[i].taskId == taskId) {
            if (message.readBy == null) {
                message.readBy = createChatReadState(message.senderRole);
            }

            chats[i].messages.push(message);
            saveTaskChats(chats);
            renderChatList();
            updateChatUnreadBadge();

            if (activeChatTaskId == taskId) {
                renderChatConversation(taskId);
            }

            return;
        }
    }
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
        var lastMessage = chats[i].messages[chats[i].messages.length - 1];
        var unreadCount = getChatUnreadCount(chats[i]);
        var unreadBadge = "";

        if (unreadCount > 0) {
            unreadBadge = '<span class="chatListUnreadBadge">' + unreadCount + '</span>';
        }

        chatList.innerHTML += '<button type="button" class="chatListItem" onclick="openTaskChat(' + chats[i].taskId + ')">' +
            unreadBadge +
            '<h4>' + escapeChatText(chats[i].taskTitle) + '</h4>' +
            '<p>To: ' + escapeChatText(getOtherChatUserName(chats[i])) + '</p>' +
            '<small>' + escapeChatText(lastMessage.text) + '</small>' +
            '</button>';
    }

    updateChatUnreadBadge();
}

function openChatDrawer() {
    if (document.getElementById("chatDrawer") == null) {
        ensureChatLayout();
        setTimeout(openChatDrawer, 200);
        return;
    }

    renderChatList();
    document.getElementById("chatOverlay").style.display = "block";
    document.getElementById("chatDrawer").style.display = "block";
}

function closeChatDrawer() {
    document.getElementById("chatOverlay").style.display = "none";
    document.getElementById("chatDrawer").style.display = "none";
    showChatListView();
}

function showChatListView() {
    activeChatTaskId = null;
    document.getElementById("chatDrawerSubtitle").innerHTML = "Task discussions";
    document.getElementById("chatListView").style.display = "block";
    document.getElementById("chatConversationView").style.display = "none";
}

function openTaskChat(taskId) {
    activeChatTaskId = taskId;
    markTaskChatAsRead(taskId);
    renderChatConversation(taskId);
    renderChatList();
    updateChatUnreadBadge();
    document.getElementById("chatListView").style.display = "none";
    document.getElementById("chatConversationView").style.display = "block";
    openChatDrawer();
}

function renderChatConversation(taskId) {
    var chat = findTaskChat(taskId);
    var chatMessages = document.getElementById("chatMessages");

    if (chat == null || chatMessages == null) {
        return;
    }

    document.getElementById("chatDrawerSubtitle").innerHTML = escapeChatText(chat.taskTitle);
    chatMessages.innerHTML = "";

    for (var i = 0; i < chat.messages.length; i++) {
        var messageClass = "chatMessage";

        if (chat.messages[i].isSystem == true) {
            messageClass += " chatMessageSystem";
        } else if (chat.messages[i].senderRole == userRole) {
            messageClass += " chatMessageMine";
        }

        chatMessages.innerHTML += '<div class="' + messageClass + '">' +
            '<b>' + escapeChatText(chat.messages[i].senderName) + '</b>' +
            '<p>' + escapeChatText(chat.messages[i].text) + '</p>' +
            '<small>' + escapeChatText(chat.messages[i].time) + '</small>' +
            '</div>';
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
        senderRole: userRole,
        senderName: getCurrentChatUserName(),
        text: chatInput.value.trim(),
        time: getChatTimeText(),
        isSystem: false
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

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(ensureChatLayout, 350);
    setTimeout(updateChatUnreadBadge, 650);
});

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
