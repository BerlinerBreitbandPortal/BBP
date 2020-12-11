/**
 * @module viewer-map
 */

import 'ol/ol.css';
import { lang } from './language';
import {config} from './config';
import {Map, View} from 'ol';
import {Group as LayerGroup, Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Overlay from 'ol/Overlay.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import XYZ from 'ol/source/XYZ.js';
import {Fill, Stroke, Style} from 'ol/style.js';
import {defaults as defaultControls, ScaleLine, Control} from 'ol/control.js';
import {defaults as defaultInteractions, MouseWheelZoom, DragPan} from 'ol/interaction.js';
import {noModifierKeys} from 'ol/events/condition.js';
import {ATTRIBUTION} from 'ol/source/OSM';
import {TOUCH} from 'ol/has';
import LayerSwitcher from 'ol-layerswitcher';
import $ from 'jquery';

const popupContainer = document.getElementById('viewer-popup');
const popupContent = document.getElementById('viewer-popup-content');
const popupCloser = document.getElementById('viewer-popup-closer');

const changeLayerResolution = 40;
let currentLayer = null; // null-ortsteile-lor
let legendRangeLabel = null;

// Legend
const LegendControl = (function (Control) {
    /**
     * @classdesc OpenLayers Control for legend
     * @constructs LegendControl
     * @memberof module:viewer-map
     */
    function LegendControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'viewer-legend ol-unselectable ol-control';

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

let dynamicLegendControl = new LegendControl();

// Legend WoFIS
const WoFisLegendControl = (function (Control) {
    /**
     * @classdesc OpenLayers Control for WoFIS legend
     * @constructs WoFisLegendControl
     * @memberof module:viewer-map
     */
    function WoFisLegendControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'viewer-legend ol-unselectable ol-control';

        let legendHtml = '<div><b>Gesamtanzahl WE</b></div>';

        Object.keys(config.wofisClassification).forEach(function (item) {
            legendHtml += '<div><span class="legend-colors" style="background:' + config.wofisClassification[item].colorRGBA + '"></span>&nbsp&nbsp' + config.wofisClassification[item].label +'</div>';

        });

        $(container).html(legendHtml);

        Control.call(this, {
            element: container,
            target: options.target
        });
    }

    if ( Control ) WoFisLegendControl.__proto__ = Control;
    WoFisLegendControl.prototype = Object.create( Control && Control.prototype );
    WoFisLegendControl.prototype.constructor = WoFisLegendControl;

    return WoFisLegendControl;
}(Control));

let woFisLegendControl = new WoFisLegendControl();

// Counter
const CounterControl = (function (Control) {
    /**
     * @classdesc OpenLayers Control for counter
     * @constructs CounterControl
     * @memberof module:viewer-map
     */
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

// Scroll message
const ScrollMessageControl = (function (Control) {
    /**
     * @classdesc OpenLayers Control to show scroll message on map
     * @constructs ScrollMessageControl
     * @memberof module:viewer-map
     */
    function ScrollMessageControl(opt_options) {
        let options = opt_options || {};

        const container = document.createElement('div');
        container.className = 'viewer-scroll-message ol-unselectable ol-control';
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

// Prevent popup from showing when loading page
$('#viewer-popup').show();

const popupOverlay = new Overlay({
    element: popupContainer,
    autoPan: false
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
    if (bedarfsmeldungen <= config.bedarfsmeldungenClassification['0'].range) {
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

let woFisStyleCache = {};
const woFisStyle = (feature) => {
    const woFisSum = feature.getProperties().sum_;

    let fillColor;
    if (woFisSum <= config.wofisClassification['0'].range) {
        fillColor = config.wofisClassification['0'].color;
    } else if (woFisSum <= config.wofisClassification['1'].range) {
        fillColor = config.wofisClassification['1'].color;
    } else if (woFisSum <= config.wofisClassification['2'].range) {
        fillColor = config.wofisClassification['2'].color;
    } else if (woFisSum <= config.wofisClassification['3'].range) {
        fillColor = config.wofisClassification['3'].color;
    } else {
        fillColor = config.wofisClassification['4'].color;
    }
    let style = woFisStyleCache[fillColor];
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
        woFisStyleCache[fillColor] = style;
    }
    return style;
};

const hyddaLayer = new TileLayer({
    source: new XYZ({
        url : 'https://breitband.berlin.de/hydda_berlin/{z}/{x}/{y}.png',
        attributions: ATTRIBUTION,
        attributionsCollapsible: false
    })
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

const bedarfsmeldungenLayer = new LayerGroup({
    layers: [
        ortsteile,
        lor
    ],
    title: 'Bedarfsmeldungen',
    type: 'base',
    combine: true
});

const wofisSource = new VectorSource({
    format: new GeoJSON(),
    url: function(extent) {
        return config.geoserverUrl + 'bbp-berlin/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=' + window.wofisUrl +'&' +
            'outputFormat=application/json&srsname=' + config.map.projection + '&' +
            'bbox=' + extent.join(',') + ',' + config.map.projection;
    },
    strategy: bboxStrategy
});

const wofis = new VectorLayer({
    source: wofisSource,
    style: woFisStyle,
    visible: false,
    opacity: 0.6,
    name: 'wofis',
    title: 'Potentielle Wohnbauflächen',
    type: 'base'
});

const scaleLineControl = new ScaleLine();

/**
 * Class for viewer map
 */
export class ViewerMap {
    /**
     * @param config {object} - Map configuration
     * @param store {object} - Data store
     */
    constructor(config, store) {
        const that = this;
        this.map = new Map({
            target: 'viewer-map',
            layers: [
                hyddaLayer
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
                counterControl,
                scrollMessageControl
            ]),
            interactions: defaultInteractions({
                dragPan: false,
                pinchRotate: false,
                altShiftDragRotate: false
            })
        });

        //  tku - admin
        if (config.status === 'admin' || config.status === 'tku') {
            this.map.addLayer(wofis);
        }

        this.map.addLayer(bedarfsmeldungenLayer);

        if (config.status === 'admin' || config.status === 'tku') {
            const layerSwitcher = new LayerSwitcher();
            this.map.addControl(layerSwitcher);
        }

        bedarfsmeldungenLayer.on('change:visible', (e) => {
            if (e.oldValue === false) {
                that.map.removeControl(woFisLegendControl);

                dynamicLegendControl = new LegendControl();
                this.map.addControl(dynamicLegendControl);
                this.map.addControl(counterControl);
            } else {
                this.map.removeControl(counterControl);
                this.map.removeControl(dynamicLegendControl);
                that.map.addControl(woFisLegendControl);
            }
        });

        // Get legend range
        $.ajax({
            url: 'php/get-legend-range.php',
            type: 'POST',
            data: {},
            success: function(data) {
                let isValidJSON = true;
                try {
                    JSON.parse(data);
                } catch(ex) {
                    isValidJSON = false;
                }
                if (isValidJSON) {
                    legendRangeLabel = JSON.parse(data);
                    const currentResolution = that.map.getView().getResolution();

                    if (currentResolution > changeLayerResolution) {
                        currentLayer = 'ortsteile';
                        legendRangeLabel.ortsteile.forEach(function (singleRangeLabel, index) {
                            const range = singleRangeLabel.range;
                            const label = singleRangeLabel.label;
                            config.bedarfsmeldungenClassification[index].range = range;
                            config.bedarfsmeldungenClassification[index].label = label;
                        });
                    } else {
                        currentLayer = 'lor';
                        legendRangeLabel.lor.forEach(function (singleRangeLabel, index) {
                            const range = singleRangeLabel.range;
                            const label = singleRangeLabel.label;
                            config.bedarfsmeldungenClassification[index].range = range;
                            config.bedarfsmeldungenClassification[index].label = label;
                        });
                    }

                    dynamicLegendControl = new LegendControl();
                    that.map.addControl(dynamicLegendControl);

                } else {
                    console.log('Legend error');
                }
            },
            error: function(error) {
                console.log('Legend error');
            }
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

        const div = document.getElementById('viewer-map');
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
                    $('.viewer-scroll-message').show();
                }
                touchMoveMesageShown = true;
            }
        });

        // on touchend, reset y
        div.addEventListener('touchend', e => {
            lastTouchY = null;
            $('.viewer-scroll-message').hide();
            touchMoveMesageShown = false;
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
            const currentResolution = this.map.getView().getResolution();
            store.viewerMapCenter = center;
            store.viewerMapZoom = zoom;

            // Legend
            if (currentLayer) {
                if (currentResolution > changeLayerResolution) {
                    currentLayer = 'ortsteile';
                    legendRangeLabel.ortsteile.forEach(function(singleRangeLabel, index) {
                        const range = singleRangeLabel.range;
                        const label = singleRangeLabel.label;
                        config.bedarfsmeldungenClassification[index].range = range;
                        config.bedarfsmeldungenClassification[index].label = label;
                    });
                } else {
                    currentLayer = 'lor';
                    legendRangeLabel.lor.forEach(function(singleRangeLabel, index) {
                        const range = singleRangeLabel.range;
                        const label = singleRangeLabel.label;
                        config.bedarfsmeldungenClassification[index].range = range;
                        config.bedarfsmeldungenClassification[index].label = label;
                    });
                }
            }

            if (bedarfsmeldungenLayer.getVisible() === true) {
                this.map.removeControl(dynamicLegendControl);
                dynamicLegendControl = new LegendControl();
                this.map.addControl(dynamicLegendControl);
            }

            // Counter
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
                $('.ol-popup').removeClass('wofis-popup');

                if (layerName === 'wofis') {
                    $('.ol-popup').addClass('wofis-popup');

                    const planungsraum = feature.getProperties().planungsra;
                    const sum_ = feature.getProperties().sum_;
                    const real_ = feature.getProperties().real_;
                    const inbau_ = feature.getProperties().inbau_;
                    const kurz_ = feature.getProperties().kurz_;
                    const mittel_ = feature.getProperties().mittel_;
                    const lang_ = feature.getProperties().lang_;

                    let wofisHtml = '<p><b>' + planungsraum +  '</b></p>';
                    wofisHtml += 'Gesamtanzahl WE: ' + sum_ + '<br>';
                    wofisHtml += 'Bereits realisierte WE: ' + real_ + '<br>';
                    wofisHtml += 'In Bau befindliche WE: ' + inbau_ + '<br>';
                    wofisHtml += 'Kurzfristig umsetzbare WE: ' + kurz_ + '<br>';
                    wofisHtml += 'Mittelfristig umsetzbare WE: ' + mittel_ + '<br>';
                    wofisHtml += 'Langfristig umsetzbare WE: ' + lang_;

                    popupContent.innerHTML = wofisHtml;
                    popupOverlay.setPosition(coordinate);
                } else if (bedarfsmeldungen >= 0) {
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
                    if (layer.get('name') === 'lor' || layer.get('name') === 'ortsteile' || layer.get('name') === 'wofis') {
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

    /**
     * Get OpenLayers map
     * @returns {object}
     */
    getMap() {
        return this.map;
    }
}
