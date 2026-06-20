//yarden shriki, lior zahavi
var selectedNotificationId = null;
var selectedRatingNotification = null;
var selectedRatingValue = 0;

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

    if (document.getElementById("ratingModal") == null) {
        document.body.insertAdjacentHTML("beforeend",
            '<section id="ratingModal" class="ratingModal">' +
            '<div class="ratingIcon">★</div>' +
            '<h2>Rate the Performer</h2>' +
            '<div class="ratingSummary">' +
            '<div><span>Performer</span><b id="ratingPerformerName">John Designer</b></div>' +
            '<div><span>Date</span><b id="ratingDate">2026-02-04</b></div>' +
            '<div class="ratingTaskName"><span>Task Name</span><b id="ratingTaskName">Design a Logo</b></div>' +
            '</div>' +
            '<div id="ratingStars" class="ratingStars" aria-label="Rating stars">' +
            '<button type="button" data-rating="1">★</button>' +
            '<button type="button" data-rating="2">★</button>' +
            '<button type="button" data-rating="3">★</button>' +
            '<button type="button" data-rating="4">★</button>' +
            '<button type="button" data-rating="5">★</button>' +
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
    notification.read = false;
    notification.createdAt = getNotificationDateText();
    notifications.push(notification);
    saveNotifications(notifications);
    refreshMailbox();
    openPendingTaskCompletionNotification();
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
        if (notifications[i].toRole == userRole && shouldShowNotificationInMailbox(notifications[i])) {
            roleNotifications.push(notifications[i]);
        }
    }

    return roleNotifications;
}

function shouldShowNotificationInMailbox(notification) {
    return notification.type == "payment-success";
}

function refreshMailbox() {
    updateMailBadge();
    renderMailList();
}

function openPendingTaskCompletionNotification() {
    var notifications = getNotifications();
    var pendingNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].toRole == userRole && notifications[i].type == "task-completion" && notifications[i].resolved != true) {
            notifications[i].read = true;
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
        if (notifications[i].read == false) {
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

        if (notifications[i].read == false) {
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
        '<small>' + notification.createdAt + '</small>' +
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
            notifications[i].read = true;
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
    document.getElementById("taskCompletionMessage").innerHTML = '<b>' + notification.taskTitle + '</b> has been marked as finished.';
    document.getElementById("messageModalOverlay").style.display = "block";
    document.getElementById("taskCompletionModal").style.display = "block";
}

function closeTaskCompletionModal() {
    document.getElementById("messageModalOverlay").style.display = "none";
    document.getElementById("taskCompletionModal").style.display = "none";
    selectedNotificationId = null;
}

function resolveTaskCompletion(decisionText) {
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

    if (decisionText == "approved" && selectedNotification != null) {
        addPaymentSuccessNotification(selectedNotification);
    }

    closeTaskCompletionModal();

    if (decisionText == "approved" && selectedNotification != null) {
        openRatingModal(selectedNotification);
    }

    refreshMailbox();
}

function addPaymentSuccessNotification(taskCompletionNotification) {
    addNotification({
        toRole: "Requester",
        type: "payment-success",
        taskId: taskCompletionNotification.taskId,
        taskTitle: taskCompletionNotification.taskTitle,
        title: "Payment successful",
        message: "The payment for " + taskCompletionNotification.taskTitle + " has been successfully transferred. A confirmation has been sent to your email."
    });

    addNotification({
        toRole: "Performer",
        type: "payment-success",
        taskId: taskCompletionNotification.taskId,
        taskTitle: taskCompletionNotification.taskTitle,
        title: "Payment received",
        message: "The payment for " + taskCompletionNotification.taskTitle + " has been successfully transferred to you. A confirmation has been sent to your email."
    });
}

function getSavedRatings() {
    var savedRatings = localStorage.getItem("performerRatings");

    if (savedRatings == null || savedRatings == "") {
        return [];
    }

    return JSON.parse(savedRatings);
}

function savePerformerRating(rating) {
    var ratings = getSavedRatings();
    ratings.push(rating);
    localStorage.setItem("performerRatings", JSON.stringify(ratings));
}

function openRatingModal(notification) {
    selectedRatingNotification = notification;
    selectedRatingValue = 0;

    document.getElementById("ratingPerformerName").innerHTML = notification.performerName || "John Designer";
    document.getElementById("ratingDate").innerHTML = getNotificationDateText();
    document.getElementById("ratingTaskName").innerHTML = notification.taskTitle;
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

function submitRating() {
    if (selectedRatingNotification == null || selectedRatingValue == 0) {
        return;
    }

    savePerformerRating({
        taskId: selectedRatingNotification.taskId,
        taskTitle: selectedRatingNotification.taskTitle,
        performerName: selectedRatingNotification.performerName || "John Designer",
        rating: selectedRatingValue,
        feedback: document.getElementById("ratingFeedback").value,
        createdAt: getNotificationDateText()
    });

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

    if (selectedNotification == null) {
        return;
    }

    var receiptText = "OTES Payment Receipt\n" +
        "Task: " + selectedNotification.taskTitle + "\n" +
        "Status: Payment transferred\n" +
        "Date: " + selectedNotification.createdAt + "\n";
    var receiptFile = new Blob([receiptText], { type: "text/plain" });
    var receiptLink = document.createElement("a");

    receiptLink.href = URL.createObjectURL(receiptFile);
    receiptLink.download = "receipt-" + selectedNotification.taskId + ".txt";
    receiptLink.click();
    URL.revokeObjectURL(receiptLink.href);
}

function connectMailboxActions() {
    var mailButton = document.getElementById("mailButton");
    var closeMailButton = document.getElementById("closeMailDrawer");
    var mailOverlay = document.getElementById("mailOverlay");
    var approveButton = document.getElementById("approveCompletionButton");
    var rejectButton = document.getElementById("rejectCompletionButton");
    var submitRatingButton = document.getElementById("submitRatingButton");
    var starButtons = document.querySelectorAll("#ratingStars button");

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
    setTimeout(function () {
        ensureNotificationLayout();
        connectMailboxActions();
        refreshMailbox();
        openPendingTaskCompletionNotification();
    }, 200);
});
