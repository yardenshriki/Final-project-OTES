//yarden shriki, lior zahavi
var ADMIN_API_BASE_URL = API_BASE_URL + "/api";
var ADMIN_RUNTIME_STORAGE_KEY = "otesAdminRuntimeUpdates";
var adminData = null;
var selectedAdminUser = null;
var selectedAdminPayment = null;
var selectedAdminTask = null;
var adminProfileBackSection = "adminUsersSection";
var adminTaskBackSection = "adminTasksSection";

function getSavedAdminRuntimeUpdates() {
    var savedData = localStorage.getItem(ADMIN_RUNTIME_STORAGE_KEY);

    if (savedData == null || savedData == "") {
        return {};
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        return {};
    }
}

function saveAdminData() {
    if (!selectedAdminUser) {
        return;
    }

    var updates = getSavedAdminRuntimeUpdates();
    var userKey = selectedAdminUser.dbId || selectedAdminUser.username;

    if (updates.users == null) {
        updates.users = {};
    }

    updates.users[userKey] = {
        warningSent: selectedAdminUser.warningSent,
        warningDate: selectedAdminUser.warningDate,
        restrictionType: selectedAdminUser.restrictionType,
        restrictionDuration: selectedAdminUser.restrictionDuration,
        restrictionReason: selectedAdminUser.restrictionReason,
        restrictionEmailSent: selectedAdminUser.restrictionEmailSent,
        restrictionEmailDate: selectedAdminUser.restrictionEmailDate,
        status: selectedAdminUser.status
    };

    localStorage.setItem(ADMIN_RUNTIME_STORAGE_KEY, JSON.stringify(updates));
}
function setAdminDataStatus(text) {
    var statusElement = document.getElementById("adminApiStatus");

    if (statusElement != null) {
        statusElement.innerHTML = text;
    }
}

function setAdminTextIfExists(elementId, text) {
    var element = document.getElementById(elementId);

    if (element != null) {
        element.innerHTML = text;
    }
}

function getAdminDisplayName() {
    var username = localStorage.getItem("adminUsername") || "Admin";

    if (username.toUpperCase().indexOf("ADMIN") == 0 && username.length > 5) {
        return username.substring(5);
    }

    return username;
}

function logoutAdmin() {
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminUsername");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("adminUsername");
    window.location.href = "index.html";
}

function getAdminDataSourceText() {
    return "Server API: " + ADMIN_API_BASE_URL;
}

function countAdminExceptions() {
    var count = 0;

    for (var i = 0; i < adminData.anomalies.length; i++) {
        if (Number(adminData.anomalies[i].reports) > 3) {
            count++;
        }
    }

    return count;
}

function countBlockedUsers() {
    var count = 0;

    for (var i = 0; i < adminData.users.length; i++) {
        var status = normalizeAdminValue(adminData.users[i].status);

        if (status == "blocked" || status == "suspended" || status == "immediate block" || status == "restricted") {
            count++;
        }
    }

    return count;
}

function renderAdminOwnerProfile() {
    if (adminData == null) {
        return;
    }

    var username = localStorage.getItem("adminUsername") || "Admin";
    var displayName = getAdminDisplayName();
    var permissions = ["Reports", "Exception status", "User management", "Payments", "System log", "Software updates", "Analytics", "Profile"];
    var permissionsHtml = "";

    setAdminTextIfExists("ownerAdminName", cleanAdminText(displayName));
    setAdminTextIfExists("ownerAdminUsername", cleanAdminText(username));
    setAdminTextIfExists("ownerAdminLastLogin", new Date().toLocaleDateString());
    setAdminTextIfExists("adminApiStatus", cleanAdminText(getAdminDataSourceText()));

    for (var j = 0; j < permissions.length; j++) {
        permissionsHtml += "<span>" + cleanAdminText(permissions[j]) + "</span>";
    }

    setAdminTextIfExists("adminPermissionsList", permissionsHtml);
}
function updateAdminWelcomeName() {
    var username = getAdminDisplayName();
    setAdminTextIfExists("adminWelcomeName", cleanAdminText(username));
}


function getAdminIcon(iconName) {
    var icons = {
        documentIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l5 5v15H6z"></path><path d="M14 2v6h6"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg>',
        usersIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        paymentIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        clipboardIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M9 12h6"></path><path d="M9 16h6"></path></svg>',
        downloadIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>',
        chartIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-3"></path></svg>',
        homeIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"></path><path d="M5 10v11h14V10"></path><path d="M9 21v-6h6v6"></path></svg>',
        profileIcon: '<svg class="realIcon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 22a8 8 0 0 1 16 0"></path></svg>'
    };

    if (icons[iconName] == null) {
        return icons.documentIcon;
    }

    return icons[iconName];
}
function renderAdminHomeCards() {
    var cardsList = document.getElementById("adminCardsList");

    if (cardsList == null || adminData.dashboardCards == null) {
        return;
    }

    cardsList.innerHTML = "";

    for (var i = 0; i < adminData.dashboardCards.length; i++) {
        var card = adminData.dashboardCards[i];
        var iconText = "";

        if (card.iconText != null) {
            iconText = cleanAdminText(card.iconText);
        }

        cardsList.innerHTML += '<button type="button" class="adminHomeCard" onclick="showAdminSection(\'' + cleanAdminText(card.sectionId) + '\')">' +
            '<span class="adminCardIcon">' + getAdminIcon(card.icon) + '</span>' +
            '<strong>' + cleanAdminText(card.title) + '</strong>' +
            '<small>' + cleanAdminText(card.subtitle) + '</small>' +
            '</button>';
    }
}

function markActiveAdminNav(sectionId) {
    var buttons = document.getElementsByClassName("adminNavButton");

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].className = buttons[i].className.replace(" activeAdminNav", "");

        if (buttons[i].getAttribute("onclick") != null && buttons[i].getAttribute("onclick").indexOf(sectionId) != -1) {
            buttons[i].className += " activeAdminNav";
        }
    }
}

function fetchAdminEndpoint(path) {
    return fetch(ADMIN_API_BASE_URL + path)
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw data;
                }

                return data;
            });
        });
}

function sendAdminEndpoint(path, method, body) {
    return fetch(ADMIN_API_BASE_URL + path, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw data;
                }

                return data;
            });
        });
}

function postAdminEndpoint(path, body) {
    return sendAdminEndpoint(path, "POST", body);
}

function patchAdminEndpoint(path, body) {
    return sendAdminEndpoint(path, "PATCH", body);
}

function adminArray(data) {
    return Array.isArray(data) ? data : [];
}

function formatAdminDateValue(value) {
    if (value == null || value == "") {
        return "--";
    }

    var date = new Date(value);

    if (isNaN(date.getTime())) {
        return String(value).substring(0, 10);
    }

    return date.toISOString().substring(0, 10);
}

function getAdminUserNameById(users, userId) {
    for (var i = 0; i < users.length; i++) {
        if (String(users[i].id) == String(userId)) {
            return users[i].full_name || users[i].username || "User " + userId;
        }
    }

    return userId == null || userId == "" ? "--" : "User " + userId;
}

function getAdminTaskById(tasks, taskId) {
    for (var i = 0; i < tasks.length; i++) {
        if (String(tasks[i].id) == String(taskId)) {
            return tasks[i];
        }
    }

    return null;
}

function getAdminTaskStatus(task) {
    if (task == null) {
        return "open";
    }

    if (task.completed_at != null && task.completed_at != "") {
        return "completed";
    }

    if (task.performer_id != null && task.performer_id != "") {
        return "in-progress";
    }

    return task.state || task.work_status || "open";
}

function getDefaultAdminSoftware() {
    return {
        versionName: "v2.5.0",
        versionDate: "2026-02-01",
        changes: [
            "Improved system performance and load times",
            "Enhanced security features for user data protection",
            "Added new reporting and analytics dashboard",
            "Fixed bugs in payment processing system",
            "Updated user interface with modern design elements"
        ]
    };
}

function getDefaultAdminDashboardCards() {
    return [
        { title: "New reports today", subtitle: "View recent anomaly reports", sectionId: "adminReportsSection", icon: "documentIcon" },
        { title: "User Account Management", subtitle: "Manage all system users", sectionId: "adminUsersSection", icon: "usersIcon" },
        { title: "Payment pending", subtitle: "Pending transactions", sectionId: "adminPaymentsSection", icon: "paymentIcon", iconText: "$" },
        { title: "System log of tasks", subtitle: "View task activity", sectionId: "adminTasksSection", icon: "clipboardIcon" },
        { title: "Software update details", subtitle: "Latest version information", sectionId: "adminSoftwareSection", icon: "downloadIcon" },
        { title: "Analytics & Graphs", subtitle: "System performance metrics", sectionId: "adminAnalyticsSection", icon: "chartIcon" }
    ];
}

function normalizeServerReportStatus(status) {
    var value = normalizeAdminValue(status);

    if (value == "closed") {
        return "Closed";
    }

    if (value == "in-review" || value == "in_review" || value == "review") {
        return "In Review";
    }

    return "New";
}

function getReportStatusRank(status) {
    var value = normalizeAdminValue(status);

    if (value == "new" || value == "open") {
        return 0;
    }

    if (value == "in review" || value == "in-review" || value == "review") {
        return 1;
    }

    if (value == "closed") {
        return 2;
    }

    return 3;
}

function getReportStatusClass(status) {
    var value = normalizeAdminValue(status);

    if (value == "new" || value == "open") {
        return "statusOpen";
    }

    if (value == "closed") {
        return "statusDone";
    }

    return "statusProgress";
}

function getAdminUserStatusFromRole(role) {
    var value = normalizeAdminValue(role);

    if (value == "blocked") {
        return "Blocked";
    }

    if (value == "immediate block") {
        return "Immediate Block";
    }

    if (value == "suspended") {
        return "Blocked";
    }

    return "Active";
}

function normalizeAdminReportsFromServer(reports) {
    var result = [];

    for (var i = 0; i < reports.length; i++) {
        result.push({
            id: reports[i].id,
            date: formatAdminDateValue(reports[i].created_at),
            username: reports[i].reported_user_name || reports[i].reporter_name || "User " + reports[i].reporter_id,
            reporterName: reports[i].reporter_name || "User " + reports[i].reporter_id,
            reportedUserName: reports[i].reported_user_name || "User " + reports[i].reported_user_id,
            type: reports[i].reason || "Report",
            description: reports[i].description || reports[i].task_title || "",
            status: normalizeServerReportStatus(reports[i].status),
            reporterId: reports[i].reporter_id,
            reportedUserId: reports[i].reported_user_id,
            taskId: reports[i].task_id
        });
    }

    return result;
}

function getUserPaymentStatus(payments, userId) {
    for (var i = 0; i < payments.length; i++) {
        if (String(payments[i].requester_id) == String(userId) || String(payments[i].performer_id) == String(userId)) {
            return payments[i].status || "pending";
        }
    }

    return "none";
}

function getUserLateDays(tasks, userId) {
    var today = new Date();
    var maxDaysLate = 0;

    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var isRelated = String(task.requester_id) == String(userId) || String(task.performer_id) == String(userId);

        if (!isRelated || task.deadline == null || normalizeAdminValue(getAdminTaskStatus(task)) == "completed") {
            continue;
        }

        var deadline = new Date(task.deadline);

        if (isNaN(deadline.getTime()) || deadline >= today) {
            continue;
        }

        var daysLate = Math.ceil((today.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000));

        if (daysLate > maxDaysLate) {
            maxDaysLate = daysLate;
        }
    }

    return maxDaysLate;
}

function normalizeAdminAnomaliesFromServer(reports, users, tasks, payments) {
    var grouped = {};
    var result = [];

    for (var i = 0; i < reports.length; i++) {
        var report = reports[i];
        var userId = report.reported_user_id || report.reporter_id;

        if (userId == null || userId == "") {
            continue;
        }

        if (grouped[userId] == null) {
            grouped[userId] = {
                username: report.reported_user_name || getAdminUserNameById(users, userId),
                reports: 0,
                daysLate: getUserLateDays(tasks, userId),
                paymentStatus: getUserPaymentStatus(payments, userId),
                description: report.description || report.reason || "Reports pending review"
            };
        }

        grouped[userId].reports++;
    }

    for (var key in grouped) {
        if (Number(grouped[key].reports) > 3) {
            result.push(grouped[key]);
        }
    }

    return result;
}

function normalizeAdminPaymentsFromServer(payments, tasks) {
    var result = [];

    for (var i = 0; i < payments.length; i++) {
        var task = getAdminTaskById(tasks, payments[i].task_id);
        var transactionId = payments[i].receipt_number || "PAY-" + payments[i].id;

        result.push({
            id: payments[i].id,
            taskId: payments[i].task_id,
            requesterId: payments[i].requester_id,
            performerId: payments[i].performer_id,
            transactionId: transactionId,
            payer: payments[i].requester_name || "User " + payments[i].requester_id,
            payee: payments[i].performer_name || "User " + payments[i].performer_id,
            status: payments[i].status || "pending",
            receipt: payments[i].receipt_number ? "Yes" : "No",
            date: formatAdminDateValue(payments[i].paid_at || payments[i].created_at),
            taskName: payments[i].task_title || (task ? task.title : "Task " + payments[i].task_id),
            description: "Payment amount: $" + (payments[i].amount || "0"),
            taskStatus: getAdminTaskStatus(task)
        });
    }

    return result;
}

function normalizeAdminTaskLogsFromServer(tasks, reports) {
    var result = [];
    var reportedTasks = {};

    for (var i = 0; i < reports.length; i++) {
        if (reports[i].task_id != null) {
            reportedTasks[reports[i].task_id] = true;
        }
    }

    for (var j = 0; j < tasks.length; j++) {
        result.push({
            id: tasks[j].id,
            fullName: tasks[j].performer_name || tasks[j].requester_name || "--",
            lastTask: tasks[j].title || "Task " + tasks[j].id,
            activeStatus: getAdminTaskStatus(tasks[j]),
            date: formatAdminDateValue(tasks[j].created_at),
            requester: tasks[j].requester_name || "User " + tasks[j].requester_id,
            performer: tasks[j].performer_name || "Not assigned",
            requesterId: tasks[j].requester_id || "--",
            performerId: tasks[j].performer_id || "--",
            anomaly: reportedTasks[tasks[j].id] ? "yes" : "no"
        });
    }

    return result;
}

function normalizeAdminUsersFromServer(users, tasks, reports, payments) {
    var result = [];
    var updates = getSavedAdminRuntimeUpdates();

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userTasks = [];
        var userPayments = [];
        var userReports = [];
        var lastTask = "--";
        var completedTasks = 0;
        var activeTasks = 0;
        var earnings = 0;

        for (var t = 0; t < tasks.length; t++) {
            var relatedTask = String(tasks[t].requester_id) == String(user.id) || String(tasks[t].performer_id) == String(user.id);

            if (!relatedTask) {
                continue;
            }

            var status = normalizeAdminValue(getAdminTaskStatus(tasks[t]));
            userTasks.push(tasks[t].title || "Task " + tasks[t].id);
            lastTask = tasks[t].title || lastTask;

            if (status == "completed") {
                completedTasks++;
            } else if (status != "cancelled" && status != "canceled") {
                activeTasks++;
            }
        }

        for (var p = 0; p < payments.length; p++) {
            if (String(payments[p].requester_id) == String(user.id) || String(payments[p].performer_id) == String(user.id)) {
                userPayments.push((payments[p].receipt_number || "PAY-" + payments[p].id) + " - " + (payments[p].status || "pending"));
            }

            if (String(payments[p].performer_id) == String(user.id) && normalizeAdminValue(payments[p].status) == "paid") {
                earnings += Number(payments[p].amount || 0);
            }
        }

        for (var r = 0; r < reports.length; r++) {
            if (String(reports[r].reported_user_id) == String(user.id) || String(reports[r].reporter_id) == String(user.id)) {
                userReports.push(formatAdminDateValue(reports[r].created_at) + " - " + (reports[r].reason || "Report"));
            }
        }

        var runtimeUser = updates.users && (updates.users[user.id] || updates.users[user.username]) ? (updates.users[user.id] || updates.users[user.username]) : {};
        var normalizedUser = {
            dbId: user.id,
            username: user.username || user.full_name || "User " + user.id,
            name: user.full_name || user.username || "User " + user.id,
            idNumber: user.id,
            email: user.email || "",
            password: "",
            passwordUpdated: "",
            bio: user.bio || "",
            skills: user.skills || "",
            rating: "",
            ratingCount: 0,
            completedTasks: completedTasks,
            activeTasks: activeTasks,
            earnings: earnings,
            joinDate: formatAdminDateValue(user.created_at),
            lastTask: lastTask,
            role: user.role || "",
            status: getAdminUserStatusFromRole(user.role),
            tasks: userTasks,
            ratings: [],
            payments: userPayments,
            warningSent: false,
            warningDate: "",
            restrictionType: "",
            restrictionDuration: "",
            restrictionReason: "",
            restrictionEmailSent: false,
            restrictionEmailDate: "",
            reportsFiled: userReports.length,
            hasComplaint: userReports.length > 0,
            lastReportDate: userReports.length > 0 ? userReports[0].split(" - ")[0] : "",
            reportHistory: userReports
        };

        for (var key in runtimeUser) {
            normalizedUser[key] = runtimeUser[key];
        }

        result.push(normalizedUser);
    }

    return result;
}

function buildAdminDataFromServer(serverData) {
    var users = adminArray(serverData.users);
    var tasks = adminArray(serverData.tasks);
    var reports = adminArray(serverData.reports);
    var payments = adminArray(serverData.payments);

    return {
        reports: normalizeAdminReportsFromServer(reports),
        anomalies: normalizeAdminAnomaliesFromServer(reports, users, tasks, payments),
        users: normalizeAdminUsersFromServer(users, tasks, reports, payments),
        payments: normalizeAdminPaymentsFromServer(payments, tasks),
        taskLogs: normalizeAdminTaskLogsFromServer(tasks, reports),
        software: getDefaultAdminSoftware(),
        dashboardCards: getDefaultAdminDashboardCards()
    };
}

function loadAdminData() {
    setAdminDataStatus("Loading data from server API...");

    Promise.all([
        fetchAdminEndpoint("/users"),
        fetchAdminEndpoint("/tasks"),
        fetchAdminEndpoint("/report"),
        fetchAdminEndpoint("/payment")
    ])
        .then(function (responses) {
            adminData = buildAdminDataFromServer({
                users: responses[0],
                tasks: responses[1],
                reports: responses[2],
                payments: responses[3]
            });
            updateAdminWelcomeName();
            setAdminDataStatus("Data source: server API connected.");
            renderAdminDashboard();
        })
        .catch(function (error) {
            var message = error != null && error.message != null ? error.message : "Admin data could not be loaded from server.";
            setAdminDataStatus("Data source error: " + cleanAdminText(message));
        });
}

function showAdminSection(sectionId) {
    var sections = document.getElementsByClassName("adminSection");

    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = "none";
    }

    if (document.getElementById(sectionId) != null) {
        document.getElementById(sectionId).style.display = "block";
    }

    markActiveAdminNav(sectionId);
    closeMenu();
}

function renderAdminDashboard() {
    setAdminTextIfExists("reportsCount", adminData.reports.length);
    setAdminTextIfExists("usersCount", adminData.users.length);
    setAdminTextIfExists("paymentsCount", adminData.payments.length);
    setAdminTextIfExists("tasksCount", adminData.taskLogs.length);

    renderAdminHomeCards();
    renderReports();
    renderAnomalies();
    renderUsers();
    renderPayments();
    renderTasksLog();
    renderSoftwareDetails();
    renderAnalyticsCharts();
    renderAdminOwnerProfile();
    connectAdminSearches();
    showAdminSection("adminDashboardSection");
}

function connectAdminSearches() {
    document.getElementById("reportSearch").oninput = renderReports;
    document.getElementById("userSearch").oninput = renderUsers;
    document.getElementById("paymentSearch").oninput = renderPayments;
}

function cleanAdminText(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function adminInitials(name) {
    var parts = name.split(" ");
    var result = parts[0].charAt(0);

    if (parts.length > 1) {
        result += parts[1].charAt(0);
    }

    return result.toUpperCase();
}

function renderReports() {
    var body = document.getElementById("reportsTableBody");
    var search = document.getElementById("reportSearch").value.toLowerCase();
    var reports = adminData.reports.slice().sort(function (a, b) {
        var statusDiff = getReportStatusRank(a.status) - getReportStatusRank(b.status);

        if (statusDiff != 0) {
            return statusDiff;
        }

        return new Date(b.date) - new Date(a.date);
    });

    body.innerHTML = "";

    for (var i = 0; i < reports.length; i++) {
        if ((reports[i].username + reports[i].reporterName + reports[i].reportedUserName + reports[i].description + reports[i].type).toLowerCase().indexOf(search) == -1) {
            continue;
        }

        body.innerHTML += "<tr><td>" + cleanAdminText(reports[i].date) + "</td><td>" + getReportUserLink(reports[i].reporterId, reports[i].reporterName) + "</td><td>" + getReportUserLink(reports[i].reportedUserId, reports[i].reportedUserName) + "</td><td>" + cleanAdminText(reports[i].type) + "</td><td>" + cleanAdminText(reports[i].description) + "</td><td><span class='" + getReportStatusClass(reports[i].status) + "'>" + cleanAdminText(reports[i].status) + "</span></td></tr>";
    }
}

function exportReportsPdf() {
    if (!adminData || !adminData.reports) {
        return;
    }

    var searchInput = document.getElementById("reportSearch");
    var search = searchInput == null ? "" : searchInput.value.toLowerCase();
    var reports = adminData.reports.slice().sort(function (a, b) {
        var statusDiff = getReportStatusRank(a.status) - getReportStatusRank(b.status);

        if (statusDiff != 0) {
            return statusDiff;
        }

        return new Date(b.date) - new Date(a.date);
    });
    var rows = "";

    for (var i = 0; i < reports.length; i++) {
        var reportText = (reports[i].username + reports[i].reporterName + reports[i].reportedUserName + reports[i].description + reports[i].type).toLowerCase();

        if (reportText.indexOf(search) == -1) {
            continue;
        }

        rows += "<tr><td>" + cleanAdminText(reports[i].date) + "</td><td>" + cleanAdminText(reports[i].reporterName) + "</td><td>" + cleanAdminText(reports[i].reportedUserName) + "</td><td>" + cleanAdminText(reports[i].type) + "</td><td>" + cleanAdminText(reports[i].description) + "</td><td>" + cleanAdminText(reports[i].status) + "</td></tr>";
    }

    if (rows == "") {
        rows = "<tr><td colspan='6'>No reports found</td></tr>";
    }

    var reportWindow = window.open("", "_blank");

    if (!reportWindow) {
        alert("Reports PDF export could not open. Please allow popups and try again.");
        return;
    }

    reportWindow.document.write("<!doctype html><html><head><title>New Reports Today</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#4f3f2b}h1{font-size:28px}table{width:100%;border-collapse:collapse;margin-top:24px}th{background:#e6bf82;text-align:left}th,td{border-bottom:1px solid #ead6b2;padding:10px 8px;vertical-align:top}</style></head><body><h1>New Reports Today</h1><table><thead><tr><th>Date</th><th>Reporter</th><th>Reported User</th><th>Report Type</th><th>Description</th><th>Status</th></tr></thead><tbody>" + rows + "</tbody></table><script>window.onload=function(){window.print();};<\/script></body></html>");
    reportWindow.document.close();
}

function getReportUserLink(userId, userName) {
    if (userId == null || userId == "") {
        return cleanAdminText(userName || "Unknown user");
    }

    return "<button type='button' class='tableLink' onclick='openAdminUserByDbId(\"" + cleanAdminText(userId) + "\", \"adminReportsSection\")'>" + cleanAdminText(userName || ("User " + userId)) + "</button>";
}

function renderAnomalies() {
    var body = document.getElementById("anomaliesTableBody");
    body.innerHTML = "";

    for (var i = 0; i < adminData.anomalies.length; i++) {
        var anomaly = adminData.anomalies[i];
        var isException = Number(anomaly.reports) > 3;
        var rowClass = isException ? " class='exceptionHighRisk'" : "";
        var userClass = isException ? "tableLink dangerText" : "tableLink";
        var exceptionText = isException ? "<span class='dangerBadge'>Exception</span>" : "<span class='statusProgress'>Normal</span>";

        body.innerHTML += "<tr" + rowClass + ">" +
            "<td><button type='button' class='" + userClass + "' onclick='openAdminUserByUsername(\"" + cleanAdminText(anomaly.username) + "\", \"adminAnomaliesSection\")'>" + cleanAdminText(anomaly.username) + "</button></td>" +
            "<td>" + cleanAdminText(anomaly.reports) + "</td>" +
            "<td>" + cleanAdminText(anomaly.daysLate) + "</td>" +
            "<td>" + cleanAdminText(anomaly.paymentStatus) + "</td>" +
            "<td>" + cleanAdminText(anomaly.description) + "</td>" +
            "<td>" + exceptionText + "</td>" +
            "</tr>";
    }
}

function exportExceptionStatusPdf() {
    if (!adminData || !adminData.anomalies) {
        return;
    }

    var reportWindow = window.open("", "_blank");

    if (!reportWindow) {
        alert("Exception report export could not open. Please allow popups and try again.");
        return;
    }

    var rows = "";

    for (var i = 0; i < adminData.anomalies.length; i++) {
        var anomaly = adminData.anomalies[i];
        var exceptionLabel = Number(anomaly.reports) > 3 ? "Exception" : "Normal";

        rows += "<tr><td>" + cleanAdminText(anomaly.username) + "</td><td>" + cleanAdminText(anomaly.reports) + "</td><td>" + cleanAdminText(anomaly.daysLate) + "</td><td>" + cleanAdminText(anomaly.paymentStatus) + "</td><td>" + cleanAdminText(anomaly.description) + "</td><td>" + exceptionLabel + "</td></tr>";
    }

    reportWindow.document.write("<!doctype html><html><head><title>Exception Status Report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#4f3f2b}h1{font-size:28px}table{width:100%;border-collapse:collapse;margin-top:24px}th{background:#e6bf82;text-align:left}th,td{border-bottom:1px solid #ead6b2;padding:10px 8px}</style></head><body><h1>Exception Status Report</h1><table><thead><tr><th>Username</th><th>Reports Filed</th><th>Days Late</th><th>Payment Status</th><th>Description</th><th>Exception</th></tr></thead><tbody>" + rows + "</tbody></table><script>window.onload=function(){window.print();};<\/script></body></html>");
    reportWindow.document.close();
}

function renderUsers() {
    var body = document.getElementById("usersTableBody");
    var search = document.getElementById("userSearch").value.toLowerCase();
    body.innerHTML = "";

    for (var i = 0; i < adminData.users.length; i++) {
        var user = adminData.users[i];

        if ((user.name + user.idNumber + user.username).toLowerCase().indexOf(search) == -1) {
            continue;
        }

        body.innerHTML += "<tr><td><button type='button' class='tableLink' onclick='openAdminUser(" + i + ", \"adminUsersSection\")'>" + cleanAdminText(user.name) + "</button></td><td>" + cleanAdminText(user.idNumber) + "</td><td>" + cleanAdminText(user.joinDate) + "</td><td>" + cleanAdminText(user.lastTask) + "</td><td><span class='" + getAdminStatusClass(user.status) + "'>" + cleanAdminText(user.status) + "</span></td></tr>";
    }
}

function getAdminStatusClass(status) {
    if (status == "Active") {
        return "statusProgress";
    }

    if (status == "Blocked" || status == "Suspended" || status == "Immediate Block") {
        return "statusDone";
    }

    return "statusOpen";
}

function openAdminUserByUsername(username, backSection) {
    var searchedUsername = normalizeAdminValue(username);

    for (var i = 0; i < adminData.users.length; i++) {
        var userUsername = normalizeAdminValue(adminData.users[i].username);
        var userName = normalizeAdminValue(adminData.users[i].name);

        if (userUsername == searchedUsername || userName == searchedUsername) {
            openAdminUser(i, backSection || "adminAnomaliesSection");
            return;
        }
    }
}

function openAdminUserByDbId(userId, backSection) {
    for (var i = 0; i < adminData.users.length; i++) {
        if (String(adminData.users[i].dbId) == String(userId) || String(adminData.users[i].idNumber) == String(userId)) {
            openAdminUser(i, backSection || "adminReportsSection");
            return;
        }
    }
}

function openAdminUser(index, backSection) {
    selectedAdminUser = adminData.users[index];
    adminProfileBackSection = backSection || "adminUsersSection";

    if (!selectedAdminUser) {
        return;
    }

    var warningText = selectedAdminUser.warningSent ? "Warning sent on " + cleanAdminText(selectedAdminUser.warningDate) : "No warning sent";
    var statusClass = getAdminStatusClass(selectedAdminUser.status);
    var statusElement = document.getElementById("profileUserStatus");

    document.getElementById("profileUserName").innerHTML = cleanAdminText(selectedAdminUser.name);
    document.getElementById("profileFullName").innerHTML = cleanAdminText(selectedAdminUser.name);
    document.getElementById("profileUserId").innerHTML = cleanAdminText(selectedAdminUser.idNumber);
    document.getElementById("profileUserEmail").innerHTML = cleanAdminText(selectedAdminUser.email);
    statusElement.innerHTML = cleanAdminText(selectedAdminUser.status);
    statusElement.className = "adminStatusBadge " + statusClass;
    document.getElementById("profileWarningStatus").innerHTML = warningText;
    document.getElementById("profileActionDetails").innerHTML = "";

    showAdminSection("adminUserProfileSection");
}
async function showProfileInfo(type) {
    if (!selectedAdminUser) {
        return;
    }

    if (type == "ratings") {
        showAdminUserRatingHistory();
        return;
    }

    var title = "";
    var items = [];

    if (type == "tasks") {
        title = "Task History";
        items = selectedAdminUser.tasks || [];
    } else if (type == "payments") {
        title = "Recent Payments";
        items = selectedAdminUser.payments || [];
    } else {
        return;
    }

    var html = "<h3>" + cleanAdminText(title) + "</h3>";
    for (var i = 0; i < items.length; i++) {
        html += "<p>" + cleanAdminText(items[i]) + "</p>";
    }
    document.getElementById("profileActionDetails").innerHTML = html;
}

async function showAdminUserRatingHistory() {
    var details = document.getElementById("profileActionDetails");

    if (details == null || !selectedAdminUser) {
        return;
    }

    var userId = selectedAdminUser.dbId || selectedAdminUser.idNumber;

    if (userId == null || userId == "") {
        details.innerHTML = "<h3>Rating History</h3><p>No saved rating details for this user yet.</p>";
        return;
    }

    details.innerHTML = "<h3>Rating History</h3><p>Loading user ratings...</p>";

    try {
        var ratingData = await fetchAdminEndpoint("/rating/user/" + userId);
        var ratings = adminArray(ratingData.ratings);
        var averageRating = Number(ratingData.averageRating || 0);
        var totalRatings = Number(ratingData.totalRatings || ratings.length || 0);

        if (ratings.length == 0) {
            details.innerHTML = "<h3>Rating History</h3><p>No saved rating details for this user yet.</p>";
            return;
        }

        var html = "<h3>Rating History</h3>" +
            "<div class='adminRatingSummary'>" +
            "<div><span>Average Rating</span><strong>" + cleanAdminText(averageRating.toFixed(1)) + " / 5</strong></div>" +
            "<div><span>Total Reviews</span><strong>" + cleanAdminText(totalRatings) + "</strong></div>" +
            "</div>";

        for (var i = 0; i < ratings.length; i++) {
            html += buildAdminUserRatingHtml(ratings[i]);
        }

        details.innerHTML = html;
    } catch (error) {
        details.innerHTML = "<h3>Rating History</h3><p>Rating details could not be loaded.</p>";
    }
}

function buildAdminRatingStars(ratingValue) {
    var value = Number(ratingValue || 0);
    var stars = "";

    for (var i = 1; i <= 5; i++) {
        stars += i <= value ? "&#9733;" : "&#9734;";
    }

    return stars;
}

function buildAdminUserRatingHtml(rating) {
    var ratingValue = Number(rating.rating || 0);

    return "<div class='adminUserRatingItem'>" +
        "<p><strong>Task:</strong> " + cleanAdminText(rating.task_title || "Task " + rating.task_id) + "</p>" +
        "<p><strong>Requester:</strong> " + cleanAdminText(rating.requester_name || "Unknown requester") + "</p>" +
        "<p><strong>Rating:</strong> " + buildAdminRatingStars(ratingValue) + " (" + cleanAdminText(ratingValue) + "/5)</p>" +
        "<p><strong>Review:</strong> " + cleanAdminText(rating.feedback || "No written review was added.") + "</p>" +
        "<p><strong>Date:</strong> " + cleanAdminText(formatAdminDateValue(rating.created_at)) + "</p>" +
        "</div>";
}
function renderSmallList(elementId, items) {
    var element = document.getElementById(elementId);
    element.innerHTML = "";

    for (var i = 0; i < items.length; i++) {
        element.innerHTML += "<p>" + cleanAdminText(items[i]) + "</p>";
    }
}

function getTodayString() {
    var today = new Date();
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
}

function getWarningReasonDefaultText() {
    return "User report requires admin attention.";
}

function getWarningMailboxText(reason) {
    var warningDate = getTodayString();
    var cleanReason = reason && reason.trim() != "" ? reason.trim() : getWarningReasonDefaultText();

    return "Hello " + selectedAdminUser.name + ",\n\n" +
        "A warning was issued for your account.\n" +
        "Date: " + warningDate + "\n" +
        "Reason: " + cleanReason + "\n\n" +
        "Please resolve the reported issues. Continued exceptions may lead to account restriction or blocking.\n\n" +
        "OTES Admin Team";
}

function getRestrictionRoleValue(type) {
    return type == "Immediate Block" ? "Immediate Block" : "Blocked";
}

function getRestrictionMailboxText(type, duration, reason) {
    var durationText = type == "Immediate Block" ? "Immediate" : (duration ? duration + " days" : "Not specified");

    return "Hello " + selectedAdminUser.name + ",\n\n" +
        "An admin decision was made regarding your account.\n" +
        "Decision: " + getRestrictionRoleValue(type) + "\n" +
        "Restriction type: " + type + "\n" +
        "Duration: " + durationText + "\n" +
        "Reason: " + (reason || "No reason entered") + "\n\n" +
        "This decision affects your access to the OTES system.\n\n" +
        "OTES Admin Team";
}

function markSelectedUserReportsInReview() {
    if (!selectedAdminUser || selectedAdminUser.dbId == null || selectedAdminUser.dbId == "") {
        return Promise.resolve();
    }

    var targetReportIndexes = [];
    var updateRequests = [];

    for (var i = 0; i < adminData.reports.length; i++) {
        var report = adminData.reports[i];
        var isReportedUser = String(report.reportedUserId) == String(selectedAdminUser.dbId);
        var isNewReport = getReportStatusRank(report.status) == 0;

        if (!isReportedUser || !isNewReport) {
            continue;
        }

        targetReportIndexes.push(i);

        if (report.id != null && report.id != "") {
            updateRequests.push(patchAdminEndpoint("/report/" + report.id + "/status", {
                status: "in-review"
            }));
        }
    }

    return Promise.all(updateRequests).then(function () {
        for (var j = 0; j < targetReportIndexes.length; j++) {
            adminData.reports[targetReportIndexes[j]].status = "In Review";
        }

        saveAdminData();
        renderReports();
    });
}

function openWarningEmailPage() {
    if (!selectedAdminUser) {
        return;
    }

    var previousWarning = selectedAdminUser.warningSent ? "A warning email was already sent on " + cleanAdminText(selectedAdminUser.warningDate) + "." : "No previous warning email was sent.";
    document.getElementById("warningExistingInfo").innerHTML = previousWarning;
    document.getElementById("warningUsername").value = selectedAdminUser.username;
    document.getElementById("warningEmailText").value = getWarningReasonDefaultText();
    showAdminSection("adminWarningEmailSection");
}

function sendWarningEmail() {
    if (!selectedAdminUser) {
        return;
    }

    var warningTextElement = document.getElementById("warningEmailText");
    var warningReason = warningTextElement ? warningTextElement.value.trim() : "";
    var warningText = getWarningMailboxText(warningReason);

    if (warningReason == "") {
        warningReason = getWarningReasonDefaultText();
    }

    if (selectedAdminUser.dbId == null || selectedAdminUser.dbId == "") {
        document.getElementById("warningExistingInfo").innerHTML = "Warning email could not be sent because this user has no database ID.";
        return;
    }

    document.getElementById("warningExistingInfo").innerHTML = "Sending warning email...";

    postAdminEndpoint("/notification", {
        user_id: selectedAdminUser.dbId,
        type: "report",
        title: "Warning Email - " + getTodayString(),
        message: warningText
    })
        .then(function () {
            return markSelectedUserReportsInReview();
        })
        .then(function () {
            selectedAdminUser.warningSent = true;
            selectedAdminUser.warningDate = getTodayString();
            saveAdminData();
            document.getElementById("warningExistingInfo").innerHTML = "Warning email sent on " + selectedAdminUser.warningDate + ". It was added to this user's mailbox.";
            renderUsers();
        })
        .catch(function (error) {
            var message = error && error.message ? error.message : "Failed to send warning email.";
            document.getElementById("warningExistingInfo").innerHTML = message;
        });
}

function openRestrictionEdit() {
    if (!selectedAdminUser) {
        return;
    }

    document.getElementById("restrictionTypeEdit").value = selectedAdminUser.restrictionType || "Suspended";
    document.getElementById("restrictionDuration").value = selectedAdminUser.restrictionDuration || "";
    document.getElementById("restrictionEmailNotice").innerHTML = "";
    document.getElementById("restrictionReasonEdit").value = selectedAdminUser.restrictionReason || "";
    updateRestrictionDurationField();
    showAdminSection("adminRestrictionEditSection");
}
function updateRestrictionDurationField() {
    var typeInput = document.getElementById("restrictionTypeEdit");
    var durationGroup = document.getElementById("restrictionDurationGroup");
    var durationInput = document.getElementById("restrictionDuration");

    if (!typeInput || !durationGroup || !durationInput) {
        return;
    }

    if (typeInput.value == "Immediate Block") {
        durationGroup.style.display = "none";
        durationInput.value = "";
    } else {
        durationGroup.style.display = "block";
    }
}
function openRestrictionConfirm() {
    if (!selectedAdminUser) {
        return;
    }

    var type = document.getElementById("restrictionTypeEdit").value;
    var duration = document.getElementById("restrictionDuration").value;
    var reason = document.getElementById("restrictionReasonEdit").value;
    var durationText = type == "Immediate Block" ? "Immediate" : cleanAdminText(duration || "Not set") + (duration ? " days" : "");

    document.getElementById("confirmUsername").innerHTML = cleanAdminText(selectedAdminUser.username);
    document.getElementById("confirmRestrictionType").innerHTML = cleanAdminText(type);
    document.getElementById("confirmDuration").innerHTML = durationText;
    document.getElementById("confirmReason").innerHTML = cleanAdminText(reason || "No reason entered");
    document.getElementById("restrictionEmailNotice").innerHTML = "";
    showAdminSection("restrictionConfirmSection");
}

function approveRestriction() {
    if (!selectedAdminUser) {
        return;
    }

    var type = document.getElementById("restrictionTypeEdit").value;
    var duration = document.getElementById("restrictionDuration").value;
    var reason = document.getElementById("restrictionReasonEdit").value;
    var roleValue = getRestrictionRoleValue(type);
    var roleUpdated = false;

    if (selectedAdminUser.dbId == null || selectedAdminUser.dbId == "") {
        document.getElementById("restrictionEmailNotice").innerHTML = "Restriction could not be saved because this user has no database ID.";
        return;
    }

    document.getElementById("restrictionEmailNotice").innerHTML = "Saving restriction...";

    patchAdminEndpoint("/users/" + selectedAdminUser.dbId + "/role", {
        role: roleValue
    })
        .then(function () {
            roleUpdated = true;
            selectedAdminUser.role = roleValue;
            selectedAdminUser.restrictionType = type;
            selectedAdminUser.restrictionDuration = duration;
            selectedAdminUser.restrictionReason = reason;
            selectedAdminUser.restrictionEmailSent = true;
            selectedAdminUser.restrictionEmailDate = getTodayString();
            selectedAdminUser.status = roleValue;
            saveAdminData();
            renderUsers();

            return postAdminEndpoint("/notification", {
                user_id: selectedAdminUser.dbId,
                type: "report",
                title: "Account Restriction Decision",
                message: getRestrictionMailboxText(type, duration, reason)
            });
        })
        .then(function () {
            return markSelectedUserReportsInReview();
        })
        .then(function () {
            document.getElementById("restrictionEmailNotice").innerHTML = "Email Sent: a restriction email was sent to " + cleanAdminText(selectedAdminUser.email) + " on " + selectedAdminUser.restrictionEmailDate + ".";
        })
        .catch(function (error) {
            var message = error && error.message ? error.message : "Restriction action failed.";

            if (roleUpdated) {
                document.getElementById("restrictionEmailNotice").innerHTML = "Restriction was saved, but the mailbox notification failed: " + cleanAdminText(message);
            } else {
                document.getElementById("restrictionEmailNotice").innerHTML = cleanAdminText(message);
            }
        });
}
function getPaymentUserLink(name, backSection) {
    var userIndex = findAdminUserByNameOrId(name, "");

    if (userIndex == -1) {
        return cleanAdminText(name);
    }

    return "<button type='button' class='tableLink' onclick='openAdminUser(" + userIndex + ", \"" + cleanAdminText(backSection) + "\")'>" + cleanAdminText(name) + "</button>";
}

function findAdminTaskByName(taskName) {
    for (var i = 0; i < adminData.taskLogs.length; i++) {
        if (String(adminData.taskLogs[i].lastTask).toLowerCase() == String(taskName).toLowerCase()) {
            return i;
        }
    }

    return -1;
}

function openAdminTaskFromPayment(taskName) {
    var taskIndex = findAdminTaskByName(taskName);

    if (taskIndex == -1) {
        alert("Task details were not found in the server data yet");
        return;
    }

    openAdminTaskDetails(taskIndex, "adminPaymentDetailsSection");
}

function getPaymentTaskLink(taskName) {
    var taskIndex = findAdminTaskByName(taskName);

    if (taskIndex == -1) {
        return cleanAdminText(taskName);
    }

    return "<button type='button' class='tableLink' onclick='openAdminTaskFromPayment(\"" + cleanAdminText(taskName) + "\")'>" + cleanAdminText(taskName) + "</button>";
}

function renderPayments() {
    var body = document.getElementById("paymentsTableBody");
    var search = document.getElementById("paymentSearch").value.toLowerCase();
    var payments = adminData.payments.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    body.innerHTML = "";

    for (var i = 0; i < payments.length; i++) {
        if ((payments[i].transactionId + payments[i].payer + payments[i].payee).toLowerCase().indexOf(search) == -1) {
            continue;
        }

        body.innerHTML += "<tr><td><button type='button' class='tableLink' onclick='openPaymentDetails(\"" + cleanAdminText(payments[i].transactionId) + "\")'>" + cleanAdminText(payments[i].transactionId) + "</button></td><td>" + getPaymentUserLink(payments[i].payer, "adminPaymentsSection") + "</td><td>" + getPaymentUserLink(payments[i].payee, "adminPaymentsSection") + "</td><td>" + cleanAdminText(payments[i].status) + "</td><td>" + cleanAdminText(payments[i].receipt) + "</td><td>" + cleanAdminText(payments[i].date) + "</td></tr>";
    }
}

function openPaymentDetails(transactionId) {
    selectedAdminPayment = null;

    for (var i = 0; i < adminData.payments.length; i++) {
        if (adminData.payments[i].transactionId == transactionId) {
            selectedAdminPayment = adminData.payments[i];
        }
    }

    if (selectedAdminPayment == null) {
        return;
    }

    document.getElementById("paymentTaskName").innerHTML = getPaymentTaskLink(selectedAdminPayment.taskName);
    document.getElementById("paymentTransactionId").innerHTML = cleanAdminText(selectedAdminPayment.transactionId);
    document.getElementById("paymentRequester").innerHTML = getPaymentUserLink(selectedAdminPayment.payer, "adminPaymentDetailsSection");
    document.getElementById("paymentPerformer").innerHTML = getPaymentUserLink(selectedAdminPayment.payee, "adminPaymentDetailsSection");
    document.getElementById("paymentDescription").innerHTML = cleanAdminText(selectedAdminPayment.description);
    document.getElementById("paymentStatus").innerHTML = cleanAdminText(selectedAdminPayment.taskStatus);
    document.getElementById("paymentRatingDetails").innerHTML = "";
    showAdminSection("adminPaymentDetailsSection");
}

function exportPaymentReceiptPdf() {
    if (!selectedAdminPayment) {
        return;
    }

    var receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
        alert("Receipt PDF export could not open. Please allow popups and try again.");
        return;
    }

    receiptWindow.document.write("<!doctype html><html><head><title>Receipt " + cleanAdminText(selectedAdminPayment.transactionId) + "</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#4f3f2b}h1{font-size:28px}table{width:100%;border-collapse:collapse;margin-top:24px}td{border-bottom:1px solid #ead6b2;padding:12px 8px}td:first-child{font-weight:700;background:#fff3df;width:32%}</style></head><body><h1>Payment Receipt</h1><table><tr><td>Transaction ID</td><td>" + cleanAdminText(selectedAdminPayment.transactionId) + "</td></tr><tr><td>Task</td><td>" + cleanAdminText(selectedAdminPayment.taskName) + "</td></tr><tr><td>Payer</td><td>" + cleanAdminText(selectedAdminPayment.payer) + "</td></tr><tr><td>Payee</td><td>" + cleanAdminText(selectedAdminPayment.payee) + "</td></tr><tr><td>Status</td><td>" + cleanAdminText(selectedAdminPayment.status) + "</td></tr><tr><td>Receipt</td><td>" + cleanAdminText(selectedAdminPayment.receipt) + "</td></tr><tr><td>Date</td><td>" + cleanAdminText(selectedAdminPayment.date) + "</td></tr><tr><td>Description</td><td>" + cleanAdminText(selectedAdminPayment.description) + "</td></tr></table><script>window.onload=function(){window.print();};<\/script></body></html>");
    receiptWindow.document.close();
}

async function viewPaymentTaskRating() {
    if (!selectedAdminPayment) {
        return;
    }

    var details = document.getElementById("paymentRatingDetails");

    if (details == null) {
        return;
    }

    if (!selectedAdminPayment.taskId || !selectedAdminPayment.performerId) {
        details.innerHTML = "<h3>Task Rating</h3><p>No saved rating details for this task yet.</p>";
        return;
    }

    details.innerHTML = "<h3>Task Rating</h3><p>Loading task rating...</p>";

    try {
        var ratingData = await fetchAdminEndpoint("/rating/user/" + selectedAdminPayment.performerId);
        var ratings = adminArray(ratingData.ratings);
        var taskRatings = [];

        for (var i = 0; i < ratings.length; i++) {
            if (String(ratings[i].task_id) == String(selectedAdminPayment.taskId)) {
                taskRatings.push(ratings[i]);
            }
        }

        if (taskRatings.length == 0) {
            details.innerHTML = "<h3>Task Rating</h3><p>No saved rating details for this task yet.</p>";
            return;
        }

        var html = "<h3>Task Rating</h3>";

        for (var j = 0; j < taskRatings.length; j++) {
            html += buildPaymentTaskRatingHtml(taskRatings[j]);
        }

        details.innerHTML = html;
    } catch (error) {
        details.innerHTML = "<h3>Task Rating</h3><p>Rating details could not be loaded.</p>";
    }
}

function buildPaymentTaskRatingHtml(rating) {
    var ratingValue = Number(rating.rating || 0);
    var stars = "";

    for (var i = 1; i <= 5; i++) {
        stars += i <= ratingValue ? "&#9733;" : "&#9734;";
    }

    return "<div class='paymentRatingItem'>" +
        "<p><strong>Task:</strong> " + cleanAdminText(rating.task_title || selectedAdminPayment.taskName) + "</p>" +
        "<p><strong>Requester:</strong> " + cleanAdminText(rating.requester_name || selectedAdminPayment.payer) + "</p>" +
        "<p><strong>Performer:</strong> " + cleanAdminText(rating.performer_name || selectedAdminPayment.payee) + "</p>" +
        "<p><strong>Rating:</strong> " + stars + " (" + cleanAdminText(ratingValue) + "/5)</p>" +
        "<p><strong>Review:</strong> " + cleanAdminText(rating.feedback || "No written review was added.") + "</p>" +
        "<p><strong>Date:</strong> " + cleanAdminText(formatAdminDateValue(rating.created_at)) + "</p>" +
        "</div>";
}

function getTaskStatusClass(status) {
    var value = String(status || "").toLowerCase();

    if (value == "completed") {
        return "taskStatusDone";
    }

    if (value == "in-progress" || value == "in progress") {
        return "taskStatusProgress";
    }

    return "taskStatusOpen";
}

function formatTaskStatus(status) {
    var value = String(status || "open").toLowerCase();

    if (value == "completed") {
        return "Completed";
    }

    if (value == "in-progress" || value == "in progress") {
        return "In Progress";
    }

    return "Open";
}

function findAdminUserByNameOrId(name, idNumber) {
    for (var i = 0; i < adminData.users.length; i++) {
        var user = adminData.users[i];

        if (String(user.idNumber) == String(idNumber) || String(user.name).toLowerCase() == String(name).toLowerCase()) {
            return i;
        }
    }

    return -1;
}

function openAdminUserFromTask(name, idNumber) {
    var userIndex = findAdminUserByNameOrId(name, idNumber);

    if (userIndex == -1) {
        return;
    }

    openAdminUser(userIndex, "adminTaskDetailsSection");
}

function getTaskUserCard(role, name, idNumber) {
    var userIndex = findAdminUserByNameOrId(name, idNumber);
    var username = userIndex == -1 ? "--" : adminData.users[userIndex].username;
    var buttonStart = "<div class='taskUserCardInner'>";
    var buttonEnd = "</div>";

    if (userIndex != -1) {
        buttonStart = "<button type='button' class='taskUserCardInner taskUserButton' onclick='openAdminUserFromTask(\"" + cleanAdminText(name) + "\", \"" + cleanAdminText(idNumber) + "\")'>";
        buttonEnd = "</button>";
    }

    return buttonStart +
        "<span class='taskUserAvatar'><svg class='realIcon' viewBox='0 0 24 24' aria-hidden='true'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path><circle cx='12' cy='7' r='4'></circle></svg></span>" +
        "<span class='taskUserText'><small>" + cleanAdminText(role) + "</small><strong>" + cleanAdminText(name) + "</strong><em>ID: " + cleanAdminText(idNumber) + "</em><em>Username: " + cleanAdminText(username) + "</em></span>" +
        buttonEnd;
}

function renderTasksLog() {
    var body = document.getElementById("tasksLogTableBody");
    body.innerHTML = "";

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        var task = adminData.taskLogs[i];
        var statusText = formatTaskStatus(task.activeStatus);
        var statusClass = getTaskStatusClass(task.activeStatus);
        var userIndex = findAdminUserByNameOrId(task.fullName, task.performerId);
        var fullNameCell = cleanAdminText(task.fullName);

        if (userIndex != -1) {
            fullNameCell = "<button type='button' class='tableLink' onclick='openAdminUser(" + userIndex + ", \"adminTasksSection\")'>" + cleanAdminText(task.fullName) + "</button>";
        }

        body.innerHTML += "<tr><td>" + fullNameCell + "</td><td><button type='button' class='tableLink' onclick='openAdminTaskDetails(" + i + ")'>" + cleanAdminText(task.lastTask) + "</button></td><td><span class='" + statusClass + "'>" + statusText + "</span></td><td>" + cleanAdminText(task.date) + "</td></tr>";
    }
}

function openAdminTaskDetails(index, backSection) {
    adminTaskBackSection = backSection || "adminTasksSection";
    selectedAdminTask = adminData.taskLogs[index];
    document.getElementById("taskDetailsName").innerHTML = cleanAdminText(selectedAdminTask.lastTask);
    document.getElementById("taskRequesterDetails").innerHTML = getTaskUserCard("Requester", selectedAdminTask.requester, selectedAdminTask.requesterId);
    document.getElementById("taskPerformerDetails").innerHTML = getTaskUserCard("Performer", selectedAdminTask.performer, selectedAdminTask.performerId);
    document.getElementById("taskDateDetails").innerHTML = cleanAdminText(selectedAdminTask.date);
    document.getElementById("taskStatusDetails").innerHTML = "<span class='" + getTaskStatusClass(selectedAdminTask.activeStatus) + "'>" + formatTaskStatus(selectedAdminTask.activeStatus) + "</span>";
    document.getElementById("taskAnomalyDetails").innerHTML = selectedAdminTask.anomaly == "yes" ? "Yes" : "No";
    showAdminSection("adminTaskDetailsSection");
}

function viewTaskChat() {
    if (!selectedAdminTask) {
        return;
    }

    var chatItems = selectedAdminTask.chat || selectedAdminTask.chats || [];
    var html = "<h3>Task Chat</h3>";

    if (chatItems.length == 0) {
        html += "<p>No chat records are available from the server yet.</p>";
    } else {
        for (var i = 0; i < chatItems.length; i++) {
            html += "<p>" + cleanAdminText(chatItems[i]) + "</p>";
        }
    }

    document.getElementById("taskChatDetails").innerHTML = html;
}
function formatAdminDisplayDate(dateText) {
    var date = new Date(dateText);

    if (isNaN(date.getTime())) {
        return cleanAdminText(dateText || "--");
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function renderSoftwareDetails() {
    var software = adminData.software || {};
    var changes = software.changes || [];
    var list = document.getElementById("softwareChangesList");

    document.getElementById("softwareVersionName").innerHTML = cleanAdminText(software.versionName || "Version not available");
    document.getElementById("softwareVersionDate").innerHTML = cleanAdminText(formatAdminDisplayDate(software.versionDate));

    list.innerHTML = "";

    for (var i = 0; i < changes.length; i++) {
        list.innerHTML += "<li>" + cleanAdminText(changes[i]) + "</li>";
    }
}

function connectAdminForms() {
    var forms = document.querySelectorAll(".adminBody form");

    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener("submit", function (event) {
            event.preventDefault();
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    connectAdminForms();
    loadAdminData();
});







function normalizeAdminValue(value) {
    return String(value || "").toLowerCase().replace("_", "-").trim();
}

function getMaxCount(items) {
    var max = 0;

    for (var i = 0; i < items.length; i++) {
        if (items[i].value > max) {
            max = items[i].value;
        }
    }

    return max == 0 ? 1 : max;
}

function getPercentClass(value, prefix) {
    var percent = Math.round(Number(value) / 5) * 5;

    if (percent < 0) {
        percent = 0;
    }

    if (percent > 100) {
        percent = 100;
    }

    return prefix + percent;
}

function renderBarChart(elementId, items) {
    var container = document.getElementById(elementId);

    if (container == null) {
        return;
    }

    var max = getMaxCount(items);
    var html = "";

    for (var i = 0; i < items.length; i++) {
        var width = Math.max(6, Math.round((items[i].value / max) * 100));
        var widthClass = getPercentClass(width, "widthPercent");
        html += "<div class='analyticsBarRow'>" +
            "<div class='analyticsBarTop'><span>" + cleanAdminText(items[i].label) + "</span><strong>" + cleanAdminText(items[i].value) + "</strong></div>" +
            "<div class='analyticsBarTrack'><span class='analyticsBarFill " + cleanAdminText(items[i].className) + " " + widthClass + "'></span></div>" +
            "</div>";
    }

    container.innerHTML = html;
}

function getTaskOverviewData() {
    var counts = { open: 0, progress: 0, completed: 0, cancelled: 0 };

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        var status = normalizeAdminValue(adminData.taskLogs[i].activeStatus);

        if (status == "completed") {
            counts.completed++;
        } else if (status == "in-progress" || status == "in progress") {
            counts.progress++;
        } else if (status == "cancelled" || status == "canceled") {
            counts.cancelled++;
        } else {
            counts.open++;
        }
    }

    return [
        { label: "Open", value: counts.open, className: "analyticsBlueDark", color: "#4569d9" },
        { label: "In Progress", value: counts.progress, className: "analyticsBlue", color: "#5b8ff0" },
        { label: "Completed", value: counts.completed, className: "analyticsTeal", color: "#5dc9c9" },
        { label: "Cancelled", value: counts.cancelled, className: "analyticsCyan", color: "#9de1df" }
    ];
}

function renderPieChart(chartId, legendId, totalId, items) {
    var chart = document.getElementById(chartId);
    var legend = document.getElementById(legendId);
    var totalElement = totalId ? document.getElementById(totalId) : null;

    if (chart == null || legend == null) {
        return;
    }

    var total = 0;
    var current = -90;
    var svg = "<svg class='analyticsDonutSvg' viewBox='0 0 360 300' role='img' aria-label='Tasks overview pie chart'>";
    var labels = "";
    var legendHtml = "";

    for (var i = 0; i < items.length; i++) {
        total += items[i].value;
    }

    if (total == 0) {
        chart.innerHTML = "<div class='analyticsNoData'>0%</div>";
        legend.innerHTML = "";
        if (totalElement != null) {
            totalElement.innerHTML = "0";
        }
        return;
    }

    svg += "<circle cx='180' cy='150' r='72' class='donutBase'></circle>";

    for (var j = 0; j < items.length; j++) {
        if (items[j].value == 0) {
            legendHtml += "<div><span class='legendSwatch " + cleanAdminText(items[j].className) + "'></span><strong>" + cleanAdminText(items[j].label) + "</strong><em>0%</em></div>";
            continue;
        }

        var percent = items[j].value / total;
        var percentText = Math.round(percent * 100);
        var dash = percent * 452.39;
        var gap = 452.39 - dash;
        var midAngle = current + (percent * 360 / 2);
        var rad = midAngle * Math.PI / 180;
        var lineStartX = 180 + Math.cos(rad) * 76;
        var lineStartY = 150 + Math.sin(rad) * 76;
        var lineEndX = 180 + Math.cos(rad) * 103;
        var lineEndY = 150 + Math.sin(rad) * 103;
        var textX = 180 + Math.cos(rad) * 128;
        var textY = 150 + Math.sin(rad) * 128;
        var anchor = textX < 180 ? "end" : "start";

        svg += "<circle cx='180' cy='150' r='72' class='donutSlice' stroke='" + items[j].color + "' stroke-dasharray='" + dash + " " + gap + "' transform='rotate(" + current + " 180 150)'></circle>";
        labels += "<line x1='" + lineStartX + "' y1='" + lineStartY + "' x2='" + lineEndX + "' y2='" + lineEndY + "' class='donutLabelLine' stroke='" + items[j].color + "'></line>" +
            "<text x='" + textX + "' y='" + textY + "' text-anchor='" + anchor + "' class='donutPercentText' fill='" + items[j].color + "'>" + percentText + "%</text>";
        legendHtml += "<div><span class='legendSwatch " + cleanAdminText(items[j].className) + "'></span><strong>" + cleanAdminText(items[j].label) + "</strong><em>" + percentText + "%</em></div>";
        current += percent * 360;
    }

    svg += labels + "<circle cx='180' cy='150' r='46' class='donutHole'></circle></svg>";
    chart.innerHTML = svg;
    legend.innerHTML = legendHtml;

    if (totalElement != null) {
        totalElement.innerHTML = cleanAdminText(total);
    }
}

function getPaymentsStatusData() {
    var counts = { paid: 0, pending: 0, failed: 0 };

    for (var i = 0; i < adminData.payments.length; i++) {
        var status = normalizeAdminValue(adminData.payments[i].status);

        if (status == "paid" || status == "completed" || status == "approved" || status == "success") {
            counts.paid++;
        } else if (status == "failed" || status == "rejected") {
            counts.failed++;
        } else {
            counts.pending++;
        }
    }

    return [
        { label: "Paid", value: counts.paid, className: "analyticsGreen" },
        { label: "Pending", value: counts.pending, className: "analyticsYellow" },
        { label: "Failed / Rejected", value: counts.failed, className: "analyticsRed" }
    ];
}

function getLatestTaskDate() {
    var latest = null;

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        var current = new Date(adminData.taskLogs[i].date);

        if (!isNaN(current.getTime()) && (latest == null || current > latest)) {
            latest = current;
        }
    }

    return latest || new Date();
}

function isTaskInLastMonth(taskDate, latestDate) {
    var date = new Date(taskDate);

    if (isNaN(date.getTime())) {
        return false;
    }

    var startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() - 30);
    return date >= startDate && date <= latestDate;
}

function getUserTaskActivityCounts() {
    var latestDate = getLatestTaskDate();
    var activity = {};

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        var task = adminData.taskLogs[i];

        if (isTaskInLastMonth(task.date, latestDate)) {
            if (task.requesterId != null && task.requesterId != "--") {
                activity[task.requesterId] = (activity[task.requesterId] || 0) + 1;
            }

            if (task.performerId != null && task.performerId != "--") {
                activity[task.performerId] = (activity[task.performerId] || 0) + 1;
            }
        }
    }

    return activity;
}

function getUserReportCounts() {
    var reports = {};

    for (var i = 0; i < adminData.reports.length; i++) {
        var username = adminData.reports[i].username;
        reports[username] = (reports[username] || 0) + 1;
    }

    for (var j = 0; j < adminData.anomalies.length; j++) {
        var anomaly = adminData.anomalies[j];
        reports[anomaly.username] = (reports[anomaly.username] || 0) + Number(anomaly.reports || 0);
    }

    return reports;
}

function getReportedTasksCount() {
    var count = 0;

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        if (normalizeAdminValue(adminData.taskLogs[i].anomaly) == "yes") {
            count++;
        }
    }

    return count;
}

function getTotalReportedUsers() {
    var reports = getUserReportCounts();
    var total = 0;

    for (var i = 0; i < adminData.users.length; i++) {
        if ((reports[adminData.users[i].username] || 0) > 0) {
            total++;
        }
    }

    return total;
}

function getTotalReportCount() {
    var total = adminData.reports.length;

    for (var i = 0; i < adminData.anomalies.length; i++) {
        total += Number(adminData.anomalies[i].reports || 0);
    }

    return total;
}

function isActiveAdminUser(user) {
    return normalizeAdminValue(user.status) == "active";
}

function renderUserReportsSummary() {
    var summary = document.getElementById("userReportsSummary");

    if (summary == null) {
        return;
    }

    var activeCount = 0;
    var inactiveCount = 0;

    for (var i = 0; i < adminData.users.length; i++) {
        if (isActiveAdminUser(adminData.users[i])) {
            activeCount++;
        } else {
            inactiveCount++;
        }
    }

    summary.innerHTML = "<div><span>Total users</span><strong>" + cleanAdminText(adminData.users.length) + "</strong></div>" +
        "<div><span>Active users</span><strong>" + cleanAdminText(activeCount) + "</strong></div>" +
        "<div><span>Inactive / restricted</span><strong>" + cleanAdminText(inactiveCount) + "</strong></div>" +
        "<div><span>Total reports</span><strong>" + cleanAdminText(getTotalReportCount()) + "</strong></div>" +
        "<div><span>Reported tasks</span><strong>" + cleanAdminText(getReportedTasksCount()) + "</strong></div>" +
        "<div><span>Reported users</span><strong>" + cleanAdminText(getTotalReportedUsers()) + "</strong></div>";
}

function getLatestAnalyticsDate() {
    var latest = null;
    var collections = [adminData.taskLogs, adminData.reports, adminData.payments];

    for (var i = 0; i < collections.length; i++) {
        for (var j = 0; j < collections[i].length; j++) {
            var current = new Date(collections[i][j].date);

            if (!isNaN(current.getTime()) && (latest == null || current > latest)) {
                latest = current;
            }
        }
    }

    return latest || new Date();
}

function getWeekBucketIndex(dateText, startDate) {
    var date = new Date(dateText);

    if (isNaN(date.getTime())) {
        return -1;
    }

    var diff = date.getTime() - startDate.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function getWeeklySystemData() {
    var latestDate = getLatestAnalyticsDate();
    var startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() - 49);
    var weeks = [];

    for (var i = 0; i < 8; i++) {
        weeks.push({ label: "Week " + (i + 1), activity: 0, reports: 0 });
    }

    for (var t = 0; t < adminData.taskLogs.length; t++) {
        var taskIndex = getWeekBucketIndex(adminData.taskLogs[t].date, startDate);

        if (taskIndex >= 0 && taskIndex < weeks.length) {
            weeks[taskIndex].activity++;
        }
    }

    for (var r = 0; r < adminData.reports.length; r++) {
        var reportIndex = getWeekBucketIndex(adminData.reports[r].date, startDate);

        if (reportIndex >= 0 && reportIndex < weeks.length) {
            weeks[reportIndex].reports++;
        }
    }

    return weeks;
}

function renderUserReportsAreaChart() {
    var chart = document.getElementById("userReportsAreaChart");

    if (chart == null) {
        return;
    }

    var weeks = getWeeklySystemData();
    var maxValue = 1;

    for (var i = 0; i < weeks.length; i++) {
        if (weeks[i].activity > maxValue) {
            maxValue = weeks[i].activity;
        }

        if (weeks[i].reports > maxValue) {
            maxValue = weeks[i].reports;
        }
    }

    var points = [];
    var reportPoints = [];
    var labels = "";
    var grid = "";

    for (var line = 0; line <= 4; line++) {
        var y = 220 - (line * 45);
        var value = Math.round((maxValue / 4) * line);
        grid += "<text x='18' y='" + (y + 4) + "' class='areaAxisLabel'>" + cleanAdminText(value) + "</text><line x1='44' y1='" + y + "' x2='670' y2='" + y + "' class='areaGridLine'></line>";
    }

    for (var j = 0; j < weeks.length; j++) {
        var x = 54 + (j * 86);
        var activityY = 220 - Math.round((weeks[j].activity / maxValue) * 180);
        var reportsY = 220 - Math.round((weeks[j].reports / maxValue) * 180);
        points.push(x + "," + activityY);
        reportPoints.push(x + "," + reportsY);
        labels += "<text x='" + x + "' y='248' class='areaWeekLabel'>" + cleanAdminText(weeks[j].label) + "</text>";
    }

    var areaPoints = "54,220 " + points.join(" ") + " 656,220";
    chart.innerHTML = "<svg viewBox='0 0 700 265' role='img' aria-label='System activity and reports by week'>" +
        "<defs><linearGradient id='systemAreaGradient' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#6f94f6' stop-opacity='0.85'></stop><stop offset='100%' stop-color='#cab2f8' stop-opacity='0.35'></stop></linearGradient></defs>" +
        grid +
        "<line x1='44' y1='40' x2='44' y2='220' class='areaAxisLine'></line><line x1='44' y1='220' x2='670' y2='220' class='areaAxisLine'></line>" +
        "<polygon points='" + areaPoints + "' fill='url(#systemAreaGradient)'></polygon>" +
        "<polyline points='" + points.join(" ") + "' class='areaActivityLine'></polyline>" +
        "<polyline points='" + reportPoints.join(" ") + "' class='areaReportsLine'></polyline>" +
        labels +
        "</svg>";
}

function getUsersByWeekdayData() {
    var days = [
        { label: "Mon", active: 0, inactive: 0 },
        { label: "Tue", active: 0, inactive: 0 },
        { label: "Wed", active: 0, inactive: 0 },
        { label: "Thu", active: 0, inactive: 0 },
        { label: "Fri", active: 0, inactive: 0 },
        { label: "Sat", active: 0, inactive: 0 }
    ];

    for (var i = 0; i < adminData.users.length; i++) {
        var user = adminData.users[i];
        var joinDate = new Date(user.joinDate);

        if (isNaN(joinDate.getTime())) {
            continue;
        }

        var day = joinDate.getDay();
        var index = day == 0 ? -1 : day - 1;

        if (index >= 0 && index < days.length) {
            if (isActiveAdminUser(user)) {
                days[index].active++;
            } else {
                days[index].inactive++;
            }
        }
    }

    return days;
}

function renderUsersSystemChart() {
    var chart = document.getElementById("usersSystemChart");

    if (chart == null) {
        return;
    }

    var days = getUsersByWeekdayData();
    var maxValue = 1;
    var html = "<div class='usersSystemYAxis'><span>Users</span></div><div class='usersSystemBars'>";

    for (var i = 0; i < days.length; i++) {
        var total = days[i].active + days[i].inactive;

        if (total > maxValue) {
            maxValue = total;
        }
    }

    for (var j = 0; j < days.length; j++) {
        var activeHeight = Math.round((days[j].active / maxValue) * 100);
        var inactiveHeight = Math.round((days[j].inactive / maxValue) * 100);
        var activeHeightClass = getPercentClass(activeHeight, "heightPercent");
        var inactiveHeightClass = getPercentClass(inactiveHeight, "heightPercent");
        var totalText = days[j].active + days[j].inactive;

        html += "<div class='usersSystemColumn'>" +
            "<strong>" + cleanAdminText(totalText) + "</strong>" +
            "<div class='usersSystemBar'>" +
            "<span class='usersInactivePart " + inactiveHeightClass + "'></span>" +
            "<span class='usersActivePart " + activeHeightClass + "'></span>" +
            "</div>" +
            "<small>" + cleanAdminText(days[j].label) + "</small>" +
            "</div>";
    }

    chart.innerHTML = html + "</div>";
}
function renderAnalyticsCharts() {
    renderPieChart("tasksPieChart", "tasksPieLegend", "tasksPieTotal", getTaskOverviewData());
    renderBarChart("paymentsStatusChart", getPaymentsStatusData());
    renderUsersSystemChart();
    renderUserReportsSummary();
    renderUserReportsAreaChart();
}





