//yarden shriki, lior zahavi
var HEADER_PROFILE_API_URL = API_BASE_URL + "/api/users";

function getStoredHeaderUser() {
    var currentUserText = localStorage.getItem("currentUser");

    if (currentUserText == null || currentUserText == "") {
        return {};
    }

    try {
        return JSON.parse(currentUserText) || {};
    } catch (error) {
        return {};
    }
}

function getHeaderProfilePicture(user) {
    user = user || getStoredHeaderUser();

    return user.profile_picture || user.profilePicture || "";
}

function saveHeaderUserPicture(user) {
    if (user == null) {
        return;
    }

    var currentUser = getStoredHeaderUser();
    var picture = getHeaderProfilePicture(user);

    for (var key in user) {
        currentUser[key] = user[key];
    }

    currentUser.profile_picture = picture;
    currentUser.profilePicture = picture;

    if (picture != "") {
        localStorage.setItem("loggedInProfilePicture", picture);
    } else {
        localStorage.removeItem("loggedInProfilePicture");
    }

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function applyHeaderProfilePicture(picture) {
    var icons = document.querySelectorAll(".profileIcon");

    for (var i = 0; i < icons.length; i++) {
        if (picture != null && picture != "") {
            icons[i].classList.add("profileIconWithImage");
            icons[i].classList.remove("profileIconEmpty");
            icons[i].style.backgroundImage = "url('" + picture.replace(/'/g, "%27") + "')";
        } else {
            icons[i].classList.remove("profileIconWithImage");
            icons[i].classList.add("profileIconEmpty");
            icons[i].style.backgroundImage = "";
        }
    }
}

function isStoredHeaderUserCurrent(storedUser, userId) {
    if (userId == null || userId == "") {
        return false;
    }

    var storedUserId = storedUser.id || storedUser.user_id || storedUser.userId || "";
    return String(storedUserId) == String(userId);
}

function refreshHeaderProfilePicture() {
    var storedUser = getStoredHeaderUser();
    var userId = localStorage.getItem("loggedInUserId");
    var storedPicture = "";

    if (isStoredHeaderUserCurrent(storedUser, userId)) {
        storedPicture = getHeaderProfilePicture(storedUser);
    }

    applyHeaderProfilePicture(storedPicture);

    if (userId == null || userId == "") {
        return;
    }

    fetch(HEADER_PROFILE_API_URL + "/" + userId)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Could not load profile picture");
            }

            return response.json();
        })
        .then(function (user) {
            saveHeaderUserPicture(user);
            applyHeaderProfilePicture(getHeaderProfilePicture(user));
        })
        .catch(function () {
            applyHeaderProfilePicture(storedPicture);
        });
}

if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", refreshHeaderProfilePicture);
} else {
    refreshHeaderProfilePicture();
}
