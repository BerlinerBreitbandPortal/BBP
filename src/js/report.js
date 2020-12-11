/**
 * @module report
 */

import { lang } from './language';
import { ReportMap, markerLayer } from './report-map';
import { ortsteile, lor } from './viewer-map';
import { BedarfsmeldungenText } from './bedarfsmeldungen-text';
import {TOUCH} from 'ol/has';
import{ viewer, report, store, datenschutz } from './index.js';
import { toLonLat } from 'ol/proj';
import { config } from './config';
import $ from 'jquery';
import breitbandconfig from '../breitbandconfig/breitbandconfig.json';

/**
 * Class for report page
 */
export class Report {
    /**
     * @param config {object} - Configuration of Berliner Breitband Portal
     * @param store {object} - Data in store
     */
    constructor(config, store) {
        /**
         * Report map object
         * @memeberof Report
         * @type {object}
         */
        this.reportMapObject = new ReportMap(config, store);

        /**
         * Report OpenLayers map object
         * @memeberof Report
         * @type {object}
         */
        this.map = this.reportMapObject.getMap();

        /**
         * BedarfsmeldungenText object
         * #memeberof Report
         * @type {object}
         */
        const bedarfsmeldungenText = new BedarfsmeldungenText(config);
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            if (e.target.hash === '#bedarfsmeldung') {
                bedarfsmeldungenText.activateGetBedarfsmeldungenText();
            }
        });

    }

    /**
     * Get OpenLayers map
     * @returns {object}
     */
    getMap() {
        return this.map;
    }

    /**
     * Add data to report form
     */
    customizeForm() {
        // Speed
        let speed = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_SPEED + '</option>';
        Object.entries(breitbandconfig.speed).forEach(([key, value]) => {
            speed += '<option value=' + key + '>' + value + '</option>';
        });
        $('#report-speed').html(speed);

        // Symmetry
        let symmetry = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_SYMMETRY + '</option>';
        Object.entries(breitbandconfig.symmetry).forEach(([key, value]) => {
            symmetry += '<option value=' + key + '>' + value + '</option>';
        });
        $('#report-symmetry').html(symmetry);

        // Price
        let price = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_PRICE + '</option>';
        Object.entries(breitbandconfig.price).forEach(([key, value]) => {
            price += '<option value=' + key + '>' + value + '</option>';
        });
        $('#report-price').html(price);

        // Use
        let use = '<option class="disabled-selection" value="-1" selected disabled>' + lang.REPORT_SELECT_BROADBAND_USE + '</option>';
        Object.entries(breitbandconfig.use).forEach(([key, value]) => {
            use += '<option value=' + key + '>' + value + '</option>';
        });
        use += '<option value="verwaltung">Berliner Verwaltung</option>';
        $('#report-use').html(use);

        // Access technology
        let accessTechnology = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_ACCESS_TECHNOLOGY + '</option>';
        Object.entries(breitbandconfig.zugangstechnologie).forEach(([key, value]) => {
            accessTechnology += '<option value=' + key + '>' + value + '</option>';
        });
        $('#report-access-technology').html(accessTechnology);

        // Field
        let field = '';
        Object.entries(breitbandconfig.field).forEach(([key, value]) => {
            field += '<div class="form-check">';
            field += '<input type="checkbox" class="form-check-input" name="fieldcheckbox" id="report-field-' + key + '" value="' + key + '">';
            field += '<label class="report-check-label" for="report-field-' + key + '">' + value + '</label>';
            field += '</div>';
        });
        $('#report-field').html(field);

        // Fill "Gewünschte Technologie" according to "Zugangstechnologie"
        $('#report-access-technology').change(() => {
            const technologySelected = $('#report-access-technology').val();
            const technologyKey = 'technology_' + technologySelected;
            let technology = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_TECHNOLOGY + '</option>';
            Object.entries(breitbandconfig[technologyKey]).forEach(([key, value]) => {
                technology += '<option value=' + key + '>' + value + '</option>';
            });
            $('#report-technology').html(technology);
            $('#report-technology-form').show();
        });
    }
}

$(window).resize(function(){
    resizeFormElements();
});

$('.selectpicker').selectpicker({
    liveSearch: true,
    size: false
});

/**
 * Resize form elements
 * @const
 * @function resizeFormElements
 */
const resizeFormElements = () => {
    window.setTimeout(function() {
        const width = $('#report-postcode').css('width');
        const paddingTop = $('#report-postcode').css('padding-top');
        const paddingBottom = $('#report-postcode').css('padding-bottom');

        $('.xdsoft_autocomplete').css('width', width);
        $('.xdsoft_autocomplete').css('padding-top', paddingTop);
        $('.xdsoft_autocomplete').css('padding-bottom', paddingBottom);

        $("#report-street").autocomplete('update');
    }, 100);
};

/**
 * Reset form on first page
 * @const
 * @function resetFirstPage
 */
const resetFirstPage = () => {
    // Edit id
    $('#report-edit-id').val('0');

    // Email
    $('#report-email').val('');
    $('#report-email-validate').val('');

    // Street
    $('#report-street').val('');
    $('#report-street').attr('data-street', '');
    $('#report-street').attr('data-bezirk', '');
    $('#report-street').attr('data-ortsteil', '');

    // Housenumber
    $('#report-housenumber').html('');
    $('#report-housenumber').prop('disabled', true);

    // Postcode
    $('#report-postcode').val('');

    // Speed
    $('#report-speed option:first').prop('selected', true);

    // Symmetry
    $('#report-symmetry option:first').prop('selected', true);

    // Price
    $('#report-price option:first').prop('selected', true);

    // Use
    $('#report-use option:first').prop('selected', true);

    // Data protection
    $('#report-data-protection').prop('checked', false);

    // Contact
    $('#report-contact').prop('checked', false);

    // Reset validation
    resetFirstPageValidation();

    // Remove marker from map
    markerLayer.getSource().clear();
};

/**
 * Reset form on second page
 * @const
 * @function resetSecondPage
 */
const resetSecondPage = () => {
    // Count
    $('#report-count').val('');

    // Technology
    $('#report-technology').html('');
    $('#report-technology-form').hide();

    // Access technology
    $('#report-access-technology option:first').prop('selected', true);

    // Field
    $('#report-field input[name="fieldcheckbox"]').prop('checked', false);

    // Further info
    $('#report-further-info').val('');

    resetSecondPageValidation();
};

/**
 * Reset report tab
 * @const
 * @function resetReport
 */
const resetReport = () => {
    resetFirstPage();
    resetSecondPage();

    $('#report-edit-title').hide();
    $('#report-first-row').hide();
    $('#report-menu-row').show();
};

/**
 * Show form for single report
 * @const
 * @function showSingleReport
 */
const showSingleReport = () => {
    $('#report-email-div').show();
    $('#report-validate-email-div').show();
    $('#report-next').hide();
    $('#report-save-single').show();

    $('#report-page2').hide();
    $('#report-page1').show();
    $('#report-map-div').show();

    resizeFormElements();
};

/**
 * Show first page of form for multiple report
 * @const
 * @function showMultipleReportPage1
 */
export const showMultipleReportPage1 = () => {
    $('#report-email-div').hide();
    $('#report-validate-email-div').hide();
    $('#report-next').show();
    $('#report-save-single').hide();

    $('#report-page2').hide();
    $('#report-page1').show();
    $('#report-map-div').show();

    resizeFormElements();
};

/**
 * Show second page of form for multiple report
 * @const
 * @function showMultipleReportPage2
 */
const showMultipleReportPage2 = () => {
    $('#report-page1').hide();
    $('#report-map-div').hide();
    $('#report-page2').show();
};

// Click on report button to show report tab
$('#report-tab-button a').on('click', (evt) => {
    evt.preventDefault();
    resetReport();
});
$('#report-tab-mobile-button a').on('click', (evt) => {
    evt.preventDefault();
    resetReport();
});

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#bedarfsmeldung') {
        resetReport();
    }
});

// Load single report page
$('#report-single-button').on('click', (evt) => {
    store.reportType = 'single';

    evt.preventDefault();
    showSingleReport();
    $('#report-menu-row').hide();
    $('#report-first-row').show();
    const reportMap = report.getMap();
    window.setTimeout(() => reportMap.updateSize(), 500);
});

// Load multiple report page only for registered users
if (config.registeredStatus.includes(config.status)) {
    $('#report-multiple-button').on('click', (evt) => {
        store.reportType = 'multiple';

        evt.preventDefault();
        showMultipleReportPage1();
        $('#report-menu-row').hide();
        $('#report-first-row').show();
        const reportMap = report.getMap();
        window.setTimeout(() => reportMap.updateSize(), 500);
    });
}

/** 
 * Adjusts the Price Dropdown according to the selected speed
 * @const
 * @function adjustPrice
 * 
*/
const adjustPrice = function () {
    // Current price
    let selectedPrice = $('#report-price').val();
    // Current speed
    let selectedSpeed = $('#report-speed').val();

    // Empty select
    $('#report-price').html("");

    let price = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_PRICE + '</option>';
    let listPrices = breitbandconfig.price_selection[selectedSpeed];
    let writePrices = breitbandconfig.price;
    let p;

    for (p of listPrices) {
        price += '<option value=' + p + '>' +  writePrices[p] + '</option>';
    }

    $('#report-price').html(price);

    if (listPrices.includes(selectedPrice)) {
        $('#report-price').val(selectedPrice);
    }
};

/** 
 * Adjusts the Speed Dropdown according to the selected price
 * @const
 * @function adjustSpeed
 * 
*/
const adjustSpeed = function () {
    // Current price
    let selectedPrice = $('#report-price').val();
    // Current speed
    let selectedSpeed = $('#report-speed').val();

    // Empty select
    $('#report-speed').html("");

    let speed = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_SPEED + '</option>';
    let listSpeed = breitbandconfig.speed_selection[selectedPrice];
    let writeSpeed = breitbandconfig.speed;
    let s;

    for (s of listSpeed) {
        speed += '<option value=' + s + '>' +  writeSpeed[s] + '</option>';
    }

    $('#report-speed').html(speed);

    if (listSpeed.includes(selectedSpeed)) {
        $('#report-speed').val(selectedSpeed);
    }
};

// Aadd change events
$('#report-speed').on('change', adjustPrice);
$('#report-price').on('change', adjustSpeed);

/**
 *  Callback after data sent to server
 * @const
 * @function dataSentToServer
 * @param data {string} - Check if data were sent to server
 * @param loggedin {boolean} - User is / is not logged in
 * @param reportTyp {string} - Report type (single|multiple)
 * @param edit {mumber} - ID of databaset to be edited (0: do not edit data)
 */
const dataSentToServer = (data, loggedin, reportTyp, edit) => {
    if (data === 'OK') {
        // Reload layers to show new data
        // Note: from OpenLayers 6 there will be a change in behaviour of clear() and refresh()
        // https://github.com/openlayers/openlayers/pull/9250
        ortsteile.getSource().clear();
        lor.getSource().clear();

        // Update statistics
        viewer.getStatistics();

        if (!loggedin) {
            $('#modal-not-logged-report').show();
        } else if (loggedin && reportTyp === 'multiple' && edit == 0) {
            $('#modal-logged-multiple-report').show();
        } else if (loggedin && reportTyp === 'multiple' && edit != 0) {
            $('#modal-report-edited').show();
        } else {
            $('#modal-logged-single-report').show();
        }
    } else if (data === 'Email exists') {
        $('#modal-report-not-saved-email-used').show();
    } else {
        $('#modal-report-not-saved').show();
    }
};

/**
 * Save report in DB
 * @const
 * @function saveReport
 */
const saveReport = () => {
    let loggedin = false;
    if (config.registeredStatus.includes(config.status)) {
        loggedin = true;
    }

    let sendDataToServer = true;

    // Get coordinates from map
    let coordinates;
    if (markerLayer.getSource().getFeatures().length) {
        coordinates = markerLayer.getSource().getFeatures()[0].getGeometry().getCoordinates();
        coordinates = toLonLat(coordinates);
        if (coordinates.length !== 2) {
            sendDataToServer = false;
        }
    } else {
        sendDataToServer = false;
    }

    if (store.reportType === 'single') {
        // Single report

        // Get data from form

        // Email (only if user is not logged in)
        let email;
        if (!loggedin) {
            email = $('#report-email').val();
            if (!email || email === '') {
                sendDataToServer = false;
            }
        }

        // Street
        const street = $('#report-street').attr('data-street');
        if (!street || street === '') {
            sendDataToServer = false;
        }

        // Bezirk
        const bezirk = $('#report-street').attr('data-bezirk');

        // Ortsteil
        const ortsteil = $('#report-street').attr('data-ortsteil');

        // Housenumber
        const housenumber =$('#report-housenumber').val();
        if (!housenumber || housenumber === '') {
            sendDataToServer = false;
        }

        // Postcode
        const postcode = $('#report-postcode').val();
        if (!postcode || postcode === '') {
            sendDataToServer = false;
        }

        // Speed
        const speed = $('#report-speed').val();
        if (!speed || speed === '') {
            sendDataToServer = false;
        }

        // Symmetry
        const symmetry = $('#report-symmetry').val();

        // Price
        const price = $('#report-price').val();
        if (!price || price === '') {
            sendDataToServer = false;
        }

        // Use
        const use = $('#report-use').val();
        if (!use || use === '') {
            sendDataToServer = false;
        }

        // Contact
        let contact = true;
        if (!loggedin && !$('#report-contact').is(':checked')) {
            contact = false;
        }

        if (sendDataToServer) {
            $.post('php/save-report.php', {
                logged_in: loggedin,
                report_type: store.reportType,
                lon: coordinates[0].toFixed(7),
                lat: coordinates[1].toFixed(7),
                email: email,
                street: street,
                bezirk: bezirk,
                ortsteil: ortsteil,
                housenumber: housenumber,
                postcode: postcode,
                speed: speed,
                price: price,
                use: use,
                contact: contact,
                symmetry: symmetry
            }, function(data) {
                dataSentToServer(data, loggedin, store.reportType, 0);
            });
        }

    } else if (store.reportType === 'multiple') {
        // Multiple report

        // Get data from form

        // Street
        const street = $('#report-street').attr('data-street');
        if (!street || street === '') {
            sendDataToServer = false;
        }

        // Bezirk
        const bezirk = $('#report-street').attr('data-bezirk');

        // Ortsteil
        const ortsteil = $('#report-street').attr('data-ortsteil');

        // Housenumber
        const housenumber =$('#report-housenumber').val();
        if (!housenumber || housenumber === '') {
            sendDataToServer = false;
        }

        // Postcode
        const postcode = $('#report-postcode').val();
        if (!postcode || postcode === '') {
            sendDataToServer = false;
        }

        // Speed
        const speed = $('#report-speed').val();
        if (!speed || speed === '') {
            sendDataToServer = false;
        }

        // Symmetry
        const symmetry = $('#report-symmetry').val();

        // Price
        const price = $('#report-price').val();
        if (!price || price === '') {
            sendDataToServer = false;
        }

        // Use
        const use = $('#report-use').val();
        if (!use || use === '') {
            sendDataToServer = false;
        }

        // Count
        const count = parseInt($('#report-count').val());
        if (!Number.isInteger(count) || count < 1 || count > 100) {
            $('#report-count').addClass('invalid-input');
            sendDataToServer = false;
        }

        // Technology
        let technology = $('#report-technology').val();

        // Access technology
        let accessTechnology = $('#report-access-technology').val();

        // Field: we send only the field code. Text will be imported in server.
        let field = [];
        if ($('#report-field input[name="fieldcheckbox"]:checked').length) {
            $('#report-field input[name="fieldcheckbox"]:checked').each(function() {
                field.push($(this).val());
            });
        }

        // Further info
        let furtherInfo = $('#report-further-info').val();

        const editId = $('#report-edit-id').val();

        if (sendDataToServer) {
            $.post('php/save-report.php', {
                edit_id: editId,
                logged_in: loggedin,
                report_type: store.reportType,
                lon: coordinates[0].toFixed(7),
                lat: coordinates[1].toFixed(7),
                street: street,
                bezirk: bezirk,
                ortsteil: ortsteil,
                housenumber: housenumber,
                postcode: postcode,
                speed: speed,
                price: price,
                use: use,
                count: count,
                access_technology: accessTechnology,
                technology: technology,
                field: field,
                further_info: furtherInfo,
                symmetry: symmetry
            }, function(data) {
                dataSentToServer(data, loggedin, store.reportType, editId);
            });
        }

    } else {
        return;
    }
};

/**
 * Click on button to save single report
 * @const
 * @function clickSingleSaveReport
 * @param evt {object} - Click event object
 */
const clickSingleSaveReport = (evt) => {
    evt.preventDefault();
    if (validateFirstPage() === false) {
        return;
    }

    if (store.reportType === 'single') {
        saveReport();
    } else {
        return;
    }
};
$('#report-save-single').on('click', clickSingleSaveReport);

/**
 * Click on button to save multiple report
 * @const
 * @function clickMultipleSaveReport
 * @param evt {object} - Click event object
 */
const clickMultipleSaveReport = (evt) => {
    evt.preventDefault();
    if (validateSecondPage() === false) {
        return;
    }
    if (store.reportType === 'multiple') {
        saveReport();
    } else {
        return;
    }
};
$('#report-save-multiple').on('click',clickMultipleSaveReport);

/**
 * Reset validated fields in first page form
 * @const
 * @function resetFirstPageValidation
 */
const resetFirstPageValidation = () => {
    // Email
    $('#report-email').removeClass('invalid');
    $('#report-email-validate').removeClass('invalid');

    // Street
    $('#report-street').removeClass('invalid');

    // Housenumber
    $('#report-housenumber').removeClass('invalid');

    // Postocode
    $('#report-postcode').removeClass('invalid');

    // Speed
    $('#report-speed').removeClass('invalid');

    // Price
    $('#report-price').removeClass('invalid');

    // Use
    $('#report-use').removeClass('invalid');

    // Data protection
    $('#report-data-protection-label').removeClass('invalid-show-in-text');
};

/**
 * Reset validated fields in second page form
 * @const
 * @function resetSecondPageValidation
 */
const resetSecondPageValidation = () => {
    $('#report-count').removeClass('invalid-input');
};

/**
 * RegExp to validate email
 * @const
 * @function validateEmail
 * @param email {string} - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

// Reset validation if data protection checkbox is checked
$('#report-data-protection').change(() => {
    if ($('#report-data-protection').is(':checked')) {
        $('#report-data-protection-label').removeClass('invalid-show-in-text');
    }
});

/**
 * Validate form on first page
 * @const
 * @function validateFirstPage
 * @returns {boolean}
 */
const validateFirstPage = () => {
    let validated = true;

    resetFirstPageValidation();

    // Validate email and privacy policy only for single report and when user is not logged in
    if (store.reportType === 'single' && !config.registeredStatus.includes(config.status)) {
        // Email
        const email1 = $('#report-email').val();
        const email2 = $('#report-email-validate').val();
        if (!validateEmail(email1) || !validateEmail(email2) || email1 !== email2) {
            $('#report-email').addClass('invalid');
            $('#report-email-validate').addClass('invalid');
            validated = false;
        }

        // Privacy policy
        if (!$('#report-data-protection').is(':checked')) {
            $('#report-data-protection-label').addClass('invalid-show-in-text');
            validated = false;
        }
    }

    // Street
    if ($('#report-street').val() === '') {
        $('#report-street').addClass('invalid');
        validated = false;
    }

    // Housenumber
    if ($('#report-housenumber').val() === '' || $('#report-housenumber').val() === null) {
        $('#report-housenumber').addClass('invalid');
        validated = false;
    }

    // Postcode
    if ($('#report-postcode').val() === '' || $('#report-postcode').val() === null) {
        $('#report-postcode').addClass('invalid');
        validated = false;
    }

    // Speed
    if ($('#report-speed').val() === null) {
        $('#report-speed').addClass('invalid');
        validated = false;
    }

    // Price
    if ($('#report-price').val() === null) {
        $('#report-price').addClass('invalid');
        validated = false;
    }

    // Use
    if ($('#report-use').val() === null) {
        $('#report-use').addClass('invalid');
        validated = false;
    }

    return validated;
};

/**
 * Validate form on second page
 * @const
 * @function validateSecondPage
 * @returns {boolean}
 */
const validateSecondPage = () => {
    let validated = true;

    // Count
    const count = parseInt($('#report-count').val());
    if (!Number.isInteger(count) || count < 1 || count > 100) {
        $('#report-count').addClass('invalid-input');
        validated = false;
    }
    return validated;
};

// Show 2nd report page (multiple)
$('#report-next').on('click', (evt) => {
    evt.preventDefault();
    if (validateFirstPage() === false) {
        return;
    }
    showMultipleReportPage2();
});

// Show data protection modal
$('#report-data-protection-label').click(function() {
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
$('#report-contact-label').click(function() {
    $('#modal-allow-contact').show();
});

// Close modal (saved report, not logged-in) and go to map
$('#modal-not-logged-report-close').on('click', () => {
    $('.nav-tabs a[href="#bedarfskarte"]').tab('show');
    window.location.hash = 'bedarfskarte';
    $('#modal-not-logged-report').hide();
});

// Close modal (saved single report, logged-in) and go to map
$('#modal-logged-single-report-close').on('click', () => {
    $('.nav-tabs a[href="#bedarfskarte"]').tab('show');
    window.location.hash = 'bedarfskarte';
    $('#modal-logged-single-report').hide();
});

// Save more reports with the same data
$('#modal-logged-multiple-report-more').on('click', function() {
    showMultipleReportPage1();
    $('#modal-logged-multiple-report').hide();
});

// New report
$('#modal-logged-multiple-report-new').on('click', function() {
    resetReport();
    $('#modal-logged-multiple-report').hide();
});

// New report
$('#modal-logged-multiple-report-to-viewer').on('click', function() {
    $('.nav-tabs a[href="#bedarfskarte"]').tab('show');
    window.location.hash = 'bedarfskarte';
    $('#modal-logged-multiple-report').hide();
});

// Close contact modal
$('#modal-allow-contact-close').click(function() {
    $('#modal-allow-contact').hide();
});

// Close delete error modal
$('#modal-report-edited-close').click(function() {
    $('.nav-tabs a[href="#my-reports"]').tab('show');
    window.location.hash = 'my-reports';
    $('#modal-report-edited').hide();

});

// Close report not saved - email already used modal
$('#modal-report-not-saved-email-used-close').click(function() {
    $('#modal-report-not-saved-email-used').hide();

});

// Close report not saved modal
$('#modal-report-not-saved-close').click(function() {
    $('#modal-report-not-saved').hide();

});

// If "Berliner Verwaltung", do not accept this value and forward to itdz site
$('#report-use').change(() => {
    if ($('#report-use').val() === 'verwaltung') {
        $('#report-use option:first').prop('selected', true);

        // Countdown to forward
        let timeleft = 5;
        $('#modal-itdz-countdown').html(timeleft);
        $('#modal-itdz').show();
        let downloadTimer = setInterval(function(){
            timeleft -= 1;
            $('#modal-itdz-countdown').html(timeleft);

            // if(timeleft <= 0){
            if(timeleft === 0){
                clearInterval(downloadTimer);
                // alert('finished');
                window.location.href = "https://itdz.bbp-berlin.de/";
            }
        }, 1000);

        // Cancel forward
        $('#modal-itdz-close').click(function() {
            clearInterval(downloadTimer);
            $('#modal-itdz').hide();
        });
    }
});

// Tooltip
if (TOUCH) {
    $('#report-symmetry-label').mouseenter(function() {
        $('#tooltip-summetry').show();
    });

    $('#report-symmetry-label').mouseleave(function() {
        $('#tooltip-summetry').hide();
    });
} else {
    $('#report-symmetry-label-icon').mouseenter(function() {
        $('#tooltip-summetry').show();
    });

    $('#report-symmetry-label-icon').mouseleave(function() {
        $('#tooltip-summetry').hide();
    });
}
