/**
 * @module faq
 */

import $ from 'jquery';
import {faq} from "./index";
import {config} from "./config";


/**
 * Class for FAQ page
 */
export class Faq {
    constructor() {
        /**
         * Class name
         * @memeberof Faq
         * @type {string}
         */
        this.name = 'faq';
    }

    /**
     * Get FAQ content from database
     * @returns {Promise} Promise object returning a JSON with FAQ content
     */
    GetFaq() {
        const url = 'php/get-faq.php';
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
     * Save edited FAQ content to database
     * @param content {string} - Edited FAQ content
     * @returns {Promise} Promise object with result after saving edited FAQ content to database
     */
    SaveFaq(content) {
        const url = 'php/save-faq.php';
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
 * Function to trigger get content for FAQ and implement DOM changes
 * @const
 * @function getFaq
 */
const getFaq = () => {
    $('#faq-body').html('');
    faq.GetFaq()
        .then(data => {
            if (data.length) {
                $('#faq-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#faq-edit').click(function() {
                        $('#faq-edit').hide();
                        $('#faq-preview').show();
                        $('#faq-save').show();
                        $('#faq-cancel').show();

                        $('#faq-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#faq-preview').click(function() {
                    $('#faq-body').summernote('destroy');

                    $('#faq-preview').hide();
                    $('#faq-save').hide();
                    $('#faq-cancel').hide();
                    $('#faq-stop-preview').show();
                });

                // Stop preview
                $('#faq-stop-preview').click(function() {
                    $('#faq-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#faq-preview').show();
                    $('#faq-save').show();
                    $('#faq-cancel').show();
                    $('#faq-stop-preview').hide();
                });

                // Cancel editing
                $('#faq-cancel').click(function() {
                    $('#faq-edit').show();

                    $('#faq-preview').hide();
                    $('#faq-save').hide();
                    $('#faq-cancel').hide();
                    $('#faq-body').summernote('destroy');
                    getFaq();
                });

                // Save FAQ
                $('#faq-save').click(function() {
                    $('#faq-body').summernote('destroy');

                    $('#faq-edit').show();

                    $('#faq-preview').hide();
                    $('#faq-save').hide();
                    $('#faq-cancel').hide();

                    const content = $('#faq-body').html();

                    faq.SaveFaq(content)
                        .then(data => {
                            getFaq();
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
        getFaq();
    }
});

$('.help-link').on('click', getFaq);

//focus forum functions
const focusFAQ = function () {
    
    let scrollPos =  $("#help-faq").offset().top;
    console.log(scrollPos);
    $(window).scrollTop(scrollPos);
};

$('#help-link-faq').on('click', focusFAQ);
