/**
 * @module bedarfsmeldungen-text
 */

import $ from 'jquery';

/**
 * Class for bedarfsmeldungen text
 */
export class BedarfsmeldungenText {
    constructor(config) {
        /**
         * Class name
         * @memeberof BedarfsmeldungenText
         * @type {string}
         */
        this.name = 'BedarfsmeldungenText';

        this.config = config;
    }

    /**
     * Get bedarfsmeldungen text from database
     * @returns {Promise} Promise object returning a JSON with bedarfsmeldungen text
     */
    GetBedarfsmeldungenText() {
        const url = 'php/get-bedarfsmeldungen-text.php';
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
     * Save edited bedarfsmeldungen text content to database
     * @param content {string} - Edited bedarfsmeldungen text content
     * @returns {Promise} Promise object with result after saving edited bedarfsmeldungen text content to database
     */
    saveBedarfsmeldungenText(content) {
        const url = 'php/save-bedarfsmeldungen-text.php';
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

    activateGetBedarfsmeldungenText() {
        $('#bedarfsmeldungen-text-body').html('');
        this.GetBedarfsmeldungenText()
            .then(data => {
                if (data.length) {
                    $('#bedarfsmeldungen-text-body').html(data);

                    if (this.config.status === 'admin') {
                        // Edit
                        $('#bedarfsmeldungen-text-edit').click(() => {
                            $('#bedarfsmeldungen-text-edit').hide();
                            $('#bedarfsmeldungen-text-preview').show();
                            $('#bedarfsmeldungen-text-save').show();
                            $('#bedarfsmeldungen-text-cancel').show();

                            $('#bedarfsmeldungen-text-body').summernote({
                                lang: 'de-DE' // default: 'en-US'
                            });
                        });
                    }

                    // Start preview
                    $('#bedarfsmeldungen-text-preview').click(() => {
                        $('#bedarfsmeldungen-text-body').summernote('destroy');

                        $('#bedarfsmeldungen-text-preview').hide();
                        $('#bedarfsmeldungen-text-save').hide();
                        $('#bedarfsmeldungen-text-cancel').hide();
                        $('#bedarfsmeldungen-text-stop-preview').show();
                    });

                    // Stop preview
                    $('#bedarfsmeldungen-text-stop-preview').click(() => {
                        $('#bedarfsmeldungen-text-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });

                        $('#bedarfsmeldungen-text-preview').show();
                        $('#bedarfsmeldungen-text-save').show();
                        $('#bedarfsmeldungen-text-cancel').show();
                        $('#bedarfsmeldungen-text-stop-preview').hide();
                    });

                    // Cancel editing
                    $('#bedarfsmeldungen-text-cancel').click(() => {
                        $('#bedarfsmeldungen-text-edit').show();

                        $('#bedarfsmeldungen-text-preview').hide();
                        $('#bedarfsmeldungen-text-save').hide();
                        $('#bedarfsmeldungen-text-cancel').hide();
                        $('#bedarfsmeldungen-text-body').summernote('destroy');
                        this.activateGetBedarfsmeldungenText();
                    });

                    // Save bedarfsmeldungen text
                    $('#bedarfsmeldungen-text-save').click(() => {
                        $('#bedarfsmeldungen-text-body').summernote('destroy');

                        $('#bedarfsmeldungen-text-edit').show();

                        $('#bedarfsmeldungen-text-preview').hide();
                        $('#bedarfsmeldungen-text-save').hide();
                        $('#bedarfsmeldungen-text-cancel').hide();

                        const content = $('#bedarfsmeldungen-text-body').html();

                        this.saveBedarfsmeldungenText(content)
                            .then(data => {
                                this.activateGetBedarfsmeldungenText();
                                $('#modal-forum-company-edited').show();
                            })
                            .catch(error => {
                                $('#modal-forum-company-save-failed').show();
                            });
                    });

                }
            });
    }
}
