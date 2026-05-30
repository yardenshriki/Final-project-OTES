var performerTasks = [];
var sortNewestFirst = true;

function loadPerformerTasks() {
    fetch("data/tasks.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (tasks) {
            performerTasks = tasks;
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
                sortButton.innerHTML = "↑";
            } else {
                sortButton.innerHTML = "↓";
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
            activeTasksList.innerHTML += createPerformerTaskCard(performerTasks[i], "Open");
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
        availableTasksList.innerHTML += createPerformerTaskCard(availableTasks[i], "View");
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
        '<span class="' + getPerformerStatusClass(task.state) + '">' + task.workStatus + '</span>' +
        '<input type="button" value="' + buttonText + '">' +
        '</div>';
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
