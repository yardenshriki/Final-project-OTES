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
