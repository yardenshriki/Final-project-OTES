//yarden shriki, lior zahavi
var performerTasks = [];
var sortNewestFirst = true;

function loadPerformerTasks() {
    fetch("data/tasks.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (tasks) {
            performerTasks = applyLocalTaskAssignments(tasks.concat(getLocalCreatedTasks()));
            renderPerformerActiveTasks();
            renderPerformerAvailableTasks();
            connectPerformerActions();
        });
}

function connectPerformerActions() {
    var searchInput = document.getElementById("performerSearchInput");
    var sortButton = document.getElementById("sortDateButton");

    if (searchInput != null) {
        searchInput.oninput = renderPerformerAvailableTasks;
    }

    if (sortButton != null) {
        sortButton.onclick = function () {
            sortNewestFirst = !sortNewestFirst;

            if (sortNewestFirst == true) {
                sortButton.innerHTML = "&#8593;";
                sortButton.title = "Newest tasks first";
            } else {
                sortButton.innerHTML = "&#8595;";
                sortButton.title = "Oldest tasks first";
            }

            renderPerformerAvailableTasks();
        };
    }
}

function renderPerformerActiveTasks() {
    var activeTasksList = document.getElementById("performerActiveTasks");

    if (activeTasksList == null) {
        return;
    }

    activeTasksList.innerHTML = "";

    for (var i = 0; i < performerTasks.length; i++) {
        if (performerTasks[i].assignedToPerformer == true && performerTasks[i].state != "completed") {
            activeTasksList.innerHTML += createPerformerTaskCard(performerTasks[i], "View");
        }
    }
}

function renderPerformerAvailableTasks() {
    var availableTasksList = document.getElementById("performerAvailableTasks");
    var searchInput = document.getElementById("performerSearchInput");

    if (availableTasksList == null) {
        return;
    }

    var searchText = "";

    if (searchInput != null) {
        searchText = searchInput.value.toLowerCase();
    }

    var availableTasks = performerTasks.filter(function (task) {
        var matchesState = task.state == "open" && task.assignedToPerformer == false;
        var matchesSearch = task.taskTitle.toLowerCase().indexOf(searchText) != -1 || task.description.toLowerCase().indexOf(searchText) != -1;

        return matchesState && matchesSearch;
    });

    availableTasks.sort(function (firstTask, secondTask) {
        var firstDate = new Date(firstTask.creationDate);
        var secondDate = new Date(secondTask.creationDate);

        if (sortNewestFirst == true) {
            return secondDate - firstDate;
        }

        return firstDate - secondDate;
    });

    availableTasksList.innerHTML = "";

    for (var i = 0; i < availableTasks.length; i++) {
        availableTasksList.innerHTML += createPerformerAvailableTaskCard(availableTasks[i]);
    }
}

function createPerformerTaskCard(task, buttonText) {
    return '<div class="taskItem fullTask">' +
        '<span class="' + getPerformerStatusClass(task.state) + ' statusTop">' + task.state + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p>' + task.description + '</p>' +
        '<p>Location: ' + task.location + '</p>' +
        '<p>Created: ' + task.creationDate + '</p>' +
        '<p>Payment: <b>$' + task.payment + '</b></p>' +
        '<input type="button" value="' + buttonText + '" onclick="openPerformerTask(' + task.id + ', false)">' +
        '</div>';
}

function createPerformerAvailableTaskCard(task) {
    return '<div class="taskItem performerAvailableCard">' +
        '<span class="difficultyBadge">' + task.difficultyLevel + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p class="taskDescription">' + task.description + '</p>' +
        '<div class="taskMeta"><span>Category:</span><b>' + task.categories + '</b></div>' +
        '<div class="taskMeta"><span>Payment:</span><b>$' + task.payment + '</b></div>' +
        '<div class="taskMeta"><span>Created:</span><b>' + task.creationDate + '</b></div>' +
        '<div class="taskMeta"><span>Location:</span><b>' + task.location + '</b></div>' +
        '<input type="button" value="View Details" onclick="openPerformerTask(' + task.id + ', true)">' +
        '</div>';
}

function openPerformerTask(taskId, isAvailableTask) {
    localStorage.setItem("userRole", "Performer");

    if (isAvailableTask == true) {
        window.location.href = "task.html?id=" + taskId + "&mode=take";
    } else {
        window.location.href = "task.html?id=" + taskId;
    }
}

function getPerformerStatusText(state) {
    if (state == "open") {
        return "Available";
    }

    if (state == "in-progress") {
        return "Working";
    }

    if (state == "completed") {
        return "Completed";
    }

    return state;
}

function getPerformerStatusClass(state) {
    if (state == "open") {
        return "statusOpen";
    }

    if (state == "completed") {
        return "statusDone";
    }

    return "statusProgress";
}

document.addEventListener("DOMContentLoaded", loadPerformerTasks);

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
