//yarden shriki, lior zahavi
var nearbyLocationResults = [];
var nearbyLocationsAreLoaded = false;
var nearbyLocationsAreLoading = false;
var performerNearbyLocationResults = [];
var performerNearbyLocationsAreLoaded = false;
var performerNearbyLocationsAreLoading = false;

document.addEventListener("DOMContentLoaded", setupTaskLocationField);
document.addEventListener("DOMContentLoaded", setupPerformerFilterLocationField);

function setupTaskLocationField() {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    renderLocationOptions([], "");
    document.addEventListener("click", closeTaskLocationListOnOutsideClick);
    showTaskLocationStatus("Click Location to load nearby cities based on your current location.");
}

function setupPerformerFilterLocationField() {
    var performerFilterLocationList = document.getElementById("performerFilterLocationList");

    if (performerFilterLocationList == null) {
        return;
    }

    renderPerformerFilterLocationOptions([], "");
    document.addEventListener("click", closePerformerFilterLocationListOnOutsideClick);
    showPerformerFilterLocationStatus("Click Location to load nearby cities based on your current location.");
}

function useNearestLocation() {
    loadNearbyCitiesFromCurrentLocation(true);
}

function toggleTaskLocationList() {
    var taskLocationList = document.getElementById("taskLocationList");
    var taskLocationButton = document.getElementById("taskLocationButton");

    if (taskLocationList == null || taskLocationButton == null) {
        return;
    }

    if (taskLocationList.className.indexOf("openLocationOptions") >= 0) {
        closeTaskLocationList();
        return;
    }

    taskLocationList.className = "locationOptions openLocationOptions";
    taskLocationButton.setAttribute("aria-expanded", "true");

    if (nearbyLocationsAreLoaded == false && nearbyLocationsAreLoading == false) {
        loadNearbyCitiesFromCurrentLocation(false);
    }
}

function loadNearbyCitiesFromCurrentLocation(selectNearestCity) {
    if (navigator.geolocation == null) {
        renderLocationMessage("Location detection is not supported by this browser.");
        showTaskLocationStatus("Your browser does not support location detection.");
        return;
    }

    nearbyLocationsAreLoading = true;
    renderLocationMessage("Loading nearby cities...");
    showTaskLocationStatus("Checking your current location...");

    navigator.geolocation.getCurrentPosition(function (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        loadCountryAndNearbyCities(latitude, longitude, selectNearestCity);
    }, function () {
        nearbyLocationsAreLoading = false;
        renderLocationMessage("Location permission was not approved.");
        showTaskLocationStatus("Location permission was not approved.");
    });
}

function togglePerformerFilterLocationList() {
    var locationList = document.getElementById("performerFilterLocationList");
    var locationButton = document.getElementById("performerFilterLocationButton");

    if (locationList == null || locationButton == null) {
        return;
    }

    if (locationList.className.indexOf("openPerformerFilterLocationOptions") >= 0) {
        closePerformerFilterLocationList();
        return;
    }

    locationList.className = "performerFilterLocationOptions openPerformerFilterLocationOptions";
    locationButton.setAttribute("aria-expanded", "true");

    if (performerNearbyLocationsAreLoaded == false && performerNearbyLocationsAreLoading == false) {
        loadPerformerNearbyCitiesFromCurrentLocation(false);
    }
}

function loadPerformerNearbyCitiesFromCurrentLocation(selectNearestCity) {
    if (navigator.geolocation == null) {
        renderPerformerFilterLocationMessage("Location detection is not supported by this browser.");
        showPerformerFilterLocationStatus("Your browser does not support location detection.");
        return;
    }

    performerNearbyLocationsAreLoading = true;
    renderPerformerFilterLocationMessage("Loading nearby cities...");
    showPerformerFilterLocationStatus("Checking your current location...");

    navigator.geolocation.getCurrentPosition(function (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        loadPerformerCountryAndNearbyCities(latitude, longitude, selectNearestCity);
    }, function () {
        performerNearbyLocationsAreLoading = false;
        renderPerformerFilterLocationMessage("Location permission was not approved.");
        showPerformerFilterLocationStatus("Location permission was not approved.");
    });
}

function loadPerformerCountryAndNearbyCities(latitude, longitude, selectNearestCity) {
    var apiUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=3&accept-language=en&lat=" + encodeURIComponent(latitude) + "&lon=" + encodeURIComponent(longitude);

    fetch(apiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (result) {
            var countryName = "";

            if (result != null && result.address != null && result.address.country != null) {
                countryName = result.address.country;
            }

            loadPerformerNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 50000, countryName);
        })
        .catch(function () {
            loadPerformerNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 50000, "");
        });
}

function loadPerformerNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, radiusMeters, countryName) {
    var query = buildOverpassNearbyCitiesQuery(latitude, longitude, radiusMeters);
    var apiUrl = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    showPerformerFilterLocationStatus("Loading nearby cities from external location API...");

    fetch(apiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var locations = buildNearbyLocationResults(data, latitude, longitude, countryName);

            if (locations.length == 0 && radiusMeters < 150000) {
                loadPerformerNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 150000, countryName);
                return;
            }

            performerNearbyLocationsAreLoading = false;
            performerNearbyLocationsAreLoaded = true;
            performerNearbyLocationResults = locations;

            if (performerNearbyLocationResults.length == 0) {
                renderPerformerFilterLocationMessage("No nearby cities were found.");
                showPerformerFilterLocationStatus("The external location API did not return nearby cities.");
                return;
            }

            renderPerformerFilterLocationOptions(performerNearbyLocationResults, getInputValue("filterLocation"));

            if (selectNearestCity == true) {
                selectPerformerFilterLocation(performerNearbyLocationResults[0].value, performerNearbyLocationResults[0].label);
                showPerformerFilterLocationStatus("Nearest city selected: " + performerNearbyLocationResults[0].label);
                return;
            }

            showPerformerFilterLocationStatus("Nearby cities loaded from closest to farthest.");
        })
        .catch(function () {
            performerNearbyLocationsAreLoading = false;
            renderPerformerFilterLocationMessage("Nearby cities could not be loaded.");
            showPerformerFilterLocationStatus("The external location API is not available right now.");
        });
}

function loadCountryAndNearbyCities(latitude, longitude, selectNearestCity) {
    var apiUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=3&accept-language=en&lat=" + encodeURIComponent(latitude) + "&lon=" + encodeURIComponent(longitude);

    fetch(apiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (result) {
            var countryName = "";

            if (result != null && result.address != null && result.address.country != null) {
                countryName = result.address.country;
            }

            loadNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 50000, countryName);
        })
        .catch(function () {
            loadNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 50000, "");
        });
}

function loadNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, radiusMeters, countryName) {
    var query = buildOverpassNearbyCitiesQuery(latitude, longitude, radiusMeters);
    var apiUrl = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    showTaskLocationStatus("Loading nearby cities from external location API...");

    fetch(apiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var locations = buildNearbyLocationResults(data, latitude, longitude, countryName);

            if (locations.length == 0 && radiusMeters < 150000) {
                loadNearbyCitiesFromExternalApi(latitude, longitude, selectNearestCity, 150000, countryName);
                return;
            }

            nearbyLocationsAreLoading = false;
            nearbyLocationsAreLoaded = true;
            nearbyLocationResults = locations;

            if (nearbyLocationResults.length == 0) {
                renderLocationMessage("No nearby cities were found.");
                showTaskLocationStatus("The external location API did not return nearby cities.");
                return;
            }

            renderLocationOptions(nearbyLocationResults, "");

            if (selectNearestCity == true) {
                selectNearbyLocation(nearbyLocationResults[0]);
                showTaskLocationStatus("Nearest city selected: " + nearbyLocationResults[0].label);
                return;
            }

            showTaskLocationStatus("Nearby cities loaded from closest to farthest.");
        })
        .catch(function () {
            nearbyLocationsAreLoading = false;
            renderLocationMessage("Nearby cities could not be loaded.");
            showTaskLocationStatus("The external location API is not available right now.");
        });
}

function buildOverpassNearbyCitiesQuery(latitude, longitude, radiusMeters) {
    return '[out:json][timeout:25];' +
        '(' +
        'node["place"~"city|town|village"](around:' + radiusMeters + ',' + latitude + ',' + longitude + ');' +
        'way["place"~"city|town|village"](around:' + radiusMeters + ',' + latitude + ',' + longitude + ');' +
        'relation["place"~"city|town|village"](around:' + radiusMeters + ',' + latitude + ',' + longitude + ');' +
        ');' +
        'out center tags;';
}

function buildNearbyLocationResults(data, userLatitude, userLongitude, detectedCountryName) {
    var locations = [];
    var usedCities = {};

    if (data == null || data.elements == null) {
        return locations;
    }

    for (var i = 0; i < data.elements.length; i++) {
        var element = data.elements[i];
        var tags = element.tags || {};
        var cityName = tags["name:en"] || tags.name || "";
        var countryName = tags["is_in:country"] || tags["addr:country"] || "";
        var latitude = element.lat;
        var longitude = element.lon;

        if (latitude == null && element.center != null) {
            latitude = element.center.lat;
            longitude = element.center.lon;
        }

        if (cityName == "" || latitude == null || longitude == null) {
            continue;
        }

        if ((countryName == "" || countryName.length <= 3) && detectedCountryName != "") {
            countryName = detectedCountryName;
        }

        if (countryName == "") {
            continue;
        }

        var label = cityName + ", " + countryName;

        if (usedCities[label] == true) {
            continue;
        }

        locations.push({
            value: label,
            label: label,
            placeId: String(element.id || ""),
            latitude: latitude,
            longitude: longitude,
            distance: getDistanceInKm(userLatitude, userLongitude, latitude, longitude)
        });

        usedCities[label] = true;
    }

    locations.sort(function (firstLocation, secondLocation) {
        return firstLocation.distance - secondLocation.distance;
    });

    return locations.slice(0, 25);
}

function renderLocationOptions(locations, selectedValue) {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    taskLocationList.innerHTML = "";
    addLocationOption("", "Select location", "", "", "", selectedValue);

    for (var i = 0; i < locations.length; i++) {
        addLocationOption(locations[i].value, locations[i].label, locations[i].placeId, locations[i].latitude, locations[i].longitude, selectedValue);
    }
}

function renderPerformerFilterLocationOptions(locations, selectedValue) {
    var locationList = document.getElementById("performerFilterLocationList");

    if (locationList == null) {
        return;
    }

    locationList.innerHTML = "";
    addPerformerFilterLocationOption("", "All Locations", selectedValue);

    for (var i = 0; i < locations.length; i++) {
        addPerformerFilterLocationOption(locations[i].value, locations[i].label, selectedValue);
    }
}

function renderPerformerFilterLocationMessage(message) {
    var locationList = document.getElementById("performerFilterLocationList");

    if (locationList == null) {
        return;
    }

    locationList.innerHTML = "";
    addPerformerFilterLocationOption("", message, "");
}

function renderLocationMessage(message) {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    taskLocationList.innerHTML = "";
    addLocationOption("", message, "", "", "", "");
}

function addLocationOption(value, text, placeId, latitude, longitude, selectedValue) {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    var optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "locationOption";
    optionButton.innerHTML = text;
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("data-value", value);
    optionButton.onclick = function () {
        selectTaskLocation(value, text, placeId, latitude, longitude);
    };

    if (value == selectedValue) {
        optionButton.className = "locationOption selectedLocationOption";
        optionButton.setAttribute("aria-selected", "true");
    }

    taskLocationList.appendChild(optionButton);
}

function addPerformerFilterLocationOption(value, text, selectedValue) {
    var locationList = document.getElementById("performerFilterLocationList");

    if (locationList == null) {
        return;
    }

    var optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "performerFilterLocationOption";
    optionButton.innerHTML = text;
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("data-value", value);
    optionButton.onclick = function () {
        selectPerformerFilterLocation(value, text);
    };

    if (value == selectedValue) {
        optionButton.className = "performerFilterLocationOption selectedPerformerFilterLocationOption";
        optionButton.setAttribute("aria-selected", "true");
    }

    locationList.appendChild(optionButton);
}

function selectNearbyLocation(location) {
    selectTaskLocation(location.value, location.label, location.placeId, location.latitude, location.longitude);
}

function selectTaskLocation(locationText, labelText, placeId, latitude, longitude) {
    if (locationText == "") {
        clearTaskLocationDetails();
        setInputValue("taskLocation", "");
        setTaskLocationButtonText("Select location");
        closeTaskLocationList();
        return;
    }

    setInputValue("taskLocation", locationText);
    setTaskLocationButtonText(labelText);
    setTaskLocationDetails(locationText, placeId, latitude, longitude);
    markSelectedTaskLocation(locationText);
    closeTaskLocationList();
    showTaskLocationStatus("Selected location: " + labelText);
}

function closeTaskLocationList() {
    var taskLocationList = document.getElementById("taskLocationList");
    var taskLocationButton = document.getElementById("taskLocationButton");

    if (taskLocationList != null) {
        taskLocationList.className = "locationOptions";
    }

    if (taskLocationButton != null) {
        taskLocationButton.setAttribute("aria-expanded", "false");
    }
}

function closePerformerFilterLocationList() {
    var locationList = document.getElementById("performerFilterLocationList");
    var locationButton = document.getElementById("performerFilterLocationButton");

    if (locationList != null) {
        locationList.className = "performerFilterLocationOptions";
    }

    if (locationButton != null) {
        locationButton.setAttribute("aria-expanded", "false");
    }
}

function closeTaskLocationListOnOutsideClick(event) {
    var locationField = document.getElementsByClassName("locationField")[0];

    if (locationField == null || locationField.contains(event.target) == false) {
        closeTaskLocationList();
    }
}

function closePerformerFilterLocationListOnOutsideClick(event) {
    var locationField = document.getElementsByClassName("performerFilterLocationField")[0];

    if (locationField == null || locationField.contains(event.target) == false) {
        closePerformerFilterLocationList();
    }
}

function selectPerformerFilterLocation(locationText, labelText) {
    setInputValue("filterLocation", locationText);

    if (locationText == "") {
        setPerformerFilterLocationButtonText("All Locations");
    } else {
        setPerformerFilterLocationButtonText(labelText);
    }

    markSelectedPerformerFilterLocation(locationText);
    closePerformerFilterLocationList();
    showPerformerFilterLocationStatus(locationText == "" ? "All locations selected." : "Selected location: " + labelText);
}

function setTaskLocationDetails(locationText, placeId, latitude, longitude) {
    setInputValue("taskPlaceId", placeId);
    setInputValue("taskLatitude", latitude);
    setInputValue("taskLongitude", longitude);
    setInputValue("taskMapsUrl", buildMapsUrl(locationText, latitude, longitude));
}

function setTaskLocationButtonText(text) {
    var taskLocationButtonText = document.getElementById("taskLocationButtonText");

    if (taskLocationButtonText != null) {
        taskLocationButtonText.innerHTML = text;
    }
}

function setPerformerFilterLocationButtonText(text) {
    var locationButtonText = document.getElementById("performerFilterLocationButtonText");

    if (locationButtonText != null) {
        locationButtonText.innerHTML = text;
    }
}

function markSelectedTaskLocation(selectedValue) {
    var options = document.getElementsByClassName("locationOption");

    for (var i = 0; i < options.length; i++) {
        if (options[i].getAttribute("data-value") == selectedValue) {
            options[i].className = "locationOption selectedLocationOption";
            options[i].setAttribute("aria-selected", "true");
        } else {
            options[i].className = "locationOption";
            options[i].removeAttribute("aria-selected");
        }
    }
}

function markSelectedPerformerFilterLocation(selectedValue) {
    var options = document.getElementsByClassName("performerFilterLocationOption");

    for (var i = 0; i < options.length; i++) {
        if (options[i].getAttribute("data-value") == selectedValue) {
            options[i].className = "performerFilterLocationOption selectedPerformerFilterLocationOption";
            options[i].setAttribute("aria-selected", "true");
        } else {
            options[i].className = "performerFilterLocationOption";
            options[i].removeAttribute("aria-selected");
        }
    }
}

function syncPerformerFilterLocationButton(locationText) {
    if (locationText == "") {
        setPerformerFilterLocationButtonText("All Locations");
    } else {
        setPerformerFilterLocationButtonText(locationText);
    }

    markSelectedPerformerFilterLocation(locationText);
}

function clearTaskLocationDetails() {
    setInputValue("taskPlaceId", "");
    setInputValue("taskLatitude", "");
    setInputValue("taskLongitude", "");
    setInputValue("taskMapsUrl", "");
    showTaskLocationStatus("");
}

function getDistanceInKm(firstLatitude, firstLongitude, secondLatitude, secondLongitude) {
    var earthRadius = 6371;
    var latitudeDistance = toRadians(secondLatitude - firstLatitude);
    var longitudeDistance = toRadians(secondLongitude - firstLongitude);
    var firstLatitudeRad = toRadians(firstLatitude);
    var secondLatitudeRad = toRadians(secondLatitude);

    var distance =
        Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
        Math.cos(firstLatitudeRad) * Math.cos(secondLatitudeRad) *
        Math.sin(longitudeDistance / 2) * Math.sin(longitudeDistance / 2);

    var centralAngle = 2 * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance));
    return earthRadius * centralAngle;
}

function toRadians(value) {
    return value * Math.PI / 180;
}

function buildMapsUrl(locationText, latitude, longitude) {
    if (latitude != "" && longitude != "") {
        return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(latitude + "," + longitude);
    }

    if (locationText == "") {
        return "";
    }

    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locationText);
}

function setInputValue(elementId, value) {
    var element = document.getElementById(elementId);

    if (element != null) {
        element.value = value;
    }
}

function getInputValue(elementId) {
    var element = document.getElementById(elementId);

    if (element == null) {
        return "";
    }

    return element.value;
}

function showTaskLocationStatus(message) {
    var taskLocationStatus = document.getElementById("taskLocationStatus");

    if (taskLocationStatus != null) {
        taskLocationStatus.innerHTML = message;
    }
}

function showPerformerFilterLocationStatus(message) {
    var locationStatus = document.getElementById("performerFilterLocationStatus");

    if (locationStatus != null) {
        locationStatus.innerHTML = message;
    }
}