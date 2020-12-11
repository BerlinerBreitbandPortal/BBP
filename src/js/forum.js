/**
 * @module forum
 */

import $ from 'jquery';
import '../css/summernote-lite.css';
import './summernote-lite';
import './summernote-de-DE';
import {config} from './config';
import {forum} from "./index";

// Open-close menus
$('#forum-content .collapse').on('shown.bs.collapse', function () {
    $($(this).prev().children('i')[0]).removeClass('fa-chevron-right');
    $($(this).prev().children('i')[0]).addClass('fa-chevron-down');
});

$('#forum-content .collapse').on('hidden.bs.collapse', function () {
    $($(this).prev().children('i')[0]).removeClass('fa-chevron-down');
    $($(this).prev().children('i')[0]).addClass('fa-chevron-right');
});

/**
 * Class for forum page
 */
export class Forum {
    constructor() {
        /**
         * Class name
         * @memeberof Forum
         * @type {string}
         */
        this.name = 'Forum';
    }

    /**
     * Get providers content from database
     * @returns {Promise} Promise object returning a JSON with providers content
     */
    GetProviders() {
        const url = 'php/forum-get-providers.php';
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
     * Get providers template from database
     * @returns {Promise} Promise object returning a JSON with providers template
     */
    GetTemplate() {
        const url = 'php/forum-provider-get-template.php';
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
     * Save new provider to database
     * @param name {string} - New provider name
     * @param table {string} - New provider content
     * @returns {Promise} Promise object with result after saving new provider to database
     */
    SaveNewProvider(name, table) {
        const url = 'php/forum-save-new-provider.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    name: name,
                    table: table
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

    /**
     * Save edited provider content to database
     * @param name {string} - Edited provider name
     * @param table {string} - Edited provider content
     * @param id {number} - Edited provider id
     * @returns {Promise} Promise object with result after saving edited provider content to database
     */
    SaveEditedProvider(name, table, id) {
        const url = 'php/forum-save-edited-provider.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    name: name,
                    table: table,
                    id: id
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

    /**
     * Delete provider from database
     * @param name {string} - Provider name
     * @param id {number} - provider id
     * @returns {Promise} Promise object with result after deleting provider from database
     */
    DeleteProvider(name, id) {
        const url = 'php/forum-delete-provider.php';
        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    name: name,
                    id: id
                },
                success: function(data) {
                    if (data === 'OK') {
                        resolve(data);
                    } else {
                        $('#modal-forum-company-delete-failed').show();
                    }
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Get technology content from database
     * @returns {Promise} Promise object returning a JSON with technology content
     */
    GetTechnology() {
        const url = 'php/forum-get-technology.php';
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
     * Save edited technology content to database
     * @param content {string} - Edited technology content
     * @returns {Promise} Promise object with result after saving edited technology content to database
     */
    SaveTechnology(content) {
        const url = 'php/forum-save-technology.php';
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

    /**
     * Get supply content from database
     * @returns {Promise} Promise object returning a JSON with supply content
     */
    GetSupply() {
        const url = 'php/forum-get-supply.php';
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
     * Save edited supply content to database
     * @param content {string} - Edited supply content
     * @returns {Promise} Promise object with result after saving edited supply content to database
     */
    SaveSupply(content) {
        const url = 'php/forum-save-supply.php';
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

    /**
     * Get infos content from database
     * @returns {Promise} Promise object returning a JSON with infos content
     */
    GetInfos() {
        const url = 'php/forum-get-infos.php';
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
     * Save edited infos content to database
     * @param content {string} - Edited infos content
     * @returns {Promise} Promise object with result after saving edited infos content to database
     */
    SaveInfos(content) {
        const url = 'php/forum-save-infos.php';
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

    /**
     * Get IHK content from database
     * @returns {Promise} Promise object returning a JSON with IHK content
     */
    GetIhk() {
        const url = 'php/forum-get-ihk.php';
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
     * Save edited IHK content to database
     * @param content {string} - Edited IHK content
     * @returns {Promise} Promise object with result after saving edited IHK content to database
     */
    SaveIhk(content) {
        const url = 'php/forum-save-ihk.php';
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
 * Function to trigger get providers content and implement DOM changes
 * @const
 * @function loadProviders
 */
const loadProviders = () => {
    $('#provider-body').html('');
    forum.GetProviders()
        .then(data => {
            data = JSON.parse(data);
            if (data.length) {
                data.forEach((provider) => {
                    if (provider.gid && provider.id && provider.table && provider.company) {
                        let html = '<div data-gid="' + provider.gid + '" class="single-provider" id="' + provider.id + '">';
                        html += '<div id="' + provider.id + '-div-name" class="single-provider-div-name">';
                        html += 'Name des Telekommunikationsunternehmens: <input id="' + provider.id + '-name" class="single-provider-name" type="text" value="' + provider.company + '">';
                        html += '</div>';
                        html += '<div id="' + provider.id + '-content">';
                        html += provider.table;
                        html += '</div>';
                        html += '<br>';
                        if (config.status === 'admin') {
                            html += '<div id="forum-edit-' + provider.id + '-div">';
                            html += '<br>';
                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-edit" id="forum-edit-' + provider.id + '-edit">Editieren</button>';
                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-delete" id="forum-edit-' + provider.id + '-delete">Löschen</button>';

                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-preview" id="forum-edit-' + provider.id + '-preview">Vorschau</button>';
                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-save" id="forum-edit-' + provider.id + '-save">Speichern</button>';
                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-cancel" id="forum-edit-' + provider.id + '-cancel">Abbrechen</button>';
                            html += '<button class="btn btn-primary forum-edit-template-buttons forum-buttons-stop-preview" id="forum-edit-' + provider.id + '-stop-preview" hidden>Vorschau beenden</button>';
                            html += '<hr>';
                            html += '</div>';
                        }
                        $('#provider-body').append(html);

                        $('#forum-edit-' + provider.id + '-preview').hide();
                        $('#forum-edit-' + provider.id + '-save').hide();
                        $('#forum-edit-' + provider.id + '-cancel').hide();
                        $('#forum-edit-' + provider.id + '-stop-preview').hide();

                        if (config.status === 'admin') {
                            // Edit
                            $('#forum-edit-' + provider.id + '-edit').click(function() {
                                $('#forum-add-provider').hide();
                                $('.forum-buttons-edit').hide();
                                $('.forum-buttons-delete').hide();

                                $('#' + provider.id + '-div-name').show();
                                $('#forum-edit-' + provider.id + '-edit').hide();
                                $('#forum-edit-' + provider.id + '-delete').hide();

                                $('#forum-edit-' + provider.id + '-preview').show();
                                $('#forum-edit-' + provider.id + '-save').show();
                                $('#forum-edit-' + provider.id + '-cancel').show();

                                $('#' + provider.id + '-content').summernote({
                                    lang: 'de-DE' // default: 'en-US'
                                });
                            });

                            // Start preview
                            $('#forum-edit-' + provider.id + '-preview').click(function() {
                                $('#' + provider.id + '-content').summernote('destroy');

                                $('#' + provider.id + '-div-name').hide();
                                $('#forum-edit-' + provider.id + '-preview').hide();
                                $('#forum-edit-' + provider.id + '-save').hide();
                                $('#forum-edit-' + provider.id + '-cancel').hide();
                                $('#forum-edit-' + provider.id + '-stop-preview').show();
                            });

                            // Stop preview
                            $('#forum-edit-' + provider.id + '-stop-preview').click(function() {
                                $('#' + provider.id + '-content').summernote({
                                    lang: 'de-DE' // default: 'en-US'
                                });

                                $('#' + provider.id + '-div-name').show();
                                $('#forum-edit-' + provider.id + '-preview').show();
                                $('#forum-edit-' + provider.id + '-save').show();
                                $('#forum-edit-' + provider.id + '-cancel').show();
                                $('#forum-edit-' + provider.id + '-stop-preview').hide();
                            });

                            // Cancel editing
                            $('#forum-edit-' + provider.id + '-cancel').click(function() {
                                $('#forum-add-provider').show();
                                loadProviders();
                            });

                            // Delete
                            $('#forum-edit-' + provider.id + '-delete').click(function() {
                                const deleteText = 'Der Anbieter "' + $('#' + provider.id + '-name').val() + '" wird endgültig gelöscht!';
                                const deleteProvider =  window.confirm(deleteText);
                                if (deleteProvider == true) {
                                    const id = $('#' + provider.id).attr('data-gid');
                                    const name = $('#' + provider.id + '-name').val();
                                    if (!id || !name) {
                                        loadProviders();
                                        alert('Der Anbieter konnte nicht gelöscht werden');
                                        return;
                                    }

                                    forum.DeleteProvider(name, id)
                                        .then(data => {
                                            $('#modal-forum-company-deleted').show();
                                            loadProviders();
                                        })
                                        .catch(error => {
                                            $('#modal-forum-company-delete-failed').show();
                                        });

                                } else {
                                    return;
                                }
                            });

                            // Save edited provider
                            $('#forum-edit-' + provider.id + '-save').click(function() {
                                const name = $('#' + provider.id + '-name').val();
                                if (name === '') {
                                    alert('Geben Sie den Namen des Telekommunikationsunternehmens ein');
                                    return;
                                }

                                const id = $('#' + provider.id).attr('data-gid');
                                if (!id) {
                                    loadProviders();
                                    alert('Der Eintrag konnte nicht gespeichert werden');
                                    return;
                                }

                                $('#' + provider.id + '-content').summernote('destroy');
                                const table = $('#' + provider.id + '-content').html();
                                // $('#' + data.id).remove();
                                $('#forum-add-provider').show();
                                // $('.forum-buttons-edit').show();
                                // $('.forum-buttons-delete').show();
                                //
                                forum.SaveEditedProvider(name, table, id)
                                    .then(data => {
                                        loadProviders();
                                        $('#modal-forum-company-edited').show();
                                    })
                                    .catch(error => {
                                        $('#modal-forum-company-save-failed').show();
                                    });
                            });
                        }
                    }
                });
            }

        })
        .catch(error => {
            console.log(error);
        });
};

/**
 * Function to trigger get technology content and implement DOM changes
 * @const
 * @function getTechnology
 */
const getTechnology = () => {
    $('#forum-technology-body').html('');
    forum.GetTechnology()
        .then(data => {
            if (data.length) {
                $('#forum-technology-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#forum-technology-edit').click(function() {
                        $('#forum-technology-edit').hide();
                        $('#forum-technology-preview').show();
                        $('#forum-technology-save').show();
                        $('#forum-technology-cancel').show();

                        $('#forum-technology-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#forum-technology-preview').click(function() {
                    $('#forum-technology-body').summernote('destroy');

                    $('#forum-technology-preview').hide();
                    $('#forum-technology-save').hide();
                    $('#forum-technology-cancel').hide();
                    $('#forum-technology-stop-preview').show();
                });

                // Stop preview
                $('#forum-technology-stop-preview').click(function() {
                    $('#forum-technology-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#forum-technology-preview').show();
                    $('#forum-technology-save').show();
                    $('#forum-technology-cancel').show();
                    $('#forum-technology-stop-preview').hide();
                });

                // Cancel editing
                $('#forum-technology-cancel').click(function() {
                    $('#forum-technology-edit').show();

                    $('#forum-technology-preview').hide();
                    $('#forum-technology-save').hide();
                    $('#forum-technology-cancel').hide();
                    $('#forum-technology-body').summernote('destroy');
                    getTechnology();
                });

                // Save technology
                $('#forum-technology-save').click(function() {
                    $('#forum-technology-body').summernote('destroy');

                    $('#forum-technology-edit').show();

                    $('#forum-technology-preview').hide();
                    $('#forum-technology-save').hide();
                    $('#forum-technology-cancel').hide();

                    const content = $('#forum-technology-body').html();

                    forum.SaveTechnology(content)
                        .then(data => {
                            getTechnology();
                            $('#modal-forum-company-edited').show();
                        })
                        .catch(error => {
                            $('#modal-forum-company-save-failed').show();
                        });
                });

            }
        });
};

/**
 * Function to trigger get supply content and implement DOM changes
 * @const
 * @function getSupply
 */
const getSupply = () => {
    $('#forum-supply-body').html('');
    forum.GetSupply()
        .then(data => {
            if (data.length) {
                $('#forum-supply-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#forum-supply-edit').click(function() {
                        $('#forum-supply-edit').hide();
                        $('#forum-supply-preview').show();
                        $('#forum-supply-save').show();
                        $('#forum-supply-cancel').show();

                        $('#forum-supply-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#forum-supply-preview').click(function() {
                    $('#forum-supply-body').summernote('destroy');

                    $('#forum-supply-preview').hide();
                    $('#forum-supply-save').hide();
                    $('#forum-supply-cancel').hide();
                    $('#forum-supply-stop-preview').show();
                });

                // Stop preview
                $('#forum-supply-stop-preview').click(function() {
                    $('#forum-supply-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#forum-supply-preview').show();
                    $('#forum-supply-save').show();
                    $('#forum-supply-cancel').show();
                    $('#forum-supply-stop-preview').hide();
                });

                // Cancel editing
                $('#forum-supply-cancel').click(function() {
                    $('#forum-supply-edit').show();

                    $('#forum-supply-preview').hide();
                    $('#forum-supply-save').hide();
                    $('#forum-supply-cancel').hide();
                    $('#forum-supply-body').summernote('destroy');
                    getSupply();
                });

                // Save supply
                $('#forum-supply-save').click(function() {
                    $('#forum-supply-body').summernote('destroy');

                    $('#forum-supply-edit').show();

                    $('#forum-supply-preview').hide();
                    $('#forum-supply-save').hide();
                    $('#forum-supply-cancel').hide();

                    const content = $('#forum-supply-body').html();

                    forum.SaveSupply(content)
                        .then(data => {
                            getSupply();
                            $('#modal-forum-company-edited').show();
                        })
                        .catch(error => {
                            $('#modal-forum-company-save-failed').show();
                        });
                });

            }
        });
};

/**
 * Function to trigger get infos content and implement DOM changes
 * @const
 * @function getInfos
 */
const getInfos = () => {
    $('#forum-infos-body').html('');
    forum.GetInfos()
        .then(data => {
            if (data.length) {
                $('#forum-infos-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#forum-infos-edit').click(function() {
                        $('#forum-infos-edit').hide();
                        $('#forum-infos-preview').show();
                        $('#forum-infos-save').show();
                        $('#forum-infos-cancel').show();

                        $('#forum-infos-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#forum-infos-preview').click(function() {
                    $('#forum-infos-body').summernote('destroy');

                    $('#forum-infos-preview').hide();
                    $('#forum-infos-save').hide();
                    $('#forum-infos-cancel').hide();
                    $('#forum-infos-stop-preview').show();
                });

                // Stop preview
                $('#forum-infos-stop-preview').click(function() {
                    $('#forum-infos-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#forum-infos-preview').show();
                    $('#forum-infos-save').show();
                    $('#forum-infos-cancel').show();
                    $('#forum-infos-stop-preview').hide();
                });

                // Cancel editing
                $('#forum-infos-cancel').click(function() {
                    $('#forum-infos-edit').show();

                    $('#forum-infos-preview').hide();
                    $('#forum-infos-save').hide();
                    $('#forum-infos-cancel').hide();
                    $('#forum-infos-body').summernote('destroy');
                    getInfos();
                });

                // Save infos
                $('#forum-infos-save').click(function() {
                    $('#forum-infos-body').summernote('destroy');

                    $('#forum-infos-edit').show();

                    $('#forum-infos-preview').hide();
                    $('#forum-infos-save').hide();
                    $('#forum-infos-cancel').hide();

                    const content = $('#forum-infos-body').html();

                    forum.SaveInfos(content)
                        .then(data => {
                            getInfos();
                            $('#modal-forum-company-edited').show();
                        })
                        .catch(error => {
                            $('#modal-forum-company-save-failed').show();
                        });
                });

            }
        });
};

/**
 * Function to trigger get IHK content and implement DOM changes
 * @const
 * @function getIhk
 */
const getIhk = () => {
    $('#forum-ihk-body').html('');
    forum.GetIhk()
        .then(data => {
            if (data.length) {
                $('#forum-ihk-body').html(data);

                if (config.status === 'admin') {
                    // Edit
                    $('#forum-ihk-edit').click(function() {
                        $('#forum-ihk-edit').hide();
                        $('#forum-ihk-preview').show();
                        $('#forum-ihk-save').show();
                        $('#forum-ihk-cancel').show();

                        $('#forum-ihk-body').summernote({
                            lang: 'de-DE' // default: 'en-US'
                        });
                    });
                }

                // Start preview
                $('#forum-ihk-preview').click(function() {
                    $('#forum-ihk-body').summernote('destroy');

                    $('#forum-ihk-preview').hide();
                    $('#forum-ihk-save').hide();
                    $('#forum-ihk-cancel').hide();
                    $('#forum-ihk-stop-preview').show();
                });

                // Stop preview
                $('#forum-ihk-stop-preview').click(function() {
                    $('#forum-ihk-body').summernote({
                        lang: 'de-DE' // default: 'en-US'
                    });

                    $('#forum-ihk-preview').show();
                    $('#forum-ihk-save').show();
                    $('#forum-ihk-cancel').show();
                    $('#forum-ihk-stop-preview').hide();
                });

                // Cancel editing
                $('#forum-ihk-cancel').click(function() {
                    $('#forum-ihk-edit').show();

                    $('#forum-ihk-preview').hide();
                    $('#forum-ihk-save').hide();
                    $('#forum-ihk-cancel').hide();
                    $('#forum-ihk-body').summernote('destroy');
                    getIhk();
                });

                // Save IHK
                $('#forum-ihk-save').click(function() {
                    $('#forum-ihk-body').summernote('destroy');

                    $('#forum-ihk-edit').show();

                    $('#forum-ihk-preview').hide();
                    $('#forum-ihk-save').hide();
                    $('#forum-ihk-cancel').hide();

                    const content = $('#forum-ihk-body').html();

                    forum.SaveIhk(content)
                        .then(data => {
                            getIhk();
                            $('#modal-forum-company-edited').show();
                        })
                        .catch(error => {
                            $('#modal-forum-company-save-failed').show();
                        });
                });

            }
        });
};

/**
 * Function to add providers template to DOM
 * @const
 * @function addTemplate
 * @param data {object} - Providers template
 */
const addTemplate = (data) => {
    if (data.id && data.table) {
        let html = '<div class="single-provider" id="' + data.id + '">';
        html += '<div id="' + data.id + '-div-name" class="single-provider-div-name">';
        html += 'Name des Telekommunikationsunternehmens: <input id="' + data.id + '-name" class="single-provider-name" type="text">';
        html += '</div>';
        html += '<div id="' + data.id + '-content">';
        html += data.table;
        html += '</div>';
        html += '<br>';
        html += '<button class="btn btn-primary forum-edit-template-buttons" id="forum-edit-template-preview">Vorschau</button>';
        html += '<button class="btn btn-primary forum-edit-template-buttons" id="forum-edit-template-save">Speichern</button>';
        html += '<button class="btn btn-primary forum-edit-template-buttons" id="forum-edit-template-cancel">Abbrechen</button>';
        html += '<button class="btn btn-primary forum-edit-template-buttons" id="forum-edit-template-stop-preview">Vorschau beenden</button>';
        html += '<hr>';
        html += '</div>';
        $('#provider-body').prepend(html);

        $('#' + data.id + '-content').summernote({
            lang: 'de-DE' // default: 'en-US'
        });

        $('#forum-add-provider').hide();

        $('#' + data.id + '-div-name').show();
        $('.forum-buttons-edit').hide();
        $('.forum-buttons-delete').hide();

        // Start preview
        $('#forum-edit-template-preview').click(function() {
            $('#' + data.id + '-content').summernote('destroy');

            $('#forum-edit-template-preview').hide();
            $('#forum-edit-template-save').hide();
            $('#forum-edit-template-cancel').hide();
            $('#' + data.id + '-div-name').hide();

            $('#forum-edit-template-stop-preview').show();
        });

        // Stop preview
        $('#forum-edit-template-stop-preview').click(function() {
            $('#' + data.id + '-content').summernote({
                lang: 'de-DE' // default: 'en-US'
            });

            $('#forum-edit-template-stop-preview').hide();

            $('#forum-edit-template-preview').show();
            $('#forum-edit-template-save').show();
            $('#forum-edit-template-cancel').show();
            $('#' + data.id + '-div-name').show();
        });

        // Cancel editing
        $('#forum-edit-template-cancel').click(function() {
            $('#' + data.id + '-content').summernote('destroy');
            $('#' + data.id).remove();

            $('#forum-add-provider').show();
            $('.forum-buttons-edit').show();
            $('.forum-buttons-delete').show();
        });

        // Save new provider
        $('#forum-edit-template-save').click(function() {
            const name = $('#' + data.id + '-name').val();
            if (name === '') {
                alert('Geben Sie den Namen des Telekommunikationsunternehmens ein');
                return;
            }

            $('#' + data.id + '-content').summernote('destroy');
            const table = $('#' + data.id + '-content').html();
            $('#' + data.id).remove();
            $('#forum-add-provider').show();
            $('.forum-buttons-edit').show();
            $('.forum-buttons-delete').show();

            forum.SaveNewProvider(name, table)
                .then(data => {
                    loadProviders();
                    $('#modal-forum-new-company-saved').show();
                })
                .catch(error => {
                    $('#modal-forum-company-save-failed').show();
                });
        });

    }
};

// Only admins are allowed to edit providers
if (config.status === 'admin') {
    $('#forum-add-provider').click(function(evt) {

        // Prevent providers from closing, if they are already open
        if ($('#provider-body').hasClass('show')) {
            evt.stopPropagation();
        }

        forum.GetTemplate()
            .then(data => {
                addTemplate(data);
            })
            .catch(error => {
                console.log(error);
            });
    });
}

// Close saved modal
$('#modal-forum-new-company-saved-close').click(function() {
    $('#modal-forum-new-company-saved').hide();

});
// Close edited modal
$('#modal-forum-company-edited-close').click(function() {
    $('#modal-forum-company-edited').hide();
});
// Close deleted modal
$('#modal-forum-company-deleted-close').click(function() {
    $('#modal-forum-company-deleted').hide();
});
// Close save failed modal
$('#modal-forum-company-save-failed-close').click(function() {
    $('#modal-forum-company-save-failed').hide();
});
// Close delete failed modal
$('#modal-forum-company-delete-failed-close').click(function() {
    $('#modal-forum-company-delete-failed').hide();
});


//focus forum functions
const focusArchive = function () {
    if ($('#news-body').hasClass('show')) {
        let scrollPos =  $("#forum-archive").offset().top;
        $(window).scrollTop(scrollPos);
    } else {
        $("#news-body").on('shown.bs.collapse', function() {
            let scrollPos = $("#forum-archive").offset().top;
            $(window).scrollTop(scrollPos);
        });
        $('#news-body').collapse('show');
    }

};

const focusProvider = function () {
    if ($('#provider-body').hasClass('show')) {
        let scrollPosProvider =  $("#forum-provider").offset().top;
        $(window).scrollTop(scrollPosProvider);
    } else {
        $('#provider-body').collapse('show');

        $("#provider-body").on('shown.bs.collapse', function() {
            let scrollPosProvider =  $("#forum-provider").offset().top;
            $(window).scrollTop(scrollPosProvider);
        });
    }
};

const focusTechnology = function () {
    if ($('#forum-technology-body').hasClass('show')) {
        let scrollPos =  $("#forum-technology").offset().top;
        $(window).scrollTop(scrollPos);
    } else {
        $("#forum-technology-body").on('shown.bs.collapse', function() {
            let scrollPos = $("#forum-technology").offset().top;
            $(window).scrollTop(scrollPos);
        });
        $('#forum-technology-body').collapse('show');
    }

};

const focusSupply = function () {
    if ($('#forum-supply-body').hasClass('show')) {
        let scrollPos =  $("#forum-supply").offset().top;
        $(window).scrollTop(scrollPos);
    } else {
        $("#forum-supply-body").on('shown.bs.collapse', function() {
            let scrollPos = $("#forum-supply").offset().top;
            $(window).scrollTop(scrollPos);
        });
        $('#forum-supply-body').collapse('show');
    }

};

const focusInfos = function () {
    if ($('#forum-infos-body').hasClass('show')) {
        let scrollPos =  $("#forum-infos").offset().top;
        $(window).scrollTop(scrollPos);
    } else {
        $("#forum-infos-body").on('shown.bs.collapse', function() {
            let scrollPos = $("#forum-infos").offset().top;
            $(window).scrollTop(scrollPos);
        });
        $('#forum-infos-body').collapse('show');
    }
};

const focusIhk = function () {
    if ($('#forum-ihk-body').hasClass('show')) {
        let scrollPos =  $("#forum-ihk").offset().top;
        $(window).scrollTop(scrollPos);
    } else {
        $("#forum-ihk-body").on('shown.bs.collapse', function() {
            let scrollPos = $("#forum-ihk").offset().top;
            $(window).scrollTop(scrollPos);
        });
        $('#forum-ihk-body').collapse('show');
    }
};


$('.archive_link').on('click', focusArchive);

$('.provider_link').on('click', focusProvider);

$('.technology_link').on('click', focusTechnology);

$('.supply_link').on('click', focusSupply);

$('.infos_link').on('click', focusInfos);

$('.ihk_link').on('click', focusIhk);

// $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    if (e.target.hash === '#forum-content' || e.target.hash === '#forum-archive' || e.target.hash == '#forum-provider' || e.target.hash == '#forum-technology' || e.target.hash == '#forum-supply' || e.target.hash == '#forum-infos'  || e.target.hash == '#forum-ihk') {
        loadProviders();
        getTechnology();
        getSupply();
        getInfos();
        getIhk();
    }
    if (e.target.hash === '#forum-archive') {
        focusArchive();
    }
});
