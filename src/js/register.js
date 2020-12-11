import $ from 'jquery';
import {datenschutz} from "./index";

// Show data protection modal
$('#register-data-protection-label').click(function() {
    $('#modal-data-protection .modal-body').html('');
    datenschutz.GetDatenschutz()
        .then(data => {
            if (data.length) {
                $('#modal-data-protection .modal-body').html(data);
                $('#modal-data-protection').show();
            }
        });
});

// Show data contact modal
$('#register-contact-label').click(function() {
    $('#modal-allow-contact').show();
});