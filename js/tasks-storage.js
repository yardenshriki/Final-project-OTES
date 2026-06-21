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

function takeLocalTask(taskId) {
  var takenTaskIds = getTakenTaskIds();

  if (isTaskTakenByPerformer(taskId) == false) {
    takenTaskIds.push(taskId);
    localStorage.setItem("takenTaskIds", JSON.stringify(takenTaskIds));
  }

  saveLocalTaskWorkStatus(taskId, "Task accepted");
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

function applyLocalTaskAssignments(tasks) {
  var taskParticipants = getLocalTaskParticipants();

  for (var i = 0; i < tasks.length; i++) {
    var savedWorkStatus = getLocalTaskWorkStatus(tasks[i].id);
    var savedParticipants = taskParticipants[tasks[i].id];

    if (savedWorkStatus != null) {
      tasks[i].workStatus = savedWorkStatus;
    }

    if (savedParticipants != null) {
      tasks[i].requesterName = savedParticipants.requesterName;
      tasks[i].performerName = savedParticipants.performerName;
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
