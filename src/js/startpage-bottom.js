/**
 * @module startpage-bottom
 */

import $ from 'jquery';
import {startpageBottom} from "./index";
import {config} from "./config";

/**
 * Class for start page (bottom area)
 */
export class StartpageBottom {
    constructor() {
        /**
         * Class name
         * @memeberof StartpageBottom
         * @type {string}
         */
        this.name = 'StartpageBottom';
    }

    /**
     * Get start page content (bottom) from database
     * @returns {Promise} Promise object returning a JSON with start page content (bottom)
     */
    GetStartpageBottom() {
        const url = 'php/get-startpage-bottom.php';
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
     * Save edited start page content (bottom) to database
     * @param content {string} - Edited start page content (bottom)
     * @returns {Promise} Promise object with result after saving edited start page content (bottom) to database
     */
    SaveStartpageBottom(content) {
        const url = 'php/save-startpage-bottom.php';
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
 * Function to trigger get content for start page (bottom) and implement DOM changes
 * @const
 * @function getStartpageBottom
 */
export const getStartpageBottom = () => {
    $('#startpage-bottom-body').html('');
    startpageBottom.GetStartpageBottom()
        .then(data => {
            if (data.length) {
                $('#startpage-bottom-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#startpage-bottom-edit').click(function() {
                        $('#startpage-bottom-edit').hide();
                        $('#startpage-bottom-preview').show();
                        $('#startpage-bottom-save').show();
                        $('#startpage-bottom-cancel').show();

                        $('#startpage-bottom-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#startpage-bottom-preview').click(function() {
                    $('#startpage-bottom-body').summernote('destroy');

                    $('#startpage-bottom-preview').hide();
                    $('#startpage-bottom-save').hide();
                    $('#startpage-bottom-cancel').hide();
                    $('#startpage-bottom-stop-preview').show();
                });

                // Stop preview
                $('#startpage-bottom-stop-preview').click(function() {
                    $('#startpage-bottom-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#startpage-bottom-preview').show();
                    $('#startpage-bottom-save').show();
                    $('#startpage-bottom-cancel').show();
                    $('#startpage-bottom-stop-preview').hide();
                });

                // Cancel editing
                $('#startpage-bottom-cancel').click(function() {
                    $('#startpage-bottom-edit').show();

                    $('#startpage-bottom-preview').hide();
                    $('#startpage-bottom-save').hide();
                    $('#startpage-bottom-cancel').hide();
                    $('#startpage-bottom-body').summernote('destroy');
                    getStartpageBottom();
                });

                // Save start page
                $('#startpage-bottom-save').click(function() {
                    $('#startpage-bottom-body').summernote('destroy');

                    $('#startpage-bottom-edit').show();

                    $('#startpage-bottom-preview').hide();
                    $('#startpage-bottom-save').hide();
                    $('#startpage-bottom-cancel').hide();

                    const content = $('#startpage-bottom-body').html();

                    startpageBottom.SaveStartpageBottom(content)
                        .then(data => {
                            getStartpageBottom();
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
        getStartpageBottom();
    }
});

