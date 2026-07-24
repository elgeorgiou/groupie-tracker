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

const creationYearSelect = document.getElementById('creation-year');
const firstAlbumSelect = document.getElementById('first-album');
const artistSortSelect = document.getElementById('artist-sort');

const resetFiltersButton = document.querySelector('.filters__reset');
const emptyResetButton = document.querySelector('.artists__empty-reset');
const artistsEmptyState = document.querySelector('.artists__empty');

const artistsCountNumber = document.querySelector(
    '.artists__count-number'
);

const pagination = document.querySelector('.pagination');
const paginationList = document.querySelector('.pagination__list');

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
        console.error('Unable to read artist data:', error);

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
    const members = artist.members ?? artist.Members;

    return Array.isArray(members) ? members : [];
}

function getArtistLocations(artist) {
    const locations =
        artist.locationsList ??
        artist.Locations ??
        [];

    return Array.isArray(locations) ? locations : [];
}

function getArtistCreationDate(artist) {
    return artist.creationDate ??
        artist.creation_date ??
        artist.CreationDate ??
        '';
}

function getArtistFirstAlbum(artist) {
    return artist.firstAlbum ??
        artist.first_album ??
        artist.FirstAlbum ??
        '';
}

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/* ==========================================================
   SEARCH CONTROLS
========================================================== */

function updateSearchControls() {
    if (!searchInput || !searchButton || !clearButton) {
        return;
    }

    const hasValue = searchInput.value.trim() !== '';

    searchButton.disabled = !hasValue;
    clearButton.hidden = !hasValue;
}

function closeSuggestions() {
    if (!searchSuggestions || !searchInput) {
        return;
    }

    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = '';

    searchInput.setAttribute('aria-expanded', 'false');

    activeSuggestionIndex = -1;
}

function openSuggestions() {
    if (!searchSuggestions || !searchInput) {
        return;
    }

    searchSuggestions.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
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

    const firstAlbum = getArtistFirstAlbum(artist);
    const members = getArtistMembers(artist);
    const locations = getArtistLocations(artist);

    if (
        normalizeText(artistName).includes(normalizedQuery)
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
            normalizeText(member).includes(normalizedQuery)
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
            normalizeText(location).includes(normalizedQuery)
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
        normalizeText(creationDate).includes(normalizedQuery)
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
        normalizeText(firstAlbum).includes(normalizedQuery)
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
    const matchingSuggestions = artists.flatMap(
        (artist) => {
            return getArtistSuggestions(artist, query);
        }
    );

    const uniqueSuggestions = [];
    const seenSuggestions = new Set();

    matchingSuggestions.forEach((suggestion) => {
        const suggestionKey = [
            suggestion.artistID,
            suggestion.type,
            normalizeText(suggestion.value),
        ].join('|');

        if (seenSuggestions.has(suggestionKey)) {
            return;
        }

        seenSuggestions.add(suggestionKey);
        uniqueSuggestions.push(suggestion);
    });

    return uniqueSuggestions.slice(0, 8);
}

function createSuggestionMarkup(suggestion, index) {
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
                        ${escapeHTML(suggestion.value)}
                    </span>

                    <span class="search__suggestion-type">
                        ${escapeHTML(suggestion.type)}
                        ·
                        ${escapeHTML(suggestion.description)}
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
        getMatchingSuggestions(normalizedQuery);

    if (matchingSuggestions.length === 0) {
        searchSuggestions.innerHTML = `
            <li class="search__suggestions-empty">
                No matching results found
            </li>
        `;

        openSuggestions();

        return;
    }

    searchSuggestions.innerHTML = matchingSuggestions
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
        const isSelected = index === activeSuggestionIndex;

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
        activeSuggestionIndex = buttons.length - 1;
    }

    if (activeSuggestionIndex >= buttons.length) {
        activeSuggestionIndex = 0;
    }

    updateActiveSuggestion();
}

function openArtistPage(artistID) {
    if (!artistID) {
        return;
    }

    window.location.href =
        `/artist?id=${encodeURIComponent(artistID)}`;
}

function selectActiveSuggestion() {
    const buttons = getSuggestionButtons();

    if (
        activeSuggestionIndex < 0 ||
        activeSuggestionIndex >= buttons.length
    ) {
        return false;
    }

    const selectedButton = buttons[activeSuggestionIndex];
    const artistID = selectedButton.dataset.artistId;

    openArtistPage(artistID);

    return true;
}

/* ==========================================================
   SEARCH EVENTS
========================================================== */

if (searchInput) {
    searchInput.addEventListener('input', () => {
        updateSearchControls();
        renderSuggestions(searchInput.value);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== '') {
            renderSuggestions(searchInput.value);
        }
    });

    searchInput.addEventListener('keydown', (event) => {
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
            const suggestionWasSelected =
                selectActiveSuggestion();

            if (suggestionWasSelected) {
                event.preventDefault();
            }
        }
    });
}

if (searchSuggestions) {
    searchSuggestions.addEventListener(
        'click',
        (event) => {
            const suggestionButton = event.target.closest(
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
}

if (clearButton && searchInput) {
    clearButton.addEventListener('click', () => {
        searchInput.value = '';

        updateSearchControls();
        closeSuggestions();

        searchInput.focus();
    });
}

if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (event) => {
        if (searchInput.value.trim() === '') {
            event.preventDefault();

            searchInput.focus();
        }
    });
}

document.addEventListener('click', (event) => {
    if (
        !searchForm ||
        searchForm.contains(event.target)
    ) {
        return;
    }

    closeSuggestions();
});

/* ==========================================================
   FILTER OPTIONS
========================================================== */

function getUniqueSortedValues(values) {
    return [...new Set(values)]
        .filter((value) => {
            return value !== null && value !== '';
        })
        .sort((firstValue, secondValue) => {
            return firstValue - secondValue;
        });
}

function addOptionsToSelect(selectElement, values) {
    if (!selectElement) {
        return;
    }

    values.forEach((value) => {
        const option = document.createElement('option');

        option.value = String(value);
        option.textContent = String(value);

        selectElement.append(option);
    });
}

function populateFilterOptions() {
    const creationYears = getUniqueSortedValues(
        artistCards.map((card) => {
            return parseYear(
                card.dataset.creationYear
            );
        })
    );

    const firstAlbumYears = getUniqueSortedValues(
        artistCards.map((card) => {
            return parseYear(
                card.dataset.firstAlbum
            );
        })
    );

    addOptionsToSelect(
        creationYearSelect,
        creationYears
    );

    addOptionsToSelect(
        firstAlbumSelect,
        firstAlbumYears
    );
}

/* ==========================================================
   FILTERING
========================================================== */

function cardMatchesFilters(card) {
    const selectedCreationYear =
        creationYearSelect?.value ?? '';

    const selectedFirstAlbumYear =
        firstAlbumSelect?.value ?? '';

    const cardCreationYear = String(
        parseYear(card.dataset.creationYear) ?? ''
    );

    const cardFirstAlbumYear = String(
        parseYear(card.dataset.firstAlbum) ?? ''
    );

    const creationYearMatches =
        selectedCreationYear === '' ||
        cardCreationYear === selectedCreationYear;

    const firstAlbumMatches =
        selectedFirstAlbumYear === '' ||
        cardFirstAlbumYear === selectedFirstAlbumYear;

    return (
        creationYearMatches &&
        firstAlbumMatches
    );
}

/* ==========================================================
   SORTING
========================================================== */

function sortCards(cards) {
    const sortValue =
        artistSortSelect?.value ?? 'default';

    return [...cards].sort(
        (firstCard, secondCard) => {
            const firstName = normalizeText(
                firstCard.dataset.artistName
            );

            const secondName = normalizeText(
                secondCard.dataset.artistName
            );

            const firstYear =
                parseYear(
                    firstCard.dataset.creationYear
                ) ?? 0;

            const secondYear =
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
                    return firstYear - secondYear;

                case 'year-descending':
                    return secondYear - firstYear;

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
   PAGINATION
========================================================== */

function getTotalPages() {
    return Math.ceil(
        filteredCards.length / artistsPerPage
    );
}

function createPaginationPageButton(pageNumber) {
    const listItem = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'pagination__page';
    button.dataset.page = String(pageNumber);
    button.textContent = String(pageNumber);

    button.setAttribute(
        'aria-label',
        `Go to page ${pageNumber}`
    );

    if (pageNumber === currentPage) {
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
    const listItem = document.createElement('li');

    listItem.className = 'pagination__ellipsis';
    listItem.textContent = '…';

    listItem.setAttribute(
        'aria-hidden',
        'true'
    );

    return listItem;
}

function getVisiblePageNumbers(totalPages) {
    if (totalPages <= 7) {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1
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
        pages.push('ellipsis-start');
    }

    for (
        let page = startPage;
        page <= endPage;
        page += 1
    ) {
        pages.push(page);
    }

    if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
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

    const totalPages = getTotalPages();

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
        getVisiblePageNumbers(totalPages);

    visiblePages.forEach((page) => {
        if (typeof page === 'number') {
            paginationList.append(
                createPaginationPageButton(page)
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

    artistsCountNumber.textContent = String(
        filteredCards.length
    );
}

function updateEmptyState() {
    if (!artistsEmptyState || !artistsGrid) {
        return;
    }

    const hasArtists =
        filteredCards.length > 0;

    artistsGrid.hidden = !hasArtists;
    artistsEmptyState.hidden = hasArtists;

    if (pagination) {
        pagination.hidden = !hasArtists;
    }
}

function renderArtistCards() {
    if (!artistsGrid) {
        return;
    }

    artistCards.forEach((card) => {
        card.hidden = true;
    });

    const startIndex =
        (currentPage - 1) * artistsPerPage;

    const endIndex =
        startIndex + artistsPerPage;

    const cardsForCurrentPage =
        filteredCards.slice(
            startIndex,
            endIndex
        );

    cardsForCurrentPage.forEach((card) => {
        card.hidden = false;
        artistsGrid.append(card);
    });

    updateArtistCount();
    updateEmptyState();
    renderPagination();
}

function applyFiltersAndSorting() {
    const matchingCards = artistCards.filter(
        cardMatchesFilters
    );

    filteredCards = sortCards(matchingCards);

    currentPage = 1;

    renderArtistCards();
}

function resetFilters() {
    if (creationYearSelect) {
        creationYearSelect.value = '';
    }

    if (firstAlbumSelect) {
        firstAlbumSelect.value = '';
    }

    if (artistSortSelect) {
        artistSortSelect.value = 'default';
    }

    applyFiltersAndSorting();
}

/* ==========================================================
   FILTER AND SORT EVENTS
========================================================== */

creationYearSelect?.addEventListener(
    'change',
    applyFiltersAndSorting
);

firstAlbumSelect?.addEventListener(
    'change',
    applyFiltersAndSorting
);

artistSortSelect?.addEventListener(
    'change',
    applyFiltersAndSorting
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
   PAGINATION EVENTS
========================================================== */

paginationList?.addEventListener(
    'click',
    (event) => {
        const pageButton = event.target.closest(
            '.pagination__page'
        );

        if (!pageButton) {
            return;
        }

        currentPage = Number(
            pageButton.dataset.page
        );

        renderArtistCards();

        document
            .getElementById('artists')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
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

        document
            .getElementById('artists')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }
);

nextPageButton?.addEventListener(
    'click',
    () => {
        const totalPages = getTotalPages();

        if (currentPage >= totalPages) {
            return;
        }

        currentPage += 1;

        renderArtistCards();

        document
            .getElementById('artists')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }
);

/* ==========================================================
   INITIALIZATION
========================================================== */

function initializeSearch() {
    updateSearchControls();
}

function initializeArtistCollection() {
    if (artistCards.length === 0) {
        updateArtistCount();
        updateEmptyState();

        return;
    }

    populateFilterOptions();
    applyFiltersAndSorting();
}

initializeSearch();
initializeArtistCollection();