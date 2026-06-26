//yarden shriki, lior zahavi
var paymentsApiUrl = "http://localhost:5000/api/payment";

async function sendPaymentRequest(path, method, body) {
    var requestOptions = {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body != null) {
        requestOptions.body = JSON.stringify(body);
    }

    var response = await fetch(paymentsApiUrl + path, requestOptions);
    var data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Payment request failed");
    }

    return data;
}

function getPaymentRequesterId(notification) {
    return notification.requester_id || notification.requesterId || getCurrentUserId(1);
}

function getPaymentPerformerId(notification) {
    return notification.performer_id || notification.performerId || null;
}

function getPaymentAmount(notification) {
    return Number(notification.amount || notification.payment || 0);
}

async function createPaymentOnServer(notification) {
    var paymentBody = {
        task_id: notification.task_id,
        requester_id: getPaymentRequesterId(notification),
        performer_id: getPaymentPerformerId(notification),
        amount: getPaymentAmount(notification),
        status: "pending",
    };

    if (!paymentBody.task_id || !paymentBody.requester_id || !paymentBody.performer_id || !paymentBody.amount) {
        throw new Error("Missing payment details");
    }

    return await sendPaymentRequest("", "POST", paymentBody);
}

async function approvePaymentOnServer(paymentId) {
    return await sendPaymentRequest("/" + paymentId + "/approve", "PATCH", null);
}

async function createApprovedPayment(notification) {
    var createdPayment = await createPaymentOnServer(notification);
    var paymentId = createdPayment.paymentId || createdPayment.id;

    if (paymentId == null) {
        throw new Error("Payment was created without id");
    }

    var approvedPayment = await approvePaymentOnServer(paymentId);

    return {
        payment_id: paymentId,
        receipt_number: approvedPayment.receiptNumber || approvedPayment.receipt_number || "",
    };
}

async function addPaymentSuccessNotification(taskCompletionNotification) {
    try {
        var paymentResult = await createApprovedPayment(taskCompletionNotification);

        addNotification({
            toRole: "Requester",
            toUserId: getPaymentRequesterId(taskCompletionNotification),
            type: "payment-success",
            task_id: taskCompletionNotification.task_id,
            task_title: taskCompletionNotification.task_title,
            payment_id: paymentResult.payment_id,
            receipt_number: paymentResult.receipt_number,
            title: "Payment successful",
            message: "The payment for " + taskCompletionNotification.task_title + " has been successfully transferred. A confirmation has been sent to your email."
        });

        addNotification({
            toRole: "Performer",
            toUserId: getPaymentPerformerId(taskCompletionNotification),
            type: "payment-success",
            task_id: taskCompletionNotification.task_id,
            task_title: taskCompletionNotification.task_title,
            payment_id: paymentResult.payment_id,
            receipt_number: paymentResult.receipt_number,
            title: "Payment received",
            message: "The payment for " + taskCompletionNotification.task_title + " has been successfully transferred to you. A confirmation has been sent to your email."
        });

        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

async function getPaymentReceiptFromServer(paymentId) {
    var response = await fetch(paymentsApiUrl + "/" + paymentId + "/receipt");
    var receipt = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(receipt.message || "Failed to get receipt");
    }

    return receipt;
}

function buildReceiptText(receipt) {
    return "OTES Payment Receipt\n" +
        "Receipt number: " + (receipt.receipt_number || "") + "\n" +
        "Task: " + (receipt.task_title || "") + "\n" +
        "Requester: " + (receipt.requester_name || "") + "\n" +
        "Performer: " + (receipt.performer_name || "") + "\n" +
        "Amount: $" + (receipt.amount || "0") + "\n" +
        "Status: " + (receipt.status || "") + "\n" +
        "Paid at: " + (receipt.paid_at || receipt.created_at || "") + "\n";
}

function saveReceiptFile(receipt) {
    var receiptFile = new Blob([buildReceiptText(receipt)], { type: "text/plain" });
    var receiptLink = document.createElement("a");

    receiptLink.href = URL.createObjectURL(receiptFile);
    receiptLink.download = "receipt-" + receipt.id + ".txt";
    receiptLink.click();
    URL.revokeObjectURL(receiptLink.href);
}

async function downloadReceipt(notificationId, event) {
    if (event != null) {
        event.stopPropagation();
    }

    var notifications = getNotifications();
    var selectedNotification = null;

    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id == notificationId) {
            selectedNotification = notifications[i];
        }
    }

    if (selectedNotification == null || selectedNotification.task_id == null) {
        console.log("Missing task_id for receipt");
        return;
    }

    try {
        var paymentsResponse = await fetch(paymentsApiUrl + "/task/" + selectedNotification.task_id);
        var payments = await paymentsResponse.json();

        if (!payments || payments.length == 0) {
            console.log("No payment found for task");
            return;
        }

        var receipt = await getPaymentReceiptFromServer(payments[0].id);
        saveReceiptFile(receipt);
    } catch (error) {
        console.log(error.message);
    }
}

function initializePaymentsPage() {
}

var previousPaymentsOnload = window.onload;
window.onload = function () {
    if (typeof previousPaymentsOnload == "function") {
        previousPaymentsOnload();
    }

    initializePaymentsPage();
};
