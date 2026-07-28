'use strict';

const errorPage =
    document.querySelector('.error-page');

const errorEyebrow =
    document.getElementById('error-eyebrow');

const errorTitle =
    document.getElementById('error-title');

const errorMessage =
    document.getElementById('error-message');

const errorActionText =
    document.getElementById('error-action-text');

const errorSystemText =
    document.getElementById('error-system-text');

/*
Each theme has its own personality.

Modern:
Music, stages, signals and performances.

Inferno:
Fire, lava, ashes and destruction.

Neon:
Portals, dimensions, glitches and lost signals.
*/
const themedErrors = {
    modern: {
        page_not_found: {
            eyebrow: 'Signal interrupted',
            title: 'Page not found',
            message:
                'The page took a detour and forgot to leave directions.',
            action: 'Return to the music'
        },

        artist_not_found: {
            eyebrow: 'Artist missing',
            title: 'Artist not found',
            message:
                'Looks like this artist missed the soundcheck.',
            action: 'Back to the lineup'
        },

        invalid_artist_id: {
            eyebrow: 'Wrong backstage pass',
            title: 'Invalid artist',
            message:
                'That artist ID does not belong on tonight’s guest list.',
            action: 'Return to the artists'
        },

        artists_fetch_failed: {
            eyebrow: 'Lineup unavailable',
            title: 'Artists unavailable',
            message:
                'The full artist lineup could not make it to the stage.',
            action: 'Try the main stage'
        },

        relation_fetch_failed: {
            eyebrow: 'Tour signal lost',
            title: 'Concerts unavailable',
            message:
                'The concert schedule lost the beat somewhere backstage.',
            action: 'Return to the music'
        },

        search_failed: {
            eyebrow: 'Search went off-key',
            title: 'Search failed',
            message:
                'Your search could not find the next headliner.',
            action: 'Restart the search'
        },

        artist_data_failed: {
            eyebrow: 'Soundcheck failed',
            title: 'Artist unavailable',
            message:
                'The artist information was not ready when the curtain opened.',
            action: 'Back to the lineup'
        },

        geocode_failed: {
            eyebrow: 'Venue signal lost',
            title: 'Location unavailable',
            message:
                'The concert venue disappeared from the tour map.',
            action: 'Return to the music'
        },

        template_failed: {
            eyebrow: 'Stage malfunction',
            title: 'Page unavailable',
            message:
                'The stage was not ready when the show was supposed to begin.',
            action: 'Return to the main stage'
        }
    },

    inferno: {
        page_not_found: {
            eyebrow: 'Transmission burned',
            title: 'Page incinerated',
            message:
                'The page you were looking for has been reduced to ashes.',
            action: 'Escape the flames'
        },

        artist_not_found: {
            eyebrow: 'Artist consumed',
            title: 'Artist vanished',
            message:
                'This artist disappeared somewhere inside the flames.',
            action: 'Return to safety'
        },

        invalid_artist_id: {
            eyebrow: 'Corrupted mark',
            title: 'Invalid artist',
            message:
                'That artist ID was scorched beyond recognition.',
            action: 'Leave the ruins'
        },

        artists_fetch_failed: {
            eyebrow: 'Lineup destroyed',
            title: 'Artists unavailable',
            message:
                'The entire artist lineup was swallowed by the inferno.',
            action: 'Escape to home'
        },

        relation_fetch_failed: {
            eyebrow: 'Tour route melted',
            title: 'Concerts unavailable',
            message:
                'The concert timeline melted before it could be recovered.',
            action: 'Return from the ashes'
        },

        search_failed: {
            eyebrow: 'Search overheated',
            title: 'Search burned out',
            message:
                'The search could not survive the heat long enough to finish.',
            action: 'Cool things down'
        },

        artist_data_failed: {
            eyebrow: 'Data scorched',
            title: 'Artist unavailable',
            message:
                'The artist information burned before it reached the stage.',
            action: 'Return from the fire'
        },

        geocode_failed: {
            eyebrow: 'Map consumed',
            title: 'Location unavailable',
            message:
                'Even the lava could not reveal where this concert was held.',
            action: 'Escape the volcano'
        },

        template_failed: {
            eyebrow: 'System meltdown',
            title: 'Page destroyed',
            message:
                'The stage collapsed before the performance could begin.',
            action: 'Leave the danger zone'
        }
    },

    neon: {
        page_not_found: {
            eyebrow: 'Reality shifted',
            title: 'Dimension not found',
            message:
                'This page slipped through a portal into another universe.',
            action: 'Return to this universe'
        },

        artist_not_found: {
            eyebrow: 'Portal trace lost',
            title: 'Artist not found',
            message:
                'The artist escaped through a neon portal before we arrived.',
            action: 'Return to the timeline'
        },

        invalid_artist_id: {
            eyebrow: 'Identity glitch',
            title: 'Invalid artist',
            message:
                'That artist ID belongs to a timeline that does not exist.',
            action: 'Restore the timeline'
        },

        artists_fetch_failed: {
            eyebrow: 'Network distortion',
            title: 'Artists unavailable',
            message:
                'The artist lineup was scattered across multiple dimensions.',
            action: 'Return to the portal'
        },

        relation_fetch_failed: {
            eyebrow: 'Timeline corrupted',
            title: 'Concerts unavailable',
            message:
                'The concert timeline glitched before it could fully load.',
            action: 'Re-enter the timeline'
        },

        search_failed: {
            eyebrow: 'Signal corrupted',
            title: 'Search failed',
            message:
                'No matching signal could be found in this dimension.',
            action: 'Search this universe'
        },

        artist_data_failed: {
            eyebrow: 'Data stream broken',
            title: 'Artist unavailable',
            message:
                'The artist data fragmented while travelling through the grid.',
            action: 'Return to the network'
        },

        geocode_failed: {
            eyebrow: 'Coordinates corrupted',
            title: 'Location unavailable',
            message:
                'The concert coordinates point to an unknown dimension.',
            action: 'Return through the portal'
        },

        template_failed: {
            eyebrow: 'Interface failure',
            title: 'Page glitched',
            message:
                'The page interface fractured before it could materialize.',
            action: 'Reboot the experience'
        }
    }
};

const fallbackErrors = {
    modern: {
        eyebrow: 'Signal interrupted',
        title: 'Something went wrong',
        message:
            'The performance stopped before the final note.',
        action: 'Return to the music'
    },

    inferno: {
        eyebrow: 'System overheated',
        title: 'Something burned',
        message:
            'An unexpected problem was consumed by the flames.',
        action: 'Escape the flames'
    },

    neon: {
        eyebrow: 'Unknown glitch',
        title: 'Reality interrupted',
        message:
            'An unexpected disturbance appeared in the system.',
        action: 'Return to this universe'
    }
};

/*
Returns the theme currently stored on the root HTML element.
*/
function getCurrentTheme() {
    const theme =
        document.documentElement.dataset.theme;

    if (
        theme === 'modern' ||
        theme === 'inferno' ||
        theme === 'neon'
    ) {
        return theme;
    }

    return 'modern';
}

/*
Updates every text element on the error page.

The selected message depends on both:

1. the current theme
2. the error key sent by the Go handler
*/
function updateErrorContent() {
    if (!errorPage) {
        return;
    }

    const theme =
        getCurrentTheme();

    const errorKey =
        errorPage.dataset.errorKey;

    const statusCode =
        errorPage.dataset.statusCode;

    const themeMessages =
        themedErrors[theme];

    const content =
        themeMessages[errorKey] ||
        fallbackErrors[theme];

    if (errorEyebrow) {
        errorEyebrow.textContent =
            content.eyebrow;
    }

    if (errorTitle) {
        errorTitle.textContent =
            content.title;
    }

    if (errorMessage) {
        errorMessage.textContent =
            content.message;
    }

    if (errorActionText) {
        errorActionText.textContent =
            content.action;
    }

    if (errorSystemText) {
        errorSystemText.textContent =
            `Groupie Tracker system / error ${statusCode}`;
    }
}

/*
The MutationObserver watches the data-theme attribute.

When theme.js changes:

html[data-theme="modern"]

to:

html[data-theme="inferno"]

or:

html[data-theme="neon"]

the error text is immediately updated.
*/
const themeObserver =
    new MutationObserver(updateErrorContent);

themeObserver.observe(
    document.documentElement,
    {
        attributes: true,
        attributeFilter: ['data-theme']
    }
);

updateErrorContent();