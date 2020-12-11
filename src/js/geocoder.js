/**
 * @module geocoder
 */

import $ from "jquery";
import { config } from './config';

/**
 * Class for geocoder
 */
export class Geocoder {
    constructor() {
        /**
         * Class name
         * @memeberof Geocoder
         * @type {string}
         */
        this.name = 'Geocoder';
    }

    /**
     * Get reverse geocoding result
     * @param geocoderParams {string} - Parameters for reverse geocoding search
     * @returns {Promise} Promise object with reverse geocoding result
     */
    Reverse(geocoderParams) {
        const url = config.geocoderReverseUrl;

        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: geocoderParams,
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
     * Get geocoding search result
     * @param geocoderParams {string} - Parameters for geocoding search
     * @returns {Promise} Promise object with geocoding result
     */
    Search(geocoderParams) {
        const url = config.geocoderSearchUrl;

        // Promisify the ajax call
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: geocoderParams,
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
}
