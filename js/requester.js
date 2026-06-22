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
        } else {
            requesterItems[m].style.display = isPerformerTaskPage && isTakenTask == false ? "none" : "flex";
        }
    }
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

    takeTaskButton.onclick = function () {
        takeLocalTask(selectedTask.id);
        selectedTask.assignedToPerformer = true;
        selectedTask.requesterName = selectedTask.requesterName || "Sarah Johnson";
        selectedTask.performerName = selectedTask.performerName || "John Designer";
        saveLocalTaskParticipants(selectedTask.id, selectedTask.requesterName, selectedTask.performerName);
        selectedTask.workStatus = "Task accepted";
        updateTaskStateByWorkStatus(selectedTask);

        if (typeof createTaskChat == "function") {
            createTaskChat(selectedTask);
        }

        localStorage.setItem("userRole", "Performer");
        window.location.href = "performer.html";
    };
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
            '<input type="button" value="Open">' +
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


