//yarden shriki, lior zahavi

var PROFILE_PICTURE_MAX_SIZE = 1024 * 1024;

function getSelectedProfilePictureFile(inputId) {
    var input = document.getElementById(inputId);

    if (input == null || input.files == null || input.files.length == 0) {
        return null;
    }

    return input.files[0];
}

function getProfilePictureValidationMessage(file) {
    if (file == null) {
        return "Profile picture is required";
    }

    if (file.type == null || file.type.indexOf("image/") != 0) {
        return "Profile picture must be an image file";
    }

    if (file.size > PROFILE_PICTURE_MAX_SIZE) {
        return "Profile picture must be smaller than 1MB";
    }

    return "";
}

function readProfilePictureFile(inputId, onSuccess, onError) {
    var file = getSelectedProfilePictureFile(inputId);
    var validationMessage = getProfilePictureValidationMessage(file);

    if (validationMessage != "") {
        if (typeof onError == "function") {
            onError(validationMessage);
        }
        return;
    }

    var reader = new FileReader();

    reader.onload = function (event) {
        if (typeof onSuccess == "function") {
            onSuccess(event.target.result);
        }
    };

    reader.onerror = function () {
        if (typeof onError == "function") {
            onError("Could not read profile picture. Please choose another image.");
        }
    };

    reader.readAsDataURL(file);
}
