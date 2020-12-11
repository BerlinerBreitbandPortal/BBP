/**
 * @module news
 */

import $ from 'jquery';
import '../css/summernote-lite.css';
import './summernote-lite';
import './summernote-de-DE';
import {config} from './config';
import {news} from "./index";
import { xhr } from 'ol/featureloader';
import {videoSupport} from "./index";

/**
 * Class for news
 */
export class News {
    constructor() {
        /**
         * Class name
         * @memeberof News
         * @type {string}
         */
        this.name = 'News';
    }

    /**
     * Get news content from database
     * @returns {Promise} Promise object returning a JSON with news content
     */
    GetNews() {
        const url = 'php/get-news.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                success: function(data) {
 
                    resolve(data);
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
     * Get news template from database
     * @returns {Promise} Promise object returning a JSON with news template
     */
    GetNewsTemplate() {
        const url = 'php/get-news-template.php';
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
     * Save news to database
     * @param title {string} - New news title
     * @param content {string} - New news content
     * @returns {Promise} Promise object with result after saving new news to database
     */
    SaveNews(content, imageVideo, further_news, modusImageVideo) {
        const url = 'php/save-news.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    content: content,
                    imageVideo : imageVideo,
                    further_news : further_news,
                    modusImageVideo : modusImageVideo

                },
                success: function(data) {
                    if (data === 'OK') {
                        resolve(data);
                    } else {
                        //$('#modal-news-save-failed').show();
                    }
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Save news content to database
     * @param title {string} - Edited news title
     * @param content {string} - Edited news content
     * @param id {number} - Edited news id
     * @returns {Promise} Promise object with result after saving news content to database
     */

    SaveEditedNews(content, id, furtherContent, imageVideo, modusImageVideo) {
        const url = 'php/save-edited-news.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    content: content,
                    id: id,
                    furtherContent: furtherContent,
                    imageVideo: imageVideo,
                    modusImageVideo: modusImageVideo
                },
                success: function(data) {


                    if (data === 'OK') {
                        resolve(data);
                    } else {
                        $('#modal-news-save-failed').show();
                    }
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Delete provider from database
     * @param title {string} - News title
     * @param id {number} - news id
     * @returns {Promise} Promise object with result after deleting news from database
     */
    DeleteNews(id) {
        const url = 'php/delete-news.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    id: id
                },
                success: function(data) {
                    if (data === 'OK') {
                        resolve(data);
                    } else {
                        $('#modal-news-delete-failed').show();
                    }
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Trigger news content and implement DOM changes
     */
    loadNews() {
        $('#news-body').html('');
        $('#startPage-news').html('');
        $('#startPage-news-buttons').html('');

        if (config.status === 'admin') {
            $('#add-news').show();
        }

        this.GetNews()
            .then(data => {
                data = JSON.parse(data);

                let newsCount = 1;

                if (data.length) {
                  data.forEach((n) => {
                        if (n.gid && n.id && n.content) {
                            
                            let html = '<div data-gid="' + n.gid + '" class="row single-news" id="news-' + n.id + '">';

                                    // Image or video div 
                                    html += '<div id="news-'+n.id+'-div-image" class="span6 forum-news-image" attr-image-video="">';

                                    if (config.status === 'admin') {
                                        html += '<p id="imageInfo-' + n.id+'" style="display:none"> Ein Bild für die Nachricht hochladen (dieses Bild ist auch auf der Startseite sichtbar): </p>';
                                        html += '<p id="videoInfo-' + n.id+'" style="display:none"> Ein Video für die Nachricht hochladen (dieses Video ist auch auf der Startseite sichtbar): </p>';    
                                        
                                        html += '<div id="div-video-select-'+n.id+'" style="display:none">';
                                            html += '<label for="video-select-'+n.id+'">';
                                            html += 'Video auswählen: ';
                                            html += '</label>';
                                            html += '<select id="video-select-'+n.id+'">';
                                                html += '<option value=""> Kein Video ausgwählt </option>';
                                            html += '</select>';
                                        html += '</div>';
                                    }

                                        html += '<div id="' + n.id + '-news-image">';
                                        html += '</div>'; 
                                        html += '<div id="' + n.id + '-news-video">'; 
                                            html += '<video id="videoDisplayElement-'+n.id+'" src="" controls style="width:100%; height: auto;"></video>';
                                        html += '</div>';
                                        
                                        html += '<br>';

                                    if (config.status === 'admin') {

                                        html += '<button class="btn btn-custom modus-video-image-buttons-'+n.id+'" id="modus-image-button-'+n.id+'" style="display:none"> Bild-Modus </button>';
                                        html += '<button class="btn btn-custom modus-video-image-buttons-'+n.id+'" id="modus-video-button-'+n.id+'" style="display:none"> Video-Modus </button>';
                                        
                                    }
                                    html += '</div>';

                                    //news
                                    html += '<div id="news-'+n.id +'-div-content" class="span6 forum-news-content">';
                                        //info and title
                                    if (config.status === 'admin') {
                                        html += '<p id="textInfo' + n.id+'"> Titel und Kurztext der Nachricht (Titel und Text sind auch auf der Startseite sichtbar): </p>';
                                    }
                                        html += '<div id="' + n.id + '-news-content">';
                                            html += n.content;
                                        html += '</div>';
                                        html +="<br>";
                                        html +="<br>";

                                    if (config.status === 'admin') {

                                        //further text and link
                                        html += '<p id="furtherTextInfo' + n.id+'"> Weiterer Inhalt: (dieser Inhalt ist nur im Archiv sichtbar) </p>';
                                        html += '<div id="' + n.id + '-further-news-content">';
                                    }
                                        if (n.further_content) {
                                            if (typeof n.further_content!== 'undefined') {
                                                html+= n.further_content;
                                            }
                                        }
                                        html += '</div>';
                                        html +="<br>";

                                    html += '</div>';

                                html += '</div>';
                                html +='<br>';

                                //Buttons
                                html += '<div class = "row">';

                                    html += '<div class = "span6">';
                                    if (config.status === 'admin') {
                                        html += '<button class="btn btn-primary news-edit-buttons news-buttons-delete" id="news-edit-' + n.id + '-delete">Eintrag löschen</button>';
                                        html += '<button class="btn btn-primary news-edit-buttons news-buttons-edit-save" id="news-edit-' + n.id + '-save">Änderungen speichern</button>';
                                        html += '<button class="btn btn-primary news-buttons news-buttons-edit" id="news-edit-' + n.id + '-edit">Editieren</button>';
                                        html += '<button class="btn btn-primary news-edit-buttons news-buttons-preview" id="news-edit-' + n.id + '-preview">Vorschau</button>';
                                        html += '<button class="btn btn-primary news-edit-buttons news-buttons-cancel" id="news-edit-' + n.id + '-cancel">Abbrechen</button>';
                                        html += '<button class="btn btn-primary news-edit-buttons news-buttons-stop-preview" id="news-edit-' + n.id + '-stop-preview" hidden>Vorschau beenden</button>';
                                    }
                                    html += '</div>';

                                    html += '<div class = "span6">';
                                    html += '</div>';

                                html += '</div>';
                                html += '<hr>';
                                
                            // Add HTML Content
                            $('#news-body').append(html);
                            
                            // Show and Hide html according to modus
                            // modus: t (true) -> image , f (false) -> video
                            let modus = n.video_image;

                            
                            // Hide Elements in image-news-div
                            // Hide Edit Elements:
                            $('#imageInfo-' + n.id).hide();
                            $('#videoInfo-' + n.id).hide();
                            $('#div-video-select-'+n.id).hide();
                            $('.modus-video-image-buttons-'+n.id).hide();

                            // Insert Image
                            if (n.news_image) {

                                if (typeof n.news_image !== 'undefined') {

                                    $('#'+n.id+'-news-image').html(n.news_image);

                                }
                            }

                            // Add Videos
                            if (n.news_video) {

                                if (typeof n.news_video !== 'undefined') {

                                   $('#videoDisplayElement-'+n.id).attr('src', n.news_video);
                                }
                            }

                            // image
                            if (modus=='t') {

                                // Hide Video Display
                                $('#'+n.id+'-news-video').hide();

                                // set attribute attr-image-video
                                $('#news-'+n.id+'-div-image').attr('attr-image-video', 'image');
                            }

                            // video
                            else if (modus == 'f') {

                                // Hide Image Display
                                $('#'+n.id+'-news-image').hide();

                                // set attribute attr-image-video
                                $('#news-'+n.id+'-div-image').attr('attr-image-video', 'video');
                            }

                            // Populate video select
                            videoSupport.PopulateVideoSelectNews($('#video-select-'+n.id));

                            $('#video-select-'+n.id).on('change', function () {
                                $('#videoDisplayElement-'+n.id).attr('src', this.value);
                                document.getElementById('videoDisplayElement-'+n.id).setAttribute('src', this.value);

                            });

                            
                            $('#news-edit-' + n.id + '-preview').hide();
                            $('#news-edit-' + n.id + '-cancel').hide();
                            $('#news-edit-' + n.id + '-stop-preview').hide();
                            $('#news-edit-' + n.id + '-save').hide();

                            // Hide Edit Information;
                            $('#textInfo' + n.id).hide();
                            $('#furtherTextInfo' + n.id).hide();

                            if (newsCount < 4) {
                                let htmlStartPage= '<div id = "startNews_'+ newsCount +'" class="span4 startNewsDiv">';
                                    htmlStartPage+= '<div id="startNewsContent_'+newsCount + '">';
                                        htmlStartPage+= '<div class = "newsContent" id="startNewsContent_Image_'+newsCount + '">';
                                        // modus: t (true) -> image , f (false) -> video
                                        if (modus == 't') {
                                            if (n.news_image) {
                                                if (typeof n.news_image !== 'undefined') {
                                                        htmlStartPage+= n.news_image;
                                                    }
                                                }
                                            }

                                        else if (modus =='f') {

                                            if (n.news_video) {

                                                if (typeof n.news_video !== 'undefined') {

                                                    htmlStartPage += '<video id="videoDisplayElement'+n.id+'" controls src="'+ n.news_video +'" style="width:100%; height: auto;">';
                                                    htmlStartPage += '</video>'; 
                                                    }   
                                                }
                                            }
                                        htmlStartPage+= '</div>';
                                        htmlStartPage+= '<div id="startNewsContent_Main_'+newsCount + '">';
                                            htmlStartPage += '<div class = "startNewsContent newsContent" id = "startNewsContent_' + newsCount + '">';
                                                htmlStartPage += n.content;
                                            htmlStartPage += '</div>';
                                        htmlStartPage += '</div>';
                                    htmlStartPage+='</div>';

                                htmlStartPage+='<div id = "startNewsLink_'+ newsCount +'">';
                                htmlStartPage+='<a  data-toggle="tab" role="tab" href="#forum-archive" id="more_button' + n.id +'" ><input class = "btn btn-primary newsButton newsContent" type="button" value="MEHR"></a>';
                                htmlStartPage+='</div>';


                                htmlStartPage += '</div>';
                                
                                // Add HTML Content
                                $('#startPage-news').append(htmlStartPage);

                                newsCount = newsCount + 1; 
                            }

                            if (config.status === 'admin') {
                                // Edit news
                                $('#news-edit-' + n.id + '-edit').on('click', function() {
                                    $('#add-news').hide();
                                    $('.news-buttons-edit').hide();
                                    $('.news-buttons-delete').hide();
                                    $('#news-edit-' + n.id + '-edit').hide();

                                    $('#news-edit-' + n.id + '-preview').show();
                                    $('#news-edit-' + n.id + '-cancel').show();

                                    $('#news-edit-' + n.id + '-save').show();
                                    $('#news-edit-' + n.id + '-delete').hide();

                                    

                                    if (modus == 't') {
                                        
                                        // Show image-paragraph
                                        $('#imageInfo-' + n.id).show();

                                        // Make image editable
                                        $('#' + n.id + '-news-image').summernote({
                                            toolbar: [
                                                ['insert', ['picture']],
                                                ['view', ['codeview']]
                                            ],
                                            lang: 'de-DE' // default: 'en-US'
                                        });

                                        $('#modus-image-button-'+n.id).addClass('button-image-video-activated');


                                    } else if (modus == 'f') {

                                        // Show video-paragraph
                                        $('#videoInfo-' + n.id).show();

                                        $('#div-video-select-'+n.id).show();

                                        $('#modus-video-button-'+n.id).addClass('button-image-video-activated');

                                    }

                                    // Show Image / Video Switch-Buttons
                                    $('.modus-video-image-buttons-'+n.id).show();

                                    //Make Descriptions editable

                                    $('#' + n.id + '-news-content').summernote({
                                        lang: 'de-DE' // default: 'en-US'
                                    });
                                    
                                    $('#' + n.id + '-further-news-content').summernote({
                                        lang: 'de-DE' // default: 'en-US'
                                    });

                                    $('#textInfo' + n.id).show();
                                    $('#furtherTextInfo' + n.id).show();

                                });
                                

                                // Events for Switch-Buttons:

                                // Switch to Image-Mode
                                $('#modus-image-button-'+n.id).on('click', function () {

                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='image') {
                                        return;
                                    }

                                    $('#news-'+n.id+'-div-image').attr('attr-image-video','image');

                                    // Adjust Switch-Button Styling
                                    $('.modus-video-image-buttons-'+n.id).removeClass('button-image-video-activated');
                                    $('#modus-image-button-'+n.id).addClass('button-image-video-activated');

                                    // Show image-paragraph
                                    $('#imageInfo-' + n.id).show();
                                    $('#videoInfo-' + n.id).hide();

                                    // Show Image
                                    $('#'+n.id + '-news-image').show();
                                    // Make image editable
                                    $('#' + n.id + '-news-image').summernote({
                                        toolbar: [
                                            ['insert', ['picture']],
                                            ['view', ['codeview']]
                                        ],
                                        lang: 'de-DE' // default: 'en-US'
                                    });

                                    // Hide Video Select
                                    $('#div-video-select-'+n.id).hide();

                                    // Hide Video Display
                                    $('#'+n.id + '-news-video').hide();

                                  

                                });

                                // Switch to video-mode
                                $('#modus-video-button-'+n.id).on('click', function () {

                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='video') {
                                        return;
                                    }

                                    $('#news-'+n.id+'-div-image').attr('attr-image-video','video');

                                    // Adjust Switch-Button Styling
                                    $('.modus-video-image-buttons-'+n.id).removeClass('button-image-video-activated');
                                    $('#modus-video-button-'+n.id).addClass('button-image-video-activated');

                                    // Show video-paragraph
                                    $('#imageInfo-' + n.id).hide();
                                    $('#videoInfo-' + n.id).show();

                                    // Show Video Select
                                    $('#div-video-select-'+n.id).show();

                                    // Make image editable
                                    $('#' + n.id + '-news-image').summernote('destroy');

                                    // Show Video Display
                                    $('#'+n.id + '-news-video').show();
                                    $('#'+n.id + '-news-image').hide();

                                    
                                });


                                // Start preview news
                                $('#news-edit-' + n.id + '-preview').on('click', function() {
                                    $('#' + n.id + '-news-content').summernote('destroy');
                                    $('#' + n.id + '-news-image').summernote('destroy');
                                    $('#' + n.id + '-further-news-content').summernote('destroy');

                                    $('#news-edit-' + n.id + '-preview').hide();
                                    $('#news-edit-' + n.id + '-stop-preview').show();

                                    $('#news-edit-' + n.id + '-save').hide();
                                    $('#news-edit-' + n.id + '-cancel').hide();
                                    $('#imageInfo' + n.id).hide();
                                    $('#textInfo' + n.id).hide();
                                    $('#furtherTextInfo' + n.id).hide();

                                    // Hide Video and Switch Elements
                                    $('.modus-video-image-buttons-'+n.id).hide();
                                    // Hide Video Select
                                    $('#div-video-select-'+n.id).hide();

                                    // Hide Paragraphs
                                    $('#imageInfo-' + n.id).hide();
                                    $('#videoInfo-' + n.id).hide();

                                    // Hide Video-Image Divs according to attr-image-video
                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='image') {
                                        $('#' + n.id + '-news-video').hide();
                                    }

                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='video') {
                                        $('#' + n.id + '-news-image').hide();
                                    }

                                });

                                // Stop preview news
                                $('#news-edit-' + n.id + '-stop-preview').on('click', function() {
                                    $('#' + n.id + '-news-content').summernote({
                                        lang: 'de-DE' // default: 'en-US'
                                    });
                                    $('#'+ n.id + '-further-news-content').summernote({
                                        lang: 'de-DE' // default: 'en-US'
                                    });

                                    $('#news-edit-' + n.id + '-preview').show();
                                    $('#news-edit-' + n.id + '-stop-preview').hide();

                                    $('#news-edit-' + n.id + '-save').show();
                                    $('#news-edit-' + n.id + '-cancel').show();
                                    
                                    $('#textInfo' + n.id).show();
                                    $('#furtherTextInfo' + n.id).show();

                                    // Show Video and Switch Elements
                                    $('.modus-video-image-buttons-'+n.id).show();

                                    // Show Elements according to current attr-image-video
                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='image') {

                                        // Make Image editable
                                        $('#' + n.id + '-news-image').summernote({
                                            toolbar: [
                                                ['insert', ['picture']],
                                                ['view', ['codeview']]
                                            ],
                                            lang: 'de-DE' // default: 'en-US'
                                        });

                                        // Show Paragraph
                                        $('#imageInfo-' + n.id).show();

                                    } else if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='video') {



                                        // Show Paragraph
                                        $('#videoInfo-' + n.id).show();

                                        // Show Video Select
                                        $('#div-video-select-'+n.id).show();
       
                                    }


                                });

                                // Cancel editing
                                $('#news-edit-' + n.id + '-cancel').click(() => {
                                    $('#add-news').show();

                                    this.loadNews();


                                });

                                // Delete
                                $('#news-edit-' + n.id + '-delete').on('click',() => {
                                    const deleteText = 'Die Nachricht wird endgültig gelöscht!';
                                    const deleteNews =  window.confirm(deleteText);
                                    if (deleteNews == true) {
        
                                        const id = $('#news-' +n.id).attr('data-gid');
                                            
                                    
                                        if (!id) {
                                            this.loadNews();
                                            alert('Die Nachricht konnte nicht gelöscht werden');
                                            return;
                                        }

                                    this.DeleteNews(id)
                                        .then(data => {
                                            $('#modal-news-deleted').show();
                                            this.loadNews();
                                        })
                                        .catch(error => {
                                            $('#modal-news-delete-failed').show();
                                        });

                                    } else {
                                        return;
                                    }
                                });

                                // Save edited news
                                $('#news-edit-' + n.id + '-save').click(() => {
                                
                                    const id = $('#news-' + n.id).attr('data-gid');
                                
                                    if (!id) {
                                        this.loadNews();
                                        alert('Der Eintrag konnte nicht gespeichert werden');
                                        return;
                                    }
                                    //close editors
                                    $('#' + n.id + '-news-content').summernote('destroy');
                                    $('#' + n.id + '-news-image').summernote('destroy');
                                    $('#' + n.id + '-further-news-content').summernote('destroy');

                                    const content = $('#' + n.id + '-news-content').html();
                                    const furtherContent = $('#' + n.id + '-further-news-content').html();
                                    let imageVideo;
                                    let image;

                                    if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='image') {

                                        imageVideo = $('#' + n.id + '-news-image').html();
                                        modus = true;

                                    }

                                    else if ($('#news-'+n.id+'-div-image').attr('attr-image-video')=='video') {

                                        imageVideo = $('#videoDisplayElement-'+n.id).attr('src');
                                        modus = false;


                                    }


                                    //const imageNews = $('#' + n.id + '-news-image').html();

                                    $('#add-news').show();
                                

                                    this.SaveEditedNews(content, id, furtherContent, imageVideo, modus)
                                        .then(data => {
                                            this.loadNews();
                                            $('#modal-news-edited').show();
                                        })
                                        .catch(error => {
                                            $('#modal-news-save-failed').show();
                                        });
                                });
                            }
                        }
                    });

                    if (data.length < 3) {
                        for (let i=0; i < data.length-1; i++) {

                            let htmlStartPage= '<div class="span4">';
                            htmlStartPage += '</div>';
                            $('#startPage-new').append(htmlStartPage);
                        }
                    }
                }

            })
            .catch(error => {
                console.log(error);
            });
    }
}

//Connect Tab 'forum-content' to loadNews
$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    if (e.target.hash === '#forum-content' || e.target.hash === '#forum-archive') {
        news.loadNews();
    }
});

//Connect tab 'start' to loadNews
$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    if (e.target.hash === '#start') {
        news.loadNews();
    }
});

/**
 * Function to add News template to DOM
 * @const
 * @function addNews
 * @param data {object} - News template
 */
const addNewsTemplate = (data) => {
    if (data.id && data.content) {

        $('#add-news').hide();
        $('.news-buttons-edit').hide();
        $('.news-buttons-delete').hide();

        let html = '<div class="row single-news" id="news-' + data.id + '">';
                // Image
                html += '<div id="newsTemplate-'+data.id+'-div-image" class="span6 forum-news-image" attr-image-video="image">';
                    html += '<p id="imageInfoTemplate"> Ein Bild für die Nachricht hochladen (dieses Bild ist auch auf der Startseite sichtbar): </p>';
                        // select for uploaded videos
                        html += '<div id="div-video-select" style="display:none">';
                        html += '<label for="video-select">';
                        html += 'Video auswählen: ';
                        html += '</label>';
                        html += '<select id="video-select">';
                        html += '<option value=""> Kein Video ausgwählt </option>';
                        html += '</select>';
                        html += '</div>';
                        // Load Image Div
                        html += '<div id="' + data.id + '-newsTemplate-image">';
                        html += data.news_image;
                        html += '</div>'; 
                        // Load Video Div
                        html += '<div id="' + data.id + '-newsTemplate-video" style="display:none">';
                        html += '<video id="videoDisplayElement-template" controls width="100%" height="auto">';
                        html += '</video>';
                        html += '</div>';
                        html += '<br>'; 
                        // Switch Buttons
                        html += '<button class="btn btn-primary button-video-image-switch" id="'+data.id + '-newsTemplate-image-button"> Bild-Modus </button>';
                        html += '<button class="btn btn-primary button-video-image-switch" id="'+data.id + '-newsTemplate-video-button"> Video-Modus </button>';

                html += '</div>';
                                        
                // News
                html += '<div id="news-'+data.id +'-div-content" class="span6 forum-news-content">';
                    html += '<p id="textInfoTemplate"> Titel und Kurztext der Nachricht (Titel und Text sind auch auf der Startseite sichtbar): </p>';
                    html += '<div id="' + data.id + '-newsTemplate-content">';
                        html += data.content;
                    html += '</div>';
                    html +="<br>";
                    html +="<br>";
                    // Further text and link
                    html += '<p id="furtherTextInfoTemplate"> Weiterer Inhalt: (dieser Inhalt ist nur im Archiv sichtbar) </p>';
                    html += '<div id="' + data.id + '-further-newsTemplate-content">';
                    html += data.further_content;
                    html += '</div>';
                    html +="<br>";

                html += '</div>';
            html +='<br>';
            html += '</div>';
           

            // Buttons
            html += '<div class = "row" id="news-buttons-' + data.id + '">';

                html += '<div class = "span6">';
                html += '<br>';
                html += '<button class="btn btn-primary news-edit-template-buttons news-buttons-save" id="newsTemplate-edit-save">Speichern</button>';
                html += '<button class="btn btn-primary news-edit-template-buttons news-buttons-preview" id="newsTemplate-edit-preview">Vorschau</button>';
                html += '<button class="btn btn-primary news-edit-template-buttons news-buttons-cancel" id="newsTemplate-edit-cancel">Abbrechen</button>';
                html += '<button class="btn btn-primary news-edit-template-buttons news-buttons-strop-preview" id="newsTemplate-edit-stop-preview" hidden>Vorschau beenden</button>';
                
                html += '</div>';

                html += '<div class = "span6">';
                html += '<br>';
                html += '</div>';
            html += '<hr>';
            html += '</div>';
         
            // Add Template HTML to Page                
            $('#news-body').prepend(html);

            // Fill Video Select
            videoSupport.PopulateVideoSelectNews($('#video-select'));

            // Add Change Event to Select
            $('#video-select').on('change', function () {
                $('#videoDisplayElement-template').attr('src', this.value);
                document.getElementById('videoDisplayElement-template').setAttribute('src', this.value);
            
                

            });
            
            // Show Image Button as activated
            $('#'+data.id +'-newsTemplate-image-button').addClass('button-image-video-activated');
            
            // Image and Video Creation
            // Enable Image Mode
            $('#'+data.id +'-newsTemplate-image-button').on('click', function () {


                if ($('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video')=='image') {

                    return;
                }

                $('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video', 'image');

                // Disable video and enable image
                $('#'+data.id +'-newsTemplate-video-button').removeClass('button-image-video-activated');
                $('#'+data.id +'-newsTemplate-image-button').addClass('button-image-video-activated');

                // Show image div and hide video div
                $('#'+data.id +'-newsTemplate-video').hide();
                $('#'+data.id +'-newsTemplate-image').show();

                // Hide video select
                $('#div-video-select').hide(); 

                $('#imageInfoTemplate').html('Ein Bild für die Nachricht hochladen (dieses Bild ist auch auf der Startseite sichtbar):');

                // set up summernote for image
                $('#' + data.id + '-newsTemplate-image').summernote({
                    toolbar: [
                        ['insert', ['picture']],
                        ['view', ['codeview']]
                    ],
                    lang: 'de-DE' // default: 'en-US'
                });

            });

            // Enable Video Mode
            $('#'+data.id +'-newsTemplate-video-button').on('click', function () {


                if ($('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video')=='video') {

                    return;
                }

                $('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video', 'video');

                // Disable image and enable video
                $('#'+data.id +'-newsTemplate-video-button').addClass('button-image-video-activated');
                $('#'+data.id +'-newsTemplate-image-button').removeClass('button-image-video-activated');

                // Show video div and hide image div
                $('#'+data.id +'-newsTemplate-video').show();

                // Show video select
                $('#div-video-select').show();
                
                // destroy summernote for image
                $('#'+ data.id + '-newsTemplate-image').summernote('destroy');

                // Show video div and hide image div
                $('#'+data.id +'-newsTemplate-video').show();
                $('#'+data.id +'-newsTemplate-image').hide();


                $('#imageInfoTemplate').html('Ein Video für die Nachricht hochladen (dieses Video ist auch auf der Startseite sichtbar):');

            });

            // Hide and Show Buttons
            $('#newsTemplate-edit-preview').show();
            $('#newsTemplate-edit-cancel').show();
            $('#newsTemplate-edit-stop-preview').hide();
            $('#newsTemplate-edit-save').show();

            $('#' + data.id + '-newsTemplate-content').summernote({
                lang: 'de-DE' // default: 'en-US'
            });

            // Template starts in Image-Modus
            $('#' + data.id + '-newsTemplate-image').summernote({
                toolbar: [
                    ['insert', ['picture']],
                    ['view', ['codeview']]
                ],
                lang: 'de-DE' // default: 'en-US'
            });

            $('#' + data.id + '-further-newsTemplate-content').summernote({
                lang: 'de-DE' // default: 'en-US'
            });
            

        // Start preview
        $('#newsTemplate-edit-preview').on('click', function() {
           
            $('#' + data.id + '-newsTemplate-content').summernote('destroy');
            $('#'+ data.id + '-newsTemplate-image').summernote('destroy');
            $('#' + data.id + '-further-newsTemplate-content').summernote('destroy');

            $('#newsTemplate-edit-preview').hide();
            $('#newsTemplate-edit-save').hide();
            $('#newsTemplate-edit-cancel').hide();

            if ($('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video')=='image') {

                $('#'+data.id +'-newsTemplate-video').hide();
                $('#'+data.id +'-newsTemplate-image').show();
             
            }

            else if ($('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video')=='video') {

                $('#'+data.id +'-newsTemplate-video').show();
                $('#'+data.id +'-newsTemplate-image').hide();
             
            }
            
            $('#newsTemplate-edit-stop-preview').show();

            // Hide video select
            $('#div-video-select').hide();

            // Hide Switch Buttons
            $('.button-video-image-switch').hide();

            // Hide Edit Information
            $('#imageInfoTemplate').hide();
            $('#textInfoTemplate').hide();
            $('#furtherTextInfoTemplate').hide();

        });

        // Stop preview
        $('#newsTemplate-edit-stop-preview').on('click', function() {

            let modus = $('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video');

  
            if (modus == 'image') {

                $('#' + data.id + '-newsTemplate-image').summernote({
                    toolbar: [
                        ['insert', ['picture']],
                        ['view', ['codeview']]
                    ],
                    lang: 'de-DE' // default: 'en-US'
                });

        
            }

            else if (modus == 'video') {

                $('#div-video-select').show();

            }

          

            $('#' + data.id + '-newsTemplate-content').summernote({
                lang: 'de-DE' // default: 'en-US'
            });

            $('#' + data.id + '-further-newsTemplate-content').summernote({
                lang: 'de-DE' // default: 'en-US'
            });


            $('.button-video-image-switch').show();

            // Show Edit Information
            $('#imageInfoTemplate').show();
            $('#textInfoTemplate').show();
            $('#furtherTextInfoTemplate').show();

            $('#newsTemplate-edit-stop-preview').hide();
            $('#newsTemplate-edit-preview').show();
            $('#newsTemplate-edit-save').show();
            $('#newsTemplate-edit-cancel').show();
        });

        // Cancel editing
        $('#newsTemplate-edit-cancel').on ('click', function() {

            // Remove Template and all html content 
            $('#news-' + data.id).remove();
            $('#news-buttons-' + data.id).remove();

            // Show Add Button 
            $('#add-news').show();

            // Show edit and delete buttons
            $('.news-buttons-edit').show();
            $('.news-buttons-delete').show();
        });

        // Save News
        $('#newsTemplate-edit-save').on ('click', function() {

            $('#'+ data.id + '-newsTemplate-content').summernote('destroy');
            $('#'+ data.id + '-newsTemplate-image').summernote('destroy');
            $('#' + data.id + '-further-newsTemplate-content').summernote('destroy');

            const content = $('#'+ data.id + '-newsTemplate-content').html();
            const further_news = $('#' + data.id + '-further-newsTemplate-content').html();

            let modus = $('#newsTemplate-'+data.id+'-div-image').attr('attr-image-video');

            let modusImageVideo;
            let imageVideo;

            if (modus == 'image') {

                modusImageVideo = true;
                imageVideo = $('#'+ data.id + '-newsTemplate-image').html();

            }

            else if (modus == 'video') {

                modusImageVideo = false;
                imageVideo = $('#videoDisplayElement-template').attr('src');

            }


            $('#news-' + data.id).remove();
            $('#news-buttons-' + data.id).remove();

            $('#add-news').show();
            $('.news-buttons-edit').show();
            $('.news-buttons-delete').show();

            news.SaveNews(content, imageVideo, further_news, modusImageVideo)
                .then(data => {
                    news.loadNews();
                    $('#modal-news-saved').show();
                })
                .catch(error => {
                    $('#modal-news-save-failed').show();
                });
        });
    }
};

// Only admins are allowed to edit news
if (config.status === 'admin') {
    $('#add-news').on('click', function(evt) {

        // Prevent news from closing, if they are already open
        if ($('#news-body').hasClass('show')) {
            evt.stopPropagation();
        }

        news.GetNewsTemplate()
            .then(data => {
                addNewsTemplate(data);
            })
            .catch(error => {
                console.log(error);
            });
    });
}

// Close saved modal
$('#modal-news-saved-close').click(function() {
    $('#modal-news-saved').hide();

});
// Close edited modal
$('#modal-news-edited-close').click(function() {
    $('#modal-news-edited').hide();
});
// Close deleted modal
$('#modal-news-deleted-close').click(function() {
    $('#modal-news-deleted').hide();
});
// Close save failed modal
$('#modal-news-save-failed-close').click(function() {
    $('#modal-news-save-failed').hide();
});
// Close delete failed modal
$('#modal-news-delete-failed-close').click(function() {
    $('#modal-news-delete-failed').hide();
});

