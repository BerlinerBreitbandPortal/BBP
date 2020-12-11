// CSS from berlin template
import '../css/vendor.css';
import '../css/bde-bootstrap.css';
import '../css/bde-index.css';

// jquery-utocomplete plugin
// We do not use the npm installation, because there are problems with the webpack configuration
// (the plugin cannot read the global variables $ and jQuery)
import '../css/autocomplete.css';

// Our css
import '../css/app.css';

// Libraries
import $ from 'jquery';
import 'bootstrap';
import 'bootstrap-select';
import '../../node_modules/bootstrap-select/dist/css/bootstrap-select.css';

// Our modules
import * as template from './template';
import * as register from './register';
import * as profile from './profile';
import { config } from './config';
import { Store } from './store';
import { Report } from './report';
import { Viewer } from './viewer';
import { MyReports } from './my-reports';
import { TkuReports } from './tku-reports';
import { AdminReports } from './admin-reports';
import { Forum } from './forum';
import { Faq } from './faq';
import { Glossar } from './glossar';
import { About } from './about';
import { Datenschutz } from './datenschutz';
import { Startpage, getStartpage } from './startpage';
import { StartpageBottom, getStartpageBottom } from './startpage-bottom';
import { ForumStartpage } from './forum-startpage';
import { News } from './news';
import { VideoSupport } from './video';

export const store = new Store(config);

export const myReports = new MyReports();

export const tkuReports = new TkuReports();
export const adminReports = new AdminReports();

export const report = new Report(config, store);
export const forum = new Forum(config, store);
export const faq = new Faq(config, store);
export const glossar = new  Glossar(config, store);
export const about = new About(config, store);
export const datenschutz = new Datenschutz(config, store);
export const startpage = new Startpage(config, store);
export const startpageBottom = new StartpageBottom(config, store);
export const news = new News(config,store);
export const forumStartpage = new ForumStartpage(config,store);
export const videoSupport = new VideoSupport ();


// Initialize start page
getStartpage();
getStartpageBottom();
news.loadNews();

report.customizeForm();
export const reportMap = report.getMap();

export const viewer = new Viewer(config, store);
const viewerMap = viewer.getMap();
viewer.getStatistics();

// Resize map after changing tab
$('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
    if (e.target.hash === '#bedarfsmeldung') {
        window.setTimeout(() => reportMap.updateSize(), 500);
    } else if (e.target.hash === '#bedarfskarte') {
        window.setTimeout(() => viewerMap.updateSize(), 500);
    }
});

// Close data protection modal
$('#modal-data-protection-close').click(function() {
    $('#modal-data-protection').hide();
});

// Show data protection modal
$('#footer-data-protection').click(function() {
    $('#modal-data-protection').show();
});

// Close about modal
$('#modal-about-close').click(function() {
    $('#modal-about').hide();
});

// Show about modal
$('#footer-about').click(function() {
    $('#modal-about').show();
});

// Close contact modal
$('#modal-contact-close').click(function() {
    $('#modal-contact').hide();
});

// Remove active class from links-buttons. Otherwise we cannot select them one more time
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.hash === '#passwort-zuruecksetzen') {
        $('#forgot-password-button').removeClass('active');
    }
    if (e.target.hash === '#registrieren') {
        $('#login-register-button').removeClass('active');
    }
    if (e.target.hash === '#konto') {
        $('.login-button').removeClass('active');
    }
    if (e.target.hash === '#bedarfskarte') {
        $('#start-viewer-button').removeClass('active');
    }
    if (e.target.hash === '#bedarfsmeldung') {
        $('#start-report-button').removeClass('active');
    }
    if (e.target.hash === '#help') {
        $('#help-tab-button').removeClass('active');
    }
    if (e.target.hash === '#kontakt') {
        $('.contact-button').removeClass('active');
    }
    if (e.target.hash === '#impressum') {
        $('#impressum-button').removeClass('active');
    }
    if (e.target.hash === '#datenschutz') {
        $('.datenschutz-button').removeClass('active');
    }
    if (e.target.hash === '#start') {
        $('#start-button').removeClass('active');
    }
    if (e.target.hash === '#forum-content') {
        $('#start-button').removeClass('active');
    }
});

$('.contact-button').click(function() {
    $('#modal-about').hide();
});

// Resize modal body (in small mobile phones it is shown cropped)
const resizeModalBody = () => {
    const bufferTop = 100;
    const bufferBottom = 100;
    const modalHeader = 120;
    const modalFooter = 100;
    let windowHeight = window.innerHeight - bufferTop - bufferBottom - modalHeader - modalFooter;
    windowHeight = (windowHeight < 100 ? 100 : windowHeight);

    $('.modal-body').css('max-height', windowHeight);
};

resizeModalBody();

$(window).resize(function() {
    resizeModalBody();
});

// Populate Table with Videos
videoSupport.populateVideoTable();

// Tab Key Events: Accessibility
$(document).on('keyup', function(e) {

    let keycode = e.key;
    if (keycode == 'Tab') {

        let tabTarget = e.target;

        let highlightedElement = $('.targeted-link-accessibility');
        highlightedElement.removeClass('targeted-link-accessibility');

        let highlightedImage = $('.targeted-image-accessibility');
        highlightedImage.removeClass('targeted-image-accessibility');

        if ($(tabTarget).hasClass('logo-accessibility')) {

            // Find Image Child
            let tabTargetImage = $(tabTarget).children().first();
            $(tabTargetImage).addClass('targeted-image-accessibility');

        } else {
            $(tabTarget).addClass('targeted-link-accessibility');
        }
    }

});

