//yarden shriki, lior zahavi
var taskProgressSteps = [
  "Task accepted",
  "On my way",
  "Task in progress",
  "Finalizing the task",
  "Task completed",
];
var performerCancelWindowMinutes = 5;
var taskPageRefreshTimer = null;
var taskPageRefreshIntervalMs = 4000;
var taskPageCurrentTaskId = null;

function renderTaskPage() {
  if (document.getElementById("taskDetailsTitle") == null) {
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);
  var taskId = urlParams.get("id");
  taskPageCurrentTaskId = taskId;

  if (taskId == null || taskId == "") {
    renderTaskNotFound();
    return;
  }

  loadTaskPageFromServer(taskId, true);
  startTaskPageAutoRefresh();
}

function loadTaskPageForPerformer(taskId) {
  loadTaskPageFromServer(taskId, true);
}

function loadTaskPageFromServer(taskId, shouldRenderNotFound) {
  if (taskId == null || taskId == "") {
    if (shouldRenderNotFound == true) {
      renderTaskNotFound();
    }
    return;
  }

  fetch(tasksApiUrl + "/" + taskId)
    .then(function (response) {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      }
      throw new Error("Task not found");
    })
    .then(function (task) {
      var acceptance = getTaskAcceptance(String(task.id));
      if (acceptance != null) {
        task.requester_name = task.requester_name || acceptance.requesterName || "";
        task.performer_name = task.performer_name || acceptance.performerName || "";
        task.acceptedAt = acceptance.acceptedAt || "";
      }
      renderTaskDetails(task);
      connectTaskPageActions(task);
    })
    .catch(function () {
      var selectedTask = findTaskById(taskId);

      if (selectedTask != null) {
        renderTaskDetails(selectedTask);
        connectTaskPageActions(selectedTask);
        return;
      }

      if (shouldRenderNotFound == true) {
        renderTaskNotFound();
      }
    });
}

function startTaskPageAutoRefresh() {
  if (taskPageRefreshTimer != null) {
    return;
  }

  taskPageRefreshTimer = setInterval(function () {
    if (taskPageCurrentTaskId != null && taskPageCurrentTaskId != "") {
      loadTaskPageFromServer(taskPageCurrentTaskId, false);
    }
  }, taskPageRefreshIntervalMs);
}

function isWithinCancelWindow(taskId) {
  var acceptedAt = getTaskAcceptedAt(String(taskId));
  if (acceptedAt == null || acceptedAt == "") {
    return false;
  }
  var acceptedTime = new Date(acceptedAt).getTime();
  var nowTime = new Date().getTime();
  return (nowTime - acceptedTime) < performerCancelWindowMinutes * 60 * 1000;
}

function canPerformerCancelTask(selectedTask) {
  return (
    selectedTask != null &&
    selectedTask.work_status == "Task accepted" &&
    isWithinCancelWindow(selectedTask.id)
  );
}

function goBack() {
  if (userRole == "Performer") {
    window.location.href = "performer.html";
  } else {
    window.location.href = "requester.html";
  }
}

function renderTaskNotFound() {
  document.getElementById("taskDetailsTitle").innerHTML = "Task not found";
  document.getElementById("taskDetailsDescription").innerHTML =
    "The selected task could not be found.";
}

function formatDisplayDate(dateValue) {
  if (dateValue == null || dateValue == "") {
    return "";
  }
  return String(dateValue).split("T")[0];
}

function renderTaskDetails(selectedTask) {
  var taskFields = {
    taskDetailsTitle: selectedTask.title,
    taskDetailsStatus: selectedTask.state,
    taskDetailsPosted: "Posted on " + formatDisplayDate(selectedTask.created_at),
    taskDetailsDescription:
      selectedTask.description + "<br><br>" + selectedTask.additional_details,
    taskDetailsPayment: "$" + selectedTask.payment,
    taskDetailsDeadline: formatDisplayDate(selectedTask.deadline) || "Not set",
    taskDetailsCategory: selectedTask.category,
    taskDetailsDifficulty: selectedTask.difficulty,
    taskDetailsPostedDate: formatDisplayDate(selectedTask.created_at),
  };

  for (var fieldId in taskFields) {
    document.getElementById(fieldId).innerHTML = taskFields[fieldId];
  }

  document.getElementById("taskDetailsStatus").className = getStatusClass(
    selectedTask.state,
  );

  var requesterNameEl = document.getElementById("taskRequesterName");
  if (requesterNameEl != null) {
    var savedParticipants = typeof getLocalTaskParticipants == "function"
      ? getLocalTaskParticipants()[selectedTask.id]
      : null;
    requesterNameEl.innerHTML =
      selectedTask.requester_name ||
      (savedParticipants && savedParticipants.requester_name) ||
      getCurrentUserName("Requester");
  }
}

function connectTaskPageActions(selectedTask) {
  connectTakeTaskButton(selectedTask);
  connectNextStepButton(selectedTask);
  connectPerformerCancelButton(selectedTask);
  connectRequesterCancelButton(selectedTask);
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
      stepMark = "✓";
    }

    progressTrack.innerHTML +=
      '<div class="' + stepClass + '">' +
      "<span>" + stepMark + "</span>" +
      "<b>" + taskProgressSteps[i] + "</b>" +
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
      .then(function () {
        if (typeof addTaskChatSystemMessage == "function") {
          addTaskChatSystemMessage(
            selectedTask,
            "Performer finished the step of: " + selectedTask.work_status,
          );

          if (selectedTask.work_status == "Task completed") {
            addTaskChatSystemMessage(selectedTask, "Task ended");
          }
        }

        if (selectedTask.work_status == "Task completed") {
          createTaskCompletionNotification(selectedTask);
        }

        document.getElementById("taskDetailsStatus").innerHTML = selectedTask.state;
        document.getElementById("taskDetailsStatus").className = getStatusClass(selectedTask.state);
        renderPerformerProgress(selectedTask);
        updateTaskPageByRole(selectedTask);
      })
      .catch(function (error) {
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
    toUserId: selectedTask.requester_id || getCurrentUserId(1),
    type: "task-completion",
    task_id: selectedTask.id,
    task_title: selectedTask.title,
    requester_id: selectedTask.requester_id || getCurrentUserId(1),
    performer_id: selectedTask.performer_id,
    amount: selectedTask.payment,
    requester_name: selectedTask.requester_name || getCurrentUserName("Requester"),
    performer_name: selectedTask.performer_name || getCurrentUserName("Performer"),
    title: "Task completion",
    message: selectedTask.title + " has been marked as finished.",
  });
}

function updateTaskPageByRole(selectedTask) {
  var performerItems = document.getElementsByClassName("performerOnly");
  var activeItems = document.getElementsByClassName("performerActiveOnly");
  var availableItems = document.getElementsByClassName("performerAvailableOnly");
  var requesterItems = document.getElementsByClassName("requesterOnly");
  var isPerformerTaskPage = userRole == "Performer";
  var isTakenTask = selectedTask.performer_id != null && selectedTask.performer_id != "";

  for (var i = 0; i < performerItems.length; i++) {
    performerItems[i].style.display = isPerformerTaskPage
      ? getTaskElementDisplay(performerItems[i])
      : "none";
  }

  for (var j = 0; j < activeItems.length; j++) {
    activeItems[j].style.display =
      isPerformerTaskPage && isTakenTask
        ? getTaskElementDisplay(activeItems[j])
        : "none";
  }

  for (var k = 0; k < availableItems.length; k++) {
    availableItems[k].style.display =
      isPerformerTaskPage && !isTakenTask
        ? getTaskElementDisplay(availableItems[k])
        : "none";
  }

  for (var m = 0; m < requesterItems.length; m++) {
    if (requesterItems[m].className.indexOf("communicationPanel") != -1) {
      requesterItems[m].style.display = isTakenTask
        ? getTaskElementDisplay(requesterItems[m])
        : "none";
    } else {
      requesterItems[m].style.display = isPerformerTaskPage ? "none" : "flex";
    }
  }

  var performerCancelPanel = document.getElementById("performerCancelTaskPanel");
  if (performerCancelPanel != null) {
    performerCancelPanel.style.display =
      isPerformerTaskPage && isTakenTask && canPerformerCancelTask(selectedTask)
        ? "block"
        : "none";
  }

  var performerSection = document.getElementById("taskPerformerSection");
  var performerNameEl = document.getElementById("taskPerformerName");
  if (performerSection != null) {
    if (isTakenTask) {
      performerSection.style.display = "block";
      if (performerNameEl != null) {
        var savedParticipants = typeof getLocalTaskParticipants == "function"
          ? getLocalTaskParticipants()[selectedTask.id]
          : null;
        performerNameEl.innerHTML =
          selectedTask.performer_name ||
          (savedParticipants && savedParticipants.performer_name) ||
          "";
      }
    } else {
      performerSection.style.display = "none";
    }
  }

  var progressPanel = document.getElementById("performerProgressPanel");
  var nextStepButton = document.getElementById("performerNextStepButton");
  var requesterCancelPanel = document.getElementById("requesterCancelTaskPanel");

  if (!isPerformerTaskPage) {
    if (progressPanel != null) {
      progressPanel.style.display = isTakenTask ? "grid" : "none";
    }
    if (nextStepButton != null) {
      nextStepButton.style.display = "none";
    }
    if (requesterCancelPanel != null) {
      requesterCancelPanel.style.display = !isTakenTask ? "flex" : "none";
    }
  }
}

function openCancelModal(selectedTask) {
  var titleEl = document.getElementById("cancelTaskTitle");
  var locationEl = document.getElementById("cancelTaskLocation");
  var paymentEl = document.getElementById("cancelTaskPayment");
  var statusEl = document.getElementById("cancelTaskStatus");

  if (titleEl != null) titleEl.innerHTML = selectedTask.title || "";
  if (locationEl != null) locationEl.innerHTML = selectedTask.location || "";
  if (paymentEl != null) paymentEl.innerHTML = "$" + (selectedTask.payment || 0);
  if (statusEl != null) statusEl.innerHTML = selectedTask.state || "";

  var overlay = document.getElementById("cancelTaskOverlay");
  var modal = document.getElementById("cancelTaskModal");
  if (overlay != null) overlay.style.display = "block";
  if (modal != null) modal.style.display = "block";
}

function closeCancelModal() {
  var overlay = document.getElementById("cancelTaskOverlay");
  var modal = document.getElementById("cancelTaskModal");
  if (overlay != null) overlay.style.display = "none";
  if (modal != null) modal.style.display = "none";
}

function connectRequesterCancelButton(selectedTask) {
  var cancelButton = document.getElementById("cancelTaskButton");
  var keepButton = document.getElementById("keepTaskButton");

  if (keepButton != null) {
    keepButton.onclick = closeCancelModal;
  }

  if (cancelButton != null) {
    cancelButton.onclick = function () {
      openCancelModal(selectedTask);
      var confirmButton = document.getElementById("confirmCancelTaskButton");
      if (confirmButton != null) {
        confirmButton.onclick = function () {
          cancelLocalTask(selectedTask.id);
          updateTaskOnServer(Object.assign({}, selectedTask, {
            state: "cancelled",
            work_status: "Cancelled",
            performer_id: null,
          })).catch(function (error) {
            console.log(error.message);
          });
          window.location.href = "requester.html";
        };
      }
    };
  }
}

function connectPerformerCancelButton(selectedTask) {
  var cancelButton = document.getElementById("performerCancelTaskButton");

  if (cancelButton == null) {
    return;
  }

  cancelButton.onclick = function () {
    if (canPerformerCancelTask(selectedTask) == false) {
      return;
    }

    openCancelModal(selectedTask);
    var confirmButton = document.getElementById("confirmCancelTaskButton");
    if (confirmButton != null) {
      confirmButton.onclick = function () {
        cancelTakenTaskByPerformer(selectedTask.id);
        if (typeof removeTaskChat == "function") {
          removeTaskChat(selectedTask.id);
        }
        updateTaskOnServer(Object.assign({}, selectedTask, {
          state: "open",
          work_status: "Available",
          performer_id: null,
        })).catch(function (error) {
          console.log(error.message);
        });
        window.location.href = "performer.html";
      };
    }
  };
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
      if (typeof openCurrentTaskChat != "function") {
        return;
      }

      var savedParticipants = typeof getLocalTaskParticipants == "function"
        ? getLocalTaskParticipants()[selectedTask.id]
        : null;

      if (savedParticipants != null) {
        selectedTask.requester_name = selectedTask.requester_name || savedParticipants.requester_name;
        selectedTask.performer_name = selectedTask.performer_name || savedParticipants.performer_name;
      }

      ensureTaskChatParticipants(selectedTask);
      openCurrentTaskChat(selectedTask);
    };
  }

  if (takeTaskButton == null) {
    return;
  }

  takeTaskButton.onclick = function () {
    selectedTask.performer_id = selectedTask.performer_id || getCurrentUserId(2);
    selectedTask.requester_name = selectedTask.requester_name || getCurrentUserName("Requester");
    selectedTask.performer_name = selectedTask.performer_name || getCurrentUserName("Performer");
    selectedTask.work_status = "Task accepted";
    updateTaskStateByWorkStatus(selectedTask);

    if (typeof takeLocalTask == "function") {
      takeLocalTask(selectedTask.id, selectedTask.requester_name, selectedTask.performer_name);
    }

    updateTaskOnServer(selectedTask)
      .then(function () {
        if (typeof createTaskChat == "function") {
          createTaskChat(selectedTask);
        }

        if (typeof addTaskChatSystemMessage == "function") {
          addTaskChatSystemMessage(
            selectedTask,
            "Task accepted by " + selectedTask.performer_name,
          );
        }

        localStorage.setItem("pendingChatTaskId", String(selectedTask.id));
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

  var performerName = selectedTask.performerName || getCurrentUserName("Performer");

  addNotification({
    toRole: "Requester",
    type: "task-accepted",
    taskId: selectedTask.id,
    taskTitle: selectedTask.title,
    performerName: performerName,
    title: "Task accepted",
    message: performerName + " accepted your task " + selectedTask.title + " and confirmed responsibility for it."
  });

  addNotification({
    toRole: "Performer",
    type: "performer-task-responsibility",
    taskId: selectedTask.id,
    taskTitle: selectedTask.title,
    title: "Task responsibility",
    message: "You accepted " + selectedTask.title + ". Contact the requester in the chat for any additional task details."
  });
}

function openPerformerAcceptedTaskModal(selectedTask) {
  if (document.getElementById("performerAcceptedTaskMessage") == null) {
    window.location.href = "performer.html";
    return;
  }

  document.getElementById("performerAcceptedTaskMessage").innerHTML =
    "<b>" + selectedTask.title + "</b> is now your responsibility. Please contact the Requester through the chat for additional task details.";
  document.getElementById("performerAcceptedTaskOverlay").style.display = "block";
  document.getElementById("performerAcceptedTaskModal").style.display = "block";
}
