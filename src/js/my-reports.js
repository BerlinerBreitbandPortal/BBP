/**
 * @module my-reports
 */

import { lang, browserLanguage } from './language';
import { myReports, store, viewer, report, reportMap } from './index';
import { showMultipleReportPage1 } from './report';
import { ortsteile, lor } from './viewer-map';
import $ from 'jquery';
import dt from 'datatables.net';
import 'datatables.net-dt/css/jquery.dataTables.css';
import moment from 'moment';
import breitbandconfig from '../breitbandconfig/breitbandconfig.json';
import * as proj from "ol/proj";

$.fn.dataTable.moment = function ( format, locale ) {
    let types = $.fn.dataTable.ext.type;

    // Add type detection
    types.detect.unshift( function ( d ) {
        return moment( d, format, locale, true ).isValid() ?
            'moment-'+format :
            null;
    } );

    // Add sorting method - use an integer for the sorting
    types.order[ 'moment-'+format+'-pre' ] = function ( d ) {
        return moment( d, format, locale, true ).unix();
    };
};

/**
 * Class for user reports page
 */
export class MyReports {
    constructor() {
        /**
         * Class name
         * @memeberof MyReports
         * @type {string}
         */
        this.name = 'My Reports';
    }

    /**
     * Get user reports from database
     * @returns {Promise} Promise object returning a JSON with user reports
     */
    ReportList() {
        const url = 'php/show-my-reports.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                success: function(data) {
                    let isValidJSON = true;
                    try {
                        JSON.parse(data);
                    } catch(ex) {
                        isValidJSON = false;
                    }
                    if (isValidJSON) {

                        resolve(JSON.parse(data));
                    } else {
                        resolve(null);
                    }
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }
}

/**
 * Function to receive reports from database and create DOM
 * @const
 * @param data {object[]} - User reports
 */
const showMyReports = (data) => {
    if (data && data.length) {
        let html = '<table id="my-reports-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>' +  'Eingabedatum' + '</th>';
        html += '<th>' +  'Bezirk' + '</th>';
        html += '<th>' +  'Ortsteil' + '</th>';
        html += '<th>' +  'PLZ' + '</th>';
        html += '<th>' +  'Straße' + '</th>';
        html += '<th>' +  'Hausnummer' + '</th>';
        html += '<th>' +  'Nutzung' + '</th>';
        html += '<th>' +  'Bandbreite' + '</th>';
        html += '<th>' +  'Symmetrie' + '</th>';
        html += '<th>' +  'Zahlungsbereitschaft' + '</th>';
        html += '<th>' +  'Anzahl' + '</th>';
        html += '<th>' +  'Zugangstechnologie' + '</th>';
        html += '<th>' +  'Gewünschte Technologie' + '</th>';
        html += '<th>' +  'Einsatzfeld' + '</th>';
        html += '<th>' +  'Weitere Mitteilungen' + '</th>';
        html += '<th>' +  'Bearbeiten' + '</th>';
        html += '<th>' +  'Löschen' + '</th>';
        html += '</tr>';
        html += '</thead>';

        html += '<tbody>';
        data.forEach(function (report) {
            html += '<tr data-gid="' + report.gid + '">';
            html += '<td>' + report.bearbeitet + '</td>';
            html += '<td>' + report.bezirk + '</td>';
            html += '<td>' + report.ortsteil + '</td>';
            html += '<td>' + report.plz + '</td>';
            html += '<td>' + report.strasse + '</td>';
            html += '<td>' + report.hnr + '</td>';
            report.tarif = (report.tarif === null ? '' : report.tarif);
            html += '<td>' + report.tarif + '</td>';
            report.bandbreite = (report.bandbreite === null ? '' : report.bandbreite);
            html += '<td>' + report.bandbreite + '</td>';
            report.symmetrie = (report.symmetrie === null ? '' : report.symmetrie);
            html += '<td>' + report.symmetrie + '</td>';
            report.preis = (report.preis === null ? '' : report.preis);
            html += '<td>' + report.preis + '</td>';
            report.anzahl = (report.anzahl === null ? '' : report.anzahl);
            html += '<td>' + report.anzahl + '</td>';
            report.zugangstechnologie = (report.zugangstechnologie === null ? '' : report.zugangstechnologie);
            html += '<td>' + report.zugangstechnologie + '</td>';
            report.technologie = (report.technologie === null ? '' : report.technologie);
            html += '<td>' + report.technologie + '</td>';
            if (report.einsatzbereich) {
                html += '<td>';
                report.einsatzbereich = report.einsatzbereich.replace(/{/g, "[");
                report.einsatzbereich = report.einsatzbereich.replace(/}/g, "]");
                report.einsatzbereich = JSON.parse(report.einsatzbereich);
                html += '<ul>';
                report.einsatzbereich.forEach(function (singleEinsatzbereich) {
                    html += '<li>';
                    html += singleEinsatzbereich;
                    html += '</li>';
                });
                html += '</ul>';
                html += '</td>';
            } else {
                html += '<td></td>';
            }
            report.meldung_weitere = (report.meldung_weitere === null ? '' : report.meldung_weitere);
            html += '<td>' + report.meldung_weitere + '</td>';
            html += '<td class="my-reports-edit"><i class="fa fa-pencil" title="Eintrag bearbeiten"></i></td>';
            html += '<td class="my-reports-delete"><i class="fa fa-trash-o" title="Eintrag löschen"></i></td>';
            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        $('#my-reports-list').html(html);

        $.fn.dataTable.moment( 'DD.MM.YYYY' );
        $('#my-reports-table').DataTable({
            searching: false,
            lengthChange: false,
            paging: false,
            scrollX: true,
            scrollY: '50vh',
            scrollCollapse: true,
            language: {
                url: 'lang/dataTables.' + browserLanguage + '.json'
            }
        });

        $('.my-reports-edit>i').click(function() {
            const gid = $(this).parent().parent().attr('data-gid');
            let reportToEdit;
            data.forEach(function (report) {
                if (report.gid == gid) {
                    reportToEdit = report;
                }
            });
            if (reportToEdit) {
                const showEditMultipleReportPage1 = (e) => {
                    if (e.target.hash === '#bedarfsmeldung') {
                        store.reportType = 'multiple';
                        showMultipleReportPage1();
                        $('#report-menu-row').hide();
                        $('#report-first-row').show();

                        $('#report-edit-title').show();

                        // Edit id
                        $('#report-edit-id').val(reportToEdit.gid);

                        // Street
                        $('#report-street').val(reportToEdit.strasse + ' [' + reportToEdit.bezirk + ']');
                        $('#report-street').attr('data-street', reportToEdit.strasse);
                        $('#report-street').attr('data-bezirk', reportToEdit.bezirk);
                        $('#report-street').attr('data-ortsteil', reportToEdit.ortsteil);

                        // Housenumber
                        const housenumberForm = '<option selected>' + reportToEdit.hnr + '</option>';
                        $('#report-housenumber').html(housenumberForm);
                        $('#report-housenumber').prop('disabled', true);

                        // Postcode
                        $('#report-postcode').val(reportToEdit.plz);

                        // Use
                        Object.entries(breitbandconfig.use).forEach(([key, value]) => {
                            if (reportToEdit.tarif === value) {
                                $('#report-use').find('option[value="' + key + '"]').prop("selected",true);
                            }
                        });

                        // Speed
                        Object.entries(breitbandconfig.speed).forEach(([key, value]) => {
                            if (reportToEdit.bandbreite === value) {
                                $('#report-speed').find('option[value="' + key + '"]').prop("selected",true);
                            }
                        });

                        // Symmetry
                        Object.entries(breitbandconfig.symmetry).forEach(([key, value]) => {
                            if (reportToEdit.symmetrie === value) {
                                $('#report-symmetry').find('option[value="' + key + '"]').prop("selected",true);
                            }
                        });

                        // Price
                        Object.entries(breitbandconfig.price).forEach(([key, value]) => {
                            if (reportToEdit.preis === value) {
                                $('#report-price').find('option[value="' + key + '"]').prop("selected",true);
                            }
                        });

                        // Report map
                        report.reportMapObject.repositionMarker({
                            lat: reportToEdit.lat,
                            lon: reportToEdit.lon
                        });
                        reportMap.getView().setCenter(proj.transform([parseFloat(reportToEdit.lon), parseFloat(reportToEdit.lat)], 'EPSG:4326', 'EPSG:3857'));
                        reportMap.getView().setZoom(18);

                        // Count
                        $('#report-count').val(reportToEdit.anzahl);

                        // Access technology
                        let technologyKey = '';
                        Object.entries(breitbandconfig.zugangstechnologie).forEach(([key, value]) => {
                            if (reportToEdit.zugangstechnologie === value) {
                                $('#report-access-technology').find('option[value="' + key + '"]').prop("selected",true);
                                technologyKey = 'technology_' + key;
                            }
                        });

                        // Technology
                        let technology = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_BROADBAND_TECHNOLOGY + '</option>';
                        let technologyKeyToSelect = '';
                        if (technologyKey !== '') {
                            Object.entries(breitbandconfig[technologyKey]).forEach(([key, value]) => {
                                technology += '<option value=' + key + '>' + value + '</option>';
                                if (reportToEdit.technologie === value) {
                                    technologyKeyToSelect = key;
                                }
                            });
                            $('#report-technology').html(technology);
                            $('#report-technology').find('option[value="' + technologyKeyToSelect + '"]').prop("selected", true);
                            $('#report-technology-form').show();
                        }

                        // Field
                        Object.entries(breitbandconfig.field).forEach(([key, value]) => {
                            reportToEdit.einsatzbereich.forEach(function (singleField, index) {
                                    if (singleField === value) {
                                        $('input[name=fieldcheckbox][value=' + key + ']').prop('checked', true);
                                    }
                            });
                        });

                        // Further info
                        $('#report-further-info').val(reportToEdit.meldung_weitere);
                    }
                };

                $('a[data-toggle="tab"]').one('shown.bs.tab', showEditMultipleReportPage1);

                $('#bbp-tabs a[href="#bedarfsmeldung"]').tab('show');
                window.location.hash = 'report';
            } else {
                alert('error');
            }
        });

        $('.my-reports-delete>i').click(function() {
            const gid = $(this).parent().parent().attr('data-gid');
            deleteReport(gid)
                .then(data => {
                    if (data === 'OK') {
                        myReports.ReportList()
                            .then(data => {
                                showMyReports(data);
                                $('#modal-report-deleted').show();
                            })
                            .catch(error => {
                                console.log(error);
                            });
                    } else {
                        $('#modal-report-not-deleted').show();
                    }
                })
                .catch(error => {
                    console.log(error);
                    $('#modal-report-not-deleted').show();
                });
        });
    } else {
        $('#my-reports-list').html(lang.MY_REPORTS_NOT_FOUND);
    }
};
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#meine-bedarfsmeldungen') {
        myReports.ReportList()
            .then(data => {
                showMyReports(data);
            })
            .catch(error => {
                console.log(error);
            });
    }
});

/**
 * Function to delete reports in database
 * @const
 * @param gid {number} - Report id
 */
const deleteReport = (gid) => {
    const url = 'php/delete-report.php';
    // Promisify the ajax call
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'POST',
            data: {
                id: gid
            },
            success: function(data) {
                // Reload layers to show new data
                // Note: from OpenLayers 6 there will be a change in behaviour of clear() and refresh()
                // https://github.com/openlayers/openlayers/pull/9250
                ortsteile.getSource().clear();
                lor.getSource().clear();

                // Update statistics
                viewer.getStatistics();

                resolve(data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
};

// Close delete success modal
$('#modal-report-deleted-close').click(function() {
    $('#modal-report-deleted').hide();
});

// Close delete error modal
$('#modal-report-not-deleted-close').click(function() {
    $('#modal-report-not-deleted').hide();
});
