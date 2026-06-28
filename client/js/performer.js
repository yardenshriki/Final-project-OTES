//yarden shriki, lior zahavi
var performerTasks = [];
var tasksApiUrl = API_BASE_URL + "/api/tasks";
var sortNewestFirst = true;
var performerRefreshTimer = null;
var performerRefreshIntervalMs = 6000;
var performerFilters = {
    difficulty: "",
    location: "",
    category: "",
    maxPrice: 1000
};

function loadPerformerTasks() {
    fetch(tasksApiUrl)
        .then(function (response) {
            if (response.status < 200 || response.status >= 300) {
                throw new Error("Server request failed");
            }

            return response.json();
        })
        .then(function (tasks) {
            if (Array.isArray(tasks) == false && Array.isArray(tasks.value) == true) {
                tasks = tasks.value;
            }

            performerTasks = normalizePerformerTasks(tasks);
            fillPerformerFilterCategories();
            renderPerformerActiveTasks();
            renderPerformerAvailableTasks();
            connectPerformerActions();
            if (typeof onChatTasksLoaded == "function") {
                onChatTasksLoaded();
            }
        })
        .catch(function (error) {
            console.log(error.message);
            performerTasks = [];
            fillPerformerFilterCategories();
            renderPerformerActiveTasks();
            renderPerformerAvailableTasks();
            connectPerformerActions();
        });
}

function startPerformerAutoRefresh() {
    if (performerRefreshTimer != null) {
        return;
    }

    performerRefreshTimer = setInterval(function () {
        loadPerformerTasks();
    }, performerRefreshIntervalMs);
}

function getCurrentPerformerId() {
    var savedId = localStorage.getItem("loggedInUserId");
    var performerId = Number(savedId);

    if (savedId != null && savedId != "" && isNaN(performerId) == false) {
        return performerId;
    }

    return 2;
}

function normalizePerformerTasks(tasks) {
    var normalizedTasks = [];

    for (var i = 0; i < tasks.length; i++) {
        normalizedTasks.push(normalizePerformerTask(tasks[i]));
    }

    return normalizedTasks;
}

function normalizePerformerTask(task) {
    var performerId = getCurrentPerformerId();
    var normalizedTask = Object.assign({}, task);

    normalizedTask.taskTitle = task.taskTitle || task.title || "";
    normalizedTask.difficultyLevel = task.difficultyLevel || task.difficulty || "";
    normalizedTask.categories = task.categories || task.category || "";
    normalizedTask.creationDate = task.creationDate || formatTaskDate(task.created_at);
    normalizedTask.payment = Number(task.payment || 0);
    normalizedTask.assignedToPerformer = task.assignedToPerformer == true || task.performer_id == performerId;

    return normalizedTask;
}

function formatTaskDate(dateValue) {
    if (dateValue == null || dateValue == "") {
        return "";
    }

    return String(dateValue).split("T")[0];
}

function connectPerformerActions() {
    var searchInput = document.getElementById("performerSearchInput");
    var sortButton = document.getElementById("sortDateButton");
    var filterButton = document.getElementsByClassName("performerFilterButton")[0];
    var closeFilterButton = document.getElementById("closePerformerFilter");
    var filterOverlay = document.getElementById("performerFilterOverlay");
    var submitFilterButton = document.getElementById("submitPerformerFilters");
    var resetFilterButton = document.getElementById("resetPerformerFilters");
    var maxPriceInput = document.getElementById("filterMaxPrice");

    if (searchInput != null) {
        searchInput.oninput = renderPerformerAvailableTasks;
    }

    if (sortButton != null) {
        sortButton.onclick = function () {
            sortNewestFirst = !sortNewestFirst;

            if (sortNewestFirst == true) {
                sortButton.innerHTML = "&#8593;";
                sortButton.title = "Newest tasks first";
            } else {
                sortButton.innerHTML = "&#8595;";
                sortButton.title = "Oldest tasks first";
            }

            renderPerformerAvailableTasks();
        };
    }

    if (filterButton != null) {
        filterButton.onclick = openPerformerFilter;
    }

    if (closeFilterButton != null) {
        closeFilterButton.onclick = closePerformerFilter;
    }

    if (filterOverlay != null) {
        filterOverlay.onclick = closePerformerFilter;
    }

    if (submitFilterButton != null) {
        submitFilterButton.onclick = submitPerformerFilters;
    }

    if (resetFilterButton != null) {
        resetFilterButton.onclick = resetPerformerFilters;
    }

    if (maxPriceInput != null) {
        maxPriceInput.oninput = updateFilterPriceText;
    }
}

function renderPerformerActiveTasks() {
    var activeTasksList = document.getElementById("performerActiveTasks");

    if (activeTasksList == null) {
        return;
    }

    activeTasksList.innerHTML = "";

    for (var i = 0; i < performerTasks.length; i++) {
        if (performerTasks[i].assignedToPerformer == true && performerTasks[i].state != "completed") {
            activeTasksList.innerHTML += createPerformerTaskCard(performerTasks[i], "View");
        }
    }

    if (activeTasksList.innerHTML == "") {
        activeTasksList.innerHTML = '<p class="emptyTaskMessage">No active tasks yet</p>';
    }
}

function renderPerformerAvailableTasks() {
    var availableTasksList = document.getElementById("performerAvailableTasks");
    var searchInput = document.getElementById("performerSearchInput");

    if (availableTasksList == null) {
        return;
    }

    var searchText = "";

    if (searchInput != null) {
        searchText = searchInput.value.toLowerCase();
    }

    var availableTasks = performerTasks.filter(function (task) {
        var matchesState = task.state == "open" && (task.performer_id == null || task.performer_id == "");
        var matchesSearch = task.taskTitle.toLowerCase().indexOf(searchText) != -1 || task.description.toLowerCase().indexOf(searchText) != -1;
        var matchesDifficulty = performerFilters.difficulty == "" || task.difficultyLevel == performerFilters.difficulty;
        var matchesLocation = performerFilters.location == "" || task.location.toLowerCase().indexOf(performerFilters.location.toLowerCase()) != -1;
        var matchesCategory = performerFilters.category == "" || task.categories == performerFilters.category;
        var matchesPrice = task.payment <= performerFilters.maxPrice;

        return matchesState && matchesSearch && matchesDifficulty && matchesLocation && matchesCategory && matchesPrice;
    });

    availableTasks.sort(function (firstTask, secondTask) {
        var firstDate = new Date(firstTask.creationDate);
        var secondDate = new Date(secondTask.creationDate);

        if (sortNewestFirst == true) {
            return secondDate - firstDate;
        }

        return firstDate - secondDate;
    });

    availableTasksList.innerHTML = "";

    for (var i = 0; i < availableTasks.length; i++) {
        availableTasksList.innerHTML += createPerformerAvailableTaskCard(availableTasks[i]);
    }

    if (availableTasksList.innerHTML == "") {
        availableTasksList.innerHTML = '<p class="emptyTaskMessage">No available tasks found</p>';
    }
}

function createPerformerTaskCard(task, buttonText) {
    return '<div class="taskItem fullTask">' +
        '<span class="' + getPerformerStatusClass(task.state) + ' statusTop">' + task.state + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p>' + task.description + '</p>' +
        '<p>Location: ' + task.location + '</p>' +
        '<p>Created: ' + task.creationDate + '</p>' +
        '<p>Payment: <b>$' + task.payment + '</b></p>' +
        '<input type="button" value="' + buttonText + '" onclick="openPerformerTask(' + task.id + ', false)">' +
        '</div>';
}

function createPerformerAvailableTaskCard(task) {
    return '<div class="taskItem performerAvailableCard">' +
        '<span class="difficultyBadge">' + task.difficultyLevel + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p class="taskDescription">' + task.description + '</p>' +
        '<div class="taskMeta"><span>Category:</span><b>' + task.categories + '</b></div>' +
        '<div class="taskMeta"><span>Payment:</span><b>$' + task.payment + '</b></div>' +
        '<div class="taskMeta"><span>Created:</span><b>' + task.creationDate + '</b></div>' +
        '<div class="taskMeta"><span>Location:</span><b>' + task.location + '</b></div>' +
        '<input type="button" value="View Details" onclick="openPerformerTask(' + task.id + ', true)">' +
        '</div>';
}

function openPerformerTask(taskId, isAvailableTask) {
    localStorage.setItem("userRole", "Performer");

    if (isAvailableTask == true) {
        window.location.href = "task.html?id=" + taskId + "&mode=take";
    } else {
        window.location.href = "task.html?id=" + taskId;
    }
}

function fillPerformerFilterCategories() {
    var categorySelect = document.getElementById("filterCategory");

    if (categorySelect == null) {
        return;
    }

    categorySelect.innerHTML = '<option value="">All Categories</option>';

    for (var i = 0; i < performerTasks.length; i++) {
        if (performerCategoryExists(performerTasks[i].categories, categorySelect) == false) {
            categorySelect.innerHTML += '<option value="' + performerTasks[i].categories + '">' + performerTasks[i].categories + '</option>';
        }
    }
}

function performerCategoryExists(categoryName, categorySelect) {
    for (var i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value == categoryName) {
            return true;
        }
    }

    return false;
}

function openPerformerFilter() {
    document.getElementById("filterDifficulty").value = performerFilters.difficulty;
    document.getElementById("filterLocation").value = performerFilters.location;
    document.getElementById("filterCategory").value = performerFilters.category;
    document.getElementById("filterMaxPrice").value = performerFilters.maxPrice;

    if (typeof syncPerformerFilterLocationButton == "function") {
        syncPerformerFilterLocationButton(performerFilters.location);
    }

    updateFilterPriceText();

    document.getElementById("performerFilterOverlay").style.display = "block";
    document.getElementById("performerFilterDrawer").style.display = "block";
}

function closePerformerFilter() {
    document.getElementById("performerFilterOverlay").style.display = "none";
    document.getElementById("performerFilterDrawer").style.display = "none";
}

function updateFilterPriceText() {
    var maxPriceInput = document.getElementById("filterMaxPrice");
    var priceText = document.getElementById("filterPriceText");

    if (maxPriceInput == null || priceText == null) {
        return;
    }

    priceText.innerHTML = "$0 - $" + maxPriceInput.value;
}

function submitPerformerFilters() {
    performerFilters.difficulty = document.getElementById("filterDifficulty").value;
    performerFilters.location = document.getElementById("filterLocation").value;
    performerFilters.category = document.getElementById("filterCategory").value;
    performerFilters.maxPrice = parseInt(document.getElementById("filterMaxPrice").value);

    closePerformerFilter();
    renderPerformerAvailableTasks();
}

function resetPerformerFilters() {
    performerFilters.difficulty = "";
    performerFilters.location = "";
    performerFilters.category = "";
    performerFilters.maxPrice = 1000;

    document.getElementById("filterDifficulty").value = "";
    document.getElementById("filterLocation").value = "";
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterMaxPrice").value = "1000";

    if (typeof syncPerformerFilterLocationButton == "function") {
        syncPerformerFilterLocationButton("");
    }

    updateFilterPriceText();

    renderPerformerAvailableTasks();
    closePerformerFilter();
}

function getPerformerStatusText(state) {
    if (state == "open") {
        return "Available";
    }

    if (state == "in-progress") {
        return "Working";
    }

    if (state == "completed") {
        return "Completed";
    }

    return state;
}

function getPerformerStatusClass(state) {
    if (state == "open") {
        return "statusOpen";
    }

    if (state == "completed") {
        return "statusDone";
    }

    if (state == "cancelled") {
        return "statusCancelled";
    }

    return "statusProgress";
}

var performerPreviousWindowOnload = window.onload;

window.onload = function () {
    if (typeof performerPreviousWindowOnload == "function") {
        performerPreviousWindowOnload();
    }

    loadPerformerTasks();
    startPerformerAutoRefresh();
};

function checkPayment() {
    showScreen("profileScreen");
    return false;
}
