/**
 * @module viewer
 */

import { ViewerMap } from './viewer-map';
import { ViewerMessageArea } from './viewer-message-area';
import $ from "jquery";

/**
 * Class for viewer page
 */
export class Viewer {
    /**
     * @param config {object} - Configuration of Berliner Breitband Portal
     * @param store {object} - Data in store
     */
    constructor(config, store) {
        /**
         * Viewer map object
         * @memeberof Viewer
         * @type {object}
         */
        this.map = new ViewerMap(config, store).getMap();

        /**
         * ViewerMessageArea object
         * #memeberof Viewer
         * @type {object}
         */
        const viewerMessageArea = new ViewerMessageArea(config);
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            if (e.target.hash === '#bedarfskarte') {
                viewerMessageArea.activateGetViewerMessageArea();
            }
        });

        /**
         * Statistics object
         * @memeberof Viewer
         * @type {object}
         */
        this.statistics = new Statistics();
    }

    /**
     * Get OpenLayers map
     * @returns {object}
     */
    getMap() {
        return this.map;
    }

    /**
     * Get statistics and create DOM
     * @returns {Promise}
     */
    getStatistics() {
        const showStatistics = (data) => {
            if (data.counter) {
                let html = '<table>';
                html += '<tr>';
                html += '<th>Bezirke</th>';
                if (data.year && data.year.years_array && data.year.bezirke) {
                    data.year.years_array.forEach((year) => {
                        html += '<th>' + year + '</th>';
                    });
                }
                html += '<th>Alle</th>';
                html += '</tr>';

                data.counter.forEach((counterBezirkObject) => {
                    for (let bezirk in counterBezirkObject) {
                        html += '<tr>';
                        if (bezirk !== 'summe') {
                            html += '<td>' + bezirk + '</td>';
                        }

                        if (data.year && data.year.years_array && data.year.bezirke) {
                                    data.year.years_array.forEach((year) => {
                                        if (bezirk !== 'summe') {
                                            if (Object.prototype.hasOwnProperty.call(data.year.bezirke[bezirk], year)) {
                                                html += '<td>' + data.year.bezirke[bezirk][year] + '</td>';
                                            } else {
                                                html += '<td>0</td>';
                                            }

                                        }
                                    });
                            if (bezirk !== 'summe') {
                                html += '<td>' + counterBezirkObject[bezirk] + '</td>';
                            }
                        }

                        html += '</tr>';
                    }

                });

                html += '</table>';

                data.counter.forEach((counterBezirkObject) => {
                    if(Object.prototype.hasOwnProperty.call(counterBezirkObject, 'summe')){
                        html += '<b>Gesamtsumme: ' + counterBezirkObject.summe + '</b>';
                    }
                });

                $('#viewer-statistics-table').html(html);
            }
        };

        return this.statistics.getStatistics()
            .then(data => {
                // data: json or string with error message
                if (data) {
                    showStatistics(data);
                } else {
                    console.log('no data');
                }
            })
            .catch(error => {
                console.log(error);
            });

    }
}

/**
 * Class for getting statistics from database
 */
class Statistics {
    constructor() {
    }

    /**
     * Get statistics from database
     * @returns {Promise} Promise object returning a JSON with statistics
     */
    getStatistics() {
        return new Promise((resolve, reject) => {
                $.ajax({
                    url: 'php/get-reports-statistics.php',
                    type: 'POST',
                    data: {},
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

// Open-close statistics
$('#viewer-statistics-title').click(function() {
    if ($(this).hasClass('statistics-closed')) {
        $(this).removeClass('statistics-closed');
        $(this).addClass('statistics-open');

        $('#viewer-statistics-title i').removeClass('fa-chevron-right');
        $('#viewer-statistics-title i').addClass('fa-chevron-down');
        $('#viewer-statistics-content').show();
    } else if ($(this).hasClass('statistics-open')) {
        $(this).removeClass('statistics-open');
        $(this).addClass('statistics-closed');

        $('#viewer-statistics-title i').removeClass('fa-chevron-down');
        $('#viewer-statistics-title i').addClass('fa-chevron-right');
        $('#viewer-statistics-content').hide();
    }
});
