/**
 * @module about
 */

import $ from 'jquery';
import {about} from "./index";
import {config} from "./config";

/**
 * Class for Impressum
 */
export class About {
    constructor() {
        /**
         * Class name
         * @memeberof About
         * @type {string}
         */
        this.name = 'about';
    }

    /**
     * Get Imrpessum content from database
     * @returns {Promise} Promise object returning a JSON with Impressum content
     */
    GetAbout() {
        const url = 'php/get-about.php';
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
     * Save edited Impressum content to database
     * @param content {string} - Edited Impressum content
     * @returns {Promise} Promise object with result after saving edited Impressum content to database
     */
    SaveAbout(content) {
        const url = 'php/save-about.php';
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
 * Function to trigger get content for Impressum and implement DOM changes
 * @const
 * @function getAbout
 */
const getAbout = () => {
    $('#about-body').html('');
    about.GetAbout()
        .then(data => {
            if (data.length) {
                $('#about-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#about-edit').click(function() {
                        $('#about-edit').hide();
                        $('#about-preview').show();
                        $('#about-save').show();
                        $('#about-cancel').show();

                        $('#about-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#about-preview').click(function() {
                    $('#about-body').summernote('destroy');

                    $('#about-preview').hide();
                    $('#about-save').hide();
                    $('#about-cancel').hide();
                    $('#about-stop-preview').show();
                });

                // Stop preview
                $('#about-stop-preview').click(function() {
                    $('#about-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#about-preview').show();
                    $('#about-save').show();
                    $('#about-cancel').show();
                    $('#about-stop-preview').hide();
                });

                // Cancel editing
                $('#about-cancel').click(function() {
                    $('#about-edit').show();

                    $('#about-preview').hide();
                    $('#about-save').hide();
                    $('#about-cancel').hide();
                    $('#about-body').summernote('destroy');
                    getAbout();
                });

                // Save About
                $('#about-save').click(function() {
                    $('#about-body').summernote('destroy');

                    $('#about-edit').show();

                    $('#about-preview').hide();
                    $('#about-save').hide();
                    $('#about-cancel').hide();

                    const content = $('#about-body').html();

                    about.SaveAbout(content)
                        .then(data => {
                            getAbout();
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
    if (e.target.hash === '#impressum') {
        getAbout();
    }
});
