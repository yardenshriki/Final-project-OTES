//yarden shriki, lior zahavi
var LOGIN_API_URL = "http://localhost:5000/api/users/login";

function checkLogin() {
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    clearMessage("loginMessage");

    if (username == "" || password == "") {
        showMessage("loginMessage", "Invalid username or password");
        return false;
    }

    loginWithServer(username, password);
    return false;
}

function loginWithServer(username, password) {
    fetch(LOGIN_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildLoginRequest(username, password))
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw data;
                }

                return data;
            });
        })
        .then(function (loginData) {
            var user = loginData.user;

            if (user != null && isUserBlockedFromLogin(user)) {
                showMessage("loginMessage", getBlockedLoginMessage(user));
                return;
            }

            if (user == null) {
                showMessage("loginMessage", "Invalid username or password");
                return;
            }

            saveLoggedInUser(user, username);
            redirectLoggedInUser(user);
        })
        .catch(function (error) {
            showMessage("loginMessage", getLoginErrorMessage(error));
        });
}

function buildLoginRequest(username, password) {
    if (username.indexOf("@") >= 0) {
        return {
            email: username,
            password: password
        };
    }

    return {
        username: username,
        password: password
    };
}

function saveLoggedInUser(user, loginName) {
    var username = user.username || loginName;
    var role = getUserRole(user);

    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("loggedInUserId", user.id || "");
    localStorage.setItem("loggedInUsername", username);
    localStorage.setItem("loggedInFullName", user.full_name || user.fullName || username);
    localStorage.setItem("loggedInEmail", user.email || "");
    localStorage.setItem("loggedInProfilePicture", user.profile_picture || user.profilePicture || "");
    localStorage.setItem("userRole", role);

    if (role == "Admin") {
        localStorage.setItem("adminUsername", username);
    } else {
        localStorage.removeItem("adminUsername");
    }
}

function redirectLoggedInUser(user) {
    var role = getUserRole(user);

    if (role == "Admin") {
        window.location.href = "admin.html";
        return;
    }

    if (role == "Performer") {
        window.location.href = "performer.html";
        return;
    }

    window.location.href = "requester.html";
}

function getUserRole(user) {
    var username = String(user.username || "");
    var role = String(user.role || "");
    var normalizedRole = role.toLowerCase();

    if (username.toUpperCase().indexOf("ADMIN") == 0 || normalizedRole == "admin") {
        return "Admin";
    }

    if (normalizedRole == "performer") {
        return "Performer";
    }

    return "Requester";
}

function isUserBlockedFromLogin(user) {
    var status = String(user.status || "").toLowerCase();
    var restrictionType = String(user.restrictionType || user.restriction_type || "").toLowerCase();

    return status == "blocked" || status == "suspended" || status == "immediate block" ||
        restrictionType == "blocked" || restrictionType == "suspended" || restrictionType == "immediate block";
}

function getBlockedLoginMessage(user) {
    var status = String(user.status || user.restrictionType || user.restriction_type || "Blocked");

    if (status == "Immediate Block" || String(user.restrictionType || user.restriction_type || "") == "Immediate Block") {
        return "Access denied: this user is blocked immediately.";
    }

    if (status == "Suspended" || String(user.restrictionType || user.restriction_type || "") == "Suspended") {
        return "Access denied: this user is temporarily blocked.";
    }

    return "Access denied: this user is blocked.";
}

function getLoginErrorMessage(error) {
    if (error != null && error.message != null && error.message != "") {
        return error.message;
    }

    return "Login failed. Please check that the server and database are running.";
}


