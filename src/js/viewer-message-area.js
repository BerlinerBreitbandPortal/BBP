/**
 * @module viewer-message-area
 */

import $ from 'jquery';

/**
 * Class for viewer message area
 */
export class ViewerMessageArea {
    constructor(config) {
        /**
         * Class name
         * @memeberof ViewerMessageArea
         * @type {string}
         */
        this.name = 'ViewerMessageArea';

        this.config = config;
    }

    /**
     * Get viewer message area from database
     * @returns {Promise} Promise object returning a JSON with viewer message area
     */
    GetViewerMessageArea() {
        const url = 'php/get-viewer-message-area.php';
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
     * Save edited viewer message area content to database
     * @param content {string} - Edited viewer message area content
     * @returns {Promise} Promise object with result after saving edited viewer message area content to database
     */
    saveViewerMessageArea(content) {
        const url = 'php/save-viewer-message-area.php';
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

    activateGetViewerMessageArea() {
        $('#viewer-message-area-body').html('');
        this.GetViewerMessageArea()
            .then(data => {
                if (data.length) {
                    $('#viewer-message-area-body').html(data);

                    if (this.config.status === 'admin') {
                        // Edit
                        $('#viewer-message-area-edit').click(() => {
                            $('#viewer-message-area-edit').hide();
                            $('#viewer-message-area-preview').show();
                            $('#viewer-message-area-save').show();
                            $('#viewer-message-area-cancel').show();

                            $('#viewer-message-area-body').summernote({
                                lang: 'de-DE' // default: 'en-US'
                            });
                        });
                    }

                    // Start preview
                    $('#viewer-message-area-preview').click(() => {
                        $('#viewer-message-area-body').summernote('destroy');

                        $('#viewer-message-area-preview').hide();
                        $('#viewer-message-area-save').hide();
                        $('#viewer-message-area-cancel').hide();
                        $('#viewer-message-area-stop-preview').show();
                    });

                    // Stop preview
                    $('#viewer-message-area-stop-preview').click(() => {
                        $('#viewer-message-area-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });

                        $('#viewer-message-area-preview').show();
                        $('#viewer-message-area-save').show();
                        $('#viewer-message-area-cancel').show();
                        $('#viewer-message-area-stop-preview').hide();
                    });

                    // Cancel editing
                    $('#viewer-message-area-cancel').click(() => {
                        $('#viewer-message-area-edit').show();

                        $('#viewer-message-area-preview').hide();
                        $('#viewer-message-area-save').hide();
                        $('#viewer-message-area-cancel').hide();
                        $('#viewer-message-area-body').summernote('destroy');
                        this.activateGetViewerMessageArea();
                    });

                    // Save viewer message area
                    $('#viewer-message-area-save').click(() => {
                        $('#viewer-message-area-body').summernote('destroy');

                        $('#viewer-message-area-edit').show();

                        $('#viewer-message-area-preview').hide();
                        $('#viewer-message-area-save').hide();
                        $('#viewer-message-area-cancel').hide();

                        const content = $('#viewer-message-area-body').html();

                        this.saveViewerMessageArea(content)
                            .then(data => {
                                this.activateGetViewerMessageArea();
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
