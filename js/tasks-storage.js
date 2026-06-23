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

function saveLocalTaskParticipants(taskId, requester_name, performer_name) {
  var taskParticipants = getLocalTaskParticipants();
  taskParticipants[taskId] = {
    requester_name: requester_name,
    performer_name: performer_name
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

function saveLocalTaskWorkStatus(taskId, work_status) {
  var taskWorkStatuses = getLocalTaskWorkStatuses();
  taskWorkStatuses[taskId] = work_status;
  localStorage.setItem("taskWorkStatuses", JSON.stringify(taskWorkStatuses));
}

function updateTaskStateByWorkStatus(task) {
  if (task.work_status == "Task completed") {
    task.state = "completed";
    return task;
  }

  if (task.work_status != "Available") {
    task.state = "in-progress";
  }

  return task;
}

function applyLocalTaskAssignments(tasks) {
  var taskParticipants = getLocalTaskParticipants();

  for (var i = 0; i < tasks.length; i++) {
    var savedWorkStatus = getLocalTaskWorkStatus(tasks[i].id);
    var savedParticipants = taskParticipants[tasks[i].id];

    if (savedWorkStatus != null) {
      tasks[i].work_status = savedWorkStatus;
    }

    if (savedParticipants != null) {
      tasks[i].requester_name = savedParticipants.requester_name;
      tasks[i].performer_name = savedParticipants.performer_name;
    }

    if (isTaskTakenByPerformer(tasks[i].id)) {
      tasks[i].performer_id = tasks[i].performer_id || 2;

      if (tasks[i].requester_name == null || tasks[i].requester_name == "") {
        tasks[i].requester_name = "Sarah Johnson";
      }

      if (tasks[i].performer_name == null || tasks[i].performer_name == "") {
        tasks[i].performer_name = "John Designer";
        saveLocalTaskParticipants(tasks[i].id, tasks[i].requester_name, tasks[i].performer_name);
      }

      if (tasks[i].work_status == "Available") {
        tasks[i].work_status = "Task accepted";
      }
    }

    updateTaskStateByWorkStatus(tasks[i]);
  }

  return tasks;
}
