package models

import (
	"encoding/json"
	"testing"
)

// TestArtistJSONMapping verifies that the Artist structure
// correctly maps the JSON fields returned by the API.
func TestArtistJSONMapping(t *testing.T) {
	jsonData := `{
		"id": 1,
		"image": "https://example.com/queen.jpg",
		"name": "Queen",
		"members": [
			"Freddie Mercury",
			"Brian May"
		],
		"creationDate": 1970,
		"firstAlbum": "13-07-1973",
		"locations": "https://example.com/locations/1",
		"concertDates": "https://example.com/dates/1",
		"relations": "https://example.com/relation/1"
	}`

	var artist Artist

	if err := json.Unmarshal(
		[]byte(jsonData),
		&artist,
	); err != nil {
		t.Fatalf(
			"failed to unmarshal Artist JSON: %v",
			err,
		)
	}

	if artist.ID != 1 {
		t.Errorf(
			"expected ID 1, got %d",
			artist.ID,
		)
	}

	if artist.Name != "Queen" {
		t.Errorf(
			"expected name Queen, got %q",
			artist.Name,
		)
	}

	if artist.CreationDate != 1970 {
		t.Errorf(
			"expected creation date 1970, got %d",
			artist.CreationDate,
		)
	}

	if artist.FirstAlbum != "13-07-1973" {
		t.Errorf(
			"expected first album 13-07-1973, got %q",
			artist.FirstAlbum,
		)
	}

	if len(artist.Members) != 2 {
		t.Errorf(
			"expected 2 members, got %d",
			len(artist.Members),
		)
	}
}

// TestArtistLocationsListMapping verifies the additional
// locationsList field used by filters and search suggestions.
func TestArtistLocationsListMapping(t *testing.T) {
	jsonData := `{
		"id": 1,
		"name": "Queen",
		"locationsList": [
			"london-uk",
			"paris-france"
		]
	}`

	var artist Artist

	if err := json.Unmarshal(
		[]byte(jsonData),
		&artist,
	); err != nil {
		t.Fatalf(
			"failed to unmarshal Artist JSON: %v",
			err,
		)
	}

	if len(artist.Locations) != 2 {
		t.Fatalf(
			"expected 2 locations, got %d",
			len(artist.Locations),
		)
	}

	if artist.Locations[0] != "london-uk" {
		t.Errorf(
			"expected london-uk, got %q",
			artist.Locations[0],
		)
	}
}

// TestRelationMap verifies that the nested datesLocations map
// is decoded correctly.
func TestRelationMap(t *testing.T) {
	jsonData := `{
		"id": 1,
		"datesLocations": {
			"london-uk": [
				"12-12-2019",
				"13-12-2019"
			],
			"paris-france": [
				"05-05-2020"
			]
		}
	}`

	var relation Relation

	if err := json.Unmarshal(
		[]byte(jsonData),
		&relation,
	); err != nil {
		t.Fatalf(
			"failed to unmarshal Relation JSON: %v",
			err,
		)
	}

	dates, exists := relation.DatesLocations["london-uk"]
	if !exists {
		t.Fatal(
			"expected location london-uk to exist",
		)
	}

	if len(dates) != 2 {
		t.Errorf(
			"expected 2 London dates, got %d",
			len(dates),
		)
	}
}

// TestLocationIndexMapping verifies that the complete locations
// endpoint response is decoded correctly.
func TestLocationIndexMapping(t *testing.T) {
	jsonData := `{
		"index": [
			{
				"id": 1,
				"locations": [
					"london-uk",
					"paris-france"
				]
			}
		]
	}`

	var locations LocationIndex

	if err := json.Unmarshal(
		[]byte(jsonData),
		&locations,
	); err != nil {
		t.Fatalf(
			"failed to unmarshal LocationIndex JSON: %v",
			err,
		)
	}

	if len(locations.Index) != 1 {
		t.Fatalf(
			"expected 1 location node, got %d",
			len(locations.Index),
		)
	}

	if locations.Index[0].ID != 1 {
		t.Errorf(
			"expected artist ID 1, got %d",
			locations.Index[0].ID,
		)
	}

	if len(locations.Index[0].Locations) != 2 {
		t.Errorf(
			"expected 2 locations, got %d",
			len(locations.Index[0].Locations),
		)
	}
}

// TestCoordinatesJSONMapping verifies the JSON shape returned
// by the geocode HTTP endpoint.
func TestCoordinatesJSONMapping(t *testing.T) {
	coordinates := Coordinates{
		Latitude:  51.5074,
		Longitude: -0.1278,
	}

	jsonData, err := json.Marshal(coordinates)
	if err != nil {
		t.Fatalf(
			"failed to marshal Coordinates: %v",
			err,
		)
	}

	expected := `{"latitude":51.5074,"longitude":-0.1278}`

	if string(jsonData) != expected {
		t.Errorf(
			"expected %s, got %s",
			expected,
			string(jsonData),
		)
	}
}

// TestGeocodeResultJSONMapping verifies the JSON fields
// returned by the Nominatim service.
func TestGeocodeResultJSONMapping(t *testing.T) {
	jsonData := `{
		"lat": "51.5074",
		"lon": "-0.1278"
	}`

	var result GeocodeResult

	if err := json.Unmarshal(
		[]byte(jsonData),
		&result,
	); err != nil {
		t.Fatalf(
			"failed to unmarshal GeocodeResult JSON: %v",
			err,
		)
	}

	if result.Lat != "51.5074" {
		t.Errorf(
			"expected latitude 51.5074, got %q",
			result.Lat,
		)
	}

	if result.Lon != "-0.1278" {
		t.Errorf(
			"expected longitude -0.1278, got %q",
			result.Lon,
		)
	}
}
