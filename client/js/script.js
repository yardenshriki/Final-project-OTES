//yarden shriki, lior zahavi
var userRole = localStorage.getItem("userRole") || "Requester";

var screenPages = {
    loginScreen: "index.html",
    signupScreen: "signup.html",
    paymentScreen: "signup.html",
    termsScreen: "signup.html",
    successScreen: "signup.html",
    requesterHomeScreen: "requester.html",
    taskScreen: "requester.html",
    requesterTaskDetailsScreen: "requester.html",
    paymentSuccessScreen: "requester.html",
    ratingScreen: "requester.html",
    taskSuccessScreen: "requester.html",
    performerHomeScreen: "performer.html",
    availableTaskDetailsScreen: "performer.html",
    performerTaskDetailsScreen: "performer.html",
    finishTaskScreen: "performer.html",
    adminHomeScreen: "admin.html"
};

function openMenu() {
    if (document.getElementById("sideMenu") == null) {
        return;
    }

    document.getElementById("sideMenu").style.display = "block";

    if (document.getElementById("menuOverlay") != null) {
        document.getElementById("menuOverlay").style.display = "block";
    }
}

function closeMenu() {
    if (document.getElementById("sideMenu") == null) {
        return;
    }

    document.getElementById("sideMenu").style.display = "none";

    if (document.getElementById("menuOverlay") != null) {
        document.getElementById("menuOverlay").style.display = "none";
    }
}

function showHeader(screenName) {
    if (document.getElementById("appHeader") == null) {
        return;
    }

    if (screenName == "loginScreen" || screenName == "signupScreen" || screenName == "paymentScreen" || screenName == "termsScreen" || screenName == "successScreen") {
        document.getElementById("appHeader").style.display = "none";
    } else {
        document.getElementById("appHeader").style.display = "block";
    }
}

function markRole() {
    if (document.getElementById("requesterButton") == null || document.getElementById("performerButton") == null) {
        return;
    }

    if (userRole == "Performer") {
        document.getElementById("requesterButton").className = "";
        document.getElementById("performerButton").className = "activeRole";
    } else {
        document.getElementById("requesterButton").className = "activeRole";
        document.getElementById("performerButton").className = "";
    }
}

function switchRole(roleName) {
    userRole = roleName;
    localStorage.setItem("userRole", userRole);
    markRole();

    if (userRole == "Admin") {
        showScreen("adminHomeScreen");
    } else if (userRole == "Performer") {
        showScreen("performerHomeScreen");
    } else {
        showScreen("requesterHomeScreen");
    }
}

function showScreen(screenName) {
    if (document.getElementById(screenName) == null) {
        if (screenPages[screenName] != null) {
            if (screenName == "performerHomeScreen") {
                localStorage.setItem("userRole", "Performer");
            }

            if (screenName == "requesterHomeScreen") {
                localStorage.setItem("userRole", "Requester");
            }

            window.location.href = screenPages[screenName];
        }

        return;
    }

    closeMenu();
    showHeader(screenName);

    var screens = document.getElementsByClassName("screen");

    for (var i = 0; i < screens.length; i++) {
        screens[i].style.display = "none";
    }

    document.getElementById(screenName).style.display = "block";
    markRole();
}

function showMessage(messageName, text) {
    document.getElementById(messageName).innerHTML = text;
}

function clearMessage(messageName) {
    document.getElementById(messageName).innerHTML = "";
}

function isDigits(text) {
    if (text == "") {
        return false;
    }

    if (isNaN(text)) {
        return false;
    }

    return true;
}

function openHomeByRole() {
    if (userRole == "Admin") {
        showScreen("adminHomeScreen");
    } else if (userRole == "Performer") {
        showScreen("performerHomeScreen");
    } else {
        showScreen("requesterHomeScreen");
    }
}

function showWelcomePopup() {
    if (document.getElementById("welcomePopup") == null) {
        return;
    }

    document.getElementById("welcomePopup").style.display = "block";
}

function hideWelcomePopup() {
    if (document.getElementById("welcomePopup") == null) {
        return;
    }

    document.getElementById("welcomePopup").style.display = "none";
}

function chooseWelcomeRole(roleName) {
    localStorage.removeItem("showWelcomePopup");
    userRole = roleName;
    localStorage.setItem("userRole", userRole);
    hideWelcomePopup();

    if (roleName == "Performer") {
        showScreen("performerHomeScreen");
    } else {
        showScreen("requesterHomeScreen");
    }
}

document.addEventListener("click", function (event) {
    var sideMenu = document.getElementById("sideMenu");
    var menuButton = document.getElementsByClassName("menuButton")[0];

    if (sideMenu == null || sideMenu.style.display != "block") {
        return;
    }

    if (sideMenu.contains(event.target)) {
        return;
    }

    if (menuButton != null && menuButton.contains(event.target)) {
        return;
    }

    closeMenu();
});

window.onload = function () {
    var screens = document.getElementsByClassName("screen");

    if (document.getElementById("performerHomeScreen") != null) {
        userRole = "Performer";
        localStorage.setItem("userRole", userRole);
    }

    if (document.getElementById("requesterHomeScreen") != null) {
        userRole = "Requester";
        localStorage.setItem("userRole", userRole);
    }

    if (document.getElementById("adminHomeScreen") != null) {
        userRole = "Admin";
        localStorage.setItem("userRole", userRole);
    }

    if (screens.length > 0) {
        showScreen(screens[0].id);
    }

    if (localStorage.getItem("showWelcomePopup") == "yes") {
        showWelcomePopup();
    }
};



