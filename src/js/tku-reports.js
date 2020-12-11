/**
 * @module tku-reports
 */

import { lang, browserLanguage } from './language';
import {config} from './config';
import breitbandconfig from '../breitbandconfig/breitbandconfig.json';
import { tkuReports } from './index';
import $ from 'jquery';
import dt from 'datatables.net';
import 'datatables.net-dt/css/jquery.dataTables.css';

import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5.js';

import moment from 'moment';

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
 * Class for TKU reports page
 */
export class TkuReports {
    constructor() {
        /**
         * Class name
         * @memeberof TkuReports
         * @type {string}
         */
        this.name = 'TKU Reports';
    }

    /**
     * Get all reports from database
     * @returns {Promise} Promise object returning a JSON with all reports
     */
    ReportList() {
        const url = 'php/show-tku-reports.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                // data: geocoderParams,
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
 * @function showTkuReports
 * @param data {object[]} - All reports
 */
const showTkuReports = (data) => {
    if (data && data.length) {
        let html = '<table id="tku-reports-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>' +  'ID' + '</th>';
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
        html += '<th>' +  'Vorname' + '</th>';
        html += '<th>' +  'Nachname' + '</th>';
        html += '<th>' +  'E-Mail' + '</th>';
        html += '<th>' +  'Kontaktaufnahme' + '</th>';
        html += '<th>' +  'Kontaktaufnahme erfolgt' + '</th>';
        html += '<th>' +  'Maßnahmen' + '</th>';
        html += '</tr>';
        html += '</thead>';

        html += '<tbody>';
        data.forEach(function (report) {
            html += '<tr data-gid="' + report.gid + '">';
            html += '<td>' + report.gid + '</td>';
            html += '<td>' + report.bearbeitet + '</td>';
            html += '<td>' + report.bezirk + '</td>';
            html += '<td>' + report.ortsteil + '</td>';
            html += '<td>' + report.plz + '</td>';
            html += '<td>' + report.strasse + '</td>';
            report.hnr = (report.hnr === null ? '' : report.hnr);
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
            report.vorname = (report.vorname === null ? '' : report.vorname);
            html += '<td>' + report.vorname + '</td>';
            report.nachname = (report.nachname === null ? '' : report.nachname);
            html += '<td>' + report.nachname + '</td>';
            report.email = (report.email === null ? '' : report.email);
            html += '<td>' + report.email + '</td>';
            let contact = 'nein';
            if (report.contact === 't') {
                contact = 'ja';
            }
            html += '<td style="text-align:center">' + contact + '</td>';
            if (report.contacted === 't') {
                html += '<td style="text-align:center"><input type="checkbox" class="tku-contacted form-check-input" data-gid="' + report.gid + '" checked></td>';
            } else {
                html += '<td style="text-align:center"><input type="checkbox" class="tku-contacted form-check-input" data-gid="' + report.gid + '"></td>';
            }

            report.action = (report.action === null ? '' : report.action);
            html += '<td>';
            html += '<select class="tku-action" data-gid="' + report.gid + '" style="width:190px">';
            let actionEmpty = false;
            for (let action in breitbandconfig.tku_action) {
                if (breitbandconfig.tku_action[action] === report.action) {
                    actionEmpty = true;
                }
            }
            if (actionEmpty) {
                html += '<option selected></option>';
            } else {
                html += '<option></option>';
            }
            Object.entries(breitbandconfig.tku_action).forEach(([key, value]) => {
                if (report.action === value) {
                    html += '<option selected>' + value + '</option>';
                } else {
                    html += '<option>' + value + '</option>';
                }
            });
            html += '</select>';
            html += '</td>';

            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        $('#tku-reports-list').html(html);

        $('.tku-contacted').change(function() {
            const gidValue = $(this).attr('data-gid');
            const contactedValue = $(this).is(':checked');

            editTkuReport(gidValue, contactedValue, null);
        });

        $('.tku-action').change(function() {
            const gidValue = $(this).attr('data-gid');
            const actionValue = $(this).val();

            editTkuReport(gidValue, null, actionValue);
        });

        $.fn.dataTable.moment( 'DD.MM.YYYY' );
        $('#tku-reports-table').DataTable({
            searching: true,
            lengthChange: false,
            paging: true,
            scrollX: true,
            // scrollY: '50vh',
            scrollY: false,
            scrollCollapse: true,
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'csv',
                    text: 'CSV herunterladen',
                    charset: 'utf-8',
                    extension: '.csv',
                    fieldSeparator: ';',
                    fieldBoundary: '',
                    filename: 'Berliner_Breitband_Portal_Bedarfsmeldungen',
                    bom: true,
                    className: 'btn btn-secondary',
                    exportOptions: {
                        columns: function(idx, data, node) {
                            // Do not export the last two columns for TKU (Kontaktaufnahme erfolgt & Maßnahmen)
                            if (config.status === 'tku' && (idx === 20 || idx === 21)) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                }
            ],
            language: {
                // url: 'lang/dataTables.de-DE.json'
                url: 'lang/dataTables.' + browserLanguage + '.json'
            }
        });
    } else {
        $('#tku-reports-list').html(lang.TKU_REPORTS_NOT_FOUND);
    }
};

/**
 * Function to edit reports for TKU (contact and action taken)
 * @const
 * @function editTkuReport
 * @param gid {number} - Report id
 * @param contacted {boolean|null} - If the TKU has contacted the client
 * @param action {string|null} - Action taken by the TKU
 */
const editTkuReport = (gid, contacted, action) => {
    const url = 'php/edit-tku-report.php';
    let data;

    if (gid && (contacted !== null || action !== null)) {
        data = {
            gid: gid,
            contacted: contacted,
            action: action
        };
    } else {
        return;
    }

    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        success: function(data) {
            console.log(data);
        },
        error: function(error) {
            console.log(error);
        }
    });
};

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#tku-bedarfsmeldungen') {
        tkuReports.ReportList()
            .then(data => {
                showTkuReports(data);
            })
            .catch(error => {
                console.log(error);
            });
    }
});
