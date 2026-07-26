'use strict';

document.addEventListener(
    'DOMContentLoaded',
    () => {
        initConcertToggles();
        initArtistMap();
    }
);

/*
==========================================================
CONCERT LOCATION ACCORDION
==========================================================
*/

function initConcertToggles() {
    const concertButtons =
        document.querySelectorAll(
            '.concert-location__toggle'
        );

    concertButtons.forEach(button => {
        const datesList =
            button.nextElementSibling;

        if (!datesList) {
            return;
        }

        button.addEventListener(
            'click',
            () => {
                const isExpanded =
                    button.getAttribute(
                        'aria-expanded'
                    ) === 'true';

                button.setAttribute(
                    'aria-expanded',
                    String(!isExpanded)
                );

                datesList.hidden =
                    isExpanded;
            }
        );
    });
}

/*
==========================================================
ARTIST MAP
==========================================================
*/

async function initArtistMap() {
    const mapElement =
        document.getElementById(
            'tour-map'
        );

    const placeholder =
        document.getElementById(
            'tour-map-placeholder'
        );

    if (!mapElement) {
        return;
    }

    /*
    Leaflet creates the global object named L.

    If L does not exist, the Leaflet script was not loaded.
    */

    if (typeof L === 'undefined') {
        showMapMessage(
            placeholder,
            'The map library could not be loaded.'
        );

        return;
    }

    const concertLocations =
        collectConcertLocations();

    if (concertLocations.length === 0) {
        showMapMessage(
            placeholder,
            'No concert locations are available.'
        );

        return;
    }

    /*
    Create the Leaflet map.

    [20, 0] is only the initial center.
    Later, fitBounds() will reposition the map around
    the markers that were successfully created.
    */

    const map = L.map(
        mapElement,
        {
            zoomControl: true,
            scrollWheelZoom: true
        }
    ).setView(
        [20, 0],
        2
    );

    /*
    Add the OpenStreetMap tile layer.

    Tiles are the square map images that create the visible
    world map underneath our markers.
    */

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

    const markerCoordinates = [];

    let successfulLocations = 0;

    /*
    Process the locations sequentially.

    We do not send every request at the same time.
    */

    for (
        const concertLocation
        of concertLocations
    ) {
        try {
            const coordinates =
                await geocodeLocation(
                    concertLocation.originalName
                );

            if (!coordinates) {
                continue;
            }

            const marker =
                createConcertMarker(
                    map,
                    coordinates,
                    concertLocation
                );

            markerCoordinates.push(
                marker.getLatLng()
            );

            successfulLocations += 1;
        } catch (error) {
            console.error(
                `Could not map location: ${concertLocation.originalName}`,
                error
            );
        }
    }

    if (successfulLocations === 0) {
        showMapMessage(
            placeholder,
            'The concert locations could not be placed on the map.'
        );

        map.remove();

        return;
    }

    removeMapPlaceholder(
        placeholder
    );

    fitMapToMarkers(
        map,
        markerCoordinates
    );

    /*
    Leaflet occasionally needs to recalculate the dimensions
    after the map container becomes visible and filled.
    */

    window.setTimeout(
        () => {
            map.invalidateSize();
        },
        100
    );
}

/*
==========================================================
COLLECT LOCATION DATA FROM HTML
==========================================================
*/

function collectConcertLocations() {
    const locationElements =
        document.querySelectorAll(
            '.concert-location[data-location]'
        );

    const locations = [];

    locationElements.forEach(
        locationElement => {
            const originalName =
                locationElement.dataset.location
                    ?.trim();

            if (!originalName) {
                return;
            }

            const dateElements =
                locationElement.querySelectorAll(
                    '.concert-location__date'
                );

            const dates =
                Array.from(dateElements)
                    .map(dateElement => {
                        return dateElement
                            .textContent
                            .trim();
                    })
                    .filter(date => {
                        return date !== '';
                    });

            locations.push({
                originalName,

                displayName:
                    formatLocationName(
                        originalName
                    ),

                dates
            });
        }
    );

    return locations;
}

/*
==========================================================
NORMALIZE GROUPIE TRACKER LOCATION NAMES
==========================================================
*/

function normalizeLocationForSearch(
    location
) {
    const separatorIndex =
        location.lastIndexOf('-');

    /*
    Groupie Tracker locations normally look like:

    playa_del_carmen-mexico

    Everything before the final hyphen is treated as the city.
    Everything after it is treated as the country.
    */

    if (separatorIndex === -1) {
        return location.replaceAll(
            '_',
            ' '
        );
    }

    const city = location
        .slice(0, separatorIndex)
        .replaceAll('_', ' ');

    const country = location
        .slice(separatorIndex + 1)
        .replaceAll('_', ' ');

    return `${city}, ${country}`;
}

function formatLocationName(location) {
    return normalizeLocationForSearch(
        location
    )
        .split(' ')
        .map(capitalizeWord)
        .join(' ');
}

function capitalizeWord(word) {
    if (word.length === 0) {
        return word;
    }

    return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    );
}

/*
==========================================================
GEOCODING
==========================================================
*/

async function geocodeLocation(
    locationName
) {
    const endpoint = new URL(
        '/api/geocode',
        window.location.origin
    );

    /*
    Send the original Groupie Tracker location value.

    The Go backend is responsible for converting values such as:

    new_york-usa

    into:

    new york, usa
    */

    endpoint.searchParams.set(
        'q',
        locationName
    );

    const response = await fetch(
        endpoint,
        {
            method: 'GET',

            headers: {
                Accept: 'application/json'
            }
        }
    );

    if (!response.ok) {
        return null;
    }

    const coordinates =
        await response.json();

    const latitude =
        Number(coordinates.latitude);

    const longitude =
        Number(coordinates.longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    return {
        latitude,
        longitude
    };
}

/*
==========================================================
CREATE LEAFLET MARKERS
==========================================================
*/

function createConcertMarker(
    map,
    coordinates,
    concertLocation
) {
    const markerIcon =
        L.divIcon({
            className:
                'artist-map-marker-wrapper',

            html: `
                <span
                    class="artist-map-marker"
                    aria-hidden="true"
                ></span>
            `,

            iconSize: [28, 38],
            iconAnchor: [14, 38],
            popupAnchor: [0, -34]
        });

    const marker =
        L.marker(
            [
                coordinates.latitude,
                coordinates.longitude
            ],
            {
                icon: markerIcon,

                title:
                    concertLocation.displayName
            }
        );

    marker.bindPopup(
        createPopupContent(
            concertLocation
        ),
        {
            className:
                'artist-map-popup',

            maxWidth: 280
        }
    );

    marker.addTo(map);

    return marker;
}

function createPopupContent(
    concertLocation
) {
    const locationName =
        escapeHTML(
            concertLocation.displayName
        );

    let dateContent = `
        <p class="artist-map-popup__empty">
            No concert dates available.
        </p>
    `;

    if (
        concertLocation.dates.length > 0
    ) {
        const dateItems =
            concertLocation.dates
                .map(date => {
                    return `
                        <li
                            class="artist-map-popup__date"
                        >
                            ${escapeHTML(date)}
                        </li>
                    `;
                })
                .join('');

        dateContent = `
            <ul class="artist-map-popup__dates">
                ${dateItems}
            </ul>
        `;
    }

    return `
        <div class="artist-map-popup__content">
            <strong class="artist-map-popup__title">
                ${locationName}
            </strong>

            ${dateContent}
        </div>
    `;
}

/*
==========================================================
FIT MAP TO MARKERS
==========================================================
*/

function fitMapToMarkers(
    map,
    markerCoordinates
) {
    if (markerCoordinates.length === 0) {
        return;
    }

    if (markerCoordinates.length === 1) {
        map.setView(
            markerCoordinates[0],
            7
        );

        return;
    }

    const markerBounds =
        L.latLngBounds(
            markerCoordinates
        );

    map.fitBounds(
        markerBounds,
        {
            padding: [45, 45],
            maxZoom: 7
        }
    );
}

/*
==========================================================
MAP PLACEHOLDER
==========================================================
*/

function showMapMessage(
    placeholder,
    message
) {
    if (!placeholder) {
        return;
    }

    placeholder.hidden = false;
    placeholder.textContent = message;
}

function removeMapPlaceholder(
    placeholder
) {
    if (!placeholder) {
        return;
    }

    placeholder.hidden = true;
}

/*
==========================================================
HTML SAFETY
==========================================================
*/

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}