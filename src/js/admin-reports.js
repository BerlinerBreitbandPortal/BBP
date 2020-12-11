/**
 * @module admin-reports
 */

import { lang, browserLanguage } from './language';
import { adminReports } from './index';
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
 * Class for administrator reports page
 */
export class AdminReports {
    constructor() {
        /**
         * Class name
         * @memeberof AdminReports
         * @type {string}
         */
        this.name = 'Admin Reports';
    }

    /**
     * Get all reports from database
     * @returns {Promise} Promise object returning a JSON with all reports
     */
    ReportList() {
        const url = 'php/show-admin-reports.php';
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
 * @function showAdminReports
 * @param data {object[]} - All reports
 */
const showAdminReports = (data) => {
    if (data && data.length) {
        let html = '<table id="admin-reports-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>' +  'ID' + '</th>';
        html += '<th>' +  'Kontaktaufnahme' + '</th>';
        html += '<th>' +  'Kontaktaufnahme erfolgt' + '</th>';
        html += '<th>' +  'Maßnahmen' + '</th>';
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
        html += '<th>' +  'Anrede' + '</th>';
        html += '<th>' +  'Vorname' + '</th>';
        html += '<th>' +  'Nachname' + '</th>';
        html += '<th>' +  'Nutzer: Straße' + '</th>';
        html += '<th>' +  'Nutzer: PLZ, Ort' + '</th>';
        html += '<th>' +  'Unternehmen' + '</th>';
        html += '<th>' +  'Bereich' + '</th>';
        html += '<th>' +  'Weitere Angaben' + '</th>';
        html += '<th>' +  'E-Mail' + '</th>';
        html += '<th>' +  'Telefon' + '</th>';
        html += '</tr>';
        html += '</thead>';

        html += '<tbody>';
        data.forEach(function (report) {
            html += '<tr data-gid="' + report.gid + '">';
            html += '<td>' + report.gid + '</td>';
            let contact = 'nein';
            let contactClass = 'no-contact';
            if (report.contact === 't') {
                contact = 'ja';
                contactClass = 'contact';
            }
            html += '<td style="text-align:center"><span class="' + contactClass + '">' + contact + '</span></td>';
            let contacted = 'nein';
            if (report.contacted === 't') {
                contacted = 'ja';
            }
            html += '<td style="text-align:center">' + contacted + '</td>';
            report.action = (report.action === null ? '' : report.action);
            html += '<td>' + report.action + '</td>';
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
            report.anrede = (report.anrede === null ? '' : report.anrede);
            html += '<td>' + report.anrede + '</td>';
            report.vorname = (report.vorname === null ? '' : report.vorname);
            html += '<td>' + report.vorname + '</td>';
            report.nachname = (report.nachname === null ? '' : report.nachname);
            html += '<td>' + report.nachname + '</td>';
            report.benutzerstrasse = (report.benutzerstrasse === null ? '' : report.benutzerstrasse);
            html += '<td>' + report.benutzerstrasse + '</td>';
            report.benutzerort = (report.benutzerort === null ? '' : report.benutzerort);
            html += '<td>' + report.benutzerort + '</td>';
            report.unternehmen = (report.unternehmen === null ? '' : report.unternehmen);
            html += '<td>' + report.unternehmen + '</td>';
            report.bereich = (report.bereich === null ? '' : report.bereich);
            html += '<td>' + report.bereich + '</td>';
            report.weitere = (report.weitere === null ? '' : report.weitere);
            html += '<td>' + report.weitere + '</td>';
            report.email = (report.email === null ? '' : report.email);
            html += '<td>' + report.email + '</td>';
            report.telefon = (report.telefon === null ? '' : report.telefon);
            html += '<td>' + report.telefon + '</td>';

            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        $('#admin-reports-list').html(html);

        $.fn.dataTable.moment( 'DD.MM.YYYY' );
        $('#admin-reports-table').DataTable({
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
                    className: 'btn btn-secondary'
                }
            ],
            language: {
                url: 'lang/dataTables.' + browserLanguage + '.json'
            }
        });
    } else {
        $('#admin-reports-list').html(lang.TKU_REPORTS_NOT_FOUND);
    }
};
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#admin-bedarfsmeldungen') {
        adminReports.ReportList()
            .then(data => {
                showAdminReports(data);
            })
            .catch(error => {
                console.log(error);
            });
    }
});
