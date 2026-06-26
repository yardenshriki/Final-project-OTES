//yarden shriki, lior zahavi
var ratingsApiUrl = "http://localhost:5000/api/rating";
var selectedRatingNotification = null;
var selectedRatingValue = 0;

function ensureRatingLayout() {
    if (document.getElementById("messageModalOverlay") == null) {
        document.body.insertAdjacentHTML("beforeend", '<div id="messageModalOverlay" class="messageModalOverlay"></div>');
    }

    if (document.getElementById("ratingModal") == null) {
        document.body.insertAdjacentHTML("beforeend",
            '<section id="ratingModal" class="ratingModal">' +
            '<div class="ratingIcon">&#9733;</div>' +
            '<h2>Rate the Performer</h2>' +
            '<div class="ratingSummary">' +
            '<div><span>Performer</span><b id="ratingPerformerName">John Designer</b></div>' +
            '<div><span>Date</span><b id="ratingDate">2026-02-04</b></div>' +
            '<div class="ratingTaskName"><span>Task Name</span><b id="ratingTaskName">Design a Logo</b></div>' +
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

function getRatingRequesterId(notification) {
    return notification.requester_id || notification.requesterId || getCurrentUserId(1);
}

function getRatingPerformerId(notification) {
    return notification.performer_id || notification.performerId || null;
}

async function createRatingOnServer(ratingData) {
    var response = await fetch(ratingsApiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ratingData),
    });
    var data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Failed to create rating");
    }

    return data;
}

function openRatingModal(notification) {
    ensureRatingLayout();
    connectRatingActions();

    selectedRatingNotification = notification;
    selectedRatingValue = 0;

    document.getElementById("ratingPerformerName").innerHTML = notification.performer_name || "John Designer";
    document.getElementById("ratingDate").innerHTML = getNotificationDateText();
    document.getElementById("ratingTaskName").innerHTML = notification.task_title;
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

    var ratingData = {
        task_id: selectedRatingNotification.task_id,
        requester_id: getRatingRequesterId(selectedRatingNotification),
        performer_id: getRatingPerformerId(selectedRatingNotification),
        rating: selectedRatingValue,
        feedback: document.getElementById("ratingFeedback").value,
    };

    if (!ratingData.task_id || !ratingData.requester_id || !ratingData.performer_id) {
        console.log("Missing rating details");
        return;
    }

    try {
        await createRatingOnServer(ratingData);
        closeRatingModal();
    } catch (error) {
        console.log(error.message);
    }
}

function connectRatingActions() {
    var submitRatingButton = document.getElementById("submitRatingButton");
    var starButtons = document.querySelectorAll("#ratingStars button");

    for (var i = 0; i < starButtons.length; i++) {
        starButtons[i].onclick = function () {
            chooseRating(parseInt(this.getAttribute("data-rating")));
        };
    }

    if (submitRatingButton != null) {
        submitRatingButton.onclick = submitRating;
    }
}

function initializeRatingsPage() {
    ensureRatingLayout();
    connectRatingActions();
}

var previousRatingsOnload = window.onload;
window.onload = function () {
    if (typeof previousRatingsOnload == "function") {
        previousRatingsOnload();
    }

    initializeRatingsPage();
};
