//yarden shriki, lior zahavi
var requesterTasks = [];
var selectedTaskState = "all";
var tasksApiUrl = "http://localhost:5000/api/tasks";
var taskProgressSteps = [
  "Task accepted",
  "On my way",
  "Task in progress",
  "Finalizing the task",
  "Task completed",
];
var performerCancelWindowMinutes = 5;

function scrollToAllTasks() {
  closeMenu();
  showScreen("requesterHomeScreen");

  document.getElementById("allTasksSection").scrollIntoView({
    behavior: "smooth",
  });
}

function loadRequesterTasks() {
  fetch(tasksApiUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      }
      throw new Error("Failed to load requester tasks");
    })
    .then((tasksData) => {
      requesterTasks = getCurrentRequesterTasks(tasksData);
      renderCategoryOptions(requesterTasks);
      renderRequesterTasks(requesterTasks);
      renderTaskPage();
      renderMyTasks(requesterTasks);
      renderProfileTaskHistory(requesterTasks);
      updateProfileStats(requesterTasks);
      updateRequesterStats(requesterTasks);
      connectRequesterFilters();
    })
    .catch((error) => {
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
  return fetch(tasksApiUrl + "/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  }).then(parseServerResponse);
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

function renderTaskPage() {
  if (document.getElementById("taskDetailsTitle") == null) {
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);
  var taskId = urlParams.get("id");
  var selectedTask = findTaskById(taskId);

  if (selectedTask == null) {
    renderTaskNotFound();
    return;
  }

  renderTaskDetails(selectedTask);
  connectTaskPageActions(selectedTask);
}

function renderTaskNotFound() {
  document.getElementById("taskDetailsTitle").innerHTML = "Task not found";
  document.getElementById("taskDetailsDescription").innerHTML =
    "The selected task could not be found.";
}

function renderTaskDetails(selectedTask) {
  var taskFields = {
    taskDetailsTitle: selectedTask.title,
    taskDetailsStatus: selectedTask.state,
    taskDetailsPosted: "Posted on " + selectedTask.created_at,
    taskDetailsDescription:
      selectedTask.description + "<br><br>" + selectedTask.additional_details,
    taskDetailsPayment: "$" + selectedTask.payment,
    taskDetailsDeadline: selectedTask.deadline || "Not set",
    taskDetailsCategory: selectedTask.category,
    taskDetailsDifficulty: selectedTask.difficulty,
    taskDetailsPostedDate: selectedTask.created_at,
  };

  for (var fieldId in taskFields) {
    document.getElementById(fieldId).innerHTML = taskFields[fieldId];
  }

  document.getElementById("taskDetailsStatus").className = getStatusClass(
    selectedTask.state,
  );
}

function connectTaskPageActions(selectedTask) {
  connectTakeTaskButton(selectedTask);
  connectNextStepButton(selectedTask);
  renderPerformerProgress(selectedTask);
  updateTaskPageByRole(selectedTask);
}

function getTaskProgressIndex(work_status) {
  for (var i = 0; i < taskProgressSteps.length; i++) {
    if (taskProgressSteps[i] == work_status) {
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

  var currentStepIndex = getTaskProgressIndex(selectedTask.work_status);
  progressTrack.innerHTML = "";

  for (var i = 0; i < taskProgressSteps.length; i++) {
    var stepClass = "progressStep";
    var stepMark = "";

    if (i <= currentStepIndex) {
      stepClass += " completedStep";
      stepMark = "ג“";
    }

    progressTrack.innerHTML +=
      '<div class="' +
      stepClass +
      '">' +
      "<span>" +
      stepMark +
      "</span>" +
      "<b>" +
      taskProgressSteps[i] +
      "</b>" +
      "</div>";
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
    var currentStepIndex = getTaskProgressIndex(selectedTask.work_status);

    if (currentStepIndex >= taskProgressSteps.length - 1) {
      return;
    }

    selectedTask.work_status = taskProgressSteps[currentStepIndex + 1];
    updateTaskStateByWorkStatus(selectedTask);
    ensureTaskChatParticipants(selectedTask);

    updateTaskOnServer(selectedTask)
      .then(() => {
        if (typeof addTaskChatSystemMessage == "function") {
          addTaskChatSystemMessage(
            selectedTask,
            "Performer finished the step of: " + selectedTask.work_status,
          );
        }

        if (selectedTask.work_status == "Task completed") {
          createTaskCompletionNotification(selectedTask);
        }

        document.getElementById("taskDetailsStatus").innerHTML =
          selectedTask.state;
        document.getElementById("taskDetailsStatus").className = getStatusClass(
          selectedTask.state,
        );
        renderPerformerProgress(selectedTask);
        updateTaskPageByRole(selectedTask);
      })
      .catch((error) => {
        console.log(error.message);
      });
  };
}

function createTaskCompletionNotification(selectedTask) {
  if (typeof addNotification != "function") {
    return;
  }

  addNotification({
    toRole: "Requester",
    type: "task-completion",
    task_id: selectedTask.id,
    task_title: selectedTask.title,
    performer_name: selectedTask.performer_name || getCurrentUserName("Performer"),
    title: "Task completion",
    message: selectedTask.title + " has been marked as finished.",
  });
}

function updateTaskPageByRole(selectedTask) {
  var performerItems = document.getElementsByClassName("performerOnly");
  var activeItems = document.getElementsByClassName("performerActiveOnly");
  var availableItems = document.getElementsByClassName(
    "performerAvailableOnly",
  );
  var requesterItems = document.getElementsByClassName("requesterOnly");
  var isPerformerTaskPage = userRole == "Performer";
  var isTakenTask =
    selectedTask.performer_id != null && selectedTask.performer_id != "";
  var hasChatParticipants = taskHasChatParticipants(selectedTask);

  for (var i = 0; i < performerItems.length; i++) {
    if (isPerformerTaskPage) {
      performerItems[i].style.display = getTaskElementDisplay(
        performerItems[i],
      );
    } else {
      performerItems[i].style.display = "none";
    }
  }

  for (var j = 0; j < activeItems.length; j++) {
    activeItems[j].style.display =
      isPerformerTaskPage && isTakenTask
        ? getTaskElementDisplay(activeItems[j])
        : "none";
  }

  for (var k = 0; k < availableItems.length; k++) {
    availableItems[k].style.display =
      isPerformerTaskPage && isTakenTask == false
        ? getTaskElementDisplay(availableItems[k])
        : "none";
  }

  for (var m = 0; m < requesterItems.length; m++) {
    if (requesterItems[m].className.indexOf("communicationPanel") != -1) {
      requesterItems[m].style.display = hasChatParticipants
        ? getTaskElementDisplay(requesterItems[m])
        : "none";
    } else {
      requesterItems[m].style.display =
        isPerformerTaskPage && isTakenTask == false ? "none" : "flex";
    }
  }
}

function taskHasChatParticipants(task) {
  return (
    task.requester_name != null &&
    task.requester_name != "" &&
    task.performer_name != null &&
    task.performer_name != ""
  );
}

function ensureTaskChatParticipants(task) {
  if (task.performer_id == null || task.performer_id == "") {
    return;
  }

  if (task.requester_name == null || task.requester_name == "") {
    task.requester_name = getCurrentUserName("Requester");
  }

  if (task.performer_name == null || task.performer_name == "") {
    task.performer_name = getCurrentUserName("Performer");
  }
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
      if (
        taskHasChatParticipants(selectedTask) &&
        typeof openCurrentTaskChat == "function"
      ) {
        openCurrentTaskChat(selectedTask);
      }
    };
  }

  if (takeTaskButton == null) {
    return;
  }

  takeTaskButton.onclick = function () {
    selectedTask.performer_id =
      selectedTask.performer_id || getCurrentUserId(2);
    selectedTask.requester_name =
      selectedTask.requester_name || getCurrentUserName("Requester");
    selectedTask.performer_name =
      selectedTask.performer_name || getCurrentUserName("Performer");
    selectedTask.work_status = "Task accepted";
    updateTaskStateByWorkStatus(selectedTask);

    updateTaskOnServer(selectedTask)
      .then(function () {
        if (typeof createTaskChat == "function") {
          createTaskChat(selectedTask);
        }

        localStorage.setItem("userRole", "Performer");
        window.location.href = "performer.html";
      })
      .catch(function (error) {
        console.log(error.message);
      });
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
      '<input type="button" value="Open">' +
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

var previousWindowOnload = window.onload;

window.onload = function () {
  if (typeof previousWindowOnload == "function") {
    previousWindowOnload();
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
  /* showScreen("profileScreen"); */
  return false;
}
