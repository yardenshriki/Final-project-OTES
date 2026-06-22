//yarden shriki, lior zahavi
var requesterTasks = [];
var selectedTaskState = "all";
var taskProgressSteps = [
    "Task accepted",
    "On my way",
    "Task in progress",
    "Finalizing the task",
    "Task completed"
];
var performerCancelWindowMinutes = 5;

function scrollToAllTasks() {
    closeMenu();
    showScreen("requesterHomeScreen");

    document.getElementById("allTasksSection").scrollIntoView({
        behavior: "smooth"
    });
}

function loadRequesterTasks() {
    fetch("data/tasks.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (tasks) {
            requesterTasks = applyLocalTaskAssignments(tasks.concat(getLocalCreatedTasks()));
            renderCategoryOptions(requesterTasks);
            renderRequesterTasks(requesterTasks);
            renderTaskPage();
            renderMyTasks(requesterTasks);
            renderProfileTaskHistory(requesterTasks);
            updateProfileStats(requesterTasks);
            updateRequesterStats(requesterTasks);
            connectRequesterFilters();
        });
}

function renderCategoryOptions(tasks) {
    var categorySelect = document.getElementById("categoryFilter");

    if (categorySelect == null) {
        return;
    }

    categorySelect.innerHTML = "<option>All Categories</option>";

    for (var i = 0; i < tasks.length; i++) {
        if (categoryExists(tasks[i].categories, categorySelect) == false) {
            categorySelect.innerHTML += "<option>" + tasks[i].categories + "</option>";
        }
    }
}

function categoryExists(categoryName, categorySelect) {
    for (var i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value == categoryName) {
            return true;
        }
    }

    return false;
}

function connectRequesterFilters() {
    var searchInput = document.getElementById("taskSearch");
    var categorySelect = document.getElementById("categoryFilter");
    var statButtons = document.getElementsByClassName("statBox");

    if (searchInput != null) {
        searchInput.oninput = filterRequesterTasks;
    }

    if (categorySelect != null) {
        categorySelect.onchange = filterRequesterTasks;
    }

    for (var i = 0; i < statButtons.length; i++) {
        statButtons[i].onclick = function () {
            selectedTaskState = this.getAttribute("data-state");
            markActiveStat(this);
            filterRequesterTasks();
        };
    }
}

function filterRequesterTasks() {
    var searchText = document.getElementById("taskSearch").value.toLowerCase();
    var category = document.getElementById("categoryFilter").value;

    var filteredTasks = requesterTasks.filter(function (task) {
        var matchesSearch = task.taskTitle.toLowerCase().indexOf(searchText) != -1 || task.description.toLowerCase().indexOf(searchText) != -1;
        var matchesCategory = category == "All Categories" || task.categories == category;
        var matchesState = selectedTaskState == "all" || task.state == selectedTaskState;

        return matchesSearch && matchesCategory && matchesState;
    });

    renderRequesterTasks(filteredTasks);
}

function markActiveStat(activeButton) {
    var statButtons = document.getElementsByClassName("statBox");

    for (var i = 0; i < statButtons.length; i++) {
        statButtons[i].className = "statBox";
    }

    activeButton.className = "statBox activeStat";
}

function renderRequesterTasks(tasks) {
    var taskList = document.getElementById("requesterTaskList");

    if (taskList == null) {
        return;
    }

    taskList.innerHTML = "";

    for (var i = 0; i < tasks.length; i++) {
        taskList.innerHTML += createTaskCard(tasks[i]);
    }
}

function createTaskCard(task) {
    return '<div class="taskItem">' +
        '<span class="' + getStatusClass(task.state) + ' statusTop">' + task.state + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p>' + task.description + '</p>' +
        '<p>Category: ' + task.categories + '</p>' +
        '<p>Location: ' + task.location + '</p>' +
        '<p>Difficulty: ' + task.difficultyLevel + '</p>' +
        '<p>Payment: <b>$' + task.payment + '</b></p>' +
        '<input type="button" value="View" onclick="window.location.href=\'task.html?id=' + task.id + '\'">' +
        '</div>';
}

function getTaskIdFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
}

function renderTaskPage() {
    if (document.getElementById("taskDetailsTitle") == null) {
        return;
    }

    var taskId = getTaskIdFromUrl();
    var selectedTask = findTaskById(taskId);

    if (selectedTask == null) {
        document.getElementById("taskDetailsTitle").innerHTML = "Task not found";
        document.getElementById("taskDetailsDescription").innerHTML = "The selected task could not be found.";
        return;
    }

    document.getElementById("taskDetailsTitle").innerHTML = selectedTask.taskTitle;
    document.getElementById("taskDetailsStatus").innerHTML = selectedTask.state;
    document.getElementById("taskDetailsStatus").className = getStatusClass(selectedTask.state);
    document.getElementById("taskDetailsPosted").innerHTML = "Posted on " + selectedTask.creationDate;
    document.getElementById("taskDetailsDescription").innerHTML = selectedTask.description + "<br><br>" + selectedTask.additionalDetails;
    document.getElementById("taskDetailsPayment").innerHTML = "$" + selectedTask.payment;
    document.getElementById("taskDetailsDeadline").innerHTML = selectedTask.deadline || "Not set";
    document.getElementById("taskDetailsCategory").innerHTML = selectedTask.categories;
    document.getElementById("taskDetailsDifficulty").innerHTML = selectedTask.difficultyLevel;
    document.getElementById("taskDetailsPostedDate").innerHTML = selectedTask.creationDate;
    connectTakeTaskButton(selectedTask);
    connectNextStepButton(selectedTask);
    connectCancelTaskButton(selectedTask);
    renderPerformerProgress(selectedTask);
    updateTaskPageByRole(selectedTask);
}

function getTaskProgressIndex(workStatus) {
    for (var i = 0; i < taskProgressSteps.length; i++) {
        if (taskProgressSteps[i] == workStatus) {
            return i;
        }
    }

    return 0;
}

function renderPerformerProgress(selectedTask) {
    var progressTrack = document.getElementById("performerProgressTrack");
    var nextStepButton = document.getElementById("performerNextStepButton");

    if (progressTrack == null || nextStepButton == null) {
        return;
    }

    var currentStepIndex = getTaskProgressIndex(selectedTask.workStatus);
    progressTrack.innerHTML = "";

    for (var i = 0; i < taskProgressSteps.length; i++) {
        var stepClass = "progressStep";
        var stepMark = "";

        if (i <= currentStepIndex) {
            stepClass += " completedStep";
            stepMark = "ג“";
        }

        progressTrack.innerHTML += '<div class="' + stepClass + '">' +
            '<span>' + stepMark + '</span>' +
            '<b>' + taskProgressSteps[i] + '</b>' +
            '</div>';
    }

    if (currentStepIndex >= taskProgressSteps.length - 1) {
        nextStepButton.innerHTML = "Task completed";
        nextStepButton.disabled = true;
    } else {
        nextStepButton.innerHTML = taskProgressSteps[currentStepIndex + 1];
        nextStepButton.disabled = false;
    }
}

function connectNextStepButton(selectedTask) {
    var nextStepButton = document.getElementById("performerNextStepButton");

    if (nextStepButton == null) {
        return;
    }

    nextStepButton.onclick = function () {
        var currentStepIndex = getTaskProgressIndex(selectedTask.workStatus);

        if (currentStepIndex >= taskProgressSteps.length - 1) {
            return;
        }

        selectedTask.workStatus = taskProgressSteps[currentStepIndex + 1];
        saveLocalTaskWorkStatus(selectedTask.id, selectedTask.workStatus);
        updateTaskStateByWorkStatus(selectedTask);
        ensureTaskChatParticipants(selectedTask);

        if (typeof addTaskChatSystemMessage == "function") {
            addTaskChatSystemMessage(selectedTask, "Performer finished the step of: " + selectedTask.workStatus);
        }

        if (selectedTask.workStatus == "Task completed") {
            createTaskCompletionNotification(selectedTask);
        }

        document.getElementById("taskDetailsStatus").innerHTML = selectedTask.state;
        document.getElementById("taskDetailsStatus").className = getStatusClass(selectedTask.state);
        renderPerformerProgress(selectedTask);
        updateTaskPageByRole(selectedTask);
    };
}

function createTaskCompletionNotification(selectedTask) {
    if (typeof addNotification != "function") {
        return;
    }

    addNotification({
        toRole: "Requester",
        type: "task-completion",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        performerName: selectedTask.performerName || "John Designer",
        title: "Task completion",
        message: selectedTask.taskTitle + " has been marked as finished."
    });
}

function updateTaskPageByRole(selectedTask) {
    var performerItems = document.getElementsByClassName("performerOnly");
    var activeItems = document.getElementsByClassName("performerActiveOnly");
    var availableItems = document.getElementsByClassName("performerAvailableOnly");
    var requesterItems = document.getElementsByClassName("requesterOnly");
    var isPerformerTaskPage = userRole == "Performer";
    var isTakenTask = selectedTask.assignedToPerformer == true;
    var hasChatParticipants = taskHasChatParticipants(selectedTask);

    for (var i = 0; i < performerItems.length; i++) {
        if (isPerformerTaskPage) {
            performerItems[i].style.display = getTaskElementDisplay(performerItems[i]);
        } else {
            performerItems[i].style.display = "none";
        }
    }

    for (var j = 0; j < activeItems.length; j++) {
        activeItems[j].style.display = isPerformerTaskPage && isTakenTask ? getTaskElementDisplay(activeItems[j]) : "none";
    }

    for (var k = 0; k < availableItems.length; k++) {
        availableItems[k].style.display = isPerformerTaskPage && isTakenTask == false ? getTaskElementDisplay(availableItems[k]) : "none";
    }

    for (var m = 0; m < requesterItems.length; m++) {
        if (requesterItems[m].className.indexOf("communicationPanel") != -1) {
            requesterItems[m].style.display = hasChatParticipants ? getTaskElementDisplay(requesterItems[m]) : "none";
        } else if (requesterItems[m].className.indexOf("cancelTaskPanel") != -1) {
            requesterItems[m].style.display = userRole != "Performer" && canRequesterCancelTask(selectedTask) ? "flex" : "none";
        } else {
            requesterItems[m].style.display = isPerformerTaskPage && isTakenTask == false ? "none" : "flex";
        }
    }

    updatePerformerCancelTaskPanel(selectedTask);
}

function canRequesterCancelTask(task) {
    return task != null &&
        task.state == "open" &&
        task.assignedToPerformer != true &&
        task.workStatus == "Available" &&
        isTaskTakenByPerformer(task.id) == false &&
        isTaskCancelled(task.id) == false;
}

function connectCancelTaskButton(selectedTask) {
    var cancelTaskButton = document.getElementById("cancelTaskButton");
    var confirmCancelTaskButton = document.getElementById("confirmCancelTaskButton");
    var keepTaskButton = document.getElementById("keepTaskButton");
    var cancelTaskOverlay = document.getElementById("cancelTaskOverlay");

    if (cancelTaskButton != null) {
        cancelTaskButton.onclick = function () {
            openCancelTaskModal(selectedTask);
        };
    }

    if (confirmCancelTaskButton != null) {
        confirmCancelTaskButton.onclick = function () {
            if (document.getElementById("cancelTaskModal").getAttribute("data-cancel-mode") == "performer") {
                confirmPerformerTaskCancellation(selectedTask);
            } else {
                confirmCancelTask(selectedTask);
            }
        };
    }

    if (keepTaskButton != null) {
        keepTaskButton.onclick = closeCancelTaskModal;
    }

    if (cancelTaskOverlay != null) {
        cancelTaskOverlay.onclick = closeCancelTaskModal;
    }
}

function openCancelTaskModal(selectedTask) {
    if (canRequesterCancelTask(selectedTask) == false) {
        return;
    }

    document.getElementById("cancelTaskModalTitle").innerHTML = "Cancel Task";
    document.getElementById("cancelTaskModal").setAttribute("data-cancel-mode", "requester");
    document.getElementById("cancelTaskTitle").innerHTML = selectedTask.taskTitle;
    document.getElementById("cancelTaskLocation").innerHTML = selectedTask.location;
    document.getElementById("cancelTaskPayment").innerHTML = "$" + selectedTask.payment;
    document.getElementById("cancelTaskStatus").innerHTML = selectedTask.state;
    document.getElementById("confirmCancelTaskButton").innerHTML = "Yes, cancel task";
    document.getElementById("keepTaskButton").innerHTML = "No, keep task";
    document.getElementById("cancelTaskOverlay").style.display = "block";
    document.getElementById("cancelTaskModal").style.display = "block";
}

function closeCancelTaskModal() {
    var cancelTaskOverlay = document.getElementById("cancelTaskOverlay");
    var cancelTaskModal = document.getElementById("cancelTaskModal");

    if (cancelTaskOverlay != null) {
        cancelTaskOverlay.style.display = "none";
    }

    if (cancelTaskModal != null) {
        cancelTaskModal.style.display = "none";
    }
}

function confirmCancelTask(selectedTask) {
    if (canRequesterCancelTask(selectedTask) == false) {
        closeCancelTaskModal();
        return;
    }

    cancelLocalTask(selectedTask.id);
    selectedTask.state = "cancelled";
    selectedTask.workStatus = "Cancelled";
    selectedTask.assignedToPerformer = false;
    createTaskCancelledNotification(selectedTask);
    closeCancelTaskModal();

    document.getElementById("taskDetailsStatus").innerHTML = selectedTask.state;
    document.getElementById("taskDetailsStatus").className = getStatusClass(selectedTask.state);
    updateTaskPageByRole(selectedTask);
}

function createTaskCancelledNotification(selectedTask) {
    if (typeof addNotification != "function") {
        return;
    }

    addNotification({
        toRole: "Requester",
        type: "task-cancelled",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        title: "Task cancelled",
        message: "Your task " + selectedTask.taskTitle + " was cancelled successfully and is no longer available for performers."
    });
}

function canPerformerCancelAcceptedTask(task) {
    if (task == null || userRole != "Performer" || task.assignedToPerformer != true || task.state != "in-progress") {
        return false;
    }

    var acceptedAt = getTaskAcceptedAt(task.id) || task.acceptedAt;

    if (acceptedAt == null || acceptedAt == "") {
        return false;
    }

    return getAcceptedTaskMinutesLeft(acceptedAt) > 0;
}

function getAcceptedTaskMinutesLeft(acceptedAt) {
    var acceptedTime = new Date(acceptedAt).getTime();

    if (isNaN(acceptedTime)) {
        return 0;
    }

    var deadlineTime = acceptedTime + performerCancelWindowMinutes * 60 * 1000;
    var millisecondsLeft = deadlineTime - new Date().getTime();

    if (millisecondsLeft <= 0) {
        return 0;
    }

    return Math.ceil(millisecondsLeft / 60000);
}

function updatePerformerCancelTaskPanel(selectedTask) {
    var performerCancelTaskPanel = document.getElementById("performerCancelTaskPanel");
    var performerCancelTaskText = document.getElementById("performerCancelTaskText");

    if (performerCancelTaskPanel == null || performerCancelTaskText == null) {
        return;
    }

    if (canPerformerCancelAcceptedTask(selectedTask)) {
        performerCancelTaskPanel.style.display = "flex";
        performerCancelTaskText.innerHTML = "You have " + getAcceptedTaskMinutesLeft(getTaskAcceptedAt(selectedTask.id) || selectedTask.acceptedAt) + " minute(s) left to cancel this task.";
    } else {
        performerCancelTaskPanel.style.display = "none";
    }
}

function openPerformerCancelTaskModal(selectedTask) {
    if (canPerformerCancelAcceptedTask(selectedTask) == false) {
        return;
    }

    document.getElementById("cancelTaskModalTitle").innerHTML = "Cancel Accepted Task";
    document.getElementById("cancelTaskModal").setAttribute("data-cancel-mode", "performer");
    document.getElementById("cancelTaskTitle").innerHTML = selectedTask.taskTitle;
    document.getElementById("cancelTaskLocation").innerHTML = selectedTask.location;
    document.getElementById("cancelTaskPayment").innerHTML = "$" + selectedTask.payment;
    document.getElementById("cancelTaskStatus").innerHTML = selectedTask.state;
    document.getElementById("confirmCancelTaskButton").innerHTML = "Yes, cancel acceptance";
    document.getElementById("keepTaskButton").innerHTML = "No, keep task";
    document.getElementById("cancelTaskOverlay").style.display = "block";
    document.getElementById("cancelTaskModal").style.display = "block";
}

function confirmPerformerTaskCancellation(selectedTask) {
    if (canPerformerCancelAcceptedTask(selectedTask) == false) {
        closeCancelTaskModal();
        return;
    }

    createPerformerCancelledNotifications(selectedTask);
    cancelTakenTaskByPerformer(selectedTask.id);
    selectedTask.state = "open";
    selectedTask.workStatus = "Available";
    selectedTask.assignedToPerformer = false;
    selectedTask.performerName = "";
    selectedTask.acceptedAt = "";
    closeCancelTaskModal();
    window.location.href = "performer.html";
}

function createPerformerCancelledNotifications(selectedTask) {
    if (typeof addNotification != "function") {
        return;
    }

    var performerName = selectedTask.performerName || "John Designer";

    addNotification({
        toRole: "Requester",
        type: "performer-task-cancelled",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        performerName: performerName,
        title: "Task acceptance cancelled",
        message: performerName + " cancelled the accepted task " + selectedTask.taskTitle + ". The task is available again."
    });

    addNotification({
        toRole: "Performer",
        type: "performer-task-cancelled",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        title: "Task cancellation confirmed",
        message: "You cancelled " + selectedTask.taskTitle + " within the allowed 5 minute window."
    });
}

function taskHasChatParticipants(task) {
    return task.requesterName != null &&
        task.requesterName != "" &&
        task.performerName != null &&
        task.performerName != "";
}

function ensureTaskChatParticipants(task) {
    if (task.assignedToPerformer != true) {
        return;
    }

    if (task.requesterName == null || task.requesterName == "") {
        task.requesterName = "Sarah Johnson";
    }

    if (task.performerName == null || task.performerName == "") {
        task.performerName = "John Designer";
    }

    saveLocalTaskParticipants(task.id, task.requesterName, task.performerName);
}

function getTaskElementDisplay(element) {
    if (element.className.indexOf("performerProgressPanel") != -1) {
        return "grid";
    }

    if (element.className.indexOf("communicationPanel") != -1) {
        return "flex";
    }

    return "block";
}

function connectTakeTaskButton(selectedTask) {
    var takeTaskButton = document.getElementById("performerTakeTaskButton");
    var taskChatButton = document.getElementById("taskChatButton");
    var performerCancelTaskButton = document.getElementById("performerCancelTaskButton");
    var acceptedTaskOkButton = document.getElementById("acceptedTaskOkButton");

    if (taskChatButton != null) {
        taskChatButton.onclick = function () {
            if (taskHasChatParticipants(selectedTask) && typeof openCurrentTaskChat == "function") {
                openCurrentTaskChat(selectedTask);
            }
        };
    }

    if (takeTaskButton == null) {
        return;
    }

    if (performerCancelTaskButton != null) {
        performerCancelTaskButton.onclick = function () {
            openPerformerCancelTaskModal(selectedTask);
        };
    }

    if (acceptedTaskOkButton != null) {
        acceptedTaskOkButton.onclick = function () {
            window.location.href = "performer.html";
        };
    }

    takeTaskButton.onclick = function () {
        var performerName = selectedTask.performerName || "John Designer";
        var requesterName = selectedTask.requesterName || "Sarah Johnson";

        takeLocalTask(selectedTask.id, requesterName, performerName);
        selectedTask.assignedToPerformer = true;
        selectedTask.requesterName = requesterName;
        selectedTask.performerName = performerName;
        selectedTask.acceptedAt = getTaskAcceptedAt(selectedTask.id);
        saveLocalTaskParticipants(selectedTask.id, selectedTask.requesterName, selectedTask.performerName);
        selectedTask.workStatus = "Task accepted";
        updateTaskStateByWorkStatus(selectedTask);
        createTaskAcceptedNotifications(selectedTask);

        if (typeof createTaskChat == "function") {
            createTaskChat(selectedTask);
        }

        localStorage.setItem("userRole", "Performer");
        openPerformerAcceptedTaskModal(selectedTask);
    };
}

function createTaskAcceptedNotifications(selectedTask) {
    if (typeof addNotification != "function") {
        return;
    }

    var performerName = selectedTask.performerName || "John Designer";

    addNotification({
        toRole: "Requester",
        type: "task-accepted",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        performerName: performerName,
        title: "Task accepted",
        message: performerName + " accepted your task " + selectedTask.taskTitle + " and confirmed responsibility for it."
    });

    addNotification({
        toRole: "Performer",
        type: "performer-task-responsibility",
        taskId: selectedTask.id,
        taskTitle: selectedTask.taskTitle,
        title: "Task responsibility",
        message: "You accepted " + selectedTask.taskTitle + ". Contact the requester in the chat for any additional task details."
    });
}

function openPerformerAcceptedTaskModal(selectedTask) {
    if (document.getElementById("performerAcceptedTaskMessage") == null) {
        window.location.href = "performer.html";
        return;
    }

    document.getElementById("performerAcceptedTaskMessage").innerHTML =
        "<b>" + selectedTask.taskTitle + "</b> is now your responsibility. Please contact the Requester through the chat for additional task details.";
    document.getElementById("performerAcceptedTaskOverlay").style.display = "block";
    document.getElementById("performerAcceptedTaskModal").style.display = "block";
}

function renderMyTasks(tasks) {
    var myTasksList = document.getElementById("myTasksList");

    if (myTasksList == null) {
        return;
    }

    myTasksList.innerHTML = "";

    for (var i = 0; i < tasks.length; i++) {
        myTasksList.innerHTML += '<div class="taskItem">' +
            '<h4>' + tasks[i].taskTitle + '</h4>' +
            '<p>Category: ' + tasks[i].categories + '</p>' +
            '<p>Location: ' + tasks[i].location + '</p>' +
            '<span class="' + getStatusClass(tasks[i].state) + '">Status: ' + tasks[i].state + '</span>' +
            '<input type="button" value="Open" onclick="window.location.href=\'task.html?id=' + tasks[i].id + '\'">' +
            '</div>';
    }
}

function openTaskDetails(taskId, shouldOpenScreen) {
    var selectedTask = findTaskById(taskId);

    if (selectedTask == null || document.getElementById("detailsTitle") == null) {
        return;
    }

    document.getElementById("detailsTitle").innerHTML = selectedTask.taskTitle;
    document.getElementById("detailsSubTitle").innerHTML = "Current task details";
    document.getElementById("detailsDescription").innerHTML = selectedTask.description;
    document.getElementById("detailsAdditional").innerHTML = selectedTask.additionalDetails;
    document.getElementById("detailsCategory").innerHTML = selectedTask.categories;
    document.getElementById("detailsLocation").innerHTML = selectedTask.location;
    document.getElementById("detailsDifficulty").innerHTML = selectedTask.difficultyLevel;
    document.getElementById("detailsState").innerHTML = selectedTask.state;
    document.getElementById("detailsState").className = getStatusClass(selectedTask.state);
    document.getElementById("detailsPayment").innerHTML = "$" + selectedTask.payment;
    document.getElementById("detailsSideCategory").innerHTML = selectedTask.categories;

    if (shouldOpenScreen == true) {
        showScreen("requesterTaskDetailsScreen");
    }
}

function findTaskById(taskId) {
    for (var i = 0; i < requesterTasks.length; i++) {
        if (requesterTasks[i].id == taskId) {
            return requesterTasks[i];
        }
    }

    return null;
}

function renderProfileTaskHistory(tasks) {
    var profileTaskHistory = document.getElementById("profileTaskHistory");

    if (profileTaskHistory == null) {
        return;
    }

    profileTaskHistory.innerHTML = "";

    for (var i = 0; i < tasks.length; i++) {
        profileTaskHistory.innerHTML += '<p>' + tasks[i].taskTitle + ' - ' + tasks[i].state + '</p>';
    }
}

function updateProfileStats(tasks) {
    if (document.getElementById("profileCompletedTasks") == null) {
        return;
    }

    var totalPayments = 0;

    for (var i = 0; i < tasks.length; i++) {
        totalPayments += tasks[i].payment;
    }

    document.getElementById("profileCompletedTasks").innerHTML = countTasksByState(tasks, "completed");
    document.getElementById("profileOpenTasks").innerHTML = countTasksByState(tasks, "open");
    document.getElementById("profileTotalPayments").innerHTML = totalPayments;
}

function getStatusClass(state) {
    if (state == "open") {
        return "statusOpen";
    }

    if (state == "cancelled") {
        return "statusCancelled";
    }

    if (state == "completed") {
        return "statusDone";
    }

    return "statusProgress";
}

function updateRequesterStats(tasks) {
    if (document.getElementById("totalTasks") == null) {
        return;
    }

    document.getElementById("totalTasks").innerHTML = tasks.length;
    document.getElementById("openTasks").innerHTML = countTasksByState(tasks, "open");
    document.getElementById("progressTasks").innerHTML = countTasksByState(tasks, "in-progress");
    document.getElementById("completedTasks").innerHTML = countTasksByState(tasks, "completed");
}

function countTasksByState(tasks, state) {
    var counter = 0;

    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].state == state) {
            counter++;
        }
    }

    return counter;
}

document.addEventListener("DOMContentLoaded", loadRequesterTasks);

function getPaymentNumber() {
    var taskPayment = document.getElementById("taskPayment");

    if (taskPayment == null) {
        return 0;
    }

    var paymentValue = parseFloat(taskPayment.value);

    if (isNaN(paymentValue) || paymentValue < 0) {
        return 0;
    }

    return paymentValue;
}

function formatPayment() {
    var taskPayment = document.getElementById("taskPayment");

    if (taskPayment == null) {
        return;
    }

    taskPayment.value = getPaymentNumber().toFixed(2);
}

function changePayment(changeAmount) {
    var taskPayment = document.getElementById("taskPayment");

    if (taskPayment == null) {
        return;
    }

    var newPayment = getPaymentNumber() + changeAmount;

    if (newPayment < 0) {
        newPayment = 0;
    }

    taskPayment.value = newPayment.toFixed(2);
}

function getTodayText() {
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

function createTaskFromForm() {
    return {
        id: Date.now(),
        taskTitle: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDescription").value,
        location: document.getElementById("taskLocation").value,
        placeId: document.getElementById("taskPlaceId").value,
        latitude: document.getElementById("taskLatitude").value,
        longitude: document.getElementById("taskLongitude").value,
        mapsUrl: document.getElementById("taskMapsUrl").value,
        difficultyLevel: document.getElementById("difficultyLevel").value,
        payment: parseFloat(document.getElementById("taskPayment").value),
        additionalDetails: document.getElementById("additionalDetails").value,
        categories: "General",
        requesterName: "Sarah Johnson",
        performerName: "",
        state: "open",
        assignedToPerformer: false,
        workStatus: "Available",
        creationDate: getTodayText()
    };
}

function checkTask() {
    var taskTitle = document.getElementById("taskTitle").value;
    var taskDescription = document.getElementById("taskDescription").value;
    var taskLocation = document.getElementById("taskLocation").value;
    var difficultyLevel = document.getElementById("difficultyLevel").value;
    var taskPayment = document.getElementById("taskPayment").value;

    clearMessage("taskMessage");

    if (taskTitle == "" || taskDescription == "" || taskLocation == "" || difficultyLevel == "" || taskPayment == "") {
        showMessage("taskMessage", "Please fill all fields");
        return false;
    }

    if (isNaN(parseFloat(taskPayment))) {
        showMessage("taskMessage", "Payment must contain a valid number");
        return false;
    }

    if (parseFloat(taskPayment) < 0) {
        showMessage("taskMessage", "Payment is too low");
        return false;
    }

    formatPayment();
    saveLocalCreatedTask(createTaskFromForm());
    window.location.href = "requester.html";
    return false;
}

function checkPayment() {
    /* showScreen("profileScreen"); */
    return false;
}


