//yarden shriki, lior zahavi
var SIGNUP_API_URL = "http://localhost:5000/api/users";

function setSignupError(inputName, errorName, text) {
    document.getElementById(inputName).style.borderColor = "red";
    document.getElementById(errorName).innerHTML = "* " + text;
}

function clearSignupError(inputName, errorName) {
    document.getElementById(inputName).style.borderColor = "#efd5ad";
    document.getElementById(errorName).innerHTML = "";
}

function clearSignupErrors() {
    clearSignupError("fullName", "fullNameError");
    clearSignupError("birthDate", "birthDateError");
    clearSignupError("idNumber", "idNumberError");
    clearSignupError("gender", "genderError");
    clearSignupError("email", "emailError");
    clearSignupError("signupPassword", "signupPasswordError");
    clearSignupError("confirmPassword", "confirmPasswordError");
    clearSignupError("profilePicture", "profilePictureError");
}

function clearPaymentErrors() {
    clearSignupError("cardHolder", "cardHolderError");
    clearSignupError("cardNumber", "cardNumberError");
    clearSignupError("expiryMonth", "expiryMonthError");
    clearSignupError("expiryYear", "expiryYearError");
    clearSignupError("cvv", "cvvError");
}

function addZero(numberValue) {
    if (numberValue < 10) {
        return "0" + numberValue;
    }

    return numberValue;
}

function getMaxBirthDate() {
    var today = new Date();
    var year = today.getFullYear() - 18;
    var month = addZero(today.getMonth() + 1);
    var day = addZero(today.getDate());

    return year + "-" + month + "-" + day;
}

function setSignupLimits() {
    if (document.getElementById("birthDate") != null) {
        document.getElementById("birthDate").max = getMaxBirthDate();
    }
}

function clearSelect(selectName, firstText) {
    var selectBox = document.getElementById(selectName);
    selectBox.innerHTML = "";

    var firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.innerHTML = firstText;
    selectBox.appendChild(firstOption);
}

function fillExpiryYears() {
    var expiryYear = document.getElementById("expiryYear");

    if (expiryYear == null) {
        return;
    }

    clearSelect("expiryYear", "Choose Year");

    var today = new Date();
    var currentYear = today.getFullYear();
    var endYear = currentYear + 10;

    for (var year = currentYear; year <= endYear; year++) {
        var option = document.createElement("option");
        option.value = year;
        option.innerHTML = year;
        expiryYear.appendChild(option);
    }
}

function fillExpiryMonths() {
    var expiryMonth = document.getElementById("expiryMonth");
    var expiryYear = document.getElementById("expiryYear");

    if (expiryMonth == null || expiryYear == null) {
        return;
    }

    var selectedMonth = expiryMonth.value;
    clearSelect("expiryMonth", "Choose Month");

    var today = new Date();
    var currentMonth = today.getMonth() + 1;
    var currentYear = today.getFullYear();
    var selectedYear = expiryYear.value;
    var startMonth = 1;

    if (selectedYear == "" || selectedYear == currentYear) {
        startMonth = currentMonth;
    }

    for (var month = startMonth; month <= 12; month++) {
        var option = document.createElement("option");
        var monthText = addZero(month);
        option.value = monthText;
        option.innerHTML = monthText;
        expiryMonth.appendChild(option);

        if (monthText == selectedMonth) {
            expiryMonth.value = selectedMonth;
        }
    }
}

function hasLetter(text) {
    for (var i = 0; i < text.length; i++) {
        if ((text[i] >= "A" && text[i] <= "Z") || (text[i] >= "a" && text[i] <= "z")) {
            return true;
        }
    }

    return false;
}

function hasDigit(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] >= "0" && text[i] <= "9") {
            return true;
        }
    }

    return false;
}

function isStrongPassword(password) {
    return password.length >= 6 && hasLetter(password) && hasDigit(password);
}

function checkSignup() {
    var fullName = document.getElementById("fullName").value;
    var birthDate = document.getElementById("birthDate").value;
    var idNumber = document.getElementById("idNumber").value;
    var gender = document.getElementById("gender").value;
    var email = document.getElementById("email").value;
    var signupPassword = document.getElementById("signupPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;
    var profilePicture = document.getElementById("profilePicture").value;
    var hasError = false;
    var hasEmptyField = false;
    var hasPasswordMismatch = false;

    clearMessage("signupMessage");
    clearSignupErrors();

    if (fullName == "") {
        setSignupError("fullName", "fullNameError", "Full name is required");
        hasError = true;
        hasEmptyField = true;
    }

    if (birthDate == "") {
        setSignupError("birthDate", "birthDateError", "Birth date is required");
        hasError = true;
        hasEmptyField = true;
    } else {
        if (birthDate > getMaxBirthDate()) {
            setSignupError("birthDate", "birthDateError", "You must be at least 18 years old");
            hasError = true;
        }
    }

    if (idNumber == "") {
        setSignupError("idNumber", "idNumberError", "ID number is required");
        hasError = true;
        hasEmptyField = true;
    } else {
        if (idNumber.length != 9) {
            setSignupError("idNumber", "idNumberError", "ID number must contain 9 digits");
            hasError = true;
        } else {
            if (!isDigits(idNumber)) {
                setSignupError("idNumber", "idNumberError", "ID number must contain digits only");
                hasError = true;
            }
        }
    }

    if (gender == "") {
        setSignupError("gender", "genderError", "Gender is required");
        hasError = true;
        hasEmptyField = true;
    }

    if (email == "") {
        setSignupError("email", "emailError", "Email is required");
        hasError = true;
        hasEmptyField = true;
    } else {
        if (email.indexOf("@") == -1) {
            setSignupError("email", "emailError", "Email must include @");
            hasError = true;
        } else {
            if (email.indexOf(".") == -1) {
                setSignupError("email", "emailError", "Email must include .");
                hasError = true;
            }
        }
    }

    if (signupPassword == "") {
        setSignupError("signupPassword", "signupPasswordError", "Password is required");
        hasError = true;
        hasEmptyField = true;
    } else {
        if (isStrongPassword(signupPassword) == false) {
            setSignupError("signupPassword", "signupPasswordError", "Password must be at least 6 characters and include letters and numbers");
            hasError = true;
        }
    }

    if (confirmPassword == "") {
        setSignupError("confirmPassword", "confirmPasswordError", "Confirm password is required");
        hasError = true;
        hasEmptyField = true;
    } else {
        if (signupPassword != "" && signupPassword != confirmPassword) {
            setSignupError("confirmPassword", "confirmPasswordError", "Passwords do not match");
            hasError = true;
            hasPasswordMismatch = true;
        }
    }

    if (profilePicture == "") {
        setSignupError("profilePicture", "profilePictureError", "Profile picture is required");
        hasError = true;
        hasEmptyField = true;
    }

    if (hasError == true) {
        if (hasEmptyField == true) {
            showMessage("signupMessage", "Please fill all fields");
        } else if (hasPasswordMismatch == true) {
            showMessage("signupMessage", "Passwords do not match");
        } else {
            showMessage("signupMessage", "Please fix the fields marked in red");
        }

        return false;
    }

    showScreen("paymentScreen");
    return false;
}

function checkPayment() {
    var cardHolder = document.getElementById("cardHolder").value;
    var cardNumber = document.getElementById("cardNumber").value;
    var expiryMonth = document.getElementById("expiryMonth").value;
    var expiryYear = document.getElementById("expiryYear").value;
    var cvv = document.getElementById("cvv").value;
    var receipts = document.getElementById("receipts").checked;
    var notifications = document.getElementById("notifications").checked;
    var policy = document.getElementById("policy").checked;
    var hasError = false;

    clearMessage("paymentMessage");
    clearPaymentErrors();

    if (cardHolder == "") {
        setSignupError("cardHolder", "cardHolderError", "Card holder name is required");
        hasError = true;
    }

    if (cardNumber == "") {
        setSignupError("cardNumber", "cardNumberError", "Card number is required");
        hasError = true;
    } else {
        if (cardNumber.length != 16) {
            setSignupError("cardNumber", "cardNumberError", "Card number must contain 16 digits");
            hasError = true;
        } else {
            if (!isDigits(cardNumber)) {
                setSignupError("cardNumber", "cardNumberError", "Card number must contain digits only");
                hasError = true;
            }
        }
    }

    if (expiryMonth == "") {
        setSignupError("expiryMonth", "expiryMonthError", "Expiry month is required");
        hasError = true;
    }

    if (expiryYear == "") {
        setSignupError("expiryYear", "expiryYearError", "Expiry year is required");
        hasError = true;
    }

    if (cvv == "") {
        setSignupError("cvv", "cvvError", "CVV is required");
        hasError = true;
    } else {
        if (cvv.length != 3 && cvv.length != 4) {
            setSignupError("cvv", "cvvError", "CVV must contain 3 or 4 digits");
            hasError = true;
        } else {
            if (!isDigits(cvv)) {
                setSignupError("cvv", "cvvError", "CVV must contain digits only");
                hasError = true;
            }
        }
    }

    if (receipts == false || notifications == false || policy == false) {
        showMessage("paymentMessage", "Please approve all permissions and terms");
        hasError = true;
    }

    if (hasError == true) {
        if (document.getElementById("paymentMessage").innerHTML == "") {
            showMessage("paymentMessage", "Please fix the fields marked in red");
        }

        return false;
    }

    createSignupUser();
    return false;
}

function createSignupUser() {
    clearMessage("paymentMessage");

    fetch(SIGNUP_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildSignupRequest())
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
            saveSignupUser(data);
            showScreen("successScreen");
        })
        .catch(function (error) {
            showMessage("paymentMessage", getSignupErrorMessage(error));
        });
}

function buildSignupRequest() {
    var email = document.getElementById("email").value.trim();
    var profilePictureInput = document.getElementById("profilePicture");
    var profilePicture = "";

    if (profilePictureInput.files != null && profilePictureInput.files.length > 0) {
        profilePicture = profilePictureInput.files[0].name;
    }

    return {
        full_name: document.getElementById("fullName").value.trim(),
        username: buildSignupUsername(email),
        email: email,
        password: document.getElementById("signupPassword").value,
        birth_date: document.getElementById("birthDate").value,
        phone_number: null,
        gender: document.getElementById("gender").value,
        profile_picture: profilePicture,
        role: "Requester"
    };
}

function buildSignupUsername(email) {
    return document.getElementById("fullName").value.trim();
}

function saveSignupUser(data) {
    var email = document.getElementById("email").value.trim();
    var username = buildSignupUsername(email);
    var fullName = document.getElementById("fullName").value.trim();
    var role = data.role || "Requester";

    userRole = role;
    localStorage.setItem("currentUser", JSON.stringify({
        id: data.userId,
        full_name: fullName,
        username: username,
        email: email,
        role: role
    }));
    localStorage.setItem("loggedInUserId", data.userId || "");
    localStorage.setItem("loggedInUsername", username);
    localStorage.setItem("loggedInFullName", fullName);
    localStorage.setItem("loggedInEmail", email);
    localStorage.setItem("userRole", role);
    localStorage.setItem("showWelcomePopup", "yes");
}

function getSignupErrorMessage(error) {
    if (error != null && error.message != null && error.message != "") {
        return error.message;
    }

    return "Registration failed. Please check that the server and database are running.";
}

function initSignupPage() {
    setSignupLimits();
    fillExpiryYears();
    fillExpiryMonths();
}

var signupPreviousWindowOnload = window.onload;

window.onload = function () {
    if (typeof signupPreviousWindowOnload == "function") {
        signupPreviousWindowOnload();
    }

    initSignupPage();
};
