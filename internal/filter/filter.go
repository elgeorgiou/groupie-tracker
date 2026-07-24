// Package filter contains the artist filtering logic used by
// the Groupie Tracker filters extension.
package filter

import (
	"strconv"
	"strings"
	"time"

	"groupie-tracker/internal/geocoder"
	"groupie-tracker/internal/models"
)

// Options contains all filtering values selected by the client.
type Options struct {
	CreationFrom int
	CreationTo   int

	AlbumFrom int
	AlbumTo   int

	MemberCounts []int
	Locations    []string
}

// Artists returns only the artists that satisfy every active filter.
func Artists(
	artists []models.Artist,
	options Options,
) []models.Artist {
	filtered := make([]models.Artist, 0, len(artists))

	for _, artist := range artists {
		if !matchesCreationDate(artist, options) {
			continue
		}

		if !matchesFirstAlbumDate(artist, options) {
			continue
		}

		if !matchesMemberCount(artist, options) {
			continue
		}

		if !matchesLocations(artist, options) {
			continue
		}

		filtered = append(filtered, artist)
	}

	return filtered
}

// ParseInteger converts a query-string value into an integer.
//
// An empty or invalid value returns zero, which represents
// an inactive numeric filter.
func ParseInteger(value string) int {
	value = strings.TrimSpace(value)

	if value == "" {
		return 0
	}

	number, err := strconv.Atoi(value)
	if err != nil || number < 0 {
		return 0
	}

	return number
}

// ParseIntegerList converts query-string values into integers.
//
// Invalid and negative values are ignored.
func ParseIntegerList(values []string) []int {
	numbers := make([]int, 0, len(values))

	for _, value := range values {
		number, err := strconv.Atoi(
			strings.TrimSpace(value),
		)

		if err != nil || number < 0 {
			continue
		}

		numbers = append(numbers, number)
	}

	return numbers
}

func matchesCreationDate(
	artist models.Artist,
	options Options,
) bool {
	if options.CreationFrom > 0 &&
		artist.CreationDate < options.CreationFrom {
		return false
	}

	if options.CreationTo > 0 &&
		artist.CreationDate > options.CreationTo {
		return false
	}

	return true
}

func matchesFirstAlbumDate(
	artist models.Artist,
	options Options,
) bool {
	albumYear, ok := firstAlbumYear(
		artist.FirstAlbum,
	)

	if !ok {
		return options.AlbumFrom == 0 &&
			options.AlbumTo == 0
	}

	if options.AlbumFrom > 0 &&
		albumYear < options.AlbumFrom {
		return false
	}

	if options.AlbumTo > 0 &&
		albumYear > options.AlbumTo {
		return false
	}

	return true
}

func matchesMemberCount(
	artist models.Artist,
	options Options,
) bool {
	if len(options.MemberCounts) == 0 {
		return true
	}

	artistMemberCount := len(artist.Members)

	for _, selectedCount := range options.MemberCounts {
		if artistMemberCount == selectedCount {
			return true
		}
	}

	return false
}

func matchesLocations(
	artist models.Artist,
	options Options,
) bool {
	if len(options.Locations) == 0 {
		return true
	}

	for _, artistLocation := range artist.Locations {
		normalizedArtistLocation := normalizeLocation(
			artistLocation,
		)

		for _, selectedLocation := range options.Locations {
			normalizedSelectedLocation := normalizeLocation(
				selectedLocation,
			)

			if normalizedSelectedLocation == "" {
				continue
			}

			if strings.Contains(
				normalizedArtistLocation,
				normalizedSelectedLocation,
			) {
				return true
			}
		}
	}

	return false
}

func firstAlbumYear(value string) (int, bool) {
	value = strings.TrimSpace(value)

	if value == "" {
		return 0, false
	}

	date, err := time.Parse(
		"02-01-2006",
		value,
	)

	if err == nil {
		return date.Year(), true
	}

	parts := strings.FieldsFunc(
		value,
		func(character rune) bool {
			return character == '-' ||
				character == '/' ||
				character == '.'
		},
	)

	for _, part := range parts {
		if len(part) != 4 {
			continue
		}

		year, err := strconv.Atoi(part)
		if err != nil {
			continue
		}

		return year, true
	}

	return 0, false
}

func normalizeLocation(value string) string {
	value = geocoder.NormalizeLocation(value)

	value = strings.ToLower(value)

	value = strings.ReplaceAll(
		value,
		",",
		" ",
	)

	value = strings.ReplaceAll(
		value,
		"-",
		" ",
	)

	return strings.Join(
		strings.Fields(value),
		" ",
	)
}
