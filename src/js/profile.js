import $ from 'jquery';

// Show data contact modal
$('#profile-contact-label').click(function() {
    $('#modal-allow-contact').show();
});

// Show delete user account confirmation modal
$('#delete-account').click(function() {
    $('#modal-delete-account').show();
});

// Close delete user account confirmation modal
$('#modal-delete-account-close').click(function() {
    $('#modal-delete-account').hide();
});

// Close delete user account failed modal
$('#modal-delete-account-failed-close').click(function() {
    $('#modal-delete-account-failed').hide();
});


// Delete account
$('#modal-delete-account-confirm').click(function() {
    const url = 'php/delete-account.php';
    $('#modal-delete-account').hide();
    $.ajax({
        url: url,
        type: 'POST',
        data: {
            delete: true
        },
        success: function(data) {
            if (data === 'OK') {
                window.location.href = "logout.php";
            } else {
                $('#modal-delete-account-failed').show();
            }
        },
        error: function() {
            $('#modal-delete-account-failed').show();
        }
    });
});
