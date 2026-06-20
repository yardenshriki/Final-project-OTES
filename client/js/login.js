//yarden shriki, lior zahavi
var LOGIN_ADMIN_DATA_STORAGE_KEY = "otesAdminData";
function checkLogin() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    clearMessage("loginMessage");

    if (username == "" || password == "") {
        showMessage("loginMessage", "Invalid username or password");
        return false;
    }

    if (username.toUpperCase().indexOf("ADMIN") == 0) {
        localStorage.setItem("userRole", "Admin");
        localStorage.setItem("adminUsername", username);
        window.location.href = "admin.html";
        return false;
    }

    fetch("data/admin-data.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (adminData) {
            var loginData = getLoginAdminData(adminData);
            var user = findLoginUser(loginData.users, username);

            if (user != null && isUserBlockedFromLogin(user)) {
                showMessage("loginMessage", getBlockedLoginMessage(user));
                return;
            }

            localStorage.setItem("loggedInUsername", username);
            window.location.href = "requester.html";
        })
        .catch(function () {
            showMessage("loginMessage", "Login data could not be loaded");
        });

    return false;
}


function getLoginAdminData(fetchedData) {
    var savedData = localStorage.getItem(LOGIN_ADMIN_DATA_STORAGE_KEY);

    if (savedData == null || savedData == "") {
        return fetchedData;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        return fetchedData;
    }
}
function findLoginUser(users, username) {
    if (users == null) {
        return null;
    }

    for (var i = 0; i < users.length; i++) {
        if (String(users[i].username).toLowerCase() == String(username).toLowerCase()) {
            return users[i];
        }
    }

    return null;
}

function isUserBlockedFromLogin(user) {
    var status = String(user.status || "").toLowerCase();
    var restrictionType = String(user.restrictionType || "").toLowerCase();

    return status == "blocked" || status == "suspended" || status == "immediate block" ||
        restrictionType == "blocked" || restrictionType == "suspended" || restrictionType == "immediate block";
}

function getBlockedLoginMessage(user) {
    var status = String(user.status || user.restrictionType || "Blocked");

    if (status == "Immediate Block" || String(user.restrictionType || "") == "Immediate Block") {
        return "Access denied: this user is blocked immediately.";
    }

    if (status == "Suspended" || String(user.restrictionType || "") == "Suspended") {
        return "Access denied: this user is temporarily blocked.";
    }

    return "Access denied: this user is blocked.";
}