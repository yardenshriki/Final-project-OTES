//yarden shriki, lior zahavi
var notificationsApiUrl = "http://localhost:5000/api/notification";
var notificationTasksApiUrl = "http://localhost:5000/api/tasks";
var notificationUsersApiUrl = "http://localhost:5000/api/users";
var notificationsRatingsApiUrl = "http://localhost:5000/api/rating";
var notificationsCache = [];
var selectedNotificationId = null;
var selectedNotificationData = null;
var taskCompletionModalOpen = false;
var selectedRatingNotification = null;
var selectedRatingValue = 0;

function getCurrentNotificationUserId() {
    return String(localStorage.getItem("loggedInUserId") || "");
}

function getNotifications() {
    return notificationsCache;
}

async function fetchUserNotifications() {
    var userId = getCurrentNotificationUserId();
    if (userId == "" || userId == "null") return [];

    try {
        var response = await fetch(notificationsApiUrl + "/user/" + userId);
        if (!response.ok) return [];
        notificationsCache = await response.json();
        return notificationsCache;
    } catch (e) {
        return [];
    }
}

async function addNotification(notification) {
    var userId = notification.toUserId ||
        notification.user_id ||
        notification.userId ||
        null;

    if (userId == null || userId == "") return;

    try {
        await fetch(notificationsApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                task_id: notification.task_id || null,
                type: notification.type || "general",
                title: notification.title,
                message: notification.message,
            })
        });
        await refreshMailbox();
    } catch (e) {
        console.log(e.message);
    }
}

function getNotificationDateText() {
    var today = new Date();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    return today.getFullYear() + "-" + month + "-" + day;
}

function shouldShowNotificationInMailbox(notification) {
    return notification.type == "payment-success" ||
        notification.type == "task-cancelled" ||
        notification.type == "task-accepted" ||
        notification.type == "performer-task-responsibility" ||
        notification.type == "performer-task-cancelled" ||
        notification.type == "report-sent" ||
        notification.type == "report-in-review" ||
        notification.type == "report-closed" ||
        notification.type == "report-decision" ||
        notification.type == "report" ||
        notification.type == "warning" ||
        notification.type == "block";
}

function getCurrentRoleNotifications() {
    var result = [];
    for (var i = 0; i < notificationsCache.length; i++) {
        if (shouldShowNotificationInMailbox(notificationsCache[i])) {
            result.push(notificationsCache[i]);
        }
    }
    return result;
}

async function refreshMailbox() {
    await fetchUserNotifications();
    updateMailBadge();
    renderMailList();
}

async function openPendingTaskCompletionNotification() {
    var pending = null;
    for (var i = 0; i < notificationsCache.length; i++) {
        if (notificationsCache[i].type == "task-completion" && !notificationsCache[i].is_read) {
            pending = notificationsCache[i];
            break;
        }
    }

    if (pending == null) return;

    if (pending.task_id) {
        try {
            var task = await fetch(notificationTasksApiUrl + "/" + pending.task_id).then(function (r) { return r.json(); });
            pending.task_title = task.title || "";
            pending.performer_id = task.performer_id;
            pending.requester_id = task.requester_id || pending.user_id;
            pending.amount = task.payment;

            if (task.performer_id) {
                var performer = await fetch(notificationUsersApiUrl + "/" + task.performer_id).then(function (r) { return r.json(); });
                pending.performer_name = performer.full_name || "";
            }
        } catch (e) {}
    }

    try {
        await fetch(notificationsApiUrl + "/" + pending.id + "/read", { method: "PATCH" });
        for (var j = 0; j < notificationsCache.length; j++) {
            if (notificationsCache[j].id == pending.id) {
                notificationsCache[j].is_read = 1;
            }
        }
    } catch (e) {}

    openTaskCompletionModal(pending);
}

function updateMailBadge() {
    var badge = document.getElementById("mailUnreadBadge");
    if (badge == null) return;

    var notifications = getCurrentRoleNotifications();
    var unreadCount = 0;
    for (var i = 0; i < notifications.length; i++) {
        if (!notifications[i].is_read) unreadCount++;
    }

    badge.innerHTML = unreadCount;
    badge.style.display = unreadCount > 0 ? "block" : "none";
}

function renderMailList() {
    var mailList = document.getElementById("mailList");
    if (mailList == null) return;

    var notifications = getCurrentRoleNotifications();
    mailList.innerHTML = "";

    if (notifications.length == 0) {
        mailList.innerHTML = '<div class="emptyMailbox">No messages yet</div>';
        return;
    }

    for (var i = notifications.length - 1; i >= 0; i--) {
        var className = "mailItem";
        if (!notifications[i].is_read) className += " mailItemUnread";
        mailList.innerHTML += createNotificationItem(notifications[i], className);
    }
}

function createNotificationItem(notification, className) {
    var receiptButton = "";
    if (notification.type == "payment-success") {
        receiptButton = '<button type="button" class="receiptDownloadButton" onclick="downloadReceipt(' + notification.id + ', event)">Download Receipt</button>';
    }

    return '<div class="' + className + '" onclick="openNotification(' + notification.id + ')">' +
        '<h4>' + (notification.title || "") + '</h4>' +
        '<p>' + (notification.message || "") + '</p>' +
        receiptButton +
        '<small>' + (notification.created_at || "") + '</small>' +
        '</div>';
}

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
        if (document.getElementById("messageModalOverlay") == null) {
            document.body.insertAdjacentHTML("beforeend",
                '<div id="messageModalOverlay" class="messageModalOverlay"></div>');
        }
        document.body.insertAdjacentHTML("beforeend",
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

    if (document.getElementById("ratingModal") == null) {
        document.body.insertAdjacentHTML("beforeend",
            '<section id="ratingModal" class="ratingModal">' +
            '<div class="ratingIcon">&#9733;</div>' +
            '<h2>Rate the Performer</h2>' +
            '<div class="ratingSummary">' +
            '<div><span>Performer</span><b id="ratingPerformerName"></b></div>' +
            '<div><span>Date</span><b id="ratingDate"></b></div>' +
            '<div class="ratingTaskName"><span>Task Name</span><b id="ratingTaskName"></b></div>' +
            '</div>' +
            '<div id="ratingStars" class="ratingStars" aria-label="Rating stars">' +
            '<button type="button" data-rating="1">&#9733;</button>' +
            '<button type="button" data-rating="2">&#9733;</button>' +
            '<button type="button" data-rating="3">&#9733;</button>' +
            '<button type="button" data-rating="4">&#9733;</button>' +
            '<button type="button" data-rating="5">&#9733;</button>' +
            '</div>' +
            '<label for="ratingFeedback">Additional Feedback</label>' +
            '<textarea id="ratingFeedback" placeholder="Describe your experience working with this performer..."></textarea>' +
            '<button type="button" id="submitRatingButton" class="submitRatingButton">Submit Rating</button>' +
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

function openMailbox() {
    refreshMailbox();
    document.getElementById("mailOverlay").style.display = "block";
    document.getElementById("mailDrawer").style.display = "block";
}

function closeMailbox() {
    document.getElementById("mailOverlay").style.display = "none";
    document.getElementById("mailDrawer").style.display = "none";
}

async function openNotification(notificationId) {
    try {
        await fetch(notificationsApiUrl + "/" + notificationId + "/read", { method: "PATCH" });
        for (var i = 0; i < notificationsCache.length; i++) {
            if (notificationsCache[i].id == notificationId) {
                notificationsCache[i].is_read = 1;
            }
        }
    } catch (e) {}

    updateMailBadge();
    renderMailList();
}

function openTaskCompletionModal(notification) {
    if (taskCompletionModalOpen) return;
    taskCompletionModalOpen = true;
    selectedNotificationId = notification.id;
    selectedNotificationData = notification;
    document.getElementById("taskCompletionMessage").innerHTML =
        '<b>' + (notification.task_title || "") + '</b> has been marked as finished.';
    document.getElementById("messageModalOverlay").style.display = "block";
    document.getElementById("taskCompletionModal").style.display = "block";
}

function closeTaskCompletionModal() {
    taskCompletionModalOpen = false;
    document.getElementById("messageModalOverlay").style.display = "none";
    document.getElementById("taskCompletionModal").style.display = "none";
    selectedNotificationId = null;
    selectedNotificationData = null;
}

async function resolveTaskCompletion(decisionText) {
    var notification = selectedNotificationData;

    closeTaskCompletionModal();

    if (notification != null) {
        if (decisionText == "approved") {
            await approveTaskCompletion(notification);
        } else {
            await rejectTaskCompletion(notification);
        }
    }

    await refreshMailbox();
}

async function approveTaskCompletion(notification) {
    var paymentWasCreated = false;

    if (typeof addPaymentSuccessNotification == "function") {
        paymentWasCreated = await addPaymentSuccessNotification(notification);
    }

    if (paymentWasCreated == true && typeof openRatingModal == "function") {
        openRatingModal(notification);
    }
}

async function rejectTaskCompletion(notification) {
    await reopenTaskAfterRejectedCompletion(notification.task_id);
    goToReportPage(notification);
}

async function reopenTaskAfterRejectedCompletion(taskId) {
    if (taskId == null || taskId == "") return;

    try {
        var response = await fetch(notificationTasksApiUrl + "/" + taskId);
        var task = await response.json();
        task.state = "in-progress";
        task.work_status = "Finalizing the task";
        await fetch(notificationTasksApiUrl + "/" + task.id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
        });
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

function openRatingModal(notification) {
    selectedRatingNotification = notification;
    selectedRatingValue = 0;

    document.getElementById("ratingPerformerName").innerHTML = notification.performer_name || "";
    document.getElementById("ratingDate").innerHTML = getNotificationDateText();
    document.getElementById("ratingTaskName").innerHTML = notification.task_title || "";
    document.getElementById("ratingFeedback").value = "";
    markRatingStars();

    document.getElementById("messageModalOverlay").style.display = "block";
    document.getElementById("ratingModal").style.display = "block";
}

function closeRatingModal() {
    document.getElementById("messageModalOverlay").style.display = "none";
    document.getElementById("ratingModal").style.display = "none";
    selectedRatingNotification = null;
    selectedRatingValue = 0;
}

function markRatingStars() {
    var starButtons = document.querySelectorAll("#ratingStars button");
    for (var i = 0; i < starButtons.length; i++) {
        if (parseInt(starButtons[i].getAttribute("data-rating")) <= selectedRatingValue) {
            starButtons[i].className = "activeRatingStar";
        } else {
            starButtons[i].className = "";
        }
    }
}

function chooseRating(ratingValue) {
    selectedRatingValue = ratingValue;
    markRatingStars();
}

async function submitRating() {
    if (selectedRatingNotification == null || selectedRatingValue == 0) {
        return;
    }

    try {
        await fetch(notificationsRatingsApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task_id: selectedRatingNotification.task_id,
                requester_id: selectedRatingNotification.requester_id || getCurrentNotificationUserId(),
                performer_id: selectedRatingNotification.performer_id,
                rating: selectedRatingValue,
                feedback: document.getElementById("ratingFeedback").value || null
            })
        });
    } catch (e) {
        console.log(e.message);
    }

    closeRatingModal();
}

function downloadReceipt(notificationId, event) {
    if (event != null) {
        event.stopPropagation();
    }

    var notifications = getNotifications();
    var selectedNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id == notificationId) {
            selectedNotification = notifications[i];
        }
    }

    await refreshMailbox();
}

async function approveTaskCompletion(notification) {
    var paymentWasCreated = false;

    if (typeof addPaymentSuccessNotification == "function") {
        paymentWasCreated = await addPaymentSuccessNotification(notification);
    }

    var receiptText = "OTES Payment Receipt\n" +
        "Task: " + (selectedNotification.task_title || "") + "\n" +
        "Status: Payment transferred\n" +
        "Date: " + (selectedNotification.created_at || "") + "\n";
    var receiptFile = new Blob([receiptText], { type: "text/plain" });
    var receiptLink = document.createElement("a");

    receiptLink.href = URL.createObjectURL(receiptFile);
    receiptLink.download = "receipt-" + (selectedNotification.task_id || notificationId) + ".txt";
    receiptLink.click();
    URL.revokeObjectURL(receiptLink.href);
}

function connectMailboxActions() {
    var mailButton = document.getElementById("mailButton");
    var closeMailButton = document.getElementById("closeMailDrawer");
    var mailOverlay = document.getElementById("mailOverlay");
    var approveButton = document.getElementById("approveCompletionButton");
    var rejectButton = document.getElementById("rejectCompletionButton");

    if (mailButton != null) mailButton.onclick = openMailbox;
    if (closeMailButton != null) closeMailButton.onclick = closeMailbox;
    if (mailOverlay != null) mailOverlay.onclick = closeMailbox;

    if (approveButton != null) {
        approveButton.onclick = function () { resolveTaskCompletion("approved"); };
    }
    if (rejectButton != null) {
        rejectButton.onclick = function () { resolveTaskCompletion("not-approved"); };
    }

    for (var i = 0; i < starButtons.length; i++) {
        starButtons[i].onclick = function () {
            chooseRating(parseInt(this.getAttribute("data-rating")));
        };
    }

    if (submitRatingButton != null) {
        submitRatingButton.onclick = submitRating;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(async function () {
        ensureNotificationLayout();
        connectMailboxActions();
        await refreshMailbox();
        await openPendingTaskCompletionNotification();
    }, 200);

    setInterval(async function () {
        await refreshMailbox();
        await openPendingTaskCompletionNotification();
    }, 5000);
});
