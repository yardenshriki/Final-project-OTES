var userRole = "Requester";

function openMenu() {
    document.getElementById("sideMenu").style.display = "block";
}

function closeMenu() {
    document.getElementById("sideMenu").style.display = "none";
}

function showHeader(screenName) {
    if (screenName == "loginScreen" || screenName == "signupScreen" || screenName == "paymentScreen" || screenName == "termsScreen" || screenName == "successScreen") {
        document.getElementById("appHeader").style.display = "none";
    } else {
        document.getElementById("appHeader").style.display = "block";
    }
}

function markRole() {
    if (userRole == "Performer") {
        document.getElementById("requesterButton").className = "";
        document.getElementById("performerButton").className = "activeRole";
    } else {
        document.getElementById("requesterButton").className = "activeRole";
        document.getElementById("performerButton").className = "";
    }
}

function switchRole(roleName) {
    userRole = roleName;
    markRole();

    if (userRole == "Performer") {
        showScreen("performerHomeScreen");
    } else {
        showScreen("requesterHomeScreen");
    }
}

function showScreen(screenName) {
    closeMenu();
    showHeader(screenName);

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("signupScreen").style.display = "none";
    document.getElementById("paymentScreen").style.display = "none";
    document.getElementById("termsScreen").style.display = "none";
    document.getElementById("requesterHomeScreen").style.display = "none";
    document.getElementById("taskScreen").style.display = "none";
    document.getElementById("requesterTaskDetailsScreen").style.display = "none";
    document.getElementById("performerHomeScreen").style.display = "none";
    document.getElementById("availableTaskDetailsScreen").style.display = "none";
    document.getElementById("performerTaskDetailsScreen").style.display = "none";
    document.getElementById("finishTaskScreen").style.display = "none";
    document.getElementById("paymentSuccessScreen").style.display = "none";
    document.getElementById("ratingScreen").style.display = "none";
    document.getElementById("myTasksScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("addCardScreen").style.display = "none";
    document.getElementById("reportScreen").style.display = "none";
    document.getElementById("policyScreen").style.display = "none";
    document.getElementById("successScreen").style.display = "none";
    document.getElementById("taskSuccessScreen").style.display = "none";

    document.getElementById(screenName).style.display = "block";
    markRole();
}

function showMessage(messageName, text) {
    document.getElementById(messageName).innerHTML = text;
}

function clearMessage(messageName) {
    document.getElementById(messageName).innerHTML = "";
}

function isDigits(text) {
    if (text == "") {
        return false;
    }

    if (isNaN(text)) {
        return false;
    }

    return true;
}

function openHomeByRole() {
    if (userRole == "Performer") {
        showScreen("performerHomeScreen");
    } else {
        showScreen("requesterHomeScreen");
    }
}

function checkLogin() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    clearMessage("loginMessage");

    if (username == "" || password == "") {
        showMessage("loginMessage", "Invalid username or password");
        return false;
    }

    showScreen("requesterHomeScreen");
    return false;
}

function checkSignup() {
    var fullName = document.getElementById("fullName").value;
    var birthDate = document.getElementById("birthDate").value;
    var idNumber = document.getElementById("idNumber").value;
    var gender = document.getElementById("gender").value;
    var email = document.getElementById("email").value;
    var role = document.getElementById("role").value;
    var profilePicture = document.getElementById("profilePicture").value;

    clearMessage("signupMessage");

    if (fullName == "" || birthDate == "" || idNumber == "" || gender == "" || email == "" || role == "" || profilePicture == "") {
        showMessage("signupMessage", "Please fill all fields");
        return false;
    }

    if (idNumber.length != 9 || !isDigits(idNumber)) {
        showMessage("signupMessage", "ID number must contain 9 digits");
        return false;
    }

    if (email.indexOf("@") == -1 || email.indexOf(".") == -1) {
        showMessage("signupMessage", "Please enter a valid email");
        return false;
    }

    userRole = role;
    showScreen("paymentScreen");
    return false;
}

function checkPayment() {
    var cardHolder = document.getElementById("cardHolder").value;
    var cardNumber = document.getElementById("cardNumber").value;
    var expiryDate = document.getElementById("expiryDate").value;
    var cvv = document.getElementById("cvv").value;

    clearMessage("paymentMessage");

    if (cardHolder == "" || cardNumber == "" || expiryDate == "" || cvv == "") {
        showMessage("paymentMessage", "Please fill all fields");
        return false;
    }

    if (cardNumber.length != 16 || !isDigits(cardNumber)) {
        showMessage("paymentMessage", "Card number must contain 16 digits");
        return false;
    }

    if (expiryDate.length != 5 || expiryDate.charAt(2) != "/") {
        showMessage("paymentMessage", "Expiry date must be MM/YY");
        return false;
    }

    if ((cvv.length != 3 && cvv.length != 4) || !isDigits(cvv)) {
        showMessage("paymentMessage", "CVV must contain 3 or 4 digits");
        return false;
    }

    showScreen("termsScreen");
    return false;
}

function checkTerms() {
    var receipts = document.getElementById("receipts").checked;
    var notifications = document.getElementById("notifications").checked;
    var policy = document.getElementById("policy").checked;

    clearMessage("termsMessage");

    if (receipts == false || notifications == false || policy == false) {
        showMessage("termsMessage", "Please approve all permissions and terms");
        return false;
    }

    showScreen("successScreen");
    return false;
}

function checkTask() {
    var taskTitle = document.getElementById("taskTitle").value;
    var taskDescription = document.getElementById("taskDescription").value;
    var taskLocation = document.getElementById("taskLocation").value;
    var difficultyLevel = document.getElementById("difficultyLevel").value;
    var taskPayment = document.getElementById("taskPayment").value;

    clearMessage("taskMessage");

    if (taskTitle == "" || taskDescription == "" || taskLocation == "" || difficultyLevel == "" || taskPayment == "") {
        showMessage("taskMessage", "Please fill all fields");
        return false;
    }

    if (!isDigits(taskPayment)) {
        showMessage("taskMessage", "Payment must contain numbers only");
        return false;
    }

    showScreen("taskSuccessScreen");
    return false;
}

function checkReport() {
    var reportType = document.getElementById("reportType").value;
    var reportName = document.getElementById("reportName").value;
    var reportEmail = document.getElementById("reportEmail").value;
    var reportDescription = document.getElementById("reportDescription").value;

    clearMessage("reportMessage");

    if (reportType == "" || reportName == "" || reportEmail == "" || reportDescription == "") {
        showMessage("reportMessage", "Please fill all fields");
        return false;
    }

    if (reportEmail.indexOf("@") == -1 || reportEmail.indexOf(".") == -1) {
        showMessage("reportMessage", "Please enter a valid email");
        return false;
    }

    showMessage("reportMessage", "Report submitted successfully");
    return false;
}