var requesterTasks = [];
var selectedTaskState = "all";

function loadRequesterTasks() {
    fetch("data/requesterTasks.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (tasks) {
            requesterTasks = tasks;
            renderRequesterTasks(requesterTasks);
            renderMyTasks(requesterTasks);
            renderProfileTaskHistory(requesterTasks);
            updateProfileStats(requesterTasks);
            updateRequesterStats(requesterTasks);
            connectRequesterFilters();
        });
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
        '<input type="button" value="View">' +
        '</div>';
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

    if (!isDigits(taskPayment)) {
        showMessage("taskMessage", "Payment must contain numbers only");
        return false;
    }

    showScreen("taskSuccessScreen");
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
    showScreen("profileScreen");
    return false;
}
