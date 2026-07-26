package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestFetchArtists verifies that FetchArtists sends a request,
// decodes the JSON response and returns the expected artist data.
func TestFetchArtists(t *testing.T) {
	mockResponse := `[
		{
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
		}
	]`

	server := httptest.NewServer(
		http.HandlerFunc(
			func(
				w http.ResponseWriter,
				r *http.Request,
			) {
				if r.URL.Path != "/artists" {
					t.Errorf(
						"expected request path /artists, got %q",
						r.URL.Path,
					)
				}

				w.Header().Set(
					"Content-Type",
					"application/json",
				)

				w.WriteHeader(http.StatusOK)

				if _, err := w.Write(
					[]byte(mockResponse),
				); err != nil {
					t.Fatalf(
						"failed to write mock response: %v",
						err,
					)
				}
			},
		),
	)
	defer server.Close()

	originalBaseAPI := BaseAPI
	BaseAPI = server.URL

	t.Cleanup(
		func() {
			BaseAPI = originalBaseAPI
		},
	)

	artists, err := FetchArtists()
	if err != nil {
		t.Fatalf(
			"FetchArtists returned an unexpected error: %v",
			err,
		)
	}

	if len(artists) != 1 {
		t.Fatalf(
			"expected 1 artist, got %d",
			len(artists),
		)
	}

	artist := artists[0]

	if artist.ID != 1 {
		t.Errorf(
			"expected artist ID 1, got %d",
			artist.ID,
		)
	}

	if artist.Name != "Queen" {
		t.Errorf(
			"expected artist name Queen, got %q",
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

// TestFetchArtistByID verifies that FetchArtistByID requests
// the correct API endpoint and decodes the returned artist.
func TestFetchArtistByID(t *testing.T) {
	mockResponse := `{
		"id": 1,
		"name": "Queen",
		"members": [
			"Freddie Mercury",
			"Brian May"
		],
		"creationDate": 1970,
		"firstAlbum": "13-07-1973"
	}`

	server := httptest.NewServer(
		http.HandlerFunc(
			func(
				w http.ResponseWriter,
				r *http.Request,
			) {
				if r.URL.Path != "/artists/1" {
					t.Errorf(
						"expected request path /artists/1, got %q",
						r.URL.Path,
					)
				}

				w.Header().Set(
					"Content-Type",
					"application/json",
				)

				_, _ = w.Write(
					[]byte(mockResponse),
				)
			},
		),
	)
	defer server.Close()

	originalBaseAPI := BaseAPI
	BaseAPI = server.URL

	t.Cleanup(
		func() {
			BaseAPI = originalBaseAPI
		},
	)

	artist, err := FetchArtistByID(1)
	if err != nil {
		t.Fatalf(
			"FetchArtistByID returned an unexpected error: %v",
			err,
		)
	}

	if artist.Name != "Queen" {
		t.Errorf(
			"expected Queen, got %q",
			artist.Name,
		)
	}
}

// TestFetchArtistByIDStatusError verifies that a non-200 response
// is returned as an error.
func TestFetchArtistByIDStatusError(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(
			func(
				w http.ResponseWriter,
				r *http.Request,
			) {
				http.Error(
					w,
					"artist not found",
					http.StatusNotFound,
				)
			},
		),
	)
	defer server.Close()

	originalBaseAPI := BaseAPI
	BaseAPI = server.URL

	t.Cleanup(
		func() {
			BaseAPI = originalBaseAPI
		},
	)

	_, err := FetchArtistByID(999)
	if err == nil {
		t.Fatal(
			"expected FetchArtistByID to return an error",
		)
	}

	if !strings.Contains(
		err.Error(),
		"404",
	) {
		t.Errorf(
			"expected error to contain status 404, got %q",
			err.Error(),
		)
	}
}

// TestFetchArtistsWithLocations verifies that artist information
// is joined with the location endpoint using the artist ID.
func TestFetchArtistsWithLocations(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(
			func(
				w http.ResponseWriter,
				r *http.Request,
			) {
				w.Header().Set(
					"Content-Type",
					"application/json",
				)

				switch r.URL.Path {
				case "/artists":
					_, _ = w.Write(
						[]byte(`[
							{
								"id": 1,
								"name": "Queen",
								"members": [
									"Freddie Mercury",
									"Brian May"
								],
								"creationDate": 1970,
								"firstAlbum": "13-07-1973"
							}
						]`),
					)

				case "/locations":
					_, _ = w.Write(
						[]byte(`{
							"index": [
								{
									"id": 1,
									"locations": [
										"london-uk",
										"paris-france"
									]
								}
							]
						}`),
					)

				default:
					http.NotFound(w, r)
				}
			},
		),
	)
	defer server.Close()

	originalBaseAPI := BaseAPI
	BaseAPI = server.URL

	t.Cleanup(
		func() {
			BaseAPI = originalBaseAPI
		},
	)

	artists, err := FetchArtistsWithLocations()
	if err != nil {
		t.Fatalf(
			"FetchArtistsWithLocations returned an unexpected error: %v",
			err,
		)
	}

	if len(artists) != 1 {
		t.Fatalf(
			"expected 1 artist, got %d",
			len(artists),
		)
	}

	if len(artists[0].Locations) != 2 {
		t.Fatalf(
			"expected 2 locations, got %d",
			len(artists[0].Locations),
		)
	}

	if artists[0].Locations[0] != "london-uk" {
		t.Errorf(
			"expected first location london-uk, got %q",
			artists[0].Locations[0],
		)
	}
}
