/**
 * @module glossar
 */

import $ from 'jquery';
import {glossar} from "./index";
import {config} from "./config";

/**
 * Class for FAQ page
 */
export class Glossar {
    constructor() {
        /**
         * Class name
         * @memeberof Glossar
         * @type {string}
         */
        this.name = 'glossar';
    }

    /**
     * Get Glossar content from database
     * @returns {Promise} Promise object returning a JSON with FAQ content
     */
    GetGlossar() {
        const url = 'php/get-glossar.php';
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
     * Save edited Glossar content to database
     * @param content {string} - Edited Glossar content
     * @returns {Promise} Promise object with result after saving edited Glossar content to database
     */
    SaveGlossar(content) {
        const url = 'php/save-glossar.php';
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
                        //ToDo
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
 * Function to trigger get content for Glossar and implement DOM changes
 * @const
 * @function getGlossar
 */
const getGlossar = () => {
    $('#glossar-body').html('');
    glossar.GetGlossar()
        .then(data => {
            if (data.length) {
                $('#glossar-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#glossar-edit').on('click', function() {
                        $('#glossar-edit').hide();
                        $('#glossar-preview').show();
                        $('#glossar-save').show();
                        $('#glossar-cancel').show();

                        $('#glossar-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#glossar-preview').click(function() {
                    $('#glossar-body').summernote('destroy');

                    $('#glossar-preview').hide();
                    $('#glossar-save').hide();
                    $('#glossar-cancel').hide();
                    $('#glossar-stop-preview').show();
                });

                // Stop preview
                $('#glossar-stop-preview').click(function() {
                    $('#glossar-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#glossar-preview').show();
                    $('#glossar-save').show();
                    $('#glossar-cancel').show();
                    $('#glossar-stop-preview').hide();
                });

                // Cancel editing
                $('#glossar-cancel').click(function() {
                    $('#glossar-edit').show();

                    $('#glossar-preview').hide();
                    $('#glossar-save').hide();
                    $('#glossar-cancel').hide();
                    $('#glossar-body').summernote('destroy');
                    getGlossar();
                });

                // Save glossar
                $('#glossar-save').click(function() {
                    $('#glossar-body').summernote('destroy');

                    $('#glossar-edit').show();

                    $('#glossar-preview').hide();
                    $('#glossar-save').hide();
                    $('#glossar-cancel').hide();

                    const content = $('#glossar-body').html();

                    glossar.SaveGlossar(content)
                        .then(data => {
                            getGlossar();
                            //ToDo: Modal?
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
    if (e.target.hash === '#help') {
        getGlossar();
    }
});

$('.help-link').on('click', getGlossar);

//focus forum functions
const focusGlossar = function () {
    
    let scrollPos =  $("#help-glossar").offset().top;
    $(window).scrollTop(scrollPos);
};

$('#help-link-glossar').on('click', focusGlossar);
