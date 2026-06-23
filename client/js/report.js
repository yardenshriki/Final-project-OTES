var reportUserRole = localStorage.getItem("userRole") || "Requester";

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
    var reportName = document.getElementById("reportName");

    clearReportMessage();

    if (reportName != null && reportName.value == "") {
        reportName.value = localStorage.getItem("loggedInUsername") || "";
    }

    markReportRole();
}

function cancelReportForm() {
    var form = document.getElementById("reportForm");

    if (form != null) {
        form.reset();
    }

    clearReportMessage();
    goToReportHome();
}

function clearReportMessage() {
    var message = document.getElementById("reportMessage");

    if (message != null) {
        message.innerHTML = "";
        message.className = "message reportMessage";
    }
}

function setReportMessage(text, isSuccess) {
    var message = document.getElementById("reportMessage");

    if (message == null) {
        return;
    }

    message.innerHTML = text;
    message.className = isSuccess ? "message reportMessage reportSuccess" : "message reportMessage";
}

function showReportSuccessPopup() {
    var popup = document.getElementById("reportSuccessPopup");

    if (popup == null) {
        return;
    }

    popup.style.display = "flex";
    popup.setAttribute("aria-hidden", "false");
}

function confirmReportSuccess() {
    var popup = document.getElementById("reportSuccessPopup");

    if (popup != null) {
        popup.style.display = "none";
        popup.setAttribute("aria-hidden", "true");
    }

    goToReportHome();
}

function submitReportForm() {
    var reportType = getInputValue("reportType");
    var reportName = getInputValue("reportName");
    var reportedTarget = getInputValue("reportedTarget");
    var reportDescription = getInputValue("reportDescription");

    clearReportMessage();

    if (reportType == "" || reportName == "" || reportedTarget == "" || reportDescription == "") {
        setReportMessage("Please fill all required fields", false);
        return false;
    }

    setReportMessage("Saving report...", true);

    loadReportAdminData(function (data) {
        var updatedData = addReportToAdminData(data, reportType, reportName, reportedTarget, reportDescription);
        localStorage.setItem("otesAdminData", JSON.stringify(updatedData));

        var form = document.getElementById("reportForm");
        if (form != null) {
            form.reset();
        }

        clearReportMessage();
        showReportSuccessPopup();
    });

    return false;
}

function getInputValue(id) {
    var element = document.getElementById(id);

    if (element == null) {
        return "";
    }

    return element.value.trim();
}

function loadReportAdminData(done) {
    var savedData = localStorage.getItem("otesAdminData");

    if (savedData != null && savedData != "") {
        try {
            done(JSON.parse(savedData));
            return;
        } catch (error) {
        }
    }

    fetch("data/admin-data.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            done(data);
        })
        .catch(function () {
            done(getDefaultReportAdminData());
        });
}

function addReportToAdminData(data, reportType, reporterName, reportedTarget, reportDescription) {
    var dateText = new Date().toISOString().substring(0, 10);
    var targetUser = findReportedUser(data, reportedTarget);
    var targetUsername = targetUser != null ? targetUser.username : reportedTarget;
    var reporterUsername = localStorage.getItem("loggedInUsername") || reporterName;

    if (data.reports == null) {
        data.reports = [];
    }

    if (data.anomalies == null) {
        data.anomalies = [];
    }

    if (data.users == null) {
        data.users = [];
    }

    data.reports.unshift({
        date: dateText,
        username: targetUsername,
        reportedTarget: reportedTarget,
        reporterName: reporterName,
        reporterUsername: reporterUsername,
        type: reportType,
        description: reportDescription,
        status: "New"
    });

    if (targetUser != null) {
        if (targetUser.reportHistory == null) {
            targetUser.reportHistory = [];
        }

        targetUser.reportsFiled = Number(targetUser.reportsFiled || 0) + 1;
        targetUser.hasComplaint = true;
        targetUser.lastReportDate = dateText;
        targetUser.reportHistory.unshift({
            date: dateText,
            type: reportType,
            reporter: reporterName,
            target: reportedTarget,
            description: reportDescription,
            status: "New"
        });
    }

    updateReportAnomaly(data, targetUsername, reportType, reportDescription);
    updateReportedTask(data, reportedTarget);

    return data;
}

function findReportedUser(data, reportedTarget) {
    var target = normalizeReportText(reportedTarget);

    if (data.users != null) {
        for (var i = 0; i < data.users.length; i++) {
            var user = data.users[i];
            var values = [user.username, user.name, user.idNumber, user.email];

            for (var j = 0; j < values.length; j++) {
                if (normalizeReportText(values[j]) == target) {
                    return user;
                }
            }
        }
    }

    if (data.taskLogs != null) {
        for (var k = 0; k < data.taskLogs.length; k++) {
            var task = data.taskLogs[k];

            if (normalizeReportText(task.lastTask) == target) {
                return findReportedUser(data, task.fullName || task.performer || task.requester);
            }
        }
    }

    return null;
}

function updateReportAnomaly(data, username, reportType, description) {
    var anomaly = null;

    for (var i = 0; i < data.anomalies.length; i++) {
        if (normalizeReportText(data.anomalies[i].username) == normalizeReportText(username)) {
            anomaly = data.anomalies[i];
            break;
        }
    }

    if (anomaly == null) {
        anomaly = {
            username: username,
            reports: 0,
            daysLate: 0,
            paymentStatus: "pending",
            description: description
        };
        data.anomalies.push(anomaly);
    }

    anomaly.reports = Number(anomaly.reports || 0) + 1;
    anomaly.description = reportType + ": " + description;
}

function updateReportedTask(data, reportedTarget) {
    var target = normalizeReportText(reportedTarget);

    if (data.taskLogs == null) {
        return;
    }

    for (var i = 0; i < data.taskLogs.length; i++) {
        if (normalizeReportText(data.taskLogs[i].lastTask) == target) {
            data.taskLogs[i].anomaly = "yes";
        }
    }
}

function normalizeReportText(value) {
    return String(value || "").toLowerCase().trim();
}

function getDefaultReportAdminData() {
    return {
        reports: [],
        anomalies: [],
        users: [
            { username: "john_doe", name: "John Doe", idNumber: "123456789", email: "john@example.com", status: "Active", reportsFiled: 0, hasComplaint: false, reportHistory: [] },
            { username: "sarah_j", name: "Sarah Johnson", idNumber: "987654321", email: "sarah@example.com", status: "Restricted", reportsFiled: 0, hasComplaint: false, reportHistory: [] },
            { username: "anna_s", name: "Anna Smith", idNumber: "456789123", email: "anna@example.com", status: "Active", reportsFiled: 0, hasComplaint: false, reportHistory: [] }
        ],
        payments: [],
        taskLogs: [],
        dashboardCards: []
    };
}

document.addEventListener("DOMContentLoaded", function () {
    var reportForm = document.getElementById("reportForm");
    var backButton = document.getElementById("reportBackButton");
    var homeButton = document.getElementById("reportHomeButton");
    var cancelButton = document.getElementById("reportCancelButton");
    var successButton = document.getElementById("reportSuccessButton");
    var requesterButton = document.getElementById("requesterButton");
    var performerButton = document.getElementById("performerButton");

    prepareReportScreen();

    if (reportForm != null) {
        reportForm.addEventListener("submit", function (event) {
            event.preventDefault();
            submitReportForm();
        });
    }

    if (backButton != null) {
        backButton.addEventListener("click", goToReportHome);
    }

    if (homeButton != null) {
        homeButton.addEventListener("click", goToReportHome);
    }

    if (cancelButton != null) {
        cancelButton.addEventListener("click", cancelReportForm);
    }

    if (successButton != null) {
        successButton.addEventListener("click", confirmReportSuccess);
    }

    if (requesterButton != null) {
        requesterButton.addEventListener("click", function () {
            switchReportRole("Requester");
        });
    }

    if (performerButton != null) {
        performerButton.addEventListener("click", function () {
            switchReportRole("Performer");
        });
    }
});
