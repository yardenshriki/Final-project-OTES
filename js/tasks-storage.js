//yarden shriki, lior zahavi
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

function saveLocalCreatedTasks(tasks) {
  localStorage.setItem("createdTasks", JSON.stringify(tasks));
}

function getTakenTaskIds() {
  var savedTaskIds = localStorage.getItem("takenTaskIds");

  if (savedTaskIds == null || savedTaskIds == "") {
    return [];
  }

  return JSON.parse(savedTaskIds);
}

function isTaskTakenByPerformer(taskId) {
  var takenTaskIds = getTakenTaskIds();

  for (var i = 0; i < takenTaskIds.length; i++) {
    if (takenTaskIds[i] == taskId) {
      return true;
    }
  }

  return false;
}

function saveTakenTaskIds(takenTaskIds) {
  localStorage.setItem("takenTaskIds", JSON.stringify(takenTaskIds));
}

function getLocalTaskAcceptanceData() {
  var savedAcceptanceData = localStorage.getItem("taskAcceptanceData");

  if (savedAcceptanceData == null || savedAcceptanceData == "") {
    return {};
  }

  return JSON.parse(savedAcceptanceData);
}

function saveLocalTaskAcceptanceData(acceptanceData) {
  localStorage.setItem("taskAcceptanceData", JSON.stringify(acceptanceData));
}

function getTaskAcceptance(taskId) {
  var acceptanceData = getLocalTaskAcceptanceData();
  return acceptanceData[taskId];
}

function getTaskAcceptedAt(taskId) {
  var taskAcceptance = getTaskAcceptance(taskId);

  if (taskAcceptance == null) {
    return "";
  }

  return taskAcceptance.acceptedAt || "";
}

function takeLocalTask(taskId, requesterName, performerName) {
  var takenTaskIds = getTakenTaskIds();
  var acceptanceData = getLocalTaskAcceptanceData();
  var localTasks = getLocalCreatedTasks();
  var acceptedAt = new Date().toISOString();

  if (isTaskTakenByPerformer(taskId) == false) {
    takenTaskIds.push(taskId);
    saveTakenTaskIds(takenTaskIds);
  }

  if (acceptanceData[taskId] == null) {
    acceptanceData[taskId] = {
      acceptedAt: acceptedAt,
      requesterName: requesterName || "Sarah Johnson",
      performerName: performerName || "John Designer"
    };

    saveLocalTaskAcceptanceData(acceptanceData);
  } else {
    acceptedAt = acceptanceData[taskId].acceptedAt;
  }

  saveLocalTaskWorkStatus(taskId, "Task accepted");

  for (var i = 0; i < localTasks.length; i++) {
    if (localTasks[i].id == taskId) {
      localTasks[i].state = "in-progress";
      localTasks[i].workStatus = "Task accepted";
      localTasks[i].assignedToPerformer = true;
      localTasks[i].requesterName = requesterName || localTasks[i].requesterName || "Sarah Johnson";
      localTasks[i].performerName = performerName || "John Designer";
      localTasks[i].acceptedAt = acceptedAt;
    }
  }

  saveLocalCreatedTasks(localTasks);
}

function getLocalTaskParticipants() {
  var savedParticipants = localStorage.getItem("taskParticipants");

  if (savedParticipants == null || savedParticipants == "") {
    return {};
  }

  return JSON.parse(savedParticipants);
}

function saveLocalTaskParticipants(taskId, requesterName, performerName) {
  var taskParticipants = getLocalTaskParticipants();
  taskParticipants[taskId] = {
    requesterName: requesterName,
    performerName: performerName
  };
  localStorage.setItem("taskParticipants", JSON.stringify(taskParticipants));
}

function clearLocalTaskParticipants(taskId) {
  var taskParticipants = getLocalTaskParticipants();
  delete taskParticipants[taskId];
  localStorage.setItem("taskParticipants", JSON.stringify(taskParticipants));
}

function getLocalTaskWorkStatuses() {
  var savedStatuses = localStorage.getItem("taskWorkStatuses");

  if (savedStatuses == null || savedStatuses == "") {
    return {};
  }

  return JSON.parse(savedStatuses);
}

function getLocalTaskWorkStatus(taskId) {
  var taskWorkStatuses = getLocalTaskWorkStatuses();
  return taskWorkStatuses[taskId];
}

function saveLocalTaskWorkStatus(taskId, workStatus) {
  var taskWorkStatuses = getLocalTaskWorkStatuses();
  taskWorkStatuses[taskId] = workStatus;
  localStorage.setItem("taskWorkStatuses", JSON.stringify(taskWorkStatuses));
}

function updateTaskStateByWorkStatus(task) {
  if (task.workStatus == "Cancelled") {
    task.state = "cancelled";
    task.assignedToPerformer = false;
    return task;
  }

  if (task.workStatus == "Task completed") {
    task.state = "completed";
    task.assignedToPerformer = true;
    return task;
  }

  if (task.workStatus != "Available") {
    task.state = "in-progress";
    task.assignedToPerformer = true;
  }

  return task;
}

function getCancelledTaskIds() {
  var savedTaskIds = localStorage.getItem("cancelledTaskIds");

  if (savedTaskIds == null || savedTaskIds == "") {
    return [];
  }

  return JSON.parse(savedTaskIds);
}

function isTaskCancelled(taskId) {
  var cancelledTaskIds = getCancelledTaskIds();

  for (var i = 0; i < cancelledTaskIds.length; i++) {
    if (cancelledTaskIds[i] == taskId) {
      return true;
    }
  }

  return false;
}

function cancelLocalTask(taskId) {
  var cancelledTaskIds = getCancelledTaskIds();
  var localTasks = getLocalCreatedTasks();

  if (isTaskCancelled(taskId) == false) {
    cancelledTaskIds.push(taskId);
    localStorage.setItem("cancelledTaskIds", JSON.stringify(cancelledTaskIds));
  }

  saveLocalTaskWorkStatus(taskId, "Cancelled");

  for (var i = 0; i < localTasks.length; i++) {
    if (localTasks[i].id == taskId) {
      localTasks[i].state = "cancelled";
      localTasks[i].workStatus = "Cancelled";
      localTasks[i].assignedToPerformer = false;
      localTasks[i].cancelledAt = new Date().toISOString();
    }
  }

  saveLocalCreatedTasks(localTasks);
}

function cancelTakenTaskByPerformer(taskId) {
  var takenTaskIds = getTakenTaskIds();
  var filteredTaskIds = [];
  var acceptanceData = getLocalTaskAcceptanceData();
  var localTasks = getLocalCreatedTasks();

  for (var i = 0; i < takenTaskIds.length; i++) {
    if (takenTaskIds[i] != taskId) {
      filteredTaskIds.push(takenTaskIds[i]);
    }
  }

  saveTakenTaskIds(filteredTaskIds);
  delete acceptanceData[taskId];
  saveLocalTaskAcceptanceData(acceptanceData);
  clearLocalTaskParticipants(taskId);
  saveLocalTaskWorkStatus(taskId, "Available");

  for (var j = 0; j < localTasks.length; j++) {
    if (localTasks[j].id == taskId) {
      localTasks[j].state = "open";
      localTasks[j].workStatus = "Available";
      localTasks[j].assignedToPerformer = false;
      localTasks[j].performerName = "";
      localTasks[j].acceptedAt = "";
    }
  }

  saveLocalCreatedTasks(localTasks);
}

function applyLocalTaskAssignments(tasks) {
  var taskParticipants = getLocalTaskParticipants();
  var acceptanceData = getLocalTaskAcceptanceData();

  for (var i = 0; i < tasks.length; i++) {
    var savedWorkStatus = getLocalTaskWorkStatus(tasks[i].id);
    var savedParticipants = taskParticipants[tasks[i].id];
    var savedAcceptance = acceptanceData[tasks[i].id];

    if (savedWorkStatus != null) {
      tasks[i].workStatus = savedWorkStatus;
    }

    if (savedParticipants != null) {
      tasks[i].requesterName = savedParticipants.requesterName;
      tasks[i].performerName = savedParticipants.performerName;
    }

    if (savedAcceptance != null) {
      tasks[i].acceptedAt = savedAcceptance.acceptedAt;

      if (tasks[i].requesterName == null || tasks[i].requesterName == "") {
        tasks[i].requesterName = savedAcceptance.requesterName;
      }

      if (tasks[i].performerName == null || tasks[i].performerName == "") {
        tasks[i].performerName = savedAcceptance.performerName;
      }
    }

    if (isTaskCancelled(tasks[i].id)) {
      tasks[i].state = "cancelled";
      tasks[i].workStatus = "Cancelled";
      tasks[i].assignedToPerformer = false;
      continue;
    }

    if (isTaskTakenByPerformer(tasks[i].id)) {
      tasks[i].assignedToPerformer = true;

      if (tasks[i].requesterName == null || tasks[i].requesterName == "") {
        tasks[i].requesterName = "Sarah Johnson";
      }

      if (tasks[i].performerName == null || tasks[i].performerName == "") {
        tasks[i].performerName = "John Designer";
        saveLocalTaskParticipants(tasks[i].id, tasks[i].requesterName, tasks[i].performerName);
      }

      if (tasks[i].workStatus == "Available") {
        tasks[i].workStatus = "Task accepted";
      }
    }

    updateTaskStateByWorkStatus(tasks[i]);
  }

  return tasks;
}
