//yarden shriki, lior zahavi
var israeliCities = [];

var mapsLocationPreviousWindowOnload = window.onload;

window.onload = async function () {
  if (typeof mapsLocationPreviousWindowOnload == "function") {
    mapsLocationPreviousWindowOnload();
  }

  setupTaskLocationField();
  setupPerformerFilterLocationField();
  await loadIsraeliCities();
};

function setupTaskLocationField() {
  if (document.getElementById("taskLocationList") == null) {
    return;
  }

  showTaskLocationStatus("Loading cities...");
  document.addEventListener("click", closeTaskLocationListOnOutsideClick);
}

function setupPerformerFilterLocationField() {
  if (document.getElementById("performerFilterLocationList") == null) {
    return;
  }

  showPerformerFilterLocationStatus("Loading cities...");
  document.addEventListener("click", closePerformerFilterLocationListOnOutsideClick);
}

async function loadIsraeliCities() {
  try {
    israeliCities = await fetchIsraeliCitiesFromApi();
    renderLocationOptions(israeliCities, "");
    renderPerformerFilterLocationOptions(israeliCities, "");
    showTaskLocationStatus("");
    showPerformerFilterLocationStatus("");
  } catch (error) {
    renderLocationMessage("Could not load cities.");
    renderPerformerFilterLocationMessage("Could not load cities.");
    showTaskLocationStatus("Failed to load cities. Please refresh the page.");
    showPerformerFilterLocationStatus("Failed to load cities.");
  }
}

async function fetchIsraeliCitiesFromApi() {
  var response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country: "Israel" }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  var result = await response.json();

  if (result.error == true || result.data == null) {
    throw new Error("No city data returned");
  }

  return result.data.map(function (name) {
    return { value: name, label: name, placeId: "", latitude: "", longitude: "" };
  });
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

  locationList.className =
    "performerFilterLocationOptions openPerformerFilterLocationOptions";
  locationButton.setAttribute("aria-expanded", "true");
}

function renderLocationOptions(locations, selectedValue) {
  var taskLocationList = document.getElementById("taskLocationList");

  if (taskLocationList == null) {
    return;
  }

  taskLocationList.innerHTML = "";
  addLocationOption("", "Select location", "", "", "", selectedValue);

  for (var i = 0; i < locations.length; i++) {
    addLocationOption(
      locations[i].value,
      locations[i].label,
      locations[i].placeId,
      locations[i].latitude,
      locations[i].longitude,
      selectedValue
    );
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
    addPerformerFilterLocationOption(
      locations[i].value,
      locations[i].label,
      selectedValue
    );
  }
}

function renderLocationMessage(message) {
  var taskLocationList = document.getElementById("taskLocationList");

  if (taskLocationList == null) {
    return;
  }

  taskLocationList.innerHTML = "";
  addLocationOption("", message, "", "", "", "");
}

function renderPerformerFilterLocationMessage(message) {
  var locationList = document.getElementById("performerFilterLocationList");

  if (locationList == null) {
    return;
  }

  locationList.innerHTML = "";
  addPerformerFilterLocationOption("", message, "");
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
    optionButton.className =
      "performerFilterLocationOption selectedPerformerFilterLocationOption";
    optionButton.setAttribute("aria-selected", "true");
  }

  locationList.appendChild(optionButton);
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
  showTaskLocationStatus("Selected: " + labelText);
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
  showPerformerFilterLocationStatus(
    locationText == "" ? "All locations selected." : "Selected: " + labelText
  );
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
      options[i].className =
        "performerFilterLocationOption selectedPerformerFilterLocationOption";
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

function buildMapsUrl(locationText, latitude, longitude) {
  if (latitude != "" && longitude != "") {
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(latitude + "," + longitude)
    );
  }

  if (locationText == "") {
    return "";
  }

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(locationText)
  );
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
