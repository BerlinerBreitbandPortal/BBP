/**
 * @module store
 */

/**
 * Class to store data
 */
export class Store {
    constructor(config) {
        this._reportType = null; // single - multiple
        this._reportMapCenter = config.reportMap.center;
        this._reportMapZoom = config.reportMap.zoom;
        this._viewerMapCenter = config.viewerMap.center;
        this._viewerMapZoom = config.viewerMap.zoom;
    }

    get reportType() {
        return this._reportType;
    }

    set reportType(type) {
        this._reportType = type;
    }

    get reportMapCenter() {
        return this._reportMapCenter;
    }

    set reportMapCenter(center) {
        this._reportMapCenter = center;
    }

    get reportMapZoom() {
        return this._reportMapZoom;
    }

    set reportMapZoom(zoom) {
        this._reportMapZoom = zoom;
    }

    get viewerMapCenter() {
        return this._viewerMapCenter;
    }

    set viewerMapCenter(center) {
        this._viewerMapCenter = center;
    }

    get viewerMapZoom() {
        return this._viewerMapZoom;
    }

    set viewerMapZoom(zoom) {
        this._viewerMapZoom = zoom;
    }
}
