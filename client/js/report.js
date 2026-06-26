var reportUserRole = localStorage.getItem("userRole") || "Requester";
var REPORTS_API_URL = "http://localhost:5000/api/report";
var REPORT_USERS_API_URL = "http://localhost:5000/api/users";
var REPORT_TASKS_API_URL = "http://localhost:5000/api/tasks";
var reportUsers = [];
var reportTasks = [];

function getReportHomePath() {
    if (reportUserRole == "Performer") {
        return "performer.html";
    }

    return "requester.html";
}

function goToReportHome() {
    window.location.href = getReportHomePath();
}

function switchReportRole(roleName) {
    reportUserRole = roleName;
    localStorage.setItem("userRole", reportUserRole);
    goToReportHome();
}

function markReportRole() {
    var requesterButton = document.getElementById("requesterButton");
    var performerButton = document.getElementById("performerButton");

    if (requesterButton == null || performerButton == null) {
        return;
    }

    if (reportUserRole == "Performer") {
        requesterButton.className = "";
        performerButton.className = "activeRole";
    } else {
        requesterButton.className = "activeRole";
        performerButton.className = "";
    }
}

function prepareReportScreen() {
    var reportName = getReportElement("reportName");

    clearReportMessage();

    if (reportName != null && reportName.value == "") {
        reportName.value = localStorage.getItem("loggedInUsername") || "";
    }

    markReportRole();
}

function cancelReportForm() {
    resetReportForm();
    clearReportMessage();
    goToReportHome();
}

function clearReportMessage() {
    var message = getReportElement("reportMessage");

    if (message != null) {
        message.innerHTML = "";
        message.className = "message reportMessage";
    }
}

function setReportMessage(text, isSuccess) {
    var message = getReportElement("reportMessage");

    if (message == null) {
        return;
    }

    message.innerHTML = text;
    message.className = isSuccess ? "message reportMessage reportSuccess" : "message reportMessage";
}

function showReportSuccessPopup() {
    var popup = getReportElement("reportSuccessPopup");

    if (popup == null) {
        return;
    }

    popup.style.display = "flex";
    popup.setAttribute("aria-hidden", "false");
}

function confirmReportSuccess() {
    var popup = getReportElement("reportSuccessPopup");

    if (popup != null) {
        popup.style.display = "none";
        popup.setAttribute("aria-hidden", "true");
    }

    goToReportHome();
}

async function submitReportForm() {
    var reportData = getReportFormData();

    clearReportMessage();

    if (isMissingRequiredReportData(reportData) == true) {
        setReportMessage("Please fill all required fields", false);
        return false;
    }

    setReportMessage("Saving report...", true);

    try {
        var reportTarget = await findReportTargetFromServer(reportData.reportedTarget);

        if (reportTarget.reported_user_id == null && reportTarget.task_id == null) {
            setReportMessage("Reported task or user was not found", false);
            return false;
        }

        await createReportOnServer({
            reporter_id: getCurrentReportUserId(),
            reported_user_id: reportTarget.reported_user_id,
            task_id: reportTarget.task_id,
            reason: reportData.reportType,
            description: reportData.reportDescription
        });

        if (typeof addNotification == "function") {
            await addNotification({
                toUserId: getCurrentReportUserId(),
                task_id: reportTarget.task_id || null,
                type: "report-sent",
                title: "Report received",
                message: "Your report has been received and is being reviewed by our admin team.",
            });
        }

        resetReportForm();
        clearReportMessage();
        showReportSuccessPopup();
    } catch (error) {
        setReportMessage(error.message || "Report could not be submitted", false);
    }

    return false;
}

function getReportFormData() {
    return {
        reportType: getInputValue("reportType"),
        reportName: getInputValue("reportName"),
        reportedTarget: getInputValue("reportedTarget"),
        reportDescription: getInputValue("reportDescription")
    };
}

function isMissingRequiredReportData(reportData) {
    return (
        reportData.reportType == "" ||
        reportData.reportName == "" ||
        reportData.reportedTarget == "" ||
        reportData.reportDescription == ""
    );
}

function resetReportForm() {
    var form = getReportElement("reportForm");

    if (form != null) {
        form.reset();
    }
}

function getCurrentReportUserId() {
    var savedUserId = localStorage.getItem("loggedInUserId");
    var userId = Number(savedUserId);

    if (savedUserId != null && savedUserId != "" && isNaN(userId) == false) {
        return userId;
    }

    return 1;
}

async function parseReportServerResponse(response) {
    if (response.status >= 200 && response.status < 300) {
        return response.json();
    }

    var errorMessage = "Server request failed";

    try {
        var errorData = await response.json();
        if (errorData.message != null && errorData.message != "") {
            errorMessage = errorData.message;
        }
    } catch (error) {
    }

    throw new Error(errorMessage);
}

async function fetchReportJson(url) {
    var response = await fetch(url);
    return parseReportServerResponse(response);
}

async function loadReportServerData() {
    reportUsers = await fetchReportJson(REPORT_USERS_API_URL);
    reportTasks = await fetchReportJson(REPORT_TASKS_API_URL);
}

async function createReportOnServer(reportBody) {
    var response = await fetch(REPORTS_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reportBody)
    });

    return parseReportServerResponse(response);
}

async function findReportTargetFromServer(reportedTarget) {
    var normalizedTarget = normalizeReportText(reportedTarget);
    var target = {
        reported_user_id: null,
        task_id: null
    };

    if (reportUsers.length == 0 || reportTasks.length == 0) {
        await loadReportServerData();
    }

    for (var i = 0; i < reportUsers.length; i++) {
        if (isMatchingReportUser(reportUsers[i], normalizedTarget) == true) {
            target.reported_user_id = reportUsers[i].id;
            return target;
        }
    }

    for (var j = 0; j < reportTasks.length; j++) {
        if (isMatchingReportTask(reportTasks[j], normalizedTarget) == true) {
            target.task_id = reportTasks[j].id;

            if (reportTasks[j].performer_id != null && reportTasks[j].performer_id != "") {
                target.reported_user_id = reportTasks[j].performer_id;
            }

            return target;
        }
    }

    return target;
}

function isMatchingReportUser(user, normalizedTarget) {
    return isMatchingReportValue([
        user.id,
        user.username,
        user.full_name,
        user.email
    ], normalizedTarget);
}

function isMatchingReportTask(task, normalizedTarget) {
    return isMatchingReportValue([task.id, task.title], normalizedTarget);
}

function isMatchingReportValue(values, normalizedTarget) {
    for (var i = 0; i < values.length; i++) {
        if (normalizeReportText(values[i]) == normalizedTarget) {
            return true;
        }
    }

    return false;
}

function getInputValue(id) {
    var element = getReportElement(id);

    if (element == null) {
        return "";
    }

    return element.value.trim();
}

function normalizeReportText(value) {
    return String(value || "").toLowerCase().trim();
}

function getReportElement(id) {
    return document.getElementById(id);
}

function addReportClick(id, action) {
    var element = getReportElement(id);

    if (element != null) {
        element.addEventListener("click", action);
    }
}

function connectReportForm() {
    var reportForm = getReportElement("reportForm");

    if (reportForm != null) {
        reportForm.addEventListener("submit", function (event) {
            event.preventDefault();
            submitReportForm();
        });
    }
}

function connectReportActions() {
    connectReportForm();
    addReportClick("reportBackButton", goToReportHome);
    addReportClick("reportHomeButton", goToReportHome);
    addReportClick("reportCancelButton", cancelReportForm);
    addReportClick("reportSuccessButton", confirmReportSuccess);
    addReportClick("requesterButton", function () {
        switchReportRole("Requester");
    });
    addReportClick("performerButton", function () {
        switchReportRole("Performer");
    });
}

var reportPreviousWindowOnload = window.onload;

window.onload = async function () {
    if (typeof reportPreviousWindowOnload == "function") {
        reportPreviousWindowOnload();
    }

    prepareReportScreen();

    try {
        await loadReportServerData();
    } catch (error) {
        setReportMessage("Report data could not be loaded from the server", false);
    }

    connectReportActions();
};
