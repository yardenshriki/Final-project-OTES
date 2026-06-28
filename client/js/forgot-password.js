//yarden shriki, lior zahavi
var FORGOT_VERIFY_API_URL = "http://localhost:5000/api/users/reset-password/verify";
var FORGOT_RESET_API_URL = "http://localhost:5000/api/users/reset-password";
var verifiedForgotPasswordData = null;

function clearForgotPasswordForm() {
    setForgotPasswordInputValue("forgotFullName", "");
    setForgotPasswordInputValue("forgotIdNumber", "");
    setForgotPasswordInputValue("forgotEmail", "");
    setForgotPasswordInputValue("forgotBirthDate", "");
    setForgotPasswordInputValue("forgotNewPassword", "");
    setForgotPasswordInputValue("forgotConfirmPassword", "");
    clearForgotPasswordErrors();
    clearMessage("forgotVerifyMessage");
    clearMessage("forgotResetMessage");
    setForgotPasswordMessageSuccess("forgotVerifyMessage", false);
    setForgotPasswordMessageSuccess("forgotResetMessage", false);
    hideForgotResetForm();
}

function setForgotPasswordMessageSuccess(messageId, isSuccess) {
    var message = document.getElementById(messageId);

    if (message == null) {
        return;
    }

    if (isSuccess) {
        message.classList.add("successMessage");
    } else {
        message.classList.remove("successMessage");
    }
}

function setForgotPasswordInputValue(id, value) {
    var element = document.getElementById(id);

    if (element != null) {
        element.value = value;
    }
}

function clearForgotPasswordErrors() {
    clearForgotPasswordError("forgotFullName", "forgotFullNameError");
    clearForgotPasswordError("forgotIdNumber", "forgotIdNumberError");
    clearForgotPasswordError("forgotEmail", "forgotEmailError");
    clearForgotPasswordError("forgotBirthDate", "forgotBirthDateError");
    clearForgotPasswordError("forgotNewPassword", "forgotNewPasswordError");
    clearForgotPasswordError("forgotConfirmPassword", "forgotConfirmPasswordError");
}

function setForgotPasswordError(inputId, errorId, text) {
    document.getElementById(inputId).style.borderColor = "red";
    document.getElementById(errorId).innerHTML = "* " + text;
}

function clearForgotPasswordError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);

    if (input != null) {
        input.style.borderColor = "#efd5ad";
    }

    if (error != null) {
        error.innerHTML = "";
    }
}

function hideForgotResetForm() {
    var resetForm = document.getElementById("forgotResetForm");

    if (resetForm != null) {
        resetForm.classList.add("forgotHidden");
    }
}

function showForgotResetForm() {
    var resetForm = document.getElementById("forgotResetForm");

    if (resetForm != null) {
        resetForm.classList.remove("forgotHidden");
    }
}

function buildForgotPasswordVerificationRequest() {
    return {
        full_name: document.getElementById("forgotFullName").value.trim(),
        id_number: document.getElementById("forgotIdNumber").value.trim(),
        email: document.getElementById("forgotEmail").value.trim().toLowerCase(),
        birth_date: document.getElementById("forgotBirthDate").value
    };
}

function validateForgotPasswordVerification(data) {
    var hasError = false;

    if (data.full_name == "") {
        setForgotPasswordError("forgotFullName", "forgotFullNameError", "Full name is required");
        hasError = true;
    }

    if (data.id_number == "") {
        setForgotPasswordError("forgotIdNumber", "forgotIdNumberError", "ID number is required");
        hasError = true;
    } else if (!isDigits(data.id_number)) {
        setForgotPasswordError("forgotIdNumber", "forgotIdNumberError", "ID number must contain digits only");
        hasError = true;
    }

    if (data.email == "") {
        setForgotPasswordError("forgotEmail", "forgotEmailError", "Email is required");
        hasError = true;
    } else if (data.email.indexOf("@") == -1 || data.email.indexOf(".") == -1) {
        setForgotPasswordError("forgotEmail", "forgotEmailError", "Email must be valid");
        hasError = true;
    }

    if (data.birth_date == "") {
        setForgotPasswordError("forgotBirthDate", "forgotBirthDateError", "Birth date is required");
        hasError = true;
    }

    return !hasError;
}

function getForgotPasswordVerificationErrorMessage(error) {
    if (error != null && error.role != null && error.message != null) {
        return error.message;
    }

    return "One of the details is incorrect.";
}

function getForgotPasswordResetErrorMessage(error) {
    if (error != null && error.role != null && error.message != null) {
        return error.message;
    }

    return "One of the details is incorrect.";
}

function verifyForgotPasswordUser() {
    var verificationData = buildForgotPasswordVerificationRequest();

    clearForgotPasswordErrors();
    clearMessage("forgotVerifyMessage");
    clearMessage("forgotResetMessage");
    setForgotPasswordMessageSuccess("forgotVerifyMessage", false);
    hideForgotResetForm();

    if (!validateForgotPasswordVerification(verificationData)) {
        showMessage("forgotVerifyMessage", "Please fix the fields marked in red");
        return false;
    }

    fetch(FORGOT_VERIFY_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(verificationData)
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw data;
                }

                return data;
            });
        })
        .then(function () {
            verifiedForgotPasswordData = verificationData;
            setForgotPasswordMessageSuccess("forgotVerifyMessage", true);
            showMessage("forgotVerifyMessage", "User details verified. You can now set a new password.");
            showForgotResetForm();
        })
        .catch(function (error) {
            verifiedForgotPasswordData = null;
            setForgotPasswordMessageSuccess("forgotVerifyMessage", false);
            showMessage("forgotVerifyMessage", getForgotPasswordVerificationErrorMessage(error));
        });

    return false;
}

function hasForgotPasswordLetter(text) {
    for (var i = 0; i < text.length; i++) {
        if ((text[i] >= "A" && text[i] <= "Z") || (text[i] >= "a" && text[i] <= "z")) {
            return true;
        }
    }

    return false;
}

function hasForgotPasswordDigit(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] >= "0" && text[i] <= "9") {
            return true;
        }
    }

    return false;
}

function isStrongForgotPassword(password) {
    return password.length >= 6 && hasForgotPasswordLetter(password) && hasForgotPasswordDigit(password);
}

function resetForgotPassword() {
    var newPassword = document.getElementById("forgotNewPassword").value;
    var confirmPassword = document.getElementById("forgotConfirmPassword").value;
    var resetData = {};

    clearForgotPasswordError("forgotNewPassword", "forgotNewPasswordError");
    clearForgotPasswordError("forgotConfirmPassword", "forgotConfirmPasswordError");
    clearMessage("forgotResetMessage");

    if (verifiedForgotPasswordData == null) {
        showMessage("forgotResetMessage", "Please verify user details first");
        return false;
    }

    if (newPassword == "") {
        setForgotPasswordError("forgotNewPassword", "forgotNewPasswordError", "New password is required");
        showMessage("forgotResetMessage", "Please fix the fields marked in red");
        return false;
    }

    if (!isStrongForgotPassword(newPassword)) {
        setForgotPasswordError("forgotNewPassword", "forgotNewPasswordError", "Invalid password format");
        showMessage("forgotResetMessage", "Please fix the fields marked in red");
        return false;
    }

    if (confirmPassword == "") {
        setForgotPasswordError("forgotConfirmPassword", "forgotConfirmPasswordError", "Confirm password is required");
        showMessage("forgotResetMessage", "Please fix the fields marked in red");
        return false;
    }

    if (newPassword != confirmPassword) {
        setForgotPasswordError("forgotConfirmPassword", "forgotConfirmPasswordError", "Passwords do not match");
        showMessage("forgotResetMessage", "Passwords do not match");
        return false;
    }

    for (var key in verifiedForgotPasswordData) {
        resetData[key] = verifiedForgotPasswordData[key];
    }

    resetData.new_password = newPassword;

    fetch(FORGOT_RESET_API_URL, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(resetData)
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw data;
                }

                return data;
            });
        })
        .then(function (data) {
            alert("New password updated successfully.");
            saveLoggedInUser(data.user, data.user.username || verifiedForgotPasswordData.email);
            redirectLoggedInUser(data.user);
        })
        .catch(function (error) {
            showMessage("forgotResetMessage", getForgotPasswordResetErrorMessage(error));
        });

    return false;
}

window.onload = function () {
    clearForgotPasswordForm();
};
