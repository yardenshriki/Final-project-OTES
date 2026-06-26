//yarden shriki, lior zahavi
var selectedNotificationId = null;
var notificationTasksApiUrl = "http://localhost:5000/api/tasks";

function ensureNotificationLayout() {
    var appHeader = document.getElementById("appHeader");

    if (appHeader != null) {
        var profileButton = document.getElementsByClassName("profileButton")[0];
        var mailButton = document.getElementById("mailButton");
        var chatButton = document.getElementById("chatButton");

        if (mailButton == null) {
            mailButton = document.createElement("button");
            mailButton.type = "button";
            mailButton.id = "mailButton";
            mailButton.className = "mailButton";
            mailButton.setAttribute("aria-label", "Mailbox");
            mailButton.innerHTML = '<span class="mailIcon"></span><span id="mailUnreadBadge" class="mailUnreadBadge">0</span>';
        }

        if (chatButton == null) {
            chatButton = document.createElement("button");
            chatButton.type = "button";
            chatButton.id = "chatButton";
            chatButton.className = "chatButton";
            chatButton.setAttribute("aria-label", "Chat");
            chatButton.innerHTML = '<span class="chatIcon"></span>';
        }

        placeHeaderIcon(appHeader, profileButton, mailButton);
        placeHeaderIcon(appHeader, mailButton, chatButton);
    }

    if (document.getElementById("mailDrawer") == null) {
        document.body.insertAdjacentHTML("beforeend",
            '<div id="mailOverlay" class="mailOverlay"></div>' +
            '<aside id="mailDrawer" class="mailDrawer">' +
            '<div class="mailDrawerHeader">' +
            '<h3>Mailbox</h3>' +
            '<button type="button" id="closeMailDrawer" aria-label="Close mailbox">x</button>' +
            '</div>' +
            '<div id="mailList" class="mailList"></div>' +
            '</aside>');
    }

    if (document.getElementById("taskCompletionModal") == null) {
        document.body.insertAdjacentHTML("beforeend",
            '<div id="messageModalOverlay" class="messageModalOverlay"></div>' +
            '<section id="taskCompletionModal" class="taskCompletionModal">' +
            '<div class="completionIcon">!</div>' +
            '<h2>TASK COMPLETION</h2>' +
            '<p id="taskCompletionMessage"></p>' +
            '<h3>Was the task completed properly?</h3>' +
            '<div class="completionActions">' +
            '<button type="button" id="approveCompletionButton">YES, APPROVE</button>' +
            '<button type="button" id="rejectCompletionButton">NOT APPROVE</button>' +
            '</div>' +
            '<p class="completionNote">* Clicking "YES" will transfer the payment to the performer immediately.</p>' +
            '</section>');
    }

}

function placeHeaderIcon(appHeader, previousElement, iconButton) {
    if (previousElement != null && previousElement.nextSibling != iconButton) {
        appHeader.insertBefore(iconButton, previousElement.nextSibling);
        return;
    }

    if (previousElement == null && iconButton.parentNode == null) {
        appHeader.appendChild(iconButton);
    }
}

function getNotifications() {
    var savedNotifications = localStorage.getItem("notifications");

    if (savedNotifications == null || savedNotifications == "") {
        return [];
    }

    return JSON.parse(savedNotifications);
}

function saveNotifications(notifications) {
    localStorage.setItem("notifications", JSON.stringify(notifications));
}

function addNotification(notification) {
    var notifications = getNotifications();
    notification.id = Date.now();
    notification.is_read = false;
    notification.created_at = getNotificationDateText();
    notifications.push(notification);
    saveNotifications(notifications);
    refreshMailbox();
    openPendingTaskCompletionNotification();
}

function getCurrentNotificationUserId() {
    return String(localStorage.getItem("loggedInUserId") || "");
}

function getNotificationTargetUserId(notification) {
    return notification.toUserId ||
        notification.to_user_id ||
        notification.user_id ||
        notification.requester_id ||
        null;
}

function notificationBelongsToCurrentUser(notification) {
    var currentUserId = getCurrentNotificationUserId();
    var targetUserId = getNotificationTargetUserId(notification);

    if (targetUserId != null && targetUserId != "") {
        return String(targetUserId) == currentUserId;
    }

    return notification.toRole == userRole;
}

function getNotificationDateText() {
    var today = new Date();
    var month = today.getMonth() + 1;
    var day = today.getDate();

    if (month < 10) {
        month = "0" + month;
    }

    if (day < 10) {
        day = "0" + day;
    }

    return today.getFullYear() + "-" + month + "-" + day;
}

function getCurrentRoleNotifications() {
    var notifications = getNotifications();
    var roleNotifications = [];

    for (var i = 0; i < notifications.length; i++) {
        if (notificationBelongsToCurrentUser(notifications[i]) && shouldShowNotificationInMailbox(notifications[i])) {
            roleNotifications.push(notifications[i]);
        }
    }

    return roleNotifications;
}

function shouldShowNotificationInMailbox(notification) {
    return notification.type == "payment-success" ||
        notification.type == "task-cancelled" ||
        notification.type == "task-accepted" ||
        notification.type == "performer-task-responsibility" ||
        notification.type == "performer-task-cancelled";
}

function refreshMailbox() {
    updateMailBadge();
    renderMailList();
}

function openPendingTaskCompletionNotification() {
    var notifications = getNotifications();
    var pendingNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notificationBelongsToCurrentUser(notifications[i]) && notifications[i].type == "task-completion" && notifications[i].resolved != true) {
            notifications[i].is_read = true;
            pendingNotification = notifications[i];
            break;
        }
    }

    if (pendingNotification == null) {
        return;
    }

    saveNotifications(notifications);
    refreshMailbox();
    openTaskCompletionModal(pendingNotification);
}

function updateMailBadge() {
    var badge = document.getElementById("mailUnreadBadge");

    if (badge == null) {
        return;
    }

    var notifications = getCurrentRoleNotifications();
    var unreadCount = 0;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].is_read == false) {
            unreadCount++;
        }
    }

    badge.innerHTML = unreadCount;
    badge.style.display = unreadCount > 0 ? "block" : "none";
}

function renderMailList() {
    var mailList = document.getElementById("mailList");

    if (mailList == null) {
        return;
    }

    var notifications = getCurrentRoleNotifications();
    mailList.innerHTML = "";

    if (notifications.length == 0) {
        mailList.innerHTML = '<div class="emptyMailbox">No messages yet</div>';
        return;
    }

    for (var i = notifications.length - 1; i >= 0; i--) {
        var className = "mailItem";

        if (notifications[i].is_read == false) {
            className += " mailItemUnread";
        }

        mailList.innerHTML += createNotificationItem(notifications[i], className);
    }
}

function createNotificationItem(notification, className) {
    var receiptButton = "";

    if (notification.type == "payment-success") {
        receiptButton = '<button type="button" class="receiptDownloadButton" onclick="downloadReceipt(' + notification.id + ', event)">Download Receipt</button>';
    }

    return '<div class="' + className + '" onclick="openNotification(' + notification.id + ')">' +
        '<h4>' + notification.title + '</h4>' +
        '<p>' + notification.message + '</p>' +
        receiptButton +
        '<small>' + notification.created_at + '</small>' +
        '</div>';
}

function openMailbox() {
    refreshMailbox();
    document.getElementById("mailOverlay").style.display = "block";
    document.getElementById("mailDrawer").style.display = "block";
}

function closeMailbox() {
    document.getElementById("mailOverlay").style.display = "none";
    document.getElementById("mailDrawer").style.display = "none";
}

function openNotification(notificationId) {
    var notifications = getNotifications();
    var selectedNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id == notificationId) {
            notifications[i].is_read = true;
            selectedNotification = notifications[i];
        }
    }

    saveNotifications(notifications);
    refreshMailbox();

    if (selectedNotification != null && selectedNotification.type == "task-completion" && selectedNotification.resolved != true) {
        openTaskCompletionModal(selectedNotification);
    }
}

function openTaskCompletionModal(notification) {
    selectedNotificationId = notification.id;
    document.getElementById("taskCompletionMessage").innerHTML = '<b>' + notification.task_title + '</b> has been marked as finished.';
    document.getElementById("messageModalOverlay").style.display = "block";
    document.getElementById("taskCompletionModal").style.display = "block";
}

function closeTaskCompletionModal() {
    document.getElementById("messageModalOverlay").style.display = "none";
    document.getElementById("taskCompletionModal").style.display = "none";
    selectedNotificationId = null;
}

async function resolveTaskCompletion(decisionText) {
    var notifications = getNotifications();
    var selectedNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id == selectedNotificationId) {
            selectedNotification = notifications[i];
            notifications[i].resolved = true;
            notifications[i].decision = decisionText;
        }
    }

    saveNotifications(notifications);

    closeTaskCompletionModal();

    if (selectedNotification != null) {
        if (decisionText == "approved") {
            await approveTaskCompletion(selectedNotification);
        } else {
            await rejectTaskCompletion(selectedNotification);
        }
    }

    refreshMailbox();
}

async function approveTaskCompletion(selectedNotification) {
    var paymentWasCreated = false;

    if (typeof addPaymentSuccessNotification == "function") {
        paymentWasCreated = await addPaymentSuccessNotification(selectedNotification);
    }

    if (paymentWasCreated == true && typeof openRatingModal == "function") {
        openRatingModal(selectedNotification);
    }
}

async function rejectTaskCompletion(selectedNotification) {
    await reopenTaskAfterRejectedCompletion(selectedNotification.task_id);
    goToReportPage(selectedNotification);
}

async function getTaskForNotification(taskId) {
    var response = await fetch(notificationTasksApiUrl + "/" + taskId);
    var task = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(task.message || "Failed to load task");
    }

    return task;
}

async function updateTaskForNotification(task) {
    var response = await fetch(notificationTasksApiUrl + "/" + task.id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    });
    var result = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(result.message || "Failed to update task");
    }

    return result;
}

async function reopenTaskAfterRejectedCompletion(taskId) {
    if (taskId == null || taskId == "") {
        return;
    }

    try {
        var task = await getTaskForNotification(taskId);
        task.state = "in-progress";
        task.work_status = "Finalizing the task";
        await updateTaskForNotification(task);
    } catch (error) {
        console.log(error.message);
    }
}

function goToReportPage(notification) {
    var reportUrl = "report.html?task_id=" + encodeURIComponent(notification.task_id || "");

    if (notification.task_title != null) {
        reportUrl += "&task_title=" + encodeURIComponent(notification.task_title);
    }

    if (notification.performer_id != null) {
        reportUrl += "&reported_user_id=" + encodeURIComponent(notification.performer_id);
    }

    window.location.href = reportUrl;
}

function connectMailboxActions() {
    var mailButton = document.getElementById("mailButton");
    var closeMailButton = document.getElementById("closeMailDrawer");
    var mailOverlay = document.getElementById("mailOverlay");
    var approveButton = document.getElementById("approveCompletionButton");
    var rejectButton = document.getElementById("rejectCompletionButton");

    if (mailButton != null) {
        mailButton.onclick = openMailbox;
    }

    if (closeMailButton != null) {
        closeMailButton.onclick = closeMailbox;
    }

    if (mailOverlay != null) {
        mailOverlay.onclick = closeMailbox;
    }

    if (approveButton != null) {
        approveButton.onclick = function () {
            resolveTaskCompletion("approved");
        };
    }

    if (rejectButton != null) {
        rejectButton.onclick = function () {
            resolveTaskCompletion("not-approved");
        };
    }

}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        ensureNotificationLayout();
        connectMailboxActions();
        refreshMailbox();
        openPendingTaskCompletionNotification();
    }, 200);
});
