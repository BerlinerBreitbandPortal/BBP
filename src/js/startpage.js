/**
 * @module startpage
 */

import $ from 'jquery';
import {startpage} from "./index";
import {config} from "./config";

/**
 * Class for start page
 */
export class Startpage {
    constructor() {
        /**
         * Class name
         * @memeberof Startpage
         * @type {string}
         */
        this.name = 'Startpage';
    }

    /**
     * Get start page content from database
     * @returns {Promise} Promise object returning a JSON with start page content
     */
    GetStartpage() {
        const url = 'php/get-startpage.php';
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
     * Save edited start page content to database
     * @param content {string} - Edited start page content
     * @returns {Promise} Promise object with result after saving edited start page content to database
     */
    SaveStartpage(content) {
        const url = 'php/save-startpage.php';
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
 * Function to trigger get content for start page and implement DOM changes
 * @const
 * @function getStartpage
 */
export const getStartpage = () => {
    $('#startpage-body').html('');
    startpage.GetStartpage()
        .then(data => {
            if (data.length) {
                $('#startpage-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#startpage-edit').click(function() {
                        $('#startpage-edit').hide();
                        $('#startpage-preview').show();
                        $('#startpage-save').show();
                        $('#startpage-cancel').show();

                        $('#startpage-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#startpage-preview').click(function() {
                    $('#startpage-body').summernote('destroy');

                    $('#startpage-preview').hide();
                    $('#startpage-save').hide();
                    $('#startpage-cancel').hide();
                    $('#startpage-stop-preview').show();
                });

                // Stop preview
                $('#startpage-stop-preview').click(function() {
                    $('#startpage-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#startpage-preview').show();
                    $('#startpage-save').show();
                    $('#startpage-cancel').show();
                    $('#startpage-stop-preview').hide();
                });

                // Cancel editing
                $('#startpage-cancel').click(function() {
                    $('#startpage-edit').show();

                    $('#startpage-preview').hide();
                    $('#startpage-save').hide();
                    $('#startpage-cancel').hide();
                    $('#startpage-body').summernote('destroy');
                    getStartpage();
                });

                // Save start page
                $('#startpage-save').click(function() {
                    $('#startpage-body').summernote('destroy');

                    $('#startpage-edit').show();

                    $('#startpage-preview').hide();
                    $('#startpage-save').hide();
                    $('#startpage-cancel').hide();

                    const content = $('#startpage-body').html();

                    startpage.SaveStartpage(content)
                        .then(data => {
                            getStartpage();
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
    if (e.target.hash === '#start') {
        getStartpage();
    }
});