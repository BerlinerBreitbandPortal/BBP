/**
 * @module forum-startpage
 */

import $ from 'jquery';
import {forumStartpage} from "./index";
import {config} from "./config";


/**
 * Class for forum-startpage
 */
export class ForumStartpage {
    constructor() {
        /**
         * Class name
         * @memeberof forumStartpage
         * @type {string}
         */
        this.name = 'ForumStartpage';
    }

    /**
     * Get forum-startpage content from database
     * @returns {Promise} Promise object returning a JSON with start page content
     */
    GetForumStartpage() {
        const url = 'php/get-forum-startpage.php';
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
     * Save edited forum-startpage content to database
     * @param content {string} - Edited forum-startpage content
     * @returns {Promise} Promise object with result after saving edited forum-startpage content to database
     */
    SaveForumStartpage(content) {
        const url = 'php/save-forum-startpage.php';
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
                        $('#modal-forum-startpage-company-save-failed').show();
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
 * Function to trigger get content for forum-startpage and implement DOM changes
 * @const
 * @function getForumStartpage
 */
export const getForumStartpage = () => {
    $('#btk_forum_editable').html('');
    forumStartpage.GetForumStartpage()
        .then(data => {
            $('#btk_forum_editable').html(data);

            if (config.status === 'admin') {
                // Edit
                $('#forum-startpage-edit').click(function() {
                    $('#forum-startpage-edit').hide();
                    $('#forum-startpage-preview').show();
                    $('#forum-startpage-save').show();
                    $('#forum-startpage-cancel').show();

                    $('#btk_forum_editable').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });
                });
            }

            // Start preview
            $('#forum-startpage-preview').click(function() {
                $('#btk_forum_editable').summernote('destroy');

                $('#forum-startpage-preview').hide();
                $('#forum-startpage-save').hide();
                $('#forum-startpage-cancel').hide();
                $('#forum-startpage-stop-preview').show();
            });

            // Stop preview
            $('#forum-startpage-stop-preview').click(function() {
                $('#btk_forum_editable').summernote({
                    lang: 'de-DE' // default: 'en-US'
                });

                $('#forum-startpage-preview').show();
                $('#forum-startpage-save').show();
                $('#forum-startpage-cancel').show();
                $('#forum-startpage-stop-preview').hide();
            });

            // Cancel editing
            $('#forum-startpage-cancel').click(function() {
                $('#forum-startpage-edit').show();

                $('#forum-startpage-preview').hide();
                $('#forum-startpage-save').hide();
                $('#forum-startpage-cancel').hide();
                $('#btk_forum_editable').summernote('destroy');
                getForumStartpage();
            });

            // Save start page
            $('#forum-startpage-save').click(function() {
                $('#btk_forum_editable').summernote('destroy');

                $('#forum-startpage-edit').show();

                $('#forum-startpage-preview').hide();
                $('#forum-startpage-save').hide();
                $('#forum-startpage-cancel').hide();

                const content = $('#btk_forum_editable').html();

                forumStartpage.SaveForumStartpage(content)
                    .then(data => {
                        $('#modal-forum-company-edited').show();
                        getForumStartpage();
                    })
                    .catch(error => {
                        $('#modal-forum-company-save-failed').show();
                    });
            });
        });
};

$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    if (e.target.hash === '#forum') {
        getForumStartpage();
    }
});