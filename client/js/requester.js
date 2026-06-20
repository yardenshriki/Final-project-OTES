//yarden shriki, lior zahavi
var requesterTasks = [];
var selectedTaskState = "all";

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
            requesterTasks = tasks.concat(getLocalCreatedTasks());
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

function getLocalCreatedTasks() {
    var savedTasks = localStorage.getItem("createdTasks");

    if (savedTasks == null || savedTasks == "") {
        return [];
    }

    return JSON.parse(savedTasks);
}

function saveLocalCreatedTask(task) {
    var localTasks = getLocalCreatedTasks();
    localTasks.push(task);
    localStorage.setItem("createdTasks", JSON.stringify(localTasks));
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
        difficultyLevel: document.getElementById("difficultyLevel").value,
        payment: parseFloat(document.getElementById("taskPayment").value),
        additionalDetails: document.getElementById("additionalDetails").value,
        categories: "General",
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

function checkReport() {
    var reportType = document.getElementById("reportType").value;
    var reportName = document.getElementById("reportName").value;
    var reportEmail = document.getElementById("reportEmail").value;
    var reportDescription = document.getElementById("reportDescription").value;

    clearMessage("reportMessage");

    if (reportType == "" || reportName == "" || reportEmail == "" || reportDescription == "") {
        showMessage("reportMessage", "Please fill all fields");
        return false;
    }

    if (reportEmail.indexOf("@") == -1 || reportEmail.indexOf(".") == -1) {
        showMessage("reportMessage", "Please enter a valid email");
        return false;
    }

    showMessage("reportMessage", "Report submitted successfully");
    return false;
}

function checkPayment() {
    /* showScreen("profileScreen"); */
    return false;
}

