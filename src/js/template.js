// Functions related to berlin.de template
// https://www.berlin.de/rbmskzl/aktuelles/__i9/ohne/

import $ from "jquery";
import {viewer} from './index';

// Open-close mobile menu using button
$(function() {
    const n = $("html, body"),
        i = $(".navigation-mobile"),
        a = ($(".navigation-mobile .wrapper"), $(".navigation-mobile .nav-container")),
        t = $(".navigation-mobile .nav-toggle"),
        e = $(".navigation-mobile .has-dropdown > .menu-link");
    t.on("click", function(e) {
        const t = $(this);
        e.preventDefault(), t.toggleClass("is-active"), a.toggleClass("is-visible"), i.toggleClass("is-open"), n.toggleClass("nav-open");
    }), e.on("click", function(e) {
        e.preventDefault(), $(this).parent(".menu-item").toggleClass("is-active").children("ul.nav-dropdown").toggleClass("is-visible");
    }), e.on("click", ".menu-link", function(e) {
        e.stopPropagation();
    }), $("ul.navSkip a[href$='#mobile-nav-toggle']").click(function(e) {
        return e.preventDefault(), t.toggleClass("is-active"), a.toggleClass("is-visible"), i.toggleClass("is-open"), n.toggleClass("nav-open"), $("#mobile-nav-toggle").focus(), !1;
    }), $(".js-mobile-navigation-tree").on("click", ".tree__arrow", function(e) {
        const t = $(this).parent().parent().attr("class");
        return $(this).parent().parent().parent().children().removeClass("tree--open"), $(this).parent().parent().attr("class", t).toggleClass("tree--open"), !1;
    });
});

// Restore correct classes
$('#mobile-nav-toggle').click(function() {
    // Check if loading mobile or not
    if ($($('.nav-container')[0]).hasClass('is-visible')) {
        // If loading mobile:
        $('.nav-container').addClass('is-visible');
        $('#mobile-nav-toggle').addClass('is-active');
        $('.navigation-mobile').addClass('is-open');
        $('html').addClass('nav-open');
        $('body').addClass('nav-open');
    } else {
        // If closing mobile:
        $('.nav-container').removeClass('is-visible');
        $('#mobile-nav-toggle').removeClass('is-active');
        $('.navigation-mobile').removeClass('is-open');
        $('html').removeClass('nav-open');
        $('body').removeClass('nav-open');
    }
});

$('.mobile-button a').on('click', () => {
    // Close mobile programmatically
    $('.nav-container').removeClass('is-visible');
    $('#mobile-nav-toggle').removeClass('is-active');
    $('.navigation-mobile').removeClass('is-open');
    $('html').removeClass('nav-open');
    $('body').removeClass('nav-open');
});

// Deep linking
$(document).ready(() => {
    // let url = location.href.replace(/\/$/, '');
    let url = window.location.href;
    if (window.location.hash) {
        const hash = url.split("#");
        $('#bbp-tabs a[href="#'+hash[1]+'"]').tab('show');
        url = window.location.href.replace(/\/#/, '#');
        window.history.replaceState(null, null, url);
        setTimeout(() => {
            $(window).scrollTop(0);
        }, 400);
    }

    $(document).on('click', 'a[data-toggle="tab"]', function() {
        let newUrl;
        const hash = $(this).attr('href');
        if (hash == '#home') {
            newUrl = url.split('#')[0];
        } else if (hash == '#forum-archive' || hash == '#forum-provider' || hash == '#forum-technology' || hash == '#forum-supply' || hash == '#forum-infos' || hash == '#forum-ihk') {
            newUrl = url.split('#')[0] + '#forum-content';
            $('.tab-pane').removeClass('active');
            $('.tab-pane').removeClass('shown');
            $('#forum-content').tab( 'show' );
        } 
        else if (hash == '#help-faq' || hash == '#help-glossar') {
            newUrl = url.split('#')[0] + '#help';
            $('.tab-pane').removeClass('active');
            $('.tab-pane').removeClass('shown');
            $('#help').tab( 'show' );
        }
        else {
            newUrl = url.split('#')[0] + hash;
        }
        newUrl += "/";
        window.history.replaceState(null, null, newUrl);
    });
});

let changingTabs = false;

// Update buttons state when changing tabs
$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    changingTabs = true;

    // Update desktop buttons
    $('#bbp-tabs .nav-link').removeClass('active');
    $('#bbp-tabs .nav-link[href="' + e.target.hash + '"]').addClass('active');

    // Update mobile buttons
    $('.nav-container .menu-link').removeClass('active');
    $('.nav-container .menu-link[href="' + e.target.hash + '"]').addClass('active');

    // Profile dropdown
    const profileHash = ['#profil', '#meine-bedarfsmeldungen', '#benachrichtigungen', '#admin-bedarfsmeldungen', '#tku-bedarfsmeldungen'];
    if (profileHash.indexOf(e.target.hash) !== -1) {
        $('#profile-logout-menu').addClass('active');
    }

    if (e.target.hash == '#forum-archive' || e.target.hash == '#forum-provider' || e.target.hash == '#forum-technology' || e.target.hash == '#forum-supply' || e.target.hash == '#forum-infos' || e.target.hash == '#forum-ihk') {
        scrollToTheme(e.target.hash);
    }

    if (e.target.hash == '#help-faq' || e.target.hash == '#help-glossar') {
        scrollToTheme(e.target.hash);
    }

    // Refresh map
    if (e.target.hash == '#bedarfskarte') {
        viewer.getMap().updateSize();
    }
});

$('.forum-link').click(function (e) {
    setTimeout(function() {
        if (changingTabs === false) {
            const id = e.target.getAttribute('href');
            scrollToTheme(id);
        }
    }, 500);
});

// Forum (scroll to specific theme)
function scrollToTheme(id) {
    setTimeout(function() {
        $(window).scrollTop($(id).offset().top);
        changingTabs = false;
    }, 200);
}
