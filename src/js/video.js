/**
 * @module videoSupport
 */

import $ from 'jquery';
import {videoSupport} from "./index";

export class VideoSupport {
    constructor() {
        /**
         * Class name
         * @memeberof VideoSupport
         * @type {string}
         */
        this.name = 'videosupport';
    }

    /**
     * Populates a select with videos from the server
     * @param select {object} - Select DOM element for videos
     */
    PopulateVideoSelectNews(select) {
        const url = 'php/get-video-data-for-select.php';
        $.post({
            url: url,
            type: 'POST',
            success: function (data) {
                data = JSON.parse(data);

                for (let x=0; x < data.length; x++) {
                    // create new option: set value = link
                    let option = document.createElement('option');
                    option.setAttribute('value', data[x]['video_link']);
                    option.innerHTML = data[x]['title'];
                    // append option
                    select.append(option);
                }
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    /**
     * Fills the table in the 'Video'-Tab
     */
    populateVideoTable () {
        const url = 'php/get-video-data.php';

        $.post({
            url : url,
            type:'POST',
            success: function (data) {
                data = JSON.parse(data);

                $('#table-uploaded-videos').html('');

                if (data.length) {
                    $('#table-uploaded-videos').append("<tr><td style='font-weight:bold'> Titel </td><td style='font-weight:bold'> Dateiname </td><td style='font-weight:bold'> Hochgeladen am </td> <td></td></tr>");

                    for (let x = 0; x < data.length; x++) {

                        let videoTitle = data[x]['title'];
                        let videoFileName = data[x]['video_file_renamed'];
                        let videoDate = data[x]['upload_timestamp'];
                        let videoGid = data[x]['gid'];

                        $('#table-uploaded-videos').append("<tr video-gid='"+ videoGid +"'><td> " + videoTitle + "</td><td>" + videoFileName + "</td><td>" +  videoDate + "</td><td><button class='btn btn-primary delete-video-buttons' attr-delete-gid='"+videoGid+"'>Löschen</button></td></tr>");
                    }
                }
            },
            error: function (error) {
                    console.log(error);
                }
        });
    }

    /**
     * Uploads a video file to the server
     * @returns {Promise}
     */
    uploadVideoData () {
        const videoTitle = $('#form-title-video').val();
        const selectedFile = $('#upload-button-video-file')[0].files[0];

        console.log(selectedFile);

        if (!selectedFile) {
            alert('Bitte eine Datei auswählen');
            return;
        }

        const formData = new FormData();
        formData.append('videoTitle', videoTitle);
        formData.append("file", selectedFile);

        $('#ajax-loader').show();

        const url='php/upload-video.php';
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                method: 'POST',
                processData: false,
                cache: false,
                contentType: false,
                data: formData,
                success : function (data) {
                    $('#ajax-loader').hide();

                    if (data.trim() === 'data-submitted') {
                        // Reset form
                        $('#upload-button-video-file').val('');
                        $('#form-title-video').val('');
                        resolve('video uploaded');
                    } else {
                        reject();
                    }
                },
                error: function (error) {
                        $('#ajax-loader').hide();
                        reject(error);
                    }
                });
            });
    }

    /**
     * Remove a video file from server
     * @param deleteButtonGid {string} - Video ID in the DB
     * @returns {Promise}
     */
    DeleteVideoData (deleteButtonGid) {
        return new Promise ((resolve, reject) => {
            const url = 'php/delete-video.php';
            $.ajax({
                method: 'POST',
                url: url,
                data: {
                    deleteButtonGid: deleteButtonGid
                },
                success: function(data) {
                    if (data.trim() === 'dataset-deleted') {
                        resolve(data);
                    } else {
                        reject();
                    }

                },
                error: function (error) {
                    reject(error);
                }
            });
        });
    }

}

$('#button-video-upload').on('click', function () {
    videoSupport.uploadVideoData()
        .then(() => {
            videoSupport.populateVideoTable();
        })
        .catch(() => {
            $('#modal-video-save-failed').show();
        });
});

$(document).on('click', '.delete-video-buttons', function () {  
    const deleteButtonGid = $(this).attr('attr-delete-gid');
    // videoSupport.DeleteVideoData(deleteButtonGid) .then (videoSupport.populateVideoTable);
    videoSupport.DeleteVideoData(deleteButtonGid)
        .then(() => {
            videoSupport.populateVideoTable();
        })
        .catch(() => {
            $('#modal-video-delete-failed').show();
        });
});

// Close save failed modal
$('#modal-video-save-failed-close').click(function() {
    $('#modal-video-save-failed').hide();
});
// Close delete failed modal
$('#modal-video-delete-failed-close').click(function() {
    $('#modal-video-delete-failed').hide();
});