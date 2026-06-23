//yarden shriki, lior zahavi
var sharedLayoutIsLoading = false;
var sharedLayoutCallbacks = [];

function loadSharedLayout(done) {
    var layoutContainer = document.getElementById("layoutContainer");

    if (layoutContainer == null) {
        if (done != null) {
            done();
        }

        return;
    }

    if (document.getElementById("sideMenu") != null) {
        if (done != null) {
            done();
        }

        return;
    }

    if (done != null) {
        sharedLayoutCallbacks.push(done);
    }

    if (sharedLayoutIsLoading == true) {
        return;
    }

    sharedLayoutIsLoading = true;

    var layoutFrame = document.createElement("iframe");
    layoutFrame.src = "layout.html";
    layoutFrame.title = "Shared layout";
    layoutFrame.className = "layoutLoaderFrame";

    layoutFrame.onload = function () {
        var frameDocument = null;

        try {
            frameDocument = layoutFrame.contentDocument || layoutFrame.contentWindow.document;
        } catch (error) {
            frameDocument = null;
        }

        if (frameDocument != null && frameDocument.body != null) {
            layoutContainer.innerHTML = frameDocument.body.innerHTML;
        }

        if (layoutFrame.parentNode != null) {
            layoutFrame.parentNode.removeChild(layoutFrame);
        }

        sharedLayoutIsLoading = false;
        refreshSharedLayoutState();
        runSharedLayoutCallbacks();
    };

    layoutFrame.onerror = function () {
        sharedLayoutIsLoading = false;
        runSharedLayoutCallbacks();
    };

    document.body.appendChild(layoutFrame);
}

function runSharedLayoutCallbacks() {
    while (sharedLayoutCallbacks.length > 0) {
        var callback = sharedLayoutCallbacks.shift();

        if (callback != null) {
            callback();
        }
    }
}

function refreshSharedLayoutState() {
    var visibleScreen = document.querySelector(".screen[style*='block']");

    if (visibleScreen != null && typeof showHeader == "function") {
        showHeader(visibleScreen.id);
    } else if (document.getElementById("appHeader") != null) {
        document.getElementById("appHeader").style.display = "block";
    }

    if (typeof markRole == "function") {
        markRole();
    }
}

function openLayoutTasks() {
    closeMenu();

    if (typeof scrollToAllTasks == "function") {
        scrollToAllTasks();
        return;
    }

    openHomeByRole();
}

function openLayoutPolicy() {
    closeMenu();
    showScreen("policyScreen");
}

loadSharedLayout();
