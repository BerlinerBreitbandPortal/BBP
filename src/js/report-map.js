/**
 * @module report-map
 */

import 'ol/ol.css';
import { lang } from './language';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import XYZ from 'ol/source/XYZ.js';
import {Vector as VectorSource} from 'ol/source.js';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {Stroke, Icon, Style} from 'ol/style.js';
import {defaults as defaultControls, ScaleLine} from 'ol/control.js';
import * as proj from 'ol/proj.js';
import {defaults as defaultInteractions, MouseWheelZoom, DragPan} from 'ol/interaction.js';
import {noModifierKeys} from 'ol/events/condition.js';
import { berlin } from './berlin-geojson';
import { berlinBuffer } from './berlin-buffer-500-geojson';
import { Geocoder } from './geocoder';
import $ from 'jquery';
import * as autocomplete from './autocomplete.js';
import {Control} from "ol/control";
import {ATTRIBUTION} from 'ol/source/OSM';

const ScrollMessageControl = (function (Control) {
    /**
     * @classdesc OpenLayers Control to show scroll message on map
     * @constructs ScrollMessageControl
     * @memberof module:report-map
     */
    function ScrollMessageControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'report-scroll-message ol-unselectable ol-control';
        container.innerHTML = lang.VIEWER_MAP_SCROLL_MESSAGE;

        ScrollMessageControl.prototype.setHTML = (html) => {
            container.innerHTML = html;
        };

        Control.call(this, {
            element: container,
            target: options.target
        });
    }

    if ( Control ) ScrollMessageControl.__proto__ = Control;
    ScrollMessageControl.prototype = Object.create( Control && Control.prototype );
    ScrollMessageControl.prototype.constructor = ScrollMessageControl;

    return ScrollMessageControl;
}(Control));

const scrollMessageControl = new ScrollMessageControl();

// Background layer Hydda
const hyddaLayer = new TileLayer({
    source: new XYZ({
        url: 'https://breitband.berlin.de/hydda_berlin/{z}/{x}/{y}.png',
        attributions: ATTRIBUTION,
        attributionsCollapsible: false
    })
});

// Berlin border
const berlinLayer = new VectorLayer({
    source: new VectorSource({
        features: (new GeoJSON()).readFeatures(berlin)
    }),
    style: new Style({
        stroke: new Stroke({
            color: 'red',
            width: 1,
            lineDash: [3, 3]
        })
    })
});

// Berlin border with a buffer of 500m
const berlinBufferLayer = new VectorLayer({
    source: new VectorSource({
        features: (new GeoJSON()).readFeatures(berlinBuffer)
    }),
    style: new Style({
        stroke: new Stroke({
            color: 'blue',
            width: 1,
            lineDash: [3, 3]
        })
    }),
    visible: false
});

// Layer for marker
export const markerLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
        image: new Icon({
            src: 'img/marker-icon.png',
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            anchor: [0.5, 41]
        })
    })
});

// Geocoder
const geocoder = new Geocoder();

const scaleLineControl = new ScaleLine();

/**
 * Class for report map
 */
export class ReportMap {
    /**
     * @param config {object} - Map configuration
     * @param store {object} - Data store
     */
    constructor(config, store) {
        let that = this;

        this.map = new Map({
            target: 'report-map',
            layers: [
                hyddaLayer,
                // osmLayer,
                berlinLayer,
                berlinBufferLayer,
                markerLayer
            ],
            view: new View({
                center: config.reportMap.center,
                zoom: config.reportMap.zoom,
                minZoom: config.reportMap.minZoom,
                maxZoom: config.reportMap.maxZoom,
                extent: config.reportMap.extent
            }),
            controls: defaultControls().extend([
                scaleLineControl,
                scrollMessageControl
            ]),
            interactions: defaultInteractions({
                dragPan: false,
                pinchRotate: false,
                altShiftDragRotate: false
            })
        });

        // Allow pan only with 2 fingers. Disable pan with 1 finger
        // Strg+MouseWheel Zoom
        // this.map.addInteraction(new MouseWheelZoom({ condition: e => e.originalEvent.ctrlKey }));

        // desktop: normal; mobile: 2-finger pan to start
        const dragPanInteraction = new DragPan({
            condition: function(e) {
                return noModifierKeys(e) && (!/Mobi|Android/i.test(navigator.userAgent) || this.targetPointers.length === 2);
            }
        });

        this.map.addInteraction(dragPanInteraction);

        // the quick-changing holder of last touchmove y
        let lastTouchY = null;

        const div = document.getElementById('report-map');
        const scrollerBlades = document.scrollingElement || document.documentElement;

        let touchMoveMesageShown = false;
        div.addEventListener('touchmove', function (e) {
            e.preventDefault();
            const touches = e.touches || e.changedTouches;
            // on 1-finger-touchmove, scroll and take note of prev y
            if (touches.length === 1) {
                if (lastTouchY !== null) {
                    const by = lastTouchY - touches[0].clientY;
                    scrollerBlades.scrollTop += by;
                }
                lastTouchY = touches[0].clientY;

                if (touchMoveMesageShown === false) {
                    $('.report-scroll-message').show();
                }
                touchMoveMesageShown = true;
            }
        });

        // on touchend, reset y
        div.addEventListener('touchend', e => {
            lastTouchY = null;
            $('.report-scroll-message').hide();
            touchMoveMesageShown = false;
        });

        // Update store center and zoom on moveend
        const onMoveEnd = (evt) => {
            const center = evt.map.getView().getCenter();
            const zoom = evt.map.getView().getZoom();
            store.reportMapCenter = center;
            store.reportMapZoom = zoom;
        };

        // Add a marker when clicking on map
        const addMarker = (evt) => {
            markerLayer.getSource().clear();

            // Check if marker in Berlin
            const inBerlin = berlinBufferLayer.getSource().getFeatures()[0].getGeometry().intersectsCoordinate(evt.coordinate);
            if (!inBerlin) {
                clearForm();
                alert(lang.REPORT_MAP_NOT_IN_BERLIN);
                return;
            }

            const marker = new Feature({
                geometry: new Point(evt.coordinate)
            });

            markerLayer.getSource().addFeature(marker);

            const coordinate4326 = proj.toLonLat(evt.coordinate);

            const params = {
                // format: 'geojson',
                lon: coordinate4326[0],
                lat: coordinate4326[1]
            };
            geocoder.Reverse(params)
            .then(data => {
                // data: json or string with error message
                if (data) {
                    // street, housenumber, postcode, bezirk, ort, ortsteil, lat, lon
                    if (data.street && data.street_bezirk && data.lon && data.lat) {
                        that.repositionMarker(data);
                        updateForm(data);
                    } else {
                        clearForm();
                        markerLayer.getSource().clear();
                    }
                } else {
                    clearForm();
                    markerLayer.getSource().clear();
                }
            })
            .catch(error => {
                console.log(error);
                clearForm();
                markerLayer.getSource().clear();
            });
        };

        // Update form using new data from geocoder
        const updateForm = (data) => {
            const street = data.street;
            const streetBezirk = data.street_bezirk;
            const housenumber = data.housenumber;
            const postcode = data.postcode;
            const bezirk = data.bezirk || '';
            const ortsteil = data.ortsteil || '';

            // const streetForm = '<option selected>' + street + '</option>';
            // $('#report-street').html(streetForm);
            $('#report-street').val(streetBezirk);
            $('#report-street').attr('data-street', street);
            $('#report-street').attr('data-bezirk', bezirk);
            $('#report-street').attr('data-ortsteil', ortsteil);

            const housenumberForm = '<option selected>' + housenumber + '</option>';
            $('#report-housenumber').html(housenumberForm);
            $('#report-housenumber').prop('disabled', true);

            $('#report-postcode').val(postcode);

            $('.selectpicker').selectpicker('refresh');
        };

        // Clear form when we get no data from geocoder
        const clearForm = () => {
            $('#report-street').val('');
            $('#report-street').attr('data-street', '');
            $('#report-street').attr('data-bezirk', '');
            $('#report-street').attr('data-ortsteil', '');

            const houseNumberForm = '<option selected></option>';
            $('#report-housenumber').html(houseNumberForm);

            $('#report-postcode').val('');

            $('.selectpicker').selectpicker('refresh');
        };

        // Event to detect changes in Street form and empty housenumbers/postcode
        $('#report-street').on('input',function() {
            $('#report-street').attr('data-street', '');
            $('#report-street').attr('data-berzirk', '');
            $('#report-street').attr('data-ortsteil', '');
            $('#report-postcode').val('');
            $('#report-housenumber').html('');
            $('#report-housenumber').prop('disabled', true);
        });

        // Select housenumber
        $('#report-housenumber').change(function(evt) {
            const housenumber = evt.target.value;
            const streetBezirk = $('#report-street').val();

            const params = {
                street: streetBezirk,
                housenumber: housenumber
            };
            geocoder.Search(params)
                .then(data => {
                    // data: json or string with error message
                    if (data) {
                        // postcode, lat, lon
                        if (data.postcode && data.lon && data.lat) {
                            that.repositionMarker({
                                lat: data.lat,
                                lon: data.lon
                            });
                            that.map.getView().setCenter(proj.transform([parseFloat(data.lon), parseFloat(data.lat)], 'EPSG:4326', 'EPSG:3857'));
                            that.map.getView().setZoom(18);
                            // updateForm(data);

                            $('#report-postcode').val(data.postcode);
                            $('#report-street').attr('data-bezirk', data.bezirk);
                            $('#report-street').attr('data-ortsteil', data.ortsteil);
                        }
                    } else {
                        console.log('no data');
                    }
                })
                .catch(error => {
                    console.log(error);
                });

        });

        $("#report-street").autocomplete({
            dropdownWidth:'auto',
            appendMethod:'replace',
            valid: function () {
                return true;
            },
            source:[
                function (q, add) {
                    const streetInput = $('#report-street-div input').val();
                    if (streetInput === '') {
                        return;
                    }
                    const params = {
                        autocomplete: true,
                        street: streetInput
                    };
                    geocoder.Search(params)
                        .then(data => {
                            // data: json or string with error message
                            if (data) {
                                let suggestions = [];
                                $.each(data, function(i, val){
                                    suggestions.push(val.street_bezirk);
                                });
                                add(suggestions);
                            } else {
                                console.log('no data');
                                add([]);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            add([]);
                        });
                }
            ]
        }).on('selected.xdsoft',function(e, streetOrt) {
            // Get Coordinates, postcode and house numbers
            const params = {
                autocomplete: false,
                street: streetOrt
            };
            geocoder.Search(params)
                .then(data => {
                    // data: json or string with error message
                    if (data) {
                        // UPDATE MARKER, PLZ, HNR
                        // Street name
                        $('#report-street').attr('data-street', data.street);

                        // Housenumber
                        $('#report-housenumber').prop('disabled', false);
                        let housenumbersForm = '<option class="disabled-selection" selected disabled>' + lang.REPORT_SELECT_HOUSE_NUMBER + '</option>';
                        data.housenumber.forEach((housenumber) => {
                            housenumbersForm += '<option value=' + housenumber + '>' + housenumber + '</option>';
                        });
                        $('#report-housenumber').html(housenumbersForm);

                        // Marker
                        that.repositionMarker({
                            lat: data.lat,
                            lon: data.lon
                        });
                        that.map.getView().setCenter(proj.transform([parseFloat(data.lon), parseFloat(data.lat)], 'EPSG:4326', 'EPSG:3857'));
                        that.map.getView().setZoom(15);

                    } else {
                        console.log('no data');
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        });

        this.map.on('moveend', onMoveEnd);

        this.map.on('click', addMarker);
    }

    /**
     * Get OpenLayers map
     * @returns {object}
     */
    getMap() {
        return this.map;
    }

    /**
     * Reposition marker on map
     * @param data {object} - Marker information
     */
    repositionMarker(data) {
        markerLayer.getSource().clear();

        const coordinate3857 = proj.fromLonLat([parseFloat(data.lon), parseFloat(data.lat)]);

        const marker = new Feature({
            geometry: new Point(coordinate3857)
        });

        markerLayer.getSource().addFeature(marker);
    }
}
