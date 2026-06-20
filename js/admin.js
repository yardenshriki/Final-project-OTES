//yarden shriki, lior zahavi
var ADMIN_API_URL = "PASTE_ADMIN_API_URL_HERE";
var ADMIN_DATA_FILE = "data/admin-data.json";
var ADMIN_DATA_STORAGE_KEY = "otesAdminData";
var adminData = null;
var selectedAdminUser = null;
var selectedAdminPayment = null;
var selectedAdminTask = null;

function getSavedAdminData() {
    var savedData = localStorage.getItem(ADMIN_DATA_STORAGE_KEY);

    if (savedData == null || savedData == "") {
        return null;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        return null;
    }
}

function saveAdminData() {
    localStorage.setItem(ADMIN_DATA_STORAGE_KEY, JSON.stringify(adminData));
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

function updateAdminWelcomeName() {
    var username = localStorage.getItem("adminUsername") || "Admin";
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
function loadAdminData() {
    var dataSource = ADMIN_DATA_FILE;

    if (ADMIN_API_URL != "" && ADMIN_API_URL != "PASTE_ADMIN_API_URL_HERE") {
        dataSource = ADMIN_API_URL;
    }

    fetch(dataSource)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            adminData = getSavedAdminData() || data;
            updateAdminWelcomeName();
if (dataSource == ADMIN_DATA_FILE) {
                setAdminDataStatus("Data source: client/data/admin-data.json. Replace ADMIN_API_URL in js/admin.js when the external API is ready.");
            } else {
                setAdminDataStatus("Data source: external database API connected.");
            }

            renderAdminDashboard();
        })
        .catch(function () {
            setAdminDataStatus("Data source error: admin data could not be loaded.");
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
        return new Date(b.date) - new Date(a.date);
    });

    body.innerHTML = "";

    for (var i = 0; i < reports.length; i++) {
        if ((reports[i].username + reports[i].description + reports[i].type).toLowerCase().indexOf(search) == -1) {
            continue;
        }

        body.innerHTML += "<tr><td>" + cleanAdminText(reports[i].date) + "</td><td>" + cleanAdminText(reports[i].username) + "</td><td>" + cleanAdminText(reports[i].type) + "</td><td>" + cleanAdminText(reports[i].description) + "</td><td><span class='statusProgress'>" + cleanAdminText(reports[i].status) + "</span></td></tr>";
    }
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
            "<td><button type='button' class='" + userClass + "' onclick='openAdminUserByUsername(\"" + cleanAdminText(anomaly.username) + "\")'>" + cleanAdminText(anomaly.username) + "</button></td>" +
            "<td>" + cleanAdminText(anomaly.reports) + "</td>" +
            "<td>" + cleanAdminText(anomaly.daysLate) + "</td>" +
            "<td>" + cleanAdminText(anomaly.paymentStatus) + "</td>" +
            "<td>" + cleanAdminText(anomaly.description) + "</td>" +
            "<td>" + exceptionText + "</td>" +
            "</tr>";
    }
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

        body.innerHTML += "<tr><td><button type='button' class='tableLink' onclick='openAdminUser(" + i + ")'>" + cleanAdminText(user.name) + "</button></td><td>" + cleanAdminText(user.idNumber) + "</td><td>" + cleanAdminText(user.joinDate) + "</td><td>" + cleanAdminText(user.lastTask) + "</td><td><span class='" + getAdminStatusClass(user.status) + "'>" + cleanAdminText(user.status) + "</span></td></tr>";
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

function openAdminUserByUsername(username) {
    for (var i = 0; i < adminData.users.length; i++) {
        if (adminData.users[i].username == username) {
            openAdminUser(i);
            return;
        }
    }
}

function openAdminUser(index) {
    selectedAdminUser = adminData.users[index];
    var warningText = selectedAdminUser.warningSent ? "Warning sent on " + cleanAdminText(selectedAdminUser.warningDate) : "No warning sent";

    document.getElementById("profileUserName").innerHTML = cleanAdminText(selectedAdminUser.name);
    document.getElementById("profileFullName").innerHTML = cleanAdminText(selectedAdminUser.name);
    document.getElementById("profileUserId").innerHTML = cleanAdminText(selectedAdminUser.idNumber);
    document.getElementById("profileUserEmail").innerHTML = cleanAdminText(selectedAdminUser.email);
    document.getElementById("profileUserStatus").innerHTML = cleanAdminText(selectedAdminUser.status);
    document.getElementById("profileWarningStatus").innerHTML = warningText;
    document.getElementById("profileActionDetails").innerHTML = "";
    showAdminSection("adminUserProfileSection");
}

function showProfileInfo(type) {
    if (!selectedAdminUser) {
        return;
    }

    var title = "";
    var items = [];

    if (type == "tasks") {
        title = "Task History";
        items = selectedAdminUser.tasks || [];
    } else if (type == "ratings") {
        title = "Rating History";
        items = selectedAdminUser.ratings || [];
    } else if (type == "payments") {
        title = "Recent Payments";
        items = selectedAdminUser.payments || [];
    } else {
        title = "Chats";
        items = ["No chat records in admin-data yet"];
    }

    var html = "<h3>" + cleanAdminText(title) + "</h3>";
    for (var i = 0; i < items.length; i++) {
        html += "<p>" + cleanAdminText(items[i]) + "</p>";
    }
    document.getElementById("profileActionDetails").innerHTML = html;
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

function openWarningEmailPage() {
    if (!selectedAdminUser) {
        return;
    }

    var previousWarning = selectedAdminUser.warningSent ? "A warning email was already sent on " + cleanAdminText(selectedAdminUser.warningDate) + "." : "No previous warning email was sent.";
    document.getElementById("warningExistingInfo").innerHTML = previousWarning;
    document.getElementById("warningUsername").value = selectedAdminUser.username;
    document.getElementById("warningEmailText").value = "Hello " + selectedAdminUser.name + ",\n\nYour account has more than 3 reports filed. Please resolve the reported issues. Continued exceptions may lead to account restriction or blocking.\n\nOTES Admin Team";
    showAdminSection("adminWarningEmailSection");
}

function sendWarningEmail() {
    if (!selectedAdminUser) {
        return;
    }

    selectedAdminUser.warningSent = true;
    selectedAdminUser.warningDate = getTodayString();
    document.getElementById("warningExistingInfo").innerHTML = "Warning email sent on " + selectedAdminUser.warningDate + ".";
    renderUsers();
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

    selectedAdminUser.restrictionType = document.getElementById("restrictionTypeEdit").value;
    selectedAdminUser.restrictionDuration = document.getElementById("restrictionDuration").value;
    selectedAdminUser.restrictionReason = document.getElementById("restrictionReasonEdit").value;
    selectedAdminUser.restrictionEmailSent = true;
    selectedAdminUser.restrictionEmailDate = getTodayString();
    selectedAdminUser.status = selectedAdminUser.restrictionType == "Immediate Block" ? "Immediate Block" : selectedAdminUser.restrictionType;
    saveAdminData();
    renderUsers();
    document.getElementById("restrictionEmailNotice").innerHTML = "Email Sent: a restriction email was sent to " + cleanAdminText(selectedAdminUser.email) + " on " + selectedAdminUser.restrictionEmailDate + ".";
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

        body.innerHTML += "<tr><td><button type='button' class='tableLink' onclick='openPaymentDetails(\"" + cleanAdminText(payments[i].transactionId) + "\")'>" + cleanAdminText(payments[i].transactionId) + "</button></td><td>" + cleanAdminText(payments[i].payer) + "</td><td>" + cleanAdminText(payments[i].payee) + "</td><td>" + cleanAdminText(payments[i].status) + "</td><td>" + cleanAdminText(payments[i].receipt) + "</td><td>" + cleanAdminText(payments[i].date) + "</td></tr>";
    }
}

function openPaymentDetails(transactionId) {
    for (var i = 0; i < adminData.payments.length; i++) {
        if (adminData.payments[i].transactionId == transactionId) {
            selectedAdminPayment = adminData.payments[i];
        }
    }

    if (selectedAdminPayment == null) {
        return;
    }

    document.getElementById("paymentTaskName").innerHTML = cleanAdminText(selectedAdminPayment.taskName);
    document.getElementById("paymentTransactionId").innerHTML = cleanAdminText(selectedAdminPayment.transactionId);
    document.getElementById("paymentRequester").innerHTML = cleanAdminText(selectedAdminPayment.payer);
    document.getElementById("paymentPerformer").innerHTML = cleanAdminText(selectedAdminPayment.payee);
    document.getElementById("paymentDescription").innerHTML = cleanAdminText(selectedAdminPayment.description);
    document.getElementById("paymentStatus").innerHTML = cleanAdminText(selectedAdminPayment.taskStatus);
    showAdminSection("adminPaymentDetailsSection");
}

function renderTasksLog() {
    var body = document.getElementById("tasksLogTableBody");
    body.innerHTML = "";

    for (var i = 0; i < adminData.taskLogs.length; i++) {
        var task = adminData.taskLogs[i];
        body.innerHTML += "<tr><td>" + cleanAdminText(task.fullName) + "</td><td><button type='button' class='tableLink' onclick='openAdminTaskDetails(" + i + ")'>" + cleanAdminText(task.lastTask) + "</button></td><td>" + cleanAdminText(task.activeStatus) + "</td><td>" + cleanAdminText(task.date) + "</td></tr>";
    }
}

function openAdminTaskDetails(index) {
    selectedAdminTask = adminData.taskLogs[index];
    document.getElementById("taskDetailsName").innerHTML = cleanAdminText(selectedAdminTask.lastTask);
    document.getElementById("taskRequesterDetails").innerHTML = cleanAdminText(selectedAdminTask.requester) + " | ID: " + cleanAdminText(selectedAdminTask.requesterId);
    document.getElementById("taskPerformerDetails").innerHTML = cleanAdminText(selectedAdminTask.performer) + " | ID: " + cleanAdminText(selectedAdminTask.performerId);
    document.getElementById("taskStatusDetails").innerHTML = cleanAdminText(selectedAdminTask.activeStatus) + " | Date: " + cleanAdminText(selectedAdminTask.date);
    document.getElementById("taskAnomalyDetails").innerHTML = cleanAdminText(selectedAdminTask.anomaly);
    document.getElementById("taskStatusUpdate").value = selectedAdminTask.activeStatus;
    showAdminSection("adminTaskDetailsSection");
}

function renderSoftwareDetails() {
    document.getElementById("softwareVersionName").innerHTML = cleanAdminText(adminData.software.versionName);
    document.getElementById("softwareVersionDate").innerHTML = cleanAdminText(adminData.software.versionDate);

    var list = document.getElementById("softwareChangesList");
    list.innerHTML = "";

    for (var i = 0; i < adminData.software.changes.length; i++) {
        list.innerHTML += "<li>" + cleanAdminText(adminData.software.changes[i]) + "</li>";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadAdminData();
});






