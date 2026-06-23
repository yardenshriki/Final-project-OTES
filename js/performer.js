//yarden shriki, lior zahavi
var performerTasks = [];
var tasksApiUrl = "http://localhost:5000/api/tasks";
var sortNewestFirst = true;
var performerFilters = {
    difficulty: "",
    location: "",
    category: "",
    maxPrice: 1000
};

function loadPerformerTasks() {
    fetch(tasksApiUrl)
        .then(function (response) {
            if (response.status == 200) {
                return response.json();
            }

            throw new Error("Failed to load performer tasks");
        })
        .then(function (tasks) {
            performerTasks = tasks;
            fillPerformerFilterCategories();
            renderPerformerActiveTasks();
            renderPerformerAvailableTasks();
            connectPerformerActions();
        })
        .catch(function (error) {
            console.log(error.message);
        });
}

function getCurrentUserId(defaultId) {
    var savedUserId = localStorage.getItem("loggedInUserId");

    if (savedUserId != null && savedUserId != "") {
        return Number(savedUserId);
    }

    return defaultId;
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
    var performerId = getCurrentUserId(2);

    for (var i = 0; i < performerTasks.length; i++) {
        if (performerTasks[i].performer_id == performerId && performerTasks[i].state != "completed") {
            activeTasksList.innerHTML += createPerformerTaskCard(performerTasks[i], "View");
        }
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
        var matchesSearch = task.title.toLowerCase().indexOf(searchText) != -1 || task.description.toLowerCase().indexOf(searchText) != -1;
        var matchesDifficulty = performerFilters.difficulty == "" || task.difficulty == performerFilters.difficulty;
        var matchesLocation = performerFilters.location == "" || task.location.toLowerCase().indexOf(performerFilters.location.toLowerCase()) != -1;
        var matchesCategory = performerFilters.category == "" || task.category == performerFilters.category;
        var matchesPrice = task.payment <= performerFilters.maxPrice;

        return matchesState && matchesSearch && matchesDifficulty && matchesLocation && matchesCategory && matchesPrice;
    });

    availableTasks.sort(function (firstTask, secondTask) {
        var firstDate = new Date(firstTask.created_at);
        var secondDate = new Date(secondTask.created_at);

        if (sortNewestFirst == true) {
            return secondDate - firstDate;
        }

        return firstDate - secondDate;
    });

    availableTasksList.innerHTML = "";

    for (var i = 0; i < availableTasks.length; i++) {
        availableTasksList.innerHTML += createPerformerAvailableTaskCard(availableTasks[i]);
    }
}

function createPerformerTaskCard(task, buttonText) {
    return '<div class="taskItem fullTask">' +
        '<span class="' + getPerformerStatusClass(task.state) + ' statusTop">' + task.state + '</span>' +
        '<h4>' + task.title + '</h4>' +
        '<p>' + task.description + '</p>' +
        '<p>Location: ' + task.location + '</p>' +
        '<p>Created: ' + task.created_at + '</p>' +
        '<p>Payment: <b>$' + task.payment + '</b></p>' +
        '<input type="button" value="' + buttonText + '" onclick="openPerformerTask(' + task.id + ', false)">' +
        '</div>';
}

function createPerformerAvailableTaskCard(task) {
    return '<div class="taskItem performerAvailableCard">' +
        '<span class="difficultyBadge">' + task.difficulty + '</span>' +
        '<h4>' + task.title + '</h4>' +
        '<p class="taskDescription">' + task.description + '</p>' +
        '<div class="taskMeta"><span>Category:</span><b>' + task.category + '</b></div>' +
        '<div class="taskMeta"><span>Payment:</span><b>$' + task.payment + '</b></div>' +
        '<div class="taskMeta"><span>Created:</span><b>' + task.created_at + '</b></div>' +
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
        if (performerCategoryExists(performerTasks[i].category, categorySelect) == false) {
            categorySelect.innerHTML += '<option value="' + performerTasks[i].category + '">' + performerTasks[i].category + '</option>';
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

    return "statusProgress";
}

var previousWindowOnload = window.onload;

window.onload = function () {
    if (typeof previousWindowOnload == "function") {
        previousWindowOnload();
    }

    loadPerformerTasks();
};

function checkPayment() {
    showScreen("profileScreen");
    return false;
}

