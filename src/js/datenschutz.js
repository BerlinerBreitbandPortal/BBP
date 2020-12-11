/**
 * @module datenschutz
 */

import $ from 'jquery';
import {datenschutz} from "./index";
import {config} from "./config";

/**
 * Class for privacy protection page
 */
export class Datenschutz {
    constructor() {
        /**
         * Class name
         * @memeberof Datenschutz
         * @type {string}
         */
        this.name = 'datenschutz';
    }

    /**
     * Get privacy protection content from database
     * @returns {Promise} Promise object returning a JSON with privacy protection content
     */
    GetDatenschutz() {
        const url = 'php/get-datenschutz.php';
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

    /**
     * Save edited privacy protection content to database
     * @param content {string} - Edited privacy protection content
     * @returns {Promise} Promise object with result after saving edited privacy protection content to database
     */
    SaveDatenschutz(content) {
        const url = 'php/save-datenschutz.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    content: content
                },
                success: function(data) {
                    if (data === 'OK') {
                        resolve(data);
                    } else {
                        $('#modal-forum-company-save-failed').show();
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
 * Function to trigger get content for privacy protection and implement DOM changes
 * @const
 * @function getDatenschutz
 */
const getDatenschutz = () => {
    $('#datenschutz-body').html('');
    datenschutz.GetDatenschutz()
        .then(data => {
            if (data.length) {
                $('#datenschutz-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#datenschutz-edit').click(function() {
                        $('#datenschutz-edit').hide();
                        $('#datenschutz-preview').show();
                        $('#datenschutz-save').show();
                        $('#datenschutz-cancel').show();

                        $('#datenschutz-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#datenschutz-preview').click(function() {
                    $('#datenschutz-body').summernote('destroy');

                    $('#datenschutz-preview').hide();
                    $('#datenschutz-save').hide();
                    $('#datenschutz-cancel').hide();
                    $('#datenschutz-stop-preview').show();
                });

                // Stop preview
                $('#datenschutz-stop-preview').click(function() {
                    $('#datenschutz-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#datenschutz-preview').show();
                    $('#datenschutz-save').show();
                    $('#datenschutz-cancel').show();
                    $('#datenschutz-stop-preview').hide();
                });

                // Cancel editing
                $('#datenschutz-cancel').click(function() {
                    $('#datenschutz-edit').show();

                    $('#datenschutz-preview').hide();
                    $('#datenschutz-save').hide();
                    $('#datenschutz-cancel').hide();
                    $('#datenschutz-body').summernote('destroy');
                    getDatenschutz();
                });

                // Save Datenschutz
                $('#datenschutz-save').click(function() {
                    $('#datenschutz-body').summernote('destroy');

                    $('#datenschutz-edit').show();

                    $('#datenschutz-preview').hide();
                    $('#datenschutz-save').hide();
                    $('#datenschutz-cancel').hide();

                    const content = $('#datenschutz-body').html();

                    datenschutz.SaveDatenschutz(content)
                        .then(data => {
                            getDatenschutz();
                            $('#modal-forum-company-edited').show();
                        })
                        .catch(error => {
                            $('#modal-forum-company-save-failed').show();
                        });
                });

            }
        });
};

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#datenschutz') {
        getDatenschutz();
    }
});
