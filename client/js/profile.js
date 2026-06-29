var PROFILE_API_BASE_URL = API_BASE_URL + "/api";
var profileRole = localStorage.getItem("userRole") || "Requester";
var profileData = {};
var currentProfile = null;
var profileOriginalUsername = "";
var uploadedProfileImage = "";
var profileAvailableSkills = [
    "Payroll Accounting & Calculations",
    "Taxation & Benefits Compliance",
    "Budgeting & Financial Reporting",
    "Operational Excellence",
    "Project Lifecycle Management",
    "Product Requirement Characterization",
    "Operations & Monitoring",
    "Risk Management & Security Clearance",
    "Analytical Thinking & Problem Solving",
    "Working Under Pressure & Adaptability",
    "Teamwork & Cross-functional Collaboration",
    "High Attention to Detail",
    "Self-Driven Learning",
    "Software Engineering Principles",
    "Low-Level & High-Level Programming",
    "System Architecture",
    "Networking & IT Diagnostics",
    "Digital Design & Visual Storytelling",
    "Logo & Concept Branding"
];

function getProfileHomePath() {
    if (profileRole == "Performer") {
        return "performer.html";
    }

    return "requester.html";
}

function goToProfileHome() {
    window.location.href = getProfileHomePath();
}

function switchProfileRole(roleName) {
    profileRole = roleName;
    localStorage.setItem("userRole", profileRole);
    goToProfileHome();
}

function markProfileRole() {
    var requesterButton = document.getElementById("requesterButton");
    var performerButton = document.getElementById("performerButton");

    if (requesterButton == null || performerButton == null) {
        return;
    }

    if (profileRole == "Performer") {
        requesterButton.className = "";
        performerButton.className = "activeRole";
    } else {
        requesterButton.className = "activeRole";
        performerButton.className = "";
    }
}

function parseProfileServerResponse(response) {
    if (response.status >= 200 && response.status < 300) {
        return response.json();
    }

    throw new Error("Profile server request failed");
}

function fetchProfileEndpoint(path) {
    return fetch(PROFILE_API_BASE_URL + path).then(parseProfileServerResponse);
}

function getLoggedInProfileUserId() {
    var userId = Number(localStorage.getItem("loggedInUserId"));

    if (isNaN(userId) == false && userId > 0) {
        return userId;
    }

    return null;
}

function loadProfileData(done) {
    var userId = getLoggedInProfileUserId();
    var userRequest = userId != null ? fetchProfileEndpoint("/users/" + userId) : fetchProfileEndpoint("/users");
    var tasksRequest = fetchProfileEndpoint("/tasks").catch(function (error) {
        console.log("Could not load profile tasks: " + error.message);
        return [];
    });
    var paymentsRequest = fetchProfileEndpoint("/payment").catch(function (error) {
        console.log("Could not load profile payments: " + error.message);
        return [];
    });
    var ratingsRequest = userId != null ? fetchProfileEndpoint("/rating/user/" + userId).catch(function () {
        return { averageRating: 0, totalRatings: 0, ratings: [] };
    }) : Promise.resolve({ averageRating: 0, totalRatings: 0, ratings: [] });

    Promise.all([
        userRequest,
        tasksRequest,
        paymentsRequest,
        ratingsRequest
    ])
        .then(function (responses) {
            done(buildProfileDataFromServer(responses[0], responses[1], responses[2], responses[3]));
        })
        .catch(function (error) {
            console.log("Could not load profile user: " + error.message);
            done(getDefaultProfileData());
        });
}

function buildProfileDataFromServer(userData, tasksData, paymentsData, ratingsData) {
    var users = Array.isArray(userData) ? userData : [userData];
    var currentUser = findProfileUserFromList(users) || users[0] || {};
    var normalizedUser = normalizeProfileUserFromServer(currentUser);
    var taskLogs = normalizeProfileTasksFromServer(tasksData || [], normalizedUser);
    var payments = normalizeProfilePaymentsFromServer(paymentsData || [], normalizedUser);
    var ratingDetails = normalizeProfileRatingsFromServer(ratingsData);

    normalizedUser.rating = ratingDetails.averageRating;
    normalizedUser.ratingCount = ratingDetails.totalRatings;
    normalizedUser.ratings = ratingDetails.reviews;
    normalizedUser.reviews = ratingDetails.reviews;

    return {
        users: [normalizedUser],
        taskLogs: taskLogs,
        payments: payments
    };
}

function findProfileUserFromList(users) {
    var userId = getLoggedInProfileUserId();
    var username = localStorage.getItem("loggedInUsername") || "";

    for (var i = 0; i < users.length; i++) {
        if (userId != null && Number(users[i].id) == userId) {
            return users[i];
        }

        if (normalizeProfileText(users[i].username) == normalizeProfileText(username)) {
            return users[i];
        }
    }

    return null;
}

function normalizeProfileUserFromServer(user) {
    return {
        id: user.id,
        name: user.full_name || user.name || "User",
        full_name: user.full_name || user.name || "User",
        username: user.username || user.full_name || "User",
        email: user.email || "",
        birth_date: formatProfileDate(user.birth_date),
        phone_number: user.phone_number || "",
        gender: user.gender || "",
        role: user.role || profileRole,
        bio: user.bio || "",
        skills: user.skills || "",
        image: user.profile_picture || user.profileImage || "",
        profile_picture: user.profile_picture || user.profileImage || "",
        tasks: [],
        ratings: []
    };
}

function normalizeProfileTasksFromServer(tasks, user) {
    var rows = [];
    var userId = Number(user.id);

    for (var i = 0; i < tasks.length; i++) {
        if (Number(tasks[i].requester_id) != userId && Number(tasks[i].performer_id) != userId) {
            continue;
        }

        rows.push({
            fullName: user.name,
            requester: tasks[i].requester_name || "Requester",
            performer: tasks[i].performer_name || "Performer",
            lastTask: tasks[i].title || "Task",
            activeStatus: formatProfileTaskStatus(tasks[i].state || tasks[i].work_status),
            date: formatProfileDate(tasks[i].created_at || tasks[i].deadline),
            payment: Number(tasks[i].payment || 0)
        });
    }

    return rows;
}

function normalizeProfilePaymentsFromServer(payments, user) {
    var rows = [];
    var userId = Number(user.id);

    for (var i = 0; i < payments.length; i++) {
        if (Number(payments[i].requester_id) != userId && Number(payments[i].performer_id) != userId) {
            continue;
        }

        rows.push({
            payee: payments[i].performer_name || user.name,
            payee_id: payments[i].performer_id,
            amount: Number(payments[i].amount || 0),
            status: payments[i].status || "pending"
        });
    }

    return rows;
}

function normalizeProfileRatingsFromServer(ratingsData) {
    var ratings = ratingsData != null && Array.isArray(ratingsData.ratings) ? ratingsData.ratings : [];
    var average = Number(ratingsData != null ? ratingsData.averageRating || ratingsData.average_rating || 0 : 0);
    var total = Number(ratingsData != null ? ratingsData.totalRatings || ratingsData.total_ratings || ratings.length : ratings.length);
    var reviews = [];

    for (var i = 0; i < ratings.length; i++) {
        reviews.push({
            clientName: ratings[i].requester_name || "Client",
            taskTitle: ratings[i].task_title || "Task",
            rating: Number(ratings[i].rating || 0),
            feedback: ratings[i].feedback || "",
            date: formatProfileDate(ratings[i].created_at || ratings[i].updated_at),
            id: ratings[i].id || ""
        });
    }

    return {
        averageRating: average > 0 ? average.toFixed(1) : "0.0",
        totalRatings: total,
        reviews: reviews
    };
}

function formatProfileTaskStatus(status) {
    var normalizedStatus = normalizeProfileText(status);

    if (normalizedStatus == "completed" || normalizedStatus == "task completed") {
        return "completed";
    }

    if (normalizedStatus == "cancelled" || normalizedStatus == "canceled") {
        return "cancelled";
    }

    if (normalizedStatus == "open" || normalizedStatus == "available") {
        return "open";
    }

    return "in progress";
}

function formatProfileDate(value) {
    if (value == null || value == "") {
        return "";
    }

    return String(value).split("T")[0];
}
function getDefaultProfileData() {
    return {
        users: [
            {
                username: "john_doe",
                name: "User",
                email: "",
                tasks: [],
                ratings: [],
                reviews: [],
                rating: "0.0",
                ratingCount: 0
            }
        ],
        taskLogs: [],
        payments: []
    };
}

function initializeProfile() {
    markProfileRole();
    showLoading();

    loadProfileData(function (data) {
        profileData = data;
        currentProfile = buildCurrentProfile(data);
        renderProfile();
        fillEditForm();
        fillCardForm();
        hideLoading();
    });
}

function buildCurrentProfile(data) {
    var username = localStorage.getItem("loggedInUsername") || "john_doe";
    var user = findProfileUser(data, username);

    if (user == null && data.users != null && data.users.length > 0) {
        user = data.users[0];
    }

    if (user == null) {
        user = getDefaultProfileData().users[0];
    }
    var profile = {};

    copyProfileFields(profile, user);

    profileOriginalUsername = user.username || username;
    profile.username = profile.username || username;
    profile.name = profile.name || "User";
    profile.email = profile.email || "";
    profile.bio = profile.bio || "";
    profile.skills = profile.skills || "";
    profile.rating = profile.rating != null && profile.rating !== "" ? profile.rating : getRatingFromText(profile.ratings);
    profile.ratingCount = profile.ratingCount != null && profile.ratingCount !== "" ? profile.ratingCount : getReviewCount(profile);
    profile.completedTasks = profile.completedTasks || getCompletedCount(profile);
    profile.activeTasks = profile.activeTasks || getActiveCount(profile);
    profile.earnings = profile.earnings || getEarnings(profile);
    profile.reviews = profile.reviews || profile.ratings || [];
    profile.image = profile.image || "";

    return profile;
}

function copyProfileFields(target, source) {
    if (source == null) {
        return;
    }

    for (var key in source) {
        target[key] = source[key];
    }
}

function findProfileUser(data, username) {
    if (data.users == null) {
        return null;
    }

    for (var i = 0; i < data.users.length; i++) {
        if (normalizeProfileText(data.users[i].username) == normalizeProfileText(username)) {
            return data.users[i];
        }
    }

    return null;
}

function saveCurrentProfile() {
    profileOriginalUsername = currentProfile.username;
}

function buildProfileUpdateRequest(password) {
    var request = {
        full_name: currentProfile.name,
        username: currentProfile.username,
        email: currentProfile.email,
        birth_date: currentProfile.birth_date || null,
        phone_number: currentProfile.phone_number || "",
        gender: currentProfile.gender || "",
        bio: currentProfile.bio || "",
        skills: currentProfile.skills || "",
        profile_picture: getServerProfilePictureValue(),
        role: currentProfile.role || profileRole
    };

    if (password != null && password != "") {
        request.password = password;
    }

    return request;
}

function getServerProfilePictureValue() {
    return currentProfile.image || "";
}

function updateCurrentProfileOnServer(password) {
    var userId = currentProfile.id || getLoggedInProfileUserId();

    if (userId == null || userId == "") {
        return Promise.reject(new Error("Cannot update profile because user id is missing"));
    }

    return fetch(PROFILE_API_BASE_URL + "/users/" + userId, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildProfileUpdateRequest(password))
    }).then(parseProfileServerResponse);
}

function saveProfileLoginState() {
    localStorage.setItem("loggedInUsername", currentProfile.username);
    localStorage.setItem("loggedInFullName", currentProfile.name);
    localStorage.setItem("loggedInEmail", currentProfile.email);
    localStorage.setItem("loggedInProfilePicture", currentProfile.image || currentProfile.profile_picture || "");
    localStorage.setItem("userRole", currentProfile.role || profileRole);

    var currentUser = typeof getStoredHeaderUser == "function" ? getStoredHeaderUser() : {};
    currentUser.id = currentProfile.id || currentUser.id;
    currentUser.full_name = currentProfile.name;
    currentUser.username = currentProfile.username;
    currentUser.email = currentProfile.email;
    currentUser.bio = currentProfile.bio || "";
    currentUser.skills = currentProfile.skills || "";
    currentUser.role = currentProfile.role || profileRole;
    currentUser.profile_picture = currentProfile.image || currentProfile.profile_picture || "";
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    if (typeof refreshHeaderProfilePicture == "function") {
        refreshHeaderProfilePicture();
    }

    if (currentProfile.id != null && currentProfile.id != "") {
        localStorage.setItem("loggedInUserId", currentProfile.id);
    }
}
function renderProfile() {
    setProfileText("profileName", currentProfile.name);
    setProfileText("profileEmail", currentProfile.email);
    setProfileText("profileRating", currentProfile.rating);
    setProfileText("profileRatingCount", currentProfile.ratingCount);
    renderProfileBio(currentProfile.bio);
    renderProfileSkillTags(currentProfile.skills);
    setProfileText("completedTasksCount", currentProfile.completedTasks);
    setProfileText("activeTasksCount", currentProfile.activeTasks);
    setProfileText("earningsAmount", "$" + currentProfile.earnings);
    renderProfileImage("profileImage", "profileInitials", currentProfile);
    renderTaskHistory();
    renderReviews();
}

function renderProfileBio(bio) {
    var element = document.getElementById("profileBio");
    if (element == null) return;
    if (bio == null || bio.trim() == "") {
        element.innerHTML = '<span class="profileEmptyHint">No bio added yet</span>';
    } else {
        element.innerText = bio;
    }
}

function renderProfileSkillTags(skillsText) {
    var element = document.getElementById("profileSkills");
    if (element == null) return;
    var skills = getProfileSkillsArray(skillsText);
    if (skills.length == 0) {
        element.innerHTML = '<span class="profileEmptyHint">No skills added yet</span>';
        return;
    }
    var html = "";
    for (var i = 0; i < skills.length; i++) {
        html += '<span class="profileSkillTag">' + cleanProfileText(skills[i]) + '</span>';
    }
    element.innerHTML = html;
}

function setProfileText(id, text) {
    var element = document.getElementById(id);

    if (element != null) {
        element.innerText = text;
    }
}

function renderProfileImage(imageId, initialsId, profile) {
    var image = document.getElementById(imageId);
    var initials = document.getElementById(initialsId);

    if (image == null || initials == null) {
        return;
    }

    initials.innerText = getInitials(profile.name);

    if (profile.image != null && profile.image != "") {
        image.src = profile.image;
        image.style.display = "block";
        initials.style.display = "none";
    } else {
        image.removeAttribute("src");
        image.style.display = "none";
        initials.style.display = "flex";
    }
}

function getInitials(name) {
    var parts = String(name || "User").trim().split(" ");
    var initials = "";

    for (var i = 0; i < parts.length && i < 2; i++) {
        if (parts[i] != "") {
            initials += parts[i].charAt(0).toUpperCase();
        }
    }

    return initials || "U";
}

function renderTaskHistory() {
    var list = document.getElementById("profileTaskList");
    var tasks = currentProfile.tasks || [];
    var rows = "";

    if (profileData.taskLogs != null) {
        for (var i = 0; i < profileData.taskLogs.length; i++) {
            var task = profileData.taskLogs[i];
            if (normalizeProfileText(task.requester) == normalizeProfileText(currentProfile.name) || normalizeProfileText(task.performer) == normalizeProfileText(currentProfile.name) || normalizeProfileText(task.fullName) == normalizeProfileText(currentProfile.name)) {
                rows += "<li><b>" + cleanProfileText(task.lastTask) + "</b> - " + cleanProfileText(task.activeStatus) + " (" + cleanProfileText(task.date) + ")</li>";
            }
        }
    }

    for (var j = 0; j < tasks.length; j++) {
        rows += "<li>" + cleanProfileText(tasks[j]) + "</li>";
    }

    list.innerHTML = rows || "<li>No task history yet.</li>";
}

function renderReviews() {
    var list = document.getElementById("profileReviewList");
    var reviews = currentProfile.reviews || [];
    var rows = "";

    for (var i = 0; i < reviews.length; i++) {
        rows += buildProfileReviewRow(reviews[i]);
    }

    list.innerHTML = rows || "<li class='profileEmptyReview'>No client reviews yet.</li>";
}

function buildProfileReviewRow(review) {
    if (typeof review == "string") {
        return "<li class='profileReviewCard'><p>" + cleanProfileText(review) + "</p></li>";
    }

    return "<li class='profileReviewCard'>" +
        "<div class='profileReviewHeader'>" +
        "<strong>" + cleanProfileText(review.clientName || "Client") + "</strong>" +
        "<span>" + cleanProfileText(review.date || "") + "</span>" +
        "</div>" +
        "<div class='profileReviewMeta'>" +
        "<span>" + cleanProfileText(review.taskTitle || "Task") + "</span>" +
        "<span class='profileReviewStars'>" + getProfileRatingStars(review.rating) + "</span>" +
        "</div>" +
        "<p>" + cleanProfileText(review.feedback || "No written feedback.") + "</p>" +
        "</li>";
}

function getProfileRatingStars(ratingValue) {
    var rating = Math.round(Number(ratingValue || 0));
    var stars = "";

    for (var i = 1; i <= 5; i++) {
        stars += "<span class='" + (i <= rating ? "activeReviewStar" : "emptyReviewStar") + "'>&#9733;</span>";
    }

    return stars;
}

function showProfileTab(tabName) {
    var tabs = document.querySelectorAll(".profileTabs button");
    var panels = ["aboutTab", "tasksTab", "reviewsTab"];

    if (tabName != "about") {
        closeAboutEdit();
    }

    for (var i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].getAttribute("data-tab") == tabName ? "activeProfileTab" : "";
    }

    for (var j = 0; j < panels.length; j++) {
        document.getElementById(panels[j]).className = "profileTabPanel hiddenProfilePanel";
    }

    document.getElementById(tabName + "Tab").className = "profileTabPanel";
}

function showProfileView(viewId) {
    var views = ["profileView", "editProfileView", "cardView"];

    for (var i = 0; i < views.length; i++) {
        document.getElementById(views[i]).className = "profileSection hiddenProfilePanel";
    }

    document.getElementById(viewId).className = "profileSection";
}

function fillEditForm() {
    uploadedProfileImage = currentProfile.image || "";
    setInputValue("editFullName", currentProfile.name);
    setInputValue("editUsername", currentProfile.username);
    setInputValue("editEmail", currentProfile.email);
    setInputValue("editPassword", "");
    setInputValue("editPasswordConfirm", "");
    renderProfileImage("editProfileImage", "editProfileInitials", currentProfile);
}

function openAboutEdit() {
    setInputValue("editBio", currentProfile.bio);
    updateBioCounter();
    renderProfileSkillOptions(currentProfile.skills);
    setProfileMessage("aboutEditMessage", "", false);
    document.getElementById("aboutViewPanel").className = "hiddenProfilePanel";
    document.getElementById("aboutEditForm").className = "profileAboutEditForm";
}

function closeAboutEdit() {
    document.getElementById("aboutViewPanel").className = "";
    document.getElementById("aboutEditForm").className = "hiddenProfilePanel profileAboutEditForm";
    setProfileMessage("aboutEditMessage", "", false);
}

function updateBioCounter() {
    var bioInput = document.getElementById("editBio");
    var counter = document.getElementById("editBioCounter");

    if (bioInput == null || counter == null) {
        return;
    }

    counter.innerHTML = bioInput.value.length + " / 150";
}

function getProfileSkillsArray(skillsText) {
    if (skillsText == null || skillsText == "") {
        return [];
    }

    return String(skillsText).split(",").map(function (skill) {
        return skill.trim();
    }).filter(function (skill) {
        return skill != "";
    });
}

function renderProfileSkillOptions(selectedSkillsText) {
    var container = document.getElementById("editSkillsOptions");
    var selectedSkills = getProfileSkillsArray(selectedSkillsText);

    if (container == null) {
        return;
    }

    container.innerHTML = "";

    for (var i = 0; i < profileAvailableSkills.length; i++) {
        var skill = profileAvailableSkills[i];
        var checked = selectedSkills.indexOf(skill) >= 0 ? " checked" : "";
        container.innerHTML += "<label class='profileSkillOption'><input type='checkbox' name='editSkillOption' value='" + cleanProfileText(skill) + "'" + checked + "> <span>" + cleanProfileText(skill) + "</span></label>";
    }

    attachProfileSkillEvents();
    enforceProfileSkillLimit();
}

function attachProfileSkillEvents() {
    var checkboxes = document.querySelectorAll("input[name='editSkillOption']");

    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener("change", enforceProfileSkillLimit);
    }
}

function getSelectedProfileSkills() {
    var selected = [];
    var checkboxes = document.querySelectorAll("input[name='editSkillOption']");

    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selected.push(checkboxes[i].value);
        }
    }

    return selected;
}

function enforceProfileSkillLimit() {
    var selected = getSelectedProfileSkills();
    var checkboxes = document.querySelectorAll("input[name='editSkillOption']");
    var disableUnchecked = selected.length >= 4;

    for (var i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) {
            checkboxes[i].disabled = disableUnchecked;
        }
    }
}

function saveEditProfile() {
    var fullName = getInputValue("editFullName");
    var username = getInputValue("editUsername");
    var email = getInputValue("editEmail");
    var password = getPasswordInputValue("editPassword");
    var confirmPassword = getPasswordInputValue("editPasswordConfirm");
    var changedDetails = [];

    setProfileMessage("profileEditMessage", "", false);

    if (fullName == "" || username == "" || email == "") {
        setProfileMessage("profileEditMessage", "Full name, username, and email are required", false);
        return false;
    }

    if (!isValidProfileEmail(email)) {
        setProfileMessage("profileEditMessage", "Email must be valid and include @", false);
        return false;
    }

    if ((password != "" && confirmPassword == "") || (password == "" && confirmPassword != "")) {
        setProfileMessage("profileEditMessage", "Please fill both password fields", false);
        return false;
    }

    if (password != confirmPassword) {
        setProfileMessage("profileEditMessage", "Password confirmation does not match", false);
        return false;
    }

    if (password != "" && !isValidProfilePassword(password)) {
        setProfileMessage("profileEditMessage", "Password must include both letters and numbers", false);
        return false;
    }

    changedDetails = getProfileChangedDetails(fullName, username, email, currentProfile.bio, currentProfile.skills, password);

    currentProfile.name = fullName;
    currentProfile.username = username;
    currentProfile.email = email;
    currentProfile.image = uploadedProfileImage;

    if (password != "") {
        currentProfile.password = password;
        currentProfile.passwordUpdated = new Date().toISOString().substring(0, 10);
    }
    setProfileMessage("profileEditMessage", "Saving profile...", true);

    updateCurrentProfileOnServer(password)
        .then(function () {
            saveProfileLoginState();
            saveCurrentProfile();
            renderProfile();
            fillEditForm();
            showProfileView("profileView");
            showProfileUpdatedPopup(changedDetails);
        })
        .catch(function (error) {
            setProfileMessage("profileEditMessage", getProfileUpdateErrorMessage(error), false);
        });

    return false;
}

function saveAboutProfile() {
    var bio = getInputValue("editBio");
    var selectedSkills = getSelectedProfileSkills();
    var skills = selectedSkills.join(", ");
    var changedDetails = [];

    setProfileMessage("aboutEditMessage", "", false);

    if (bio.length > 150) {
        setProfileMessage("aboutEditMessage", "Bio must be up to 150 characters", false);
        return false;
    }

    if (selectedSkills.length > 4) {
        setProfileMessage("aboutEditMessage", "You can choose up to 4 skills", false);
        return false;
    }

    changedDetails = [];
    addProfileChange(changedDetails, "Bio", currentProfile.bio, bio);
    addProfileChange(changedDetails, "Skills", currentProfile.skills, skills);

    if (changedDetails.length == 0) {
        changedDetails.push("No visible details changed");
    }

    currentProfile.bio = bio;
    currentProfile.skills = skills;

    setProfileMessage("aboutEditMessage", "Saving about details...", true);

    updateCurrentProfileOnServer("")
        .then(function () {
            saveProfileLoginState();
            saveCurrentProfile();
            renderProfile();
            closeAboutEdit();
            showProfileUpdatedPopup(changedDetails);
        })
        .catch(function (error) {
            setProfileMessage("aboutEditMessage", getProfileUpdateErrorMessage(error), false);
        });

    return false;
}

function getProfileUpdateErrorMessage(error) {
    if (error != null && error.message != null) {
        return error.message;
    }

    return "Profile update failed. Please try again.";
}
function isValidProfileEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidProfilePassword(password) {
    return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

function getProfileChangedDetails(fullName, username, email, bio, skills, password) {
    var changes = [];

    addProfileChange(changes, "Full Name", currentProfile.name, fullName);
    addProfileChange(changes, "Username", currentProfile.username, username);
    addProfileChange(changes, "Email", currentProfile.email, email);
    addProfileChange(changes, "Bio", currentProfile.bio, bio);
    addProfileChange(changes, "Skills", currentProfile.skills, skills);

    if ((currentProfile.image || "") != (uploadedProfileImage || "")) {
        changes.push("Profile picture updated");
    }

    if (password != "") {
        changes.push("Password updated");
    }

    if (changes.length == 0) {
        changes.push("No visible details changed");
    }

    return changes;
}

function addProfileChange(changes, label, oldValue, newValue) {
    if (String(oldValue || "") != String(newValue || "")) {
        changes.push(label + ": " + String(oldValue || "Empty") + " -> " + String(newValue || "Empty"));
    }
}

function showProfileUpdatedPopup(changedDetails) {
    var popup = document.getElementById("profileUpdatedPopup");
    var list = document.getElementById("profileUpdatedList");
    var rows = "";

    if (popup == null || list == null) {
        return;
    }

    for (var i = 0; i < changedDetails.length; i++) {
        rows += "<li>" + cleanProfileText(changedDetails[i]) + "</li>";
    }

    list.innerHTML = rows;
    popup.style.display = "flex";
    popup.setAttribute("aria-hidden", "false");
}

function closeProfileUpdatedPopup() {
    var popup = document.getElementById("profileUpdatedPopup");

    if (popup != null) {
        if (document.activeElement != null && popup.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        popup.style.display = "none";
        popup.setAttribute("aria-hidden", "true");
    }
}

function previewProfileImage(file) {
    readProfilePictureFile("editProfilePicture", function (imageData) {
        uploadedProfileImage = imageData;
        var previewProfile = {};
        copyProfileFields(previewProfile, currentProfile);
        previewProfile.image = uploadedProfileImage;
        renderProfileImage("editProfileImage", "editProfileInitials", previewProfile);
        setProfileMessage("profileEditMessage", "", false);
    }, function (message) {
        setProfileMessage("profileEditMessage", message, false);
    });
}

function setInputValue(id, value) {
    var element = document.getElementById(id);

    if (element != null) {
        element.value = value || "";
    }
}

function getInputValue(id) {
    var element = document.getElementById(id);

    if (element == null) {
        return "";
    }

    return element.value.trim();
}

function getPasswordInputValue(id) {
    var element = document.getElementById(id);

    if (element == null) {
        return "";
    }

    return element.value;
}

function togglePasswordVisibility(inputId, buttonId) {
    var input = document.getElementById(inputId);
    var button = document.getElementById(buttonId);

    if (input == null || button == null) {
        return;
    }

    if (input.type == "password") {
        input.type = "text";
        button.setAttribute("aria-label", "Hide password");
    } else {
        input.type = "password";
        button.setAttribute("aria-label", "Show password");
    }
}

function setProfileMessage(id, text, isSuccess) {
    var message = document.getElementById(id);

    if (message == null) {
        return;
    }

    message.innerText = text;
    message.className = isSuccess ? "message profileFormMessage profileSuccess" : "message profileFormMessage";
}

function getCompletedCount(profile) {
    var count = 0;

    if (profileData.taskLogs != null) {
        for (var i = 0; i < profileData.taskLogs.length; i++) {
            if (normalizeProfileText(profileData.taskLogs[i].fullName) == normalizeProfileText(profile.name) && normalizeProfileText(profileData.taskLogs[i].activeStatus) == "completed") {
                count++;
            }
        }
    }

    return count;
}

function getActiveCount(profile) {
    var count = 0;

    if (profileData.taskLogs != null) {
        for (var i = 0; i < profileData.taskLogs.length; i++) {
            if (normalizeProfileText(profileData.taskLogs[i].fullName) == normalizeProfileText(profile.name) && normalizeProfileText(profileData.taskLogs[i].activeStatus) != "completed") {
                count++;
            }
        }
    }

    return count;
}

function getEarnings(profile) {
    var total = 0;

    if (profileData.payments != null) {
        for (var i = 0; i < profileData.payments.length; i++) {
            if (normalizeProfileText(profileData.payments[i].payee) == normalizeProfileText(profile.name)) {
                total += Number(profileData.payments[i].amount || 0);
            }
        }
    }

    return total;
}

function getRatingFromText(ratings) {
    if (ratings != null && ratings.length > 0) {
        var rating = String(ratings[0]).match(/[0-9]+(\.[0-9]+)?/);

        if (rating != null) {
            return rating[0];
        }
    }

    return "0.0";
}

function getReviewCount(profile) {
    if (profile.reviews != null) {
        return profile.reviews.length;
    }

    if (profile.ratings != null) {
        return profile.ratings.length;
    }

    return 0;
}

function cleanProfileText(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeProfileText(value) {
    return String(value || "").toLowerCase().trim();
}

document.addEventListener("DOMContentLoaded", function () {
    initializeProfile();

    document.getElementById("profileBackButton").addEventListener("click", goToProfileHome);
    document.querySelector(".profileHeaderLink").addEventListener("click", function () {
        showProfileView("profileView");
    });
    document.getElementById("editBackButton").addEventListener("click", function () {
        showProfileView("profileView");
    });
    document.getElementById("cardBackButton").addEventListener("click", function () {
        showProfileView("profileView");
    });
    document.getElementById("editProfileButton").addEventListener("click", function () {
        fillEditForm();
        showProfileView("editProfileView");
    });
    document.getElementById("openCardButton").addEventListener("click", function () {
        fillCardForm();
        showProfileView("cardView");
    });
    document.getElementById("cancelEditButton").addEventListener("click", function () {
        showProfileView("profileView");
    });
    document.getElementById("cancelCardButton").addEventListener("click", function () {
        showProfileView("profileView");
    });
    document.getElementById("editProfileForm").addEventListener("submit", function (event) {
        event.preventDefault();
        saveEditProfile();
    });
    document.getElementById("editAboutButton").addEventListener("click", openAboutEdit);
    document.getElementById("cancelAboutEditButton").addEventListener("click", closeAboutEdit);
    document.getElementById("aboutEditForm").addEventListener("submit", function (event) {
        event.preventDefault();
        saveAboutProfile();
    });
    document.getElementById("creditCardForm").addEventListener("submit", function (event) {
        event.preventDefault();
        saveCardDetails();
    });
    document.getElementById("profileUpdatedButton").addEventListener("click", closeProfileUpdatedPopup);
    document.getElementById("toggleEditPassword").addEventListener("click", function () {
        togglePasswordVisibility("editPassword", "toggleEditPassword");
    });
    document.getElementById("toggleEditPasswordConfirm").addEventListener("click", function () {
        togglePasswordVisibility("editPasswordConfirm", "toggleEditPasswordConfirm");
    });
    document.getElementById("editProfilePicture").addEventListener("change", function () {
        previewProfileImage(this.files[0]);
    });
    document.getElementById("editBio").addEventListener("input", updateBioCounter);
    document.getElementById("requesterButton").addEventListener("click", function () {
        switchProfileRole("Requester");
    });
    document.getElementById("performerButton").addEventListener("click", function () {
        switchProfileRole("Performer");
    });

    var tabs = document.querySelectorAll(".profileTabs button");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener("click", function () {
            showProfileTab(this.getAttribute("data-tab"));
        });
    }
});







