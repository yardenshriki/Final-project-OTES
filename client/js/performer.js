//yarden shriki, lior zahavi
var performerTasks = [];
var sortNewestFirst = true;
var performerFilters = {
    difficulty: "",
    location: "",
    category: "",
    maxPrice: 1000
};

function loadPerformerTasks() {
    fetch("data/tasks.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (tasks) {
            performerTasks = applyLocalTaskAssignments(tasks.concat(getLocalCreatedTasks()));
            renderPerformerFilterCategories();
            renderPerformerActiveTasks();
            renderPerformerAvailableTasks();
            connectPerformerActions();
        });
}

function connectPerformerActions() {
    var searchInput = document.getElementById("performerSearchInput");
    var sortButton = document.getElementById("sortDateButton");
    var filterButton = document.getElementsByClassName("performerFilterButton")[0];
    var filterOverlay = document.getElementById("performerFilterOverlay");
    var closeFilterButton = document.getElementById("closePerformerFilter");
    var submitFilterButton = document.getElementById("submitPerformerFilters");
    var resetFilterButton = document.getElementById("resetPerformerFilters");
    var priceRange = document.getElementById("filterMaxPrice");

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
        filterButton.onclick = openPerformerFilterDrawer;
    }

    if (filterOverlay != null) {
        filterOverlay.onclick = closePerformerFilterDrawer;
    }

    if (closeFilterButton != null) {
        closeFilterButton.onclick = closePerformerFilterDrawer;
    }

    if (submitFilterButton != null) {
        submitFilterButton.onclick = submitPerformerFilters;
    }

    if (resetFilterButton != null) {
        resetFilterButton.onclick = resetPerformerFilters;
    }

    if (priceRange != null) {
        priceRange.oninput = updateFilterPriceText;
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
        var matchesState = task.state == "open" && task.assignedToPerformer == false;
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
}

function renderPerformerFilterCategories() {
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

function openPerformerFilterDrawer() {
    setFilterControlsFromState();
    updateFilterPriceText();
    document.getElementById("performerFilterOverlay").style.display = "block";
    document.getElementById("performerFilterDrawer").style.display = "block";
}

function closePerformerFilterDrawer() {
    document.getElementById("performerFilterOverlay").style.display = "none";
    document.getElementById("performerFilterDrawer").style.display = "none";
}

function setFilterControlsFromState() {
    document.getElementById("filterDifficulty").value = performerFilters.difficulty;
    document.getElementById("filterLocation").value = performerFilters.location;
    document.getElementById("filterCategory").value = performerFilters.category;
    document.getElementById("filterMaxPrice").value = performerFilters.maxPrice;
}

function updateFilterPriceText() {
    var priceRange = document.getElementById("filterMaxPrice");
    var priceText = document.getElementById("filterPriceText");

    if (priceRange == null || priceText == null) {
        return;
    }

    priceText.innerHTML = "$0 - $" + priceRange.value;
}

function submitPerformerFilters() {
    performerFilters.difficulty = document.getElementById("filterDifficulty").value;
    performerFilters.location = document.getElementById("filterLocation").value;
    performerFilters.category = document.getElementById("filterCategory").value;
    performerFilters.maxPrice = parseInt(document.getElementById("filterMaxPrice").value);

    renderPerformerAvailableTasks();
    closePerformerFilterDrawer();
}

function resetPerformerFilters() {
    performerFilters.difficulty = "";
    performerFilters.location = "";
    performerFilters.category = "";
    performerFilters.maxPrice = 1000;

    setFilterControlsFromState();
    updateFilterPriceText();
    renderPerformerAvailableTasks();
}

function createPerformerTaskCard(task, buttonText) {
    return '<div class="taskItem fullTask">' +
        '<span class="' + getPerformerStatusClass(task.state) + ' statusTop">' + task.state + '</span>' +
        '<h4>' + task.taskTitle + '</h4>' +
        '<p>' + task.description + '</p>' +
        '<p>Location: ' + task.location + '</p>' +
        '<p>Created: ' + task.creationDate + '</p>' +
        '<p>Payment: <b>$' + task.payment + '</b></p>' +
        '<input type="button" value="' + buttonText + '" onclick="openPerformerTask(' + task.id + ', true)">' +
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
        '<input type="button" value="View Details" onclick="openPerformerTask(' + task.id + ', false)">' +
        '</div>';
}

function openPerformerTask(taskId, isActiveTask) {
    localStorage.setItem("userRole", "Performer");

    if (isActiveTask == true) {
        window.location.href = "task.html?id=" + taskId;
    } else {
        window.location.href = "task.html?id=" + taskId + "&mode=take";
    }
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

document.addEventListener("DOMContentLoaded", loadPerformerTasks);

function checkPayment() {
    showScreen("profileScreen");
    return false;
}

