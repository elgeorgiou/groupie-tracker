'use strict';

/* ==========================================================
   PAGE ELEMENTS
========================================================== */

const searchForm = document.querySelector('.search__form');
const searchInput = document.getElementById('artist-search');
const searchSuggestions = document.getElementById('artist-suggestions');
const searchButton = document.querySelector('.search__submit');
const clearButton = document.querySelector('.search__clear');

const artistsDataElement = document.getElementById('artists-data');
const artistsGrid = document.querySelector('.artists__grid');

const artistCards = Array.from(
    document.querySelectorAll('.artist-card')
);

const creationYearMinimumInput = document.getElementById(
    'creation-year-min'
);

const creationYearMaximumInput = document.getElementById(
    'creation-year-max'
);

const creationYearOutput = document.getElementById(
    'creation-year-output'
);

const creationYearProgress = document.getElementById(
    'creation-year-progress'
);

const firstAlbumMinimumInput = document.getElementById(
    'first-album-min'
);

const firstAlbumMaximumInput = document.getElementById(
    'first-album-max'
);

const firstAlbumOutput = document.getElementById(
    'first-album-output'
);

const firstAlbumProgress = document.getElementById(
    'first-album-progress'
);

const memberCountFilters = document.getElementById(
    'member-count-filters'
);

const locationFilters = document.getElementById(
    'location-filters'
);

const memberCountDropdown = document.getElementById(
    'member-count-dropdown'
);

const locationDropdown = document.getElementById(
    'location-dropdown'
);

const memberCountSummary = document.getElementById(
    'member-count-summary'
);

const locationSummary = document.getElementById(
    'location-summary'
);

const artistSortSelect = document.getElementById(
    'artist-sort'
);

const resetFiltersButton = document.querySelector(
    '.filters__reset'
);

const emptyResetButton = document.querySelector(
    '.artists__empty-reset'
);

const artistsEmptyState = document.querySelector(
    '.artists__empty'
);

const artistsCountNumber = document.querySelector(
    '.artists__count-number'
);

const pagination = document.querySelector(
    '.pagination'
);

const paginationList = document.querySelector(
    '.pagination__list'
);

const previousPageButton = document.querySelector(
    '.pagination__button--previous'
);

const nextPageButton = document.querySelector(
    '.pagination__button--next'
);

/* ==========================================================
   APPLICATION STATE
========================================================== */

const artistsPerPage = 10;

let artists = [];
let filteredCards = [...artistCards];
let currentPage = 1;
let activeSuggestionIndex = -1;

let creationYearBounds = {
    minimum: 0,
    maximum: 0,
};

let firstAlbumBounds = {
    minimum: 0,
    maximum: 0,
};

/* ==========================================================
   ARTIST DATA
========================================================== */

function readArtistsData() {
    if (!artistsDataElement) {
        return [];
    }

    const rawData = artistsDataElement.textContent.trim();

    if (rawData === '') {
        return [];
    }

    try {
        const parsedData = JSON.parse(rawData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData;
    } catch (error) {
        console.error(
            'Unable to read artist data:',
            error
        );

        return [];
    }
}

artists = readArtistsData();

/* ==========================================================
   GENERAL HELPERS
========================================================== */

function normalizeText(value) {
    return String(value ?? '')
        .trim()
        .toLocaleLowerCase();
}

function parseYear(value) {
    const match = String(value ?? '').match(/\d{4}/);

    if (!match) {
        return null;
    }

    return Number(match[0]);
}

function getArtistID(artist) {
    return artist.id ?? artist.ID;
}

function getArtistName(artist) {
    return artist.name ?? artist.Name ?? '';
}

function getArtistImage(artist) {
    return artist.image ?? artist.Image ?? '';
}

function getArtistMembers(artist) {
    const members =
        artist.members ??
        artist.Members ??
        [];

    return Array.isArray(members)
        ? members
        : [];
}

function getArtistLocations(artist) {
    const locations =
        artist.locationsList ??
        artist.Locations ??
        [];

    return Array.isArray(locations)
        ? locations
        : [];
}

function getArtistCreationDate(artist) {
    return (
        artist.creationDate ??
        artist.creation_date ??
        artist.CreationDate ??
        ''
    );
}

function getArtistFirstAlbum(artist) {
    return (
        artist.firstAlbum ??
        artist.first_album ??
        artist.FirstAlbum ??
        ''
    );
}

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getUniqueSortedNumbers(values) {
    return [...new Set(values)]
        .filter((value) => {
            return Number.isFinite(value);
        })
        .sort((firstValue, secondValue) => {
            return firstValue - secondValue;
        });
}

function getUniqueSortedText(values) {
    return [...new Set(values)]
        .filter((value) => {
            return String(value).trim() !== '';
        })
        .sort((firstValue, secondValue) => {
            return String(firstValue).localeCompare(
                String(secondValue)
            );
        });
}

function getArtistByCard(card) {
    const cardArtistID = Number(
        card.dataset.artistId
    );

    return artists.find((artist) => {
        return (
            Number(getArtistID(artist)) ===
            cardArtistID
        );
    });
}

/* ==========================================================
   SEARCH CONTROLS
========================================================== */

function updateSearchControls() {
    if (
        !searchInput ||
        !searchButton ||
        !clearButton
    ) {
        return;
    }

    const hasValue =
        searchInput.value.trim() !== '';

    searchButton.disabled = !hasValue;
    clearButton.hidden = !hasValue;
}

function closeSuggestions() {
    if (
        !searchSuggestions ||
        !searchInput
    ) {
        return;
    }

    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = '';

    searchInput.setAttribute(
        'aria-expanded',
        'false'
    );

    activeSuggestionIndex = -1;
}

function openSuggestions() {
    if (
        !searchSuggestions ||
        !searchInput
    ) {
        return;
    }

    searchSuggestions.hidden = false;

    searchInput.setAttribute(
        'aria-expanded',
        'true'
    );
}

/* ==========================================================
   SEARCH SUGGESTIONS
========================================================== */

function createSearchSuggestion(
    artist,
    value,
    type,
    description
) {
    return {
        artistID: getArtistID(artist),
        artistName: getArtistName(artist),
        artistImage: getArtistImage(artist),
        value,
        type,
        description,
    };
}

function getArtistSuggestions(artist, query) {
    const normalizedQuery = normalizeText(query);
    const suggestions = [];

    const artistName = getArtistName(artist);

    const creationDate = String(
        getArtistCreationDate(artist)
    );

    const firstAlbum =
        getArtistFirstAlbum(artist);

    const members =
        getArtistMembers(artist);

    const locations =
        getArtistLocations(artist);

    if (
        normalizeText(artistName).includes(
            normalizedQuery
        )
    ) {
        suggestions.push(
            createSearchSuggestion(
                artist,
                artistName,
                'Artist',
                `Formed ${creationDate}`
            )
        );
    }

    members.forEach((member) => {
        if (
            normalizeText(member).includes(
                normalizedQuery
            )
        ) {
            suggestions.push(
                createSearchSuggestion(
                    artist,
                    member,
                    'Member',
                    `Member of ${artistName}`
                )
            );
        }
    });

    locations.forEach((location) => {
        if (
            normalizeText(location).includes(
                normalizedQuery
            )
        ) {
            suggestions.push(
                createSearchSuggestion(
                    artist,
                    location,
                    'Location',
                    `Concert location for ${artistName}`
                )
            );
        }
    });

    if (
        normalizeText(creationDate).includes(
            normalizedQuery
        )
    ) {
        suggestions.push(
            createSearchSuggestion(
                artist,
                creationDate,
                'Creation Date',
                artistName
            )
        );
    }

    if (
        normalizeText(firstAlbum).includes(
            normalizedQuery
        )
    ) {
        suggestions.push(
            createSearchSuggestion(
                artist,
                firstAlbum,
                'First Album',
                artistName
            )
        );
    }

    return suggestions;
}

function getMatchingSuggestions(query) {
    const matchingSuggestions =
        artists.flatMap((artist) => {
            return getArtistSuggestions(
                artist,
                query
            );
        });

    const uniqueSuggestions = [];
    const seenSuggestions = new Set();

    matchingSuggestions.forEach(
        (suggestion) => {
            const suggestionKey = [
                suggestion.artistID,
                suggestion.type,
                normalizeText(
                    suggestion.value
                ),
            ].join('|');

            if (
                seenSuggestions.has(
                    suggestionKey
                )
            ) {
                return;
            }

            seenSuggestions.add(
                suggestionKey
            );

            uniqueSuggestions.push(
                suggestion
            );
        }
    );

    return uniqueSuggestions.slice(0, 8);
}

function createSuggestionMarkup(
    suggestion,
    index
) {
    return `
        <li role="presentation">
            <button
                class="search__suggestion"
                type="button"
                role="option"
                aria-selected="false"
                data-suggestion-index="${index}"
                data-artist-id="${escapeHTML(
                    suggestion.artistID
                )}"
            >
                <img
                    class="search__suggestion-image"
                    src="${escapeHTML(
                        suggestion.artistImage
                    )}"
                    alt=""
                    loading="lazy"
                >

                <span class="search__suggestion-content">
                    <span class="search__suggestion-name">
                        ${escapeHTML(
                            suggestion.value
                        )}
                    </span>

                    <span class="search__suggestion-type">
                        ${escapeHTML(
                            suggestion.type
                        )}
                        ·
                        ${escapeHTML(
                            suggestion.description
                        )}
                    </span>
                </span>

                <span
                    class="search__suggestion-arrow"
                    aria-hidden="true"
                >
                    →
                </span>
            </button>
        </li>
    `;
}

function renderSuggestions(query) {
    if (!searchSuggestions) {
        return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery === '') {
        closeSuggestions();

        return;
    }

    const matchingSuggestions =
        getMatchingSuggestions(
            normalizedQuery
        );

    if (
        matchingSuggestions.length === 0
    ) {
        searchSuggestions.innerHTML = `
            <li class="search__suggestions-empty">
                No matching results found
            </li>
        `;

        openSuggestions();

        return;
    }

    searchSuggestions.innerHTML =
        matchingSuggestions
            .map(createSuggestionMarkup)
            .join('');

    activeSuggestionIndex = -1;

    openSuggestions();
}

function getSuggestionButtons() {
    if (!searchSuggestions) {
        return [];
    }

    return Array.from(
        searchSuggestions.querySelectorAll(
            '.search__suggestion'
        )
    );
}

function updateActiveSuggestion() {
    const buttons = getSuggestionButtons();

    buttons.forEach((button, index) => {
        const isSelected =
            index === activeSuggestionIndex;

        button.setAttribute(
            'aria-selected',
            String(isSelected)
        );

        if (isSelected) {
            button.scrollIntoView({
                block: 'nearest',
            });
        }
    });
}

function moveSuggestionSelection(direction) {
    const buttons = getSuggestionButtons();

    if (buttons.length === 0) {
        return;
    }

    activeSuggestionIndex += direction;

    if (activeSuggestionIndex < 0) {
        activeSuggestionIndex =
            buttons.length - 1;
    }

    if (
        activeSuggestionIndex >=
        buttons.length
    ) {
        activeSuggestionIndex = 0;
    }

    updateActiveSuggestion();
}

function openArtistPage(artistID) {
    if (!artistID) {
        return;
    }

    window.location.href =
        `/artist?id=${encodeURIComponent(
            artistID
        )}`;
}

function selectActiveSuggestion() {
    const buttons = getSuggestionButtons();

    if (
        activeSuggestionIndex < 0 ||
        activeSuggestionIndex >=
        buttons.length
    ) {
        return false;
    }

    const selectedButton =
        buttons[activeSuggestionIndex];

    openArtistPage(
        selectedButton.dataset.artistId
    );

    return true;
}

/* ==========================================================
   SEARCH EVENTS
========================================================== */

if (searchInput) {
    searchInput.addEventListener(
        'input',
        () => {
            updateSearchControls();

            renderSuggestions(
                searchInput.value
            );
        }
    );

    searchInput.addEventListener(
        'focus',
        () => {
            if (
                searchInput.value.trim() !==
                ''
            ) {
                renderSuggestions(
                    searchInput.value
                );
            }
        }
    );

    searchInput.addEventListener(
        'keydown',
        (event) => {
            if (
                event.key === 'ArrowDown' &&
                !searchSuggestions?.hidden
            ) {
                event.preventDefault();
                moveSuggestionSelection(1);

                return;
            }

            if (
                event.key === 'ArrowUp' &&
                !searchSuggestions?.hidden
            ) {
                event.preventDefault();
                moveSuggestionSelection(-1);

                return;
            }

            if (event.key === 'Escape') {
                closeSuggestions();

                return;
            }

            if (event.key === 'Enter') {
                const selected =
                    selectActiveSuggestion();

                if (selected) {
                    event.preventDefault();
                }
            }
        }
    );
}

searchSuggestions?.addEventListener(
    'click',
    (event) => {
        const suggestionButton =
            event.target.closest(
                '.search__suggestion'
            );

        if (!suggestionButton) {
            return;
        }

        openArtistPage(
            suggestionButton.dataset.artistId
        );
    }
);

if (
    clearButton &&
    searchInput
) {
    clearButton.addEventListener(
        'click',
        () => {
            searchInput.value = '';

            updateSearchControls();
            closeSuggestions();

            searchInput.focus();
        }
    );
}

if (
    searchForm &&
    searchInput
) {
    searchForm.addEventListener(
        'submit',
        (event) => {
            if (
                searchInput.value.trim() ===
                ''
            ) {
                event.preventDefault();
                searchInput.focus();
            }
        }
    );
}

/* ==========================================================
   CHECKBOX OPTION CREATION
========================================================== */

function createSafeID(
    prefix,
    value,
    index
) {
    const normalizedValue =
        normalizeText(value)
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .replace(
                /[^a-z0-9]+/g,
                '-'
            )
            .replace(
                /^-+|-+$/g,
                ''
            );

    return [
        prefix,
        normalizedValue || 'option',
        index,
    ].join('-');
}

function createCheckboxElement({
    id,
    name,
    value,
    label,
}) {
    const checkboxLabel =
        document.createElement('label');

    checkboxLabel.className =
        'filters__checkbox';

    checkboxLabel.htmlFor = id;

    const checkboxInput =
        document.createElement('input');

    checkboxInput.id = id;
    checkboxInput.className =
        'filters__checkbox-input';

    checkboxInput.type = 'checkbox';
    checkboxInput.name = name;
    checkboxInput.value = String(value);

    const checkboxControl =
        document.createElement('span');

    checkboxControl.className =
        'filters__checkbox-control';

    const checkboxIcon =
        document.createElement('span');

    checkboxIcon.className =
        'filters__checkbox-icon';

    checkboxIcon.setAttribute(
        'aria-hidden',
        'true'
    );

    checkboxIcon.textContent = '✓';

    const checkboxText =
        document.createElement('span');

    checkboxText.className =
        'filters__checkbox-label';

    checkboxText.textContent = label;

    checkboxControl.append(
        checkboxIcon
    );

    checkboxLabel.append(
        checkboxInput,
        checkboxControl,
        checkboxText
    );

    return checkboxLabel;
}

function populateMemberCountFilters() {
    if (!memberCountFilters) {
        return;
    }

    const memberCounts =
        getUniqueSortedNumbers(
            artistCards.map((card) => {
                return Number(
                    card.dataset.memberCount
                );
            })
        );

    memberCountFilters.innerHTML = '';

    memberCounts.forEach(
        (memberCount, index) => {
            const label =
                memberCount === 1
                    ? '1 member'
                    : `${memberCount} members`;

            const checkbox =
                createCheckboxElement({
                    id: createSafeID(
                        'member-count',
                        memberCount,
                        index
                    ),
                    name: 'member-count',
                    value: memberCount,
                    label,
                });

            memberCountFilters.append(
                checkbox
            );
        }
    );
}

function populateLocationFilters() {
    if (!locationFilters) {
        return;
    }

    const locations =
        getUniqueSortedText(
            artists.flatMap((artist) => {
                return getArtistLocations(
                    artist
                );
            })
        );

    locationFilters.innerHTML = '';

    locations.forEach(
        (location, index) => {
            const checkbox =
                createCheckboxElement({
                    id: createSafeID(
                        'location',
                        location,
                        index
                    ),
                    name: 'location',
                    value: location,
                    label: location,
                });

            locationFilters.append(
                checkbox
            );
        }
    );
}

/* ==========================================================
   RANGE FILTERS
========================================================== */

function getCardYears(datasetProperty) {
    return getUniqueSortedNumbers(
        artistCards.map((card) => {
            return parseYear(
                card.dataset[datasetProperty]
            );
        })
    );
}

function configureRangeFilter({
    minimumInput,
    maximumInput,
    years,
}) {
    if (
        !minimumInput ||
        !maximumInput ||
        years.length === 0
    ) {
        return {
            minimum: 0,
            maximum: 0,
        };
    }

    const minimum = years[0];
    const maximum =
        years[years.length - 1];

    minimumInput.min = String(minimum);
    minimumInput.max = String(maximum);
    minimumInput.value = String(minimum);

    maximumInput.min = String(minimum);
    maximumInput.max = String(maximum);
    maximumInput.value = String(maximum);

    return {
        minimum,
        maximum,
    };
}

function updateRangePresentation({
    minimumInput,
    maximumInput,
    output,
    progress,
}) {
    if (
        !minimumInput ||
        !maximumInput
    ) {
        return;
    }

    const rangeMinimum =
        Number(minimumInput.min);

    const rangeMaximum =
        Number(minimumInput.max);

    const selectedMinimum =
        Number(minimumInput.value);

    const selectedMaximum =
        Number(maximumInput.value);

    if (output) {
        output.textContent =
            `${selectedMinimum} – ${selectedMaximum}`;
    }

    if (
        !progress ||
        rangeMaximum === rangeMinimum
    ) {
        return;
    }

    const minimumPercentage =
        (
            (selectedMinimum - rangeMinimum) /
            (rangeMaximum - rangeMinimum)
        ) * 100;

    const maximumPercentage =
        (
            (selectedMaximum - rangeMinimum) /
            (rangeMaximum - rangeMinimum)
        ) * 100;

    progress.style.left =
        `${minimumPercentage}%`;

    progress.style.right =
        `${100 - maximumPercentage}%`;
}

function normalizeRangeInputs(
    changedInput,
    minimumInput,
    maximumInput
) {
    if (
        !minimumInput ||
        !maximumInput
    ) {
        return;
    }

    const minimumValue =
        Number(minimumInput.value);

    const maximumValue =
        Number(maximumInput.value);

    if (minimumValue <= maximumValue) {
        return;
    }

    if (changedInput === minimumInput) {
        minimumInput.value =
            maximumInput.value;

        return;
    }

    maximumInput.value =
        minimumInput.value;
}

function updateCreationYearRange() {
    updateRangePresentation({
        minimumInput:
            creationYearMinimumInput,
        maximumInput:
            creationYearMaximumInput,
        output:
            creationYearOutput,
        progress:
            creationYearProgress,
    });
}

function updateFirstAlbumRange() {
    updateRangePresentation({
        minimumInput:
            firstAlbumMinimumInput,
        maximumInput:
            firstAlbumMaximumInput,
        output:
            firstAlbumOutput,
        progress:
            firstAlbumProgress,
    });
}

function initializeRangeFilters() {
    const creationYears =
        getCardYears('creationYear');

    const firstAlbumYears =
        getCardYears('firstAlbum');

    creationYearBounds =
        configureRangeFilter({
            minimumInput:
                creationYearMinimumInput,
            maximumInput:
                creationYearMaximumInput,
            years: creationYears,
        });

    firstAlbumBounds =
        configureRangeFilter({
            minimumInput:
                firstAlbumMinimumInput,
            maximumInput:
                firstAlbumMaximumInput,
            years: firstAlbumYears,
        });

    updateCreationYearRange();
    updateFirstAlbumRange();
}

/* ==========================================================
   SELECTED CHECKBOX VALUES
========================================================== */

function getSelectedCheckboxValues(
    container,
    inputName
) {
    if (!container) {
        return [];
    }

    const selectedInputs =
        container.querySelectorAll(
            `input[name="${inputName}"]:checked`
        );

    return Array.from(
        selectedInputs,
        (checkbox) => {
            return checkbox.value;
        }
    );
}

function getSelectedMemberCounts() {
    return getSelectedCheckboxValues(
        memberCountFilters,
        'member-count'
    ).map((value) => {
        return Number(value);
    });
}

function getSelectedLocations() {
    return getSelectedCheckboxValues(
        locationFilters,
        'location'
    );
}

/* ==========================================================
   DROPDOWN FILTERS
========================================================== */

function updateMemberCountSummary() {
    if (!memberCountSummary) {
        return;
    }

    const selectedMemberCounts =
        getSelectedMemberCounts();

    if (
        selectedMemberCounts.length === 0
    ) {
        memberCountSummary.textContent =
            'Select member count';

        return;
    }

    if (
        selectedMemberCounts.length === 1
    ) {
        const count =
            selectedMemberCounts[0];

        memberCountSummary.textContent =
            count === 1
                ? '1 member'
                : `${count} members`;

        return;
    }

    memberCountSummary.textContent =
        `${selectedMemberCounts.length} options selected`;
}

function updateLocationSummary() {
    if (!locationSummary) {
        return;
    }

    const selectedLocations =
        getSelectedLocations();

    if (
        selectedLocations.length === 0
    ) {
        locationSummary.textContent =
            'Select concert locations';

        return;
    }

    if (
        selectedLocations.length === 1
    ) {
        locationSummary.textContent =
            selectedLocations[0];

        return;
    }

    locationSummary.textContent =
        `${selectedLocations.length} locations selected`;
}

function updateDropdownSummaries() {
    updateMemberCountSummary();
    updateLocationSummary();
}

function closeFilterDropdowns(
    exceptDropdown = null
) {
    [
        memberCountDropdown,
        locationDropdown,
    ].forEach((dropdown) => {
        if (
            dropdown &&
            dropdown !== exceptDropdown
        ) {
            dropdown.open = false;
        }
    });
}

/* ==========================================================
   RANGE MATCHING
========================================================== */

function yearMatchesRange(
    year,
    minimumYear,
    maximumYear
) {
    if (year === null) {
        return false;
    }

    return (
        year >= minimumYear &&
        year <= maximumYear
    );
}

/* ==========================================================
   CARD FILTER HELPERS
========================================================== */

function cardMatchesCreationYear(card) {
    if (
        !creationYearMinimumInput ||
        !creationYearMaximumInput
    ) {
        return true;
    }

    const cardCreationYear =
        parseYear(
            card.dataset.creationYear
        );

    return yearMatchesRange(
        cardCreationYear,
        Number(
            creationYearMinimumInput.value
        ),
        Number(
            creationYearMaximumInput.value
        )
    );
}

function cardMatchesFirstAlbumYear(card) {
    if (
        !firstAlbumMinimumInput ||
        !firstAlbumMaximumInput
    ) {
        return true;
    }

    const cardFirstAlbumYear =
        parseYear(
            card.dataset.firstAlbum
        );

    return yearMatchesRange(
        cardFirstAlbumYear,
        Number(
            firstAlbumMinimumInput.value
        ),
        Number(
            firstAlbumMaximumInput.value
        )
    );
}

function cardMatchesMemberCount(card) {
    const selectedMemberCounts =
        getSelectedMemberCounts();

    if (
        selectedMemberCounts.length === 0
    ) {
        return true;
    }

    const cardMemberCount =
        Number(
            card.dataset.memberCount
        );

    if (
        !Number.isFinite(
            cardMemberCount
        )
    ) {
        return false;
    }

    return selectedMemberCounts.includes(
        cardMemberCount
    );
}

function cardMatchesLocations(card) {
    const selectedLocations =
        getSelectedLocations();

    if (
        selectedLocations.length === 0
    ) {
        return true;
    }

    const artist =
        getArtistByCard(card);

    if (!artist) {
        return false;
    }

    const normalizedArtistLocations =
        getArtistLocations(artist).map(
            normalizeText
        );

    return selectedLocations.some(
        (selectedLocation) => {
            return normalizedArtistLocations.includes(
                normalizeText(
                    selectedLocation
                )
            );
        }
    );
}

function cardMatchesFilters(card) {
    return (
        cardMatchesCreationYear(card) &&
        cardMatchesFirstAlbumYear(card) &&
        cardMatchesMemberCount(card) &&
        cardMatchesLocations(card)
    );
}

/* ==========================================================
   SORTING
========================================================== */

function sortCards(cards) {
    const sortValue =
        artistSortSelect?.value ??
        'default';

    return [...cards].sort(
        (
            firstCard,
            secondCard
        ) => {
            const firstName =
                normalizeText(
                    firstCard.dataset.artistName
                );

            const secondName =
                normalizeText(
                    secondCard.dataset.artistName
                );

            const firstCreationYear =
                parseYear(
                    firstCard.dataset.creationYear
                ) ?? 0;

            const secondCreationYear =
                parseYear(
                    secondCard.dataset.creationYear
                ) ?? 0;

            switch (sortValue) {
                case 'name-ascending':
                    return firstName.localeCompare(
                        secondName
                    );

                case 'name-descending':
                    return secondName.localeCompare(
                        firstName
                    );

                case 'year-ascending':
                    return (
                        firstCreationYear -
                        secondCreationYear
                    );

                case 'year-descending':
                    return (
                        secondCreationYear -
                        firstCreationYear
                    );

                default:
                    return (
                        Number(
                            firstCard.dataset.artistId
                        ) -
                        Number(
                            secondCard.dataset.artistId
                        )
                    );
            }
        }
    );
}

/* ==========================================================
   ACTIVE FILTER STATE
========================================================== */

function hasActiveFilters() {
    const creationRangeChanged =
        creationYearMinimumInput &&
        creationYearMaximumInput &&
        (
            Number(
                creationYearMinimumInput.value
            ) !== creationYearBounds.minimum ||
            Number(
                creationYearMaximumInput.value
            ) !== creationYearBounds.maximum
        );

    const firstAlbumRangeChanged =
        firstAlbumMinimumInput &&
        firstAlbumMaximumInput &&
        (
            Number(
                firstAlbumMinimumInput.value
            ) !== firstAlbumBounds.minimum ||
            Number(
                firstAlbumMaximumInput.value
            ) !== firstAlbumBounds.maximum
        );

    const hasMemberFilter =
        getSelectedMemberCounts()
            .length > 0;

    const hasLocationFilter =
        getSelectedLocations()
            .length > 0;

    const selectedSort =
        artistSortSelect?.value ??
        'default';

    const hasSorting =
        selectedSort !== 'default';

    return (
        creationRangeChanged ||
        firstAlbumRangeChanged ||
        hasMemberFilter ||
        hasLocationFilter ||
        hasSorting
    );
}

function updateResetButtonState() {
    if (!resetFiltersButton) {
        return;
    }

    resetFiltersButton.disabled =
        !hasActiveFilters();
}

/* ==========================================================
   PAGINATION
========================================================== */

function getTotalPages() {
    return Math.ceil(
        filteredCards.length /
        artistsPerPage
    );
}

function createPaginationPageButton(
    pageNumber
) {
    const listItem =
        document.createElement('li');

    const button =
        document.createElement('button');

    button.type = 'button';
    button.className =
        'pagination__page';

    button.dataset.page =
        String(pageNumber);

    button.textContent =
        String(pageNumber);

    button.setAttribute(
        'aria-label',
        `Go to page ${pageNumber}`
    );

    if (
        pageNumber === currentPage
    ) {
        button.classList.add(
            'pagination__page--active'
        );

        button.setAttribute(
            'aria-current',
            'page'
        );
    }

    listItem.append(button);

    return listItem;
}

function createPaginationEllipsis() {
    const listItem =
        document.createElement('li');

    listItem.className =
        'pagination__ellipsis';

    listItem.textContent = '…';

    listItem.setAttribute(
        'aria-hidden',
        'true'
    );

    return listItem;
}

function getVisiblePageNumbers(
    totalPages
) {
    if (totalPages <= 7) {
        return Array.from(
            {
                length: totalPages,
            },
            (_, index) => {
                return index + 1;
            }
        );
    }

    const pages = [1];

    const startPage = Math.max(
        2,
        currentPage - 1
    );

    const endPage = Math.min(
        totalPages - 1,
        currentPage + 1
    );

    if (startPage > 2) {
        pages.push(
            'ellipsis-start'
        );
    }

    for (
        let page = startPage;
        page <= endPage;
        page += 1
    ) {
        pages.push(page);
    }

    if (
        endPage <
        totalPages - 1
    ) {
        pages.push(
            'ellipsis-end'
        );
    }

    pages.push(totalPages);

    return pages;
}

function renderPagination() {
    if (
        !pagination ||
        !paginationList ||
        !previousPageButton ||
        !nextPageButton
    ) {
        return;
    }

    const totalPages =
        getTotalPages();

    paginationList.innerHTML = '';

    if (totalPages <= 1) {
        pagination.hidden = true;

        return;
    }

    pagination.hidden = false;

    previousPageButton.disabled =
        currentPage === 1;

    nextPageButton.disabled =
        currentPage === totalPages;

    const visiblePages =
        getVisiblePageNumbers(
            totalPages
        );

    visiblePages.forEach((page) => {
        if (
            typeof page === 'number'
        ) {
            paginationList.append(
                createPaginationPageButton(
                    page
                )
            );

            return;
        }

        paginationList.append(
            createPaginationEllipsis()
        );
    });
}

/* ==========================================================
   ARTIST COLLECTION
========================================================== */

function updateArtistCount() {
    if (!artistsCountNumber) {
        return;
    }

    artistsCountNumber.textContent =
        String(filteredCards.length);
}

function updateEmptyState() {
    if (
        !artistsEmptyState ||
        !artistsGrid
    ) {
        return;
    }

    const hasArtists =
        filteredCards.length > 0;

    artistsGrid.hidden =
        !hasArtists;

    artistsEmptyState.hidden =
        hasArtists;

    if (
        pagination &&
        !hasArtists
    ) {
        pagination.hidden = true;
    }
}

function renderArtistCards() {
    if (!artistsGrid) {
        return;
    }

    artistCards.forEach((card) => {
        card.hidden = true;
    });

    const totalPages =
        getTotalPages();

    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {
        currentPage = totalPages;
    }

    const startIndex =
        (currentPage - 1) *
        artistsPerPage;

    const endIndex =
        startIndex +
        artistsPerPage;

    const cardsForCurrentPage =
        filteredCards.slice(
            startIndex,
            endIndex
        );

    cardsForCurrentPage.forEach(
        (card) => {
            card.hidden = false;
            artistsGrid.append(card);
        }
    );

    updateArtistCount();
    updateEmptyState();
    renderPagination();
}

function applyFiltersAndSorting() {
    const matchingCards =
        artistCards.filter(
            cardMatchesFilters
        );

    filteredCards =
        sortCards(matchingCards);

    currentPage = 1;

    updateDropdownSummaries();
    updateResetButtonState();
    renderArtistCards();
}

/* ==========================================================
   RESET FILTERS
========================================================== */

function resetCheckboxes(container) {
    if (!container) {
        return;
    }

    const checkboxes =
        container.querySelectorAll(
            'input[type="checkbox"]'
        );

    checkboxes.forEach(
        (checkbox) => {
            checkbox.checked = false;
        }
    );
}

function resetRangeFilter(
    minimumInput,
    maximumInput,
    bounds
) {
    if (
        !minimumInput ||
        !maximumInput
    ) {
        return;
    }

    minimumInput.value =
        String(bounds.minimum);

    maximumInput.value =
        String(bounds.maximum);
}

function resetFilters() {
    resetRangeFilter(
        creationYearMinimumInput,
        creationYearMaximumInput,
        creationYearBounds
    );

    resetRangeFilter(
        firstAlbumMinimumInput,
        firstAlbumMaximumInput,
        firstAlbumBounds
    );

    if (artistSortSelect) {
        artistSortSelect.value =
            'default';
    }

    resetCheckboxes(
        memberCountFilters
    );

    resetCheckboxes(
        locationFilters
    );

    closeFilterDropdowns();

    updateCreationYearRange();
    updateFirstAlbumRange();

    applyFiltersAndSorting();
}

/* ==========================================================
   RANGE EVENTS
========================================================== */

function handleCreationYearRangeInput(event) {
    normalizeRangeInputs(
        event.target,
        creationYearMinimumInput,
        creationYearMaximumInput
    );

    updateCreationYearRange();
    applyFiltersAndSorting();
}

function handleFirstAlbumRangeInput(event) {
    normalizeRangeInputs(
        event.target,
        firstAlbumMinimumInput,
        firstAlbumMaximumInput
    );

    updateFirstAlbumRange();
    applyFiltersAndSorting();
}

creationYearMinimumInput?.addEventListener(
    'input',
    handleCreationYearRangeInput
);

creationYearMaximumInput?.addEventListener(
    'input',
    handleCreationYearRangeInput
);

firstAlbumMinimumInput?.addEventListener(
    'input',
    handleFirstAlbumRangeInput
);

firstAlbumMaximumInput?.addEventListener(
    'input',
    handleFirstAlbumRangeInput
);

/* ==========================================================
   OTHER FILTER EVENTS
========================================================== */

artistSortSelect?.addEventListener(
    'change',
    applyFiltersAndSorting
);

memberCountFilters?.addEventListener(
    'change',
    (event) => {
        const checkbox =
            event.target.closest(
                'input[type="checkbox"]'
            );

        if (!checkbox) {
            return;
        }

        applyFiltersAndSorting();
    }
);

locationFilters?.addEventListener(
    'change',
    (event) => {
        const checkbox =
            event.target.closest(
                'input[type="checkbox"]'
            );

        if (!checkbox) {
            return;
        }

        applyFiltersAndSorting();
    }
);

memberCountDropdown?.addEventListener(
    'toggle',
    () => {
        if (
            memberCountDropdown.open
        ) {
            closeFilterDropdowns(
                memberCountDropdown
            );
        }
    }
);

locationDropdown?.addEventListener(
    'toggle',
    () => {
        if (
            locationDropdown.open
        ) {
            closeFilterDropdowns(
                locationDropdown
            );
        }
    }
);

resetFiltersButton?.addEventListener(
    'click',
    resetFilters
);

emptyResetButton?.addEventListener(
    'click',
    resetFilters
);

/* ==========================================================
   DOCUMENT CLICK EVENTS
========================================================== */

document.addEventListener(
    'click',
    (event) => {
        if (
            searchForm &&
            !searchForm.contains(
                event.target
            )
        ) {
            closeSuggestions();
        }

        const clickedInsideDropdown =
            memberCountDropdown?.contains(
                event.target
            ) ||
            locationDropdown?.contains(
                event.target
            );

        if (!clickedInsideDropdown) {
            closeFilterDropdowns();
        }
    }
);

/* ==========================================================
   PAGINATION EVENTS
========================================================== */

function scrollToArtistsSection() {
    document
        .getElementById('artists')
        ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
}

paginationList?.addEventListener(
    'click',
    (event) => {
        const pageButton =
            event.target.closest(
                '.pagination__page'
            );

        if (!pageButton) {
            return;
        }

        const selectedPage =
            Number(
                pageButton.dataset.page
            );

        if (
            !Number.isInteger(
                selectedPage
            ) ||
            selectedPage < 1
        ) {
            return;
        }

        currentPage = selectedPage;

        renderArtistCards();
        scrollToArtistsSection();
    }
);

previousPageButton?.addEventListener(
    'click',
    () => {
        if (currentPage <= 1) {
            return;
        }

        currentPage -= 1;

        renderArtistCards();
        scrollToArtistsSection();
    }
);

nextPageButton?.addEventListener(
    'click',
    () => {
        const totalPages =
            getTotalPages();

        if (
            currentPage >= totalPages
        ) {
            return;
        }

        currentPage += 1;

        renderArtistCards();
        scrollToArtistsSection();
    }
);

/* ==========================================================
   INITIALIZATION
========================================================== */

function initializeSearch() {
    updateSearchControls();
    closeSuggestions();
}

function initializeFilterOptions() {
    initializeRangeFilters();
    populateMemberCountFilters();
    populateLocationFilters();
    updateDropdownSummaries();
}

function initializeArtistCollection() {
    if (
        artistCards.length === 0
    ) {
        filteredCards = [];

        updateArtistCount();
        updateEmptyState();
        updateResetButtonState();
        updateDropdownSummaries();

        return;
    }

    initializeFilterOptions();
    applyFiltersAndSorting();
}

initializeSearch();
initializeArtistCollection();