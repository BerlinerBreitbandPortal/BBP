import '../css/vendor.css';
import '../css/bde-bootstrap.css';
import '../css/bde-index.css';
import 'ol/ol.css';
import '../css/iframe.css';
import { lang } from './language';
import {config} from './config';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Overlay from 'ol/Overlay.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import XYZ from 'ol/source/XYZ.js';
import {Fill, Stroke, Style} from 'ol/style.js';
import {defaults as defaultControls, ScaleLine, Control} from 'ol/control.js';
import {defaults as defaultInteractions, MouseWheelZoom, DragPan} from 'ol/interaction.js';
import {TOUCH} from 'ol/has';
import $ from 'jquery';

const popupContainer = document.getElementById('viewer-popup');
const popupContent = document.getElementById('viewer-popup-content');
const popupCloser = document.getElementById('viewer-popup-closer');

const changeLayerResolution = 40;

// Legend
const LegendControl = (function (Control) {
    function LegendControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'viewer-legend ol-unselectable ol-control';

        // container.innerHTML = lang.VIEWER_MAP_LEGEND;

        let legendHtml = '<div><b>' + lang.VIEWER_MAP_LEGEND + '</b></div>';

        Object.keys(config.bedarfsmeldungenClassification).forEach(function (item) {
            legendHtml += '<div><span class="legend-colors" style="background:' + config.bedarfsmeldungenClassification[item].colorRGBA + '"></span>&nbsp&nbsp' + config.bedarfsmeldungenClassification[item].label +'</div>';

        });

        $(container).html(legendHtml);

        Control.call(this, {
            element: container,
            target: options.target
        });
    }

    if ( Control ) LegendControl.__proto__ = Control;
    LegendControl.prototype = Object.create( Control && Control.prototype );
    LegendControl.prototype.constructor = LegendControl;

    return LegendControl;
}(Control));

// Counter
const CounterControl = (function (Control) {
    function CounterControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'viewer-counter ol-unselectable ol-control';
        container.innerHTML = '';

        CounterControl.prototype.setHTML = (html) => {
            container.innerHTML = html;
        };

        Control.call(this, {
            element: container,
            target: options.target
        });
    }

    if ( Control ) CounterControl.__proto__ = Control;
    CounterControl.prototype = Object.create( Control && Control.prototype );
    CounterControl.prototype.constructor = CounterControl;

    return CounterControl;
}(Control));

const counterControl = new CounterControl();

// Prevent popup from showing when loading page
$('#viewer-popup').show();

const popupOverlay = new Overlay({
    element: popupContainer,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});

popupCloser.onclick = function() {
    popupOverlay.setPosition(undefined);
    popupCloser.blur();
    return false;
};

let styleCache = {};
const bedarfsmeldungenStyle = (feature) => {
    const bedarfsmeldungen = feature.getProperties().bedarfsmeldungen;

    let fillColor;
    if (bedarfsmeldungen == config.bedarfsmeldungenClassification['0'].range) {
        fillColor = config.bedarfsmeldungenClassification['0'].color;
    } else if (bedarfsmeldungen <= config.bedarfsmeldungenClassification['1'].range) {
        fillColor = config.bedarfsmeldungenClassification['1'].color;
    } else if (bedarfsmeldungen <= config.bedarfsmeldungenClassification['2'].range) {
        fillColor = config.bedarfsmeldungenClassification['2'].color;
    } else if (bedarfsmeldungen <= config.bedarfsmeldungenClassification['3'].range) {
        fillColor = config.bedarfsmeldungenClassification['3'].color;
    } else {
        fillColor = config.bedarfsmeldungenClassification['4'].color;
    }
    let style = styleCache[fillColor];
    if (!style) {
        style = new Style({
            stroke: new Stroke({
                color: '#000000',
                width: 1
            }),
            fill: new Fill({
                color: fillColor
            })
        });
        styleCache[fillColor] = style;
    }
    return style;
};

const hyddaLayer = new TileLayer({
    source: new XYZ({
        url : 'https://breitband.berlin.de/hydda_berlin/{z}/{x}/{y}.png'
    }),
    title: lang.VIEWER_MAP_OSM_LAYER,
    type: 'base'
});

const ortsteileSource = new VectorSource({
    format: new GeoJSON(),
    url: function(extent) {
        return config.geoserverUrl + 'bbp-berlin/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=bbp-berlin:ortsteile_view&' +
            'outputFormat=application/json&srsname=' + config.map.projection + '&' +
            'bbox=' + extent.join(',') + ',' + config.map.projection;
    },
    strategy: bboxStrategy
});

export const ortsteile = new VectorLayer({
    source: ortsteileSource,
    style: bedarfsmeldungenStyle,
    visible: true,
    opacity: 0.6,
    minResolution: changeLayerResolution,
    name: 'ortsteile'
});

const lorSource = new VectorSource({
    format: new GeoJSON(),
    url: function(extent) {
        return config.geoserverUrl + 'bbp-berlin/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=bbp-berlin:lor_view&' +
            'outputFormat=application/json&srsname=' + config.map.projection + '&' +
            'bbox=' + extent.join(',') + ',' + config.map.projection;
    },
    strategy: bboxStrategy
});

export const lor = new VectorLayer({
    source: lorSource,
    style: bedarfsmeldungenStyle,
    visible: true,
    opacity: 0.6,
    maxResolution: changeLayerResolution,
    name: 'lor'
});

const scaleLineControl = new ScaleLine();

export class ViewerMap {
    constructor(config) {
        this.map = new Map({
            target: 'viewer-map',
            layers: [
                hyddaLayer,
                ortsteile,
                lor
            ],
            overlays: [
                popupOverlay
            ],
            view: new View({
                center: config.viewerMap.center,
                zoom: config.viewerMap.zoom,
                minZoom: config.viewerMap.minZoom,
                maxZoom: config.viewerMap.maxZoom,
                extent: config.viewerMap.extent
            }),
            controls: defaultControls().extend([
                scaleLineControl,
                new LegendControl(),
                counterControl
            ]),
            interactions: defaultInteractions({
                pinchRotate: false,
                altShiftDragRotate: false
            })
        });

        // Update reports counter function
        const updateCounter = () => {
            let bedarfsmeldungen = 0;
            const currentResolution = this.map.getView().getResolution();
            const currentExtent = this.map.getView().calculateExtent(this.map.getSize());
            let featuresInExtent = '';
            if (currentResolution > changeLayerResolution) {
                // ortsteile
                featuresInExtent = ortsteile.getSource().getFeaturesInExtent(currentExtent);
            } else {
                // lor
                featuresInExtent = lor.getSource().getFeaturesInExtent(currentExtent);
            }
            if (featuresInExtent.length) {
                featuresInExtent.forEach(function (feature, index) {
                    bedarfsmeldungen += feature.get('bedarfsmeldungen');
                });
                if (bedarfsmeldungen == 1) {
                    counterControl.setHTML('<b>' + bedarfsmeldungen + ' Bedarfsmeldung</b>');
                } else {
                    counterControl.setHTML('<b>' + bedarfsmeldungen + ' Bedarfsmeldungen</b>');
                }

            } else {
                counterControl.setHTML('');
            }
        };

        // Update store center and zoom on moveend. Also update reports counter.
        let firstLoadOrtsteile = true;
        let firstLoadLor = true;
        const onMoveEnd = (evt) => {
            // Store center and zoom
            const center = evt.map.getView().getCenter();
            const zoom = evt.map.getView().getZoom();

            // Counter
            const currentResolution = this.map.getView().getResolution();
            if (currentResolution > changeLayerResolution) {
                // ortsteile
                if (firstLoadOrtsteile) {
                    firstLoadOrtsteile = false;
                    counterControl.setHTML('');
                    window.setTimeout(() => updateCounter(), 1000);
                } else {
                    updateCounter();
                }
            } else {
                // lor
                if (firstLoadLor) {
                    firstLoadLor = false;
                    counterControl.setHTML('');
                    window.setTimeout(() => updateCounter(), 1000);
                } else {
                    updateCounter();
                }
            }
        };

        this.map.on('moveend', onMoveEnd);

        // Popup
        const displayFeatureInfo = (pixel, coordinate) => {
            let featureFound = undefined;
            this.map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                featureFound = feature;
                const layerName = layer.get('name');
                const bedarfsmeldungen = feature.getProperties().bedarfsmeldungen;
                const ortsteil = feature.getProperties().spatial_al;
                if (bedarfsmeldungen >= 0) {
                    if (layerName === 'ortsteile') {
                        if (bedarfsmeldungen == 1) {
                            popupContent.innerHTML = '<b>' + ortsteil +  '</b><br>' + bedarfsmeldungen + ' Bedarfsmeldung';
                        } else {
                            popupContent.innerHTML = '<b>' + ortsteil +  '</b><br>' + bedarfsmeldungen + ' Bedarfsmeldungen';
                        }
                        popupOverlay.setPosition(coordinate);
                    } else if (layerName === 'lor') {
                        if (bedarfsmeldungen == 1) {
                            popupContent.innerHTML = bedarfsmeldungen + ' Bedarfsmeldung';
                        } else {
                            popupContent.innerHTML = bedarfsmeldungen + ' Bedarfsmeldungen';
                        }
                        popupOverlay.setPosition(coordinate);
                    } else {
                        popupContent.innerHTML = '';
                        popupOverlay.setPosition(undefined);
                    }
                } else {
                    popupContent.innerHTML = '';
                    popupOverlay.setPosition(undefined);
                }
            }, {
                layerFilter: function(layer) {
                    if (layer.get('name') === 'lor' || layer.get('name') === 'ortsteile') {
                        return true;
                    } else {
                        return false;
                    }
                }
            });

            if (!featureFound) {
                popupContent.innerHTML = '';
                popupOverlay.setPosition(undefined);
            }
        };

        const onPointerMove = (evt) => {
            const pixel = evt.pixel;
            const coordinate = evt.coordinate;
            displayFeatureInfo(pixel, coordinate);
        };

        const onTouch = (evt) => {
            const pixel = evt.pixel;
            const coordinate = evt.coordinate;
            displayFeatureInfo(pixel, coordinate);
        };

        // Touch event if browser supports touch events. Otherwise hover.
        if (TOUCH) {
            this.map.on('singleclick', onTouch);
        } else {
            $('#viewer-popup-closer').hide();
            this.map.on('pointermove', onPointerMove);

        }
    }

    getMap() {
        return this.map;
    }
}

const map = new ViewerMap(config).getMap();
