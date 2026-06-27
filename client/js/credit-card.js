//yarden shriki, lior zahavi

function getCreditCardFieldIds(options) {
    options = options || {};
    var fieldIds = options.fieldIds || {};

    return {
        cardHolder: fieldIds.cardHolder || "cardHolder",
        cardNumber: fieldIds.cardNumber || "cardNumber",
        cardExpiry: fieldIds.cardExpiry || "cardExpiry",
        expiryMonth: fieldIds.expiryMonth || "expiryMonth",
        expiryYear: fieldIds.expiryYear || "expiryYear",
        cardCvv: fieldIds.cardCvv || "cardCvv",
        cvv: fieldIds.cvv || "cvv"
    };
}

function getCreditCardErrorIds(options) {
    options = options || {};
    var errorIds = options.errorIds || {};

    return {
        cardHolder: errorIds.cardHolder || "cardHolderError",
        cardNumber: errorIds.cardNumber || "cardNumberError",
        cardExpiry: errorIds.cardExpiry || "cardExpiryError",
        expiryMonth: errorIds.expiryMonth || "expiryMonthError",
        expiryYear: errorIds.expiryYear || "expiryYearError",
        cardCvv: errorIds.cardCvv || "cardCvvError",
        cvv: errorIds.cvv || "cvvError"
    };
}

function getCreditCardInputValue(id) {
    var input = document.getElementById(id);

    if (input == null) {
        return "";
    }

    return input.value.trim();
}

function setCreditCardInputValue(id, value) {
    var input = document.getElementById(id);

    if (input != null) {
        input.value = value;
    }
}

function getCreditCardExpiryValue(fieldIds) {
    var cardExpiry = getCreditCardInputValue(fieldIds.cardExpiry);

    if (cardExpiry != "") {
        return cardExpiry;
    }

    var month = getCreditCardInputValue(fieldIds.expiryMonth);
    var year = getCreditCardInputValue(fieldIds.expiryYear);

    if (month == "" || year == "") {
        return "";
    }

    return month + "/" + String(year).substring(2);
}

function getCreditCardCvvValue(fieldIds) {
    var cardCvv = getCreditCardInputValue(fieldIds.cardCvv);

    if (cardCvv != "") {
        return cardCvv;
    }

    return getCreditCardInputValue(fieldIds.cvv);
}

function getCreditCardDetails(options) {
    var fieldIds = getCreditCardFieldIds(options);

    return {
        cardHolder: getCreditCardInputValue(fieldIds.cardHolder),
        cardNumber: getCreditCardInputValue(fieldIds.cardNumber).replace(/\s/g, ""),
        expiry: getCreditCardExpiryValue(fieldIds),
        expiryMonth: getCreditCardInputValue(fieldIds.expiryMonth),
        expiryYear: getCreditCardInputValue(fieldIds.expiryYear),
        cvv: getCreditCardCvvValue(fieldIds),
        fieldIds: fieldIds
    };
}

function isCreditCardDigits(value) {
    return /^[0-9]+$/.test(value);
}

function setCreditCardMessage(options, text, isSuccess) {
    options = options || {};
    var messageId = options.messageId || "cardMessage";

    if (typeof setProfileMessage == "function" && messageId == "cardMessage") {
        setProfileMessage(messageId, text, isSuccess);
        return;
    }

    if (typeof showMessage == "function" && messageId == "paymentMessage") {
        showMessage(messageId, text);
        return;
    }

    var message = document.getElementById(messageId);

    if (message != null) {
        message.innerHTML = text;
        message.className = isSuccess ? "message successMessage" : "message";
    }
}

function setCreditCardFieldError(inputId, errorId, text) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);

    if (input != null) {
        input.style.borderColor = "red";
    }

    if (error != null) {
        error.innerHTML = "* " + text;
    }
}

function validateCreditCardDetails(options) {
    var card = getCreditCardDetails(options);
    var errorIds = getCreditCardErrorIds(options);
    var hasError = false;

    if (card.cardHolder == "") {
        setCreditCardFieldError(card.fieldIds.cardHolder, errorIds.cardHolder, "Card holder name is required");
        hasError = true;
    }

    if (card.cardNumber == "") {
        setCreditCardFieldError(card.fieldIds.cardNumber, errorIds.cardNumber, "Card number is required");
        hasError = true;
    } else if (card.cardNumber.length != 16 || !isCreditCardDigits(card.cardNumber)) {
        setCreditCardFieldError(card.fieldIds.cardNumber, errorIds.cardNumber, "Card number must contain 16 digits");
        hasError = true;
    }

    if (card.fieldIds.cardExpiry != null && document.getElementById(card.fieldIds.cardExpiry) != null) {
        if (card.expiry == "") {
            setCreditCardFieldError(card.fieldIds.cardExpiry, errorIds.cardExpiry, "Expiry date is required");
            hasError = true;
        }
    } else {
        if (card.expiryMonth == "") {
            setCreditCardFieldError(card.fieldIds.expiryMonth, errorIds.expiryMonth, "Expiry month is required");
            hasError = true;
        }

        if (card.expiryYear == "") {
            setCreditCardFieldError(card.fieldIds.expiryYear, errorIds.expiryYear, "Expiry year is required");
            hasError = true;
        }
    }

    if (card.cvv == "") {
        setCreditCardFieldError(document.getElementById(card.fieldIds.cardCvv) == null ? card.fieldIds.cvv : card.fieldIds.cardCvv, document.getElementById(errorIds.cardCvv) == null ? errorIds.cvv : errorIds.cardCvv, "CVV is required");
        hasError = true;
    } else if ((card.cvv.length < 3 || card.cvv.length > 4) || !isCreditCardDigits(card.cvv)) {
        setCreditCardFieldError(document.getElementById(card.fieldIds.cardCvv) == null ? card.fieldIds.cvv : card.fieldIds.cardCvv, document.getElementById(errorIds.cardCvv) == null ? errorIds.cvv : errorIds.cardCvv, "CVV must contain 3 or 4 digits");
        hasError = true;
    }

    if (hasError == true) {
        setCreditCardMessage(options, "Please fix the fields marked in red", false);
        return null;
    }

    return card;
}

function getProfileStorageUsername(options) {
    options = options || {};

    if (options.username != null && options.username != "") {
        return options.username;
    }

    if (typeof currentProfile != "undefined" && currentProfile != null && currentProfile.username != null && currentProfile.username != "") {
        return currentProfile.username;
    }

    var fullNameInput = document.getElementById("fullName");

    if (fullNameInput != null && fullNameInput.value.trim() != "") {
        return fullNameInput.value.trim();
    }

    return localStorage.getItem("loggedInUsername") || "guest_user";
}

function fillCardForm(options) {
    options = options || {};
    var savedCard = localStorage.getItem("otesCard_" + getProfileStorageUsername(options));

    if (savedCard == null || savedCard == "") {
        return;
    }

    try {
        var card = JSON.parse(savedCard);
        var fieldIds = getCreditCardFieldIds(options);
        setCreditCardInputValue(fieldIds.cardNumber, card.maskedNumber || "");
        setCreditCardInputValue(fieldIds.cardHolder, card.cardHolder || "");
        setCreditCardInputValue(fieldIds.cardExpiry, card.expiry || "");

        if (card.expiry != null && card.expiry.indexOf("/") > 0) {
            var expiryParts = card.expiry.split("/");
            setCreditCardInputValue(fieldIds.expiryMonth, expiryParts[0]);
            setCreditCardInputValue(fieldIds.expiryYear, "20" + expiryParts[1]);
        }
    } catch (error) {
    }
}

function saveCardDetails(options) {
    options = options || {};
    var card = validateCreditCardDetails(options);

    if (card == null) {
        return false;
    }

    if (options.validateOnly == true) {
        return true;
    }

    localStorage.setItem("otesCard_" + getProfileStorageUsername(options), JSON.stringify({
        maskedNumber: "**** **** **** " + card.cardNumber.substring(12),
        cardHolder: card.cardHolder,
        expiry: card.expiry,
        savedAt: new Date().toISOString().substring(0, 10)
    }));

    if (options.showSuccess !== false) {
        setCreditCardMessage(options, options.successMessage || "Card details saved successfully", true);
    }

    var cvvInput = document.getElementById(card.fieldIds.cardCvv) || document.getElementById(card.fieldIds.cvv);

    if (cvvInput != null) {
        cvvInput.value = "";
    }

    return true;
}