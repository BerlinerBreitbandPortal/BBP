/**
 * @module config
 */

/**
 * Configuration of Berliner Breitband Portal
 * @const
 * @type {object}
 * @property {string} geoserverUrl - The GeoServer URL with map services
 * @property {object} map - General map configuration
 * @property {string} map.projection - EPSG code of map projection
 * @property {object} reportMap - Configuration of report map
 * @property {number[]} reportMap.center - Map center
 * @property {number} reportMap.zoom - Map zoom level
 * @property {number} reportMap.minZoom - Minimum map zoonm level
 * @property {number} reportMap.maxZoom - Maximum map zoonm level
 * @property {number[]} reportMap.extent - Map extent
 * @property {object} viewerMap - Configuration of viewer map
 * @property {number[]} viewerMap.center - Map center
 * @property {number} viewerMap.zoom - Map zoom level
 * @property {number} viewerMap.minZoom - Minimum map zoonm level
 * @property {number} viewerMap.maxZoom - Maximum map zoonm level
 * @property {number[]} viewerMap.extent - Map extent
 * @property {object} bedarfsmeldungenClassification - Classification of reports showed on map
 * @property {object} bedarfsmeldungenClassification.0 - Classification level 0
 * @property {number} bedarfsmeldungenClassification.0.range - Range of classification
 * @property {number} bedarfsmeldungenClassification.0.color - Color used on map (HEX)
 * @property {number} bedarfsmeldungenClassification.0.colorRGBA - Color used on map (RGBA)
 * @property {number} bedarfsmeldungenClassification.0.label - Label showed of legend
 * @property {object} bedarfsmeldungenClassification.1 - Classification level 1
 * @property {number} bedarfsmeldungenClassification.1.range - Range of classification
 * @property {number} bedarfsmeldungenClassification.1.color - Color used on map (HEX)
 * @property {number} bedarfsmeldungenClassification.1.colorRGBA - Color used on map (RGBA)
 * @property {number} bedarfsmeldungenClassification.1.label - Label showed of legend
 * @property {object} bedarfsmeldungenClassification.2 - Classification level 2
 * @property {number} bedarfsmeldungenClassification.2.range - Range of classification
 * @property {number} bedarfsmeldungenClassification.2.color - Color used on map (HEX)
 * @property {number} bedarfsmeldungenClassification.2.colorRGBA - Color used on map (RGBA)
 * @property {number} bedarfsmeldungenClassification.2.label - Label showed of legend
 * @property {object} bedarfsmeldungenClassification.3 - Classification level 3
 * @property {number} bedarfsmeldungenClassification.3.range - Range of classification
 * @property {number} bedarfsmeldungenClassification.3.color - Color used on map (HEX)
 * @property {number} bedarfsmeldungenClassification.3.colorRGBA - Color used on map (RGBA)
 * @property {number} bedarfsmeldungenClassification.3.label - Label showed of legend
 * @property {object} bedarfsmeldungenClassification.4 - Classification level 4
 * @property {number} bedarfsmeldungenClassification.4.range - Range of classification
 * @property {number} bedarfsmeldungenClassification.4.color - Color used on map (HEX)
 * @property {number} bedarfsmeldungenClassification.4.colorRGBA - Color used on map (RGBA)
 * @property {number} bedarfsmeldungenClassification.4.label - Label showed of legend
 * @property {string[]} registeredStatus - Possible status for registered users ('anonymous'|'user'|'intern'|'admin')
 * @property {string} geocoderSearchUrl - URL for geocoder search function
 * @property {string} geocoderReverseUrl - URL for geocoder reverse search function
 */
export const config = {
    geoserverUrl: 'https://breitband.berlin.de/geoserver/',
    map: {
        projection: 'EPSG:3857'
    },
    reportMap: {
        center: [1490464.0755659437, 6894160.463462796],
        zoom: 13,
        minZoom: 11,
        maxZoom: 19,
        extent: [1454825.959352174, 6859671.24339003, 1533709.309188271, 6924642.717432427]
    },
    viewerMap: {
        center: [1496614.462371242, 6894736.579625794],
        zoom: 10,
        minZoom: 10,
        maxZoom: 19,
        extent: [1454825.959352174, 6859671.24339003, 1533709.309188271, 6924642.717432427]
    },
    bedarfsmeldungenClassification: {
        '0': {
            range: 0, // 0
            color: '#ffffff',
            colorRGBA: 'rgba(255,255,255,0.6)',
            label: '0'
        },
        '1': {
            range: 5, // 1-5
            color: '#ffaaaa',
            colorRGBA: 'rgba(255,170,170,0.6)',
            label: '1-5'
        },
        '2': {
            range: 10, // 6-10
            color: '#ff4646',
            colorRGBA: 'rgba(255,70,70,0.6)',
            label: '6-10'
        },
        '3': {
            range: 20, // 11-20
            color: '#f40c0c',
            colorRGBA: 'rgba(244,12,12,0.6)',
            label: '11-20'
        },
        '4': {
            range: null, // >20
            color: '#b70013',
            colorRGBA: 'rgba(183,0,19,0.6)',
            label: '>20'
        }
    },
    wofisClassification: {
        '0': {
            range: 122, // 0 - 122
            color: '#ffffcc',
            colorRGBA: 'rgba(255,255,204,0.6)',
            label: '0-122'
        },
        '1': {
            range: 324.60, // 122 - 324,60
            color: '#c2e699',
            colorRGBA: 'rgba(194,230,153,0.6)',
            label: '122-324,60'
        },
        '2': {
            range: 540, // 324,60 - 540
            color: '#78c679',
            colorRGBA: 'rgba(120,198,121,0.6)',
            label: '324,60-540'
        },
        '3': {
            range: 1126, // 540 - 1126
            color: '#31a354',
            colorRGBA: 'rgba(49,163,84,0.6)',
            label: '540-1126'
        },
        '4': {
            range: 8555, // 1126 - 8555
            color: '#006837',
            colorRGBA: 'rgba(0,104,55,0.6)',
            label: '1126-8555'
        }
    },
    registeredStatus: ['user', 'intern', 'admin', 'tku'],
    status: status, // anonymous - user - intern - admin
    geocoderSearchUrl: 'php/geocoder-search.php',
    geocoderReverseUrl: 'php/geocoder-reverse.php',
};
