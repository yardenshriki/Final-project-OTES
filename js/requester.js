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

function checkPayment() {
    showScreen("profileScreen");
    return false;
}
