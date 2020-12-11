/**
 * @module language
 */
// Language selection
/**
 * Default Berliner Breitband Portal language code
 * @const
 * @type {string}
 */
export const browserLanguage = 'de-DE'; // We can detect the browser language using navigator.language

// We need to add here statically all the languages available,
// because import is defined in such a way that it is statically analyzable,
// so it cannot depend on runtime information.
import languageGerman from '../lang/de-DE.json';
// import languageEnglish from '../lang/de-US.json';
// import languageFrench from '../lang/fr-FR.json';

/**
 * Configuration with available languages
 * @const
 * @type {object}
 */
const languagesAvailable = {
    'de-DE': languageGerman,
    // 'de-US': languageEnglish,
    // 'fr-FR': languageFrench,
};

/**
 * Berliner Breitband Portal language used from current user
 * @const
 * @type {string}
 */
export const lang = languagesAvailable[browserLanguage];
