//yarden shriki, lior zahavi
function renderSharedLayout() {
    var layout = document.getElementById("sharedLayout");

    if (layout == null) {
        return;
    }

    fetch("layout.html")
        .then(function (response) {
            return response.text();
        })
        .then(function (html) {
            layout.innerHTML = html;
            refreshSharedLayoutState();
        });
}

function refreshSharedLayoutState() {
    var visibleScreen = document.querySelector(".screen[style*='block']");

    if (visibleScreen != null && typeof showHeader == "function") {
        showHeader(visibleScreen.id);
    } else {
        if (document.getElementById("appHeader") != null) {
            document.getElementById("appHeader").style.display = "block";
        }
    }

    if (typeof markRole == "function") {
        markRole();
    }
}

renderSharedLayout();
