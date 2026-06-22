//yarden shriki, lior zahavi
var israelCityLocations = [
    { city: "Acre", country: "Israel", latitude: 32.9275, longitude: 35.0818 },
    { city: "Afula", country: "Israel", latitude: 32.6091, longitude: 35.2892 },
    { city: "Ashdod", country: "Israel", latitude: 31.8044, longitude: 34.6553 },
    { city: "Ashkelon", country: "Israel", latitude: 31.6688, longitude: 34.5743 },
    { city: "Bat Yam", country: "Israel", latitude: 32.0132, longitude: 34.7480 },
    { city: "Be'er Sheva", country: "Israel", latitude: 31.2529, longitude: 34.7915 },
    { city: "Beit She'an", country: "Israel", latitude: 32.4973, longitude: 35.4967 },
    { city: "Bnei Brak", country: "Israel", latitude: 32.0839, longitude: 34.8338 },
    { city: "Caesarea", country: "Israel", latitude: 32.5189, longitude: 34.9046 },
    { city: "Dimona", country: "Israel", latitude: 31.0686, longitude: 35.0325 },
    { city: "Eilat", country: "Israel", latitude: 29.5577, longitude: 34.9519 },
    { city: "Givatayim", country: "Israel", latitude: 32.0722, longitude: 34.8125 },
    { city: "Hadera", country: "Israel", latitude: 32.4340, longitude: 34.9196 },
    { city: "Haifa", country: "Israel", latitude: 32.7940, longitude: 34.9896 },
    { city: "Herzliya", country: "Israel", latitude: 32.1663, longitude: 34.8433 },
    { city: "Holon", country: "Israel", latitude: 32.0158, longitude: 34.7874 },
    { city: "Jerusalem", country: "Israel", latitude: 31.7683, longitude: 35.2137 },
    { city: "Karmiel", country: "Israel", latitude: 32.9199, longitude: 35.2901 },
    { city: "Kfar Saba", country: "Israel", latitude: 32.1782, longitude: 34.9076 },
    { city: "Kiryat Gat", country: "Israel", latitude: 31.6061, longitude: 34.7717 },
    { city: "Kiryat Shmona", country: "Israel", latitude: 33.2073, longitude: 35.5721 },
    { city: "Lod", country: "Israel", latitude: 31.9510, longitude: 34.8881 },
    { city: "Modi'in-Maccabim-Re'ut", country: "Israel", latitude: 31.8980, longitude: 35.0104 },
    { city: "Nahariya", country: "Israel", latitude: 33.0059, longitude: 35.0941 },
    { city: "Nazareth", country: "Israel", latitude: 32.6996, longitude: 35.3035 },
    { city: "Netanya", country: "Israel", latitude: 32.3215, longitude: 34.8532 },
    { city: "Petah Tikva", country: "Israel", latitude: 32.0840, longitude: 34.8878 },
    { city: "Raanana", country: "Israel", latitude: 32.1848, longitude: 34.8713 },
    { city: "Ramat Gan", country: "Israel", latitude: 32.0684, longitude: 34.8248 },
    { city: "Ramla", country: "Israel", latitude: 31.9292, longitude: 34.8656 },
    { city: "Rehovot", country: "Israel", latitude: 31.8948, longitude: 34.8113 },
    { city: "Rishon LeZion", country: "Israel", latitude: 31.9730, longitude: 34.7925 },
    { city: "Rosh HaAyin", country: "Israel", latitude: 32.0956, longitude: 34.9566 },
    { city: "Safed", country: "Israel", latitude: 32.9646, longitude: 35.4960 },
    { city: "Sderot", country: "Israel", latitude: 31.5250, longitude: 34.5969 },
    { city: "Tel Aviv-Yafo", country: "Israel", latitude: 32.0853, longitude: 34.7818 },
    { city: "Tiberias", country: "Israel", latitude: 32.7959, longitude: 35.5309 },
    { city: "Yavne", country: "Israel", latitude: 31.8781, longitude: 34.7394 }
];

document.addEventListener("DOMContentLoaded", setupTaskLocationField);

function setupTaskLocationField() {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    renderTaskCityOptions(israelCityLocations, "");
    document.addEventListener("click", closeTaskLocationListOnOutsideClick);
    showTaskLocationStatus("Allow location access to sort cities from nearest to farthest.");
    sortTaskCitiesByCurrentLocation(false);
}

function renderTaskCityOptions(cities, selectedValue) {
    var taskLocationList = document.getElementById("taskLocationList");

    if (taskLocationList == null) {
        return;
    }

    taskLocationList.innerHTML = "";
    addTaskLocationOption("", "Select location", "", "", selectedValue);

    for (var i = 0; i < cities.length; i++) {
        var cityText = getCityDisplayText(cities[i]);
        addTaskLocationOption(cityText, getCityOptionText(cities[i]), cities[i].latitude, cities[i].longitude, selectedValue);
    }
}

function addTaskLocationOption(value, text, latitude, longitude, selectedValue) {
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
    optionButton.setAttribute("data-latitude", latitude);
    optionButton.setAttribute("data-longitude", longitude);
    optionButton.onclick = function () {
        selectTaskCity(value, latitude, longitude);
    };

    if (value == selectedValue) {
        optionButton.className = "locationOption selectedLocationOption";
        optionButton.setAttribute("aria-selected", "true");
    }

    taskLocationList.appendChild(optionButton);
}

function getCityDisplayText(city) {
    return city.city + ", " + city.country;
}

function getCityOptionText(city) {
    if (city.distance == null) {
        return getCityDisplayText(city);
    }

    return getCityDisplayText(city) + " - " + city.distance.toFixed(1) + " km away";
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

function closeTaskLocationListOnOutsideClick(event) {
    var locationField = document.getElementsByClassName("locationField")[0];

    if (locationField == null || locationField.contains(event.target) == false) {
        closeTaskLocationList();
    }
}

function selectTaskCity(locationText, latitude, longitude) {
    if (locationText == "") {
        clearTaskLocationDetails();
        setInputValue("taskLocation", "");
        setTaskLocationButtonText("Select location");
        closeTaskLocationList();
        return;
    }

    setInputValue("taskLocation", locationText);
    setTaskLocationButtonText(locationText);
    setTaskLocationDetails(locationText, "", latitude, longitude);
    markSelectedTaskCity(locationText);
    closeTaskLocationList();
    showTaskLocationStatus("Selected location: " + locationText);
}

function useNearestLocation() {
    sortTaskCitiesByCurrentLocation(true);
}

function sortTaskCitiesByCurrentLocation(selectNearestCity) {
    if (navigator.geolocation == null) {
        showTaskLocationStatus("Your browser does not support location detection.");
        return;
    }

    showTaskLocationStatus("Checking your current location and sorting nearby cities...");

    navigator.geolocation.getCurrentPosition(function (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var sortedCities = getCitiesSortedByDistance(latitude, longitude);
        var nearestCity = sortedCities[0];
        var selectedLocation = "";

        if (selectNearestCity == true) {
            selectedLocation = getCityDisplayText(nearestCity);
        } else {
            selectedLocation = document.getElementById("taskLocation").value;
        }

        renderTaskCityOptions(sortedCities, selectedLocation);

        if (selectNearestCity == true) {
            setInputValue("taskLocation", getCityDisplayText(nearestCity));
            setTaskLocationButtonText(getCityDisplayText(nearestCity));
            setTaskLocationDetails(getCityDisplayText(nearestCity), "", nearestCity.latitude, nearestCity.longitude);
            showTaskLocationStatus("Nearest city selected: " + getCityDisplayText(nearestCity));
            return;
        }

        showTaskLocationStatus("Cities are sorted from nearest to farthest based on your current location.");
    }, function () {
        showTaskLocationStatus("Location permission was not approved. You can still choose a city manually.");
    });
}

function getCitiesSortedByDistance(latitude, longitude) {
    var cities = [];

    for (var i = 0; i < israelCityLocations.length; i++) {
        cities.push({
            city: israelCityLocations[i].city,
            country: israelCityLocations[i].country,
            latitude: israelCityLocations[i].latitude,
            longitude: israelCityLocations[i].longitude,
            distance: getDistanceInKm(latitude, longitude, israelCityLocations[i].latitude, israelCityLocations[i].longitude)
        });
    }

    cities.sort(function (firstCity, secondCity) {
        return firstCity.distance - secondCity.distance;
    });

    return cities;
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

function setTaskLocationDetails(locationText, placeId, latitude, longitude) {
    setInputValue("taskPlaceId", placeId);
    setInputValue("taskLatitude", latitude);
    setInputValue("taskLongitude", longitude);
    setInputValue("taskMapsUrl", buildGoogleMapsUrl(locationText, placeId));
}

function setTaskLocationButtonText(text) {
    var taskLocationButtonText = document.getElementById("taskLocationButtonText");

    if (taskLocationButtonText != null) {
        taskLocationButtonText.innerHTML = text;
    }
}

function markSelectedTaskCity(selectedValue) {
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

function clearTaskLocationDetails() {
    setInputValue("taskPlaceId", "");
    setInputValue("taskLatitude", "");
    setInputValue("taskLongitude", "");
    setInputValue("taskMapsUrl", "");
    showTaskLocationStatus("");
}

function buildGoogleMapsUrl(locationText, placeId) {
    if (locationText == "") {
        return "";
    }

    var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locationText);

    if (placeId != "") {
        mapsUrl += "&query_place_id=" + encodeURIComponent(placeId);
    }

    return mapsUrl;
}

function setInputValue(elementId, value) {
    var element = document.getElementById(elementId);

    if (element != null) {
        element.value = value;
    }
}

function showTaskLocationStatus(message) {
    var taskLocationStatus = document.getElementById("taskLocationStatus");

    if (taskLocationStatus != null) {
        taskLocationStatus.innerHTML = message;
    }
}
