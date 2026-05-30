function checkLogin() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    clearMessage("loginMessage");

    if (username == "" || password == "") {
        showMessage("loginMessage", "Invalid username or password");
        return false;
    }

    window.location.href = "requester.html";
    return false;
}
