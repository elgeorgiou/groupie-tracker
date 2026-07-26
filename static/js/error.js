'use strict';

const errorPage =
    document.querySelector('.error-page');

const errorMessage =
    document.getElementById('error-message');

const messages = {
    page_not_found:
        'The page you are looking for could not be found.',

    artist_not_found:
        'The requested artist could not be found.',

    invalid_artist_id:
        'The artist identifier is invalid.',

    artists_fetch_failed:
        'The artist collection could not be loaded.',

    relation_fetch_failed:
        'The concert information could not be loaded.',

    search_failed:
        'The search could not be completed.',

    artist_data_failed:
        'The artist information could not be prepared.',

    geocode_failed:
        'The concert location could not be placed on the map.',

    template_failed:
        'The page could not be prepared.'
};

function updateErrorMessage() {
    if (!errorPage || !errorMessage) {
        return;
    }

    const errorKey =
        errorPage.dataset.errorKey;

    const message =
        messages[errorKey];

    if (!message) {
        return;
    }

    errorMessage.textContent = message;
}

const themeObserver = new MutationObserver(
    updateErrorMessage
);

themeObserver.observe(
    document.documentElement,
    {
        attributes: true,
        attributeFilter: ['data-theme']
    }
);

updateErrorMessage();