//yarden shriki, lior zahavi
var requesterTasks = [];
var selectedTaskState = "all";
var tasksApiUrl = "http://localhost:5000/api/tasks";

function scrollToAllTasks() {
  closeMenu();
  showScreen("requesterHomeScreen");

  document.getElementById("allTasksSection").scrollIntoView({
    behavior: "smooth",
  });
}

function loadRequesterTasks() {
  fetch(tasksApiUrl)
    .then(function (response) {
      if (response.status === 200) {
        return response.json();
      }
      throw new Error("Failed to load requester tasks");
    })
    .then(function (tasksData) {
      requesterTasks = getCurrentRequesterTasks(tasksData);
      renderCategoryOptions(requesterTasks);
      renderRequesterTasks(requesterTasks);
      if (typeof renderTaskPage == "function") {
        renderTaskPage();
      }
      renderMyTasks(requesterTasks);
      renderProfileTaskHistory(requesterTasks);
      updateProfileStats(requesterTasks);
      updateRequesterStats(requesterTasks);
      connectRequesterFilters();
      if (typeof onChatTasksLoaded == "function") {
        onChatTasksLoaded();
      }
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

function getCurrentRequesterTasks(tasks) {
  var requesterId = getCurrentUserId(1);
  var currentRequesterTasks = [];

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].requester_id == requesterId) {
      currentRequesterTasks.push(tasks[i]);
    }
  }

  return currentRequesterTasks;
}

function parseServerResponse(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }

  throw new Error("Server request failed");
}

function createTaskOnServer(task) {
  return fetch(tasksApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  }).then(parseServerResponse);
}

function updateTaskOnServer(task) {
  task.deadline = formatServerDate(task.deadline);

  return fetch(tasksApiUrl + "/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  }).then(parseServerResponse);
}

function formatServerDate(dateValue) {
  if (dateValue == null || dateValue == "") {
    return null;
  }

  return String(dateValue).split("T")[0];
}

function getCurrentUserName(defaultRole) {
  var savedUsername = localStorage.getItem("loggedInUsername");

  if (savedUsername != null && savedUsername != "") {
    return savedUsername;
  }

  return defaultRole;
}

function getCurrentUserId(defaultId) {
  var savedUserId = localStorage.getItem("loggedInUserId");

  if (savedUserId != null && savedUserId != "") {
    return Number(savedUserId);
  }

  return defaultId;
}

function renderCategoryOptions(tasks) {
  var categorySelect = document.getElementById("categoryFilter");

  if (categorySelect == null) {
    return;
  }

  categorySelect.innerHTML = "<option>All Categories</option>";

  for (var i = 0; i < tasks.length; i++) {
    if (categoryExists(tasks[i].category, categorySelect) == false) {
      categorySelect.innerHTML += "<option>" + tasks[i].category + "</option>";
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
    var matchesSearch =
      task.title.toLowerCase().indexOf(searchText) != -1 ||
      task.description.toLowerCase().indexOf(searchText) != -1;
    var matchesCategory =
      category == "All Categories" || task.category == category;
    var matchesState =
      selectedTaskState == "all" || task.state == selectedTaskState;

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
  return (
    '<div class="taskItem">' +
    '<span class="' +
    getStatusClass(task.state) +
    ' statusTop">' +
    task.state +
    "</span>" +
    "<h4>" +
    task.title +
    "</h4>" +
    "<p>" +
    task.description +
    "</p>" +
    "<p>Category: " +
    task.category +
    "</p>" +
    "<p>Location: " +
    task.location +
    "</p>" +
    "<p>Difficulty: " +
    task.difficulty +
    "</p>" +
    "<p>Payment: <b>$" +
    task.payment +
    "</b></p>" +
    '<input type="button" value="View" onclick="window.location.href=\'task.html?id=' +
    task.id +
    "'\">" +
    "</div>"
  );
}

function renderMyTasks(tasks) {
  var myTasksList = document.getElementById("myTasksList");

  if (myTasksList == null) {
    return;
  }

  myTasksList.innerHTML = "";

  for (var i = 0; i < tasks.length; i++) {
    myTasksList.innerHTML +=
      '<div class="taskItem">' +
      "<h4>" +
      tasks[i].title +
      "</h4>" +
      "<p>Category: " +
      tasks[i].category +
      "</p>" +
      "<p>Location: " +
      tasks[i].location +
      "</p>" +
      '<span class="' +
      getStatusClass(tasks[i].state) +
      '">Status: ' +
      tasks[i].state +
      "</span>" +
      '<input type="button" value="Open" onclick="window.location.href=\'task.html?id=' +
      tasks[i].id +
      "'\">" +
      "</div>";
  }
}

function openTaskDetails(taskId, shouldOpenScreen) {
  var selectedTask = findTaskById(taskId);

  if (selectedTask == null || document.getElementById("detailsTitle") == null) {
    return;
  }

  var taskFields = {
    detailsTitle: selectedTask.title,
    detailsSubTitle: "Current task details",
    detailsDescription: selectedTask.description,
    detailsAdditional: selectedTask.additional_details,
    detailsCategory: selectedTask.category,
    detailsLocation: selectedTask.location,
    detailsDifficulty: selectedTask.difficulty,
    detailsPayment: "$" + selectedTask.payment,
    detailsSideCategory: selectedTask.category,
  };

  for (var fieldId in taskFields) {
    document.getElementById(fieldId).innerHTML = taskFields[fieldId];
  }

  document.getElementById("detailsState").innerHTML = selectedTask.state;
  document.getElementById("detailsState").className = getStatusClass(
    selectedTask.state,
  );

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
    profileTaskHistory.innerHTML +=
      "<p>" + tasks[i].title + " - " + tasks[i].state + "</p>";
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

  document.getElementById("profileCompletedTasks").innerHTML =
    countTasksByState(tasks, "completed");
  document.getElementById("profileOpenTasks").innerHTML = countTasksByState(
    tasks,
    "open",
  );
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
  document.getElementById("openTasks").innerHTML = countTasksByState(
    tasks,
    "open",
  );
  document.getElementById("progressTasks").innerHTML = countTasksByState(
    tasks,
    "in-progress",
  );
  document.getElementById("completedTasks").innerHTML = countTasksByState(
    tasks,
    "completed",
  );
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

var requesterPreviousWindowOnload = window.onload;

window.onload = function () {
  if (typeof requesterPreviousWindowOnload == "function") {
    requesterPreviousWindowOnload();
  }

  loadRequesterTasks();
};

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

function getFormFieldValue(fieldId) {
  var field = document.getElementById(fieldId);

  if (field == null) {
    return "";
  }

  return field.value;
}

function createTaskFromForm() {
  var taskFields = {
    title: "taskTitle",
    description: "taskDescription",
    location: "taskLocation",
    difficulty: "difficultyLevel",
    additional_details: "additionalDetails",
  };
  var task = {
    requester_id: getCurrentUserId(1),
    performer_id: null,
    category: "General",
    payment: parseFloat(getFormFieldValue("taskPayment")),
    state: "open",
    work_status: "Available",
  };

  for (var fieldName in taskFields) {
    task[fieldName] = getFormFieldValue(taskFields[fieldName]);
  }

  return task;
}

function checkTask() {
  var title = document.getElementById("taskTitle").value;
  var taskDescription = document.getElementById("taskDescription").value;
  var taskLocation = document.getElementById("taskLocation").value;
  var difficulty = document.getElementById("difficultyLevel").value;
  var taskPayment = document.getElementById("taskPayment").value;

  clearMessage("taskMessage");

  if (
    title == "" ||
    taskDescription == "" ||
    taskLocation == "" ||
    difficulty == "" ||
    taskPayment == ""
  ) {
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
  createTaskOnServer(createTaskFromForm())
    .then(function () {
      window.location.href = "requester.html";
    })
    .catch(function (error) {
      showMessage("taskMessage", error.message);
    });
  return false;
}

function checkPayment() {
  return false;
}
