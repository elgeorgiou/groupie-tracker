package handlers

import (
	"html/template"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"groupie-tracker/internal/api"
)

// initTestTemplates creates minimal in-memory templates used by
// the handlers during isolated tests.
func initTestTemplates() {
	Tmpl = template.New("test")

	template.Must(
		Tmpl.New("index.html").Parse(
			`<html>
				<body>
					Mock Index: {{len .Artists}}
				</body>
			</html>`,
		),
	)

	template.Must(
		Tmpl.New("artist.html").Parse(
			`<html>
				<body>
					Mock Artist: {{.Artist.Name}}
				</body>
			</html>`,
		),
	)

	template.Must(
		Tmpl.New("error.html").Parse(
			`<html>
				<body>
					Mock Error: {{.Title}}
				</body>
			</html>`,
		),
	)
}

// newMockGroupieAPIServer creates a local server that behaves
// like the required parts of the Groupie Tracker API.
func newMockGroupieAPIServer(
	t *testing.T,
) *httptest.Server {
	t.Helper()

	return httptest.NewServer(
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
								"image": "https://example.com/queen.jpg",
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
										"london-uk"
									]
								}
							]
						}`),
					)

				case "/artists/1":
					_, _ = w.Write(
						[]byte(`{
							"id": 1,
							"image": "https://example.com/queen.jpg",
							"name": "Queen",
							"members": [
								"Freddie Mercury",
								"Brian May"
							],
							"creationDate": 1970,
							"firstAlbum": "13-07-1973"
						}`),
					)

				case "/relation/1":
					_, _ = w.Write(
						[]byte(`{
							"id": 1,
							"datesLocations": {
								"london-uk": [
									"12-12-2019"
								]
							}
						}`),
					)

				default:
					http.NotFound(w, r)
				}
			},
		),
	)
}

// useMockAPI temporarily redirects the api package
// to a local HTTP test server.
func useMockAPI(
	t *testing.T,
	serverURL string,
) {
	t.Helper()

	originalBaseAPI := api.BaseAPI
	api.BaseAPI = serverURL

	t.Cleanup(
		func() {
			api.BaseAPI = originalBaseAPI
		},
	)
}

// TestArtistsHandlerRootRoute verifies that the root page
// returns a successful HTML response.
func TestArtistsHandlerRootRoute(t *testing.T) {
	initTestTemplates()

	server := newMockGroupieAPIServer(t)
	defer server.Close()

	useMockAPI(
		t,
		server.URL,
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/",
		nil,
	)

	response := httptest.NewRecorder()

	ArtistsHandler(
		response,
		request,
	)

	if response.Code != http.StatusOK {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusOK,
			response.Code,
		)
	}

	if !strings.Contains(
		response.Body.String(),
		"Mock Index: 1",
	) {
		t.Errorf(
			"expected rendered index template, got %q",
			response.Body.String(),
		)
	}
}

// TestArtistsHandlerNotFoundRoute verifies that an unknown path
// returns a 404 response.
func TestArtistsHandlerNotFoundRoute(t *testing.T) {
	initTestTemplates()

	request := httptest.NewRequest(
		http.MethodGet,
		"/this-page-does-not-exist",
		nil,
	)

	response := httptest.NewRecorder()

	ArtistsHandler(
		response,
		request,
	)

	if response.Code != http.StatusNotFound {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusNotFound,
			response.Code,
		)
	}

	if !strings.Contains(
		response.Body.String(),
		"Page Not Found",
	) {
		t.Errorf(
			"expected error template output, got %q",
			response.Body.String(),
		)
	}
}

// TestSearchHandler verifies that searching by member name
// returns the artist connected with that member.
func TestSearchHandler(t *testing.T) {
	initTestTemplates()

	server := newMockGroupieAPIServer(t)
	defer server.Close()

	useMockAPI(
		t,
		server.URL,
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/search?q=Freddie",
		nil,
	)

	response := httptest.NewRecorder()

	SearchHandler(
		response,
		request,
	)

	if response.Code != http.StatusOK {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusOK,
			response.Code,
		)
	}

	if !strings.Contains(
		response.Body.String(),
		"Mock Index: 1",
	) {
		t.Errorf(
			"expected one matching artist, got %q",
			response.Body.String(),
		)
	}
}

// TestSearchHandlerByLocation verifies that a normalized
// concert location can be used as a search query.
func TestSearchHandlerByLocation(t *testing.T) {
	initTestTemplates()

	server := newMockGroupieAPIServer(t)
	defer server.Close()

	useMockAPI(
		t,
		server.URL,
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/search?q=london",
		nil,
	)

	response := httptest.NewRecorder()

	SearchHandler(
		response,
		request,
	)

	if response.Code != http.StatusOK {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusOK,
			response.Code,
		)
	}

	if !strings.Contains(
		response.Body.String(),
		"Mock Index: 1",
	) {
		t.Errorf(
			"expected one location match, got %q",
			response.Body.String(),
		)
	}
}

// TestSearchHandlerEmptyQuery verifies that an empty search
// redirects the user back to the artist section.
func TestSearchHandlerEmptyQuery(t *testing.T) {
	request := httptest.NewRequest(
		http.MethodGet,
		"/search?q=",
		nil,
	)

	response := httptest.NewRecorder()

	SearchHandler(
		response,
		request,
	)

	if response.Code != http.StatusSeeOther {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusSeeOther,
			response.Code,
		)
	}

	if location := response.Header().Get("Location"); location != "/#artists" {
		t.Errorf(
			"expected redirect to /#artists, got %q",
			location,
		)
	}
}

// TestArtistDetailHandler verifies that a valid artist ID
// renders the artist template.
func TestArtistDetailHandler(t *testing.T) {
	initTestTemplates()

	server := newMockGroupieAPIServer(t)
	defer server.Close()

	useMockAPI(
		t,
		server.URL,
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/artist?id=1",
		nil,
	)

	response := httptest.NewRecorder()

	ArtistDetailHandler(
		response,
		request,
	)

	if response.Code != http.StatusOK {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusOK,
			response.Code,
		)
	}

	if !strings.Contains(
		response.Body.String(),
		"Mock Artist: Queen",
	) {
		t.Errorf(
			"expected Queen in rendered template, got %q",
			response.Body.String(),
		)
	}
}

// TestArtistDetailHandlerInvalidID verifies that malformed
// and non-positive IDs return a 400 response.
func TestArtistDetailHandlerInvalidID(t *testing.T) {
	testCases := []struct {
		name string
		url  string
	}{
		{
			name: "non-numeric ID",
			url:  "/artist?id=abc",
		},
		{
			name: "zero ID",
			url:  "/artist?id=0",
		},
		{
			name: "negative ID",
			url:  "/artist?id=-1",
		},
	}

	for _, testCase := range testCases {
		t.Run(
			testCase.name,
			func(t *testing.T) {
				initTestTemplates()

				request := httptest.NewRequest(
					http.MethodGet,
					testCase.url,
					nil,
				)

				response := httptest.NewRecorder()

				ArtistDetailHandler(
					response,
					request,
				)

				if response.Code != http.StatusBadRequest {
					t.Errorf(
						"expected status %d, got %d",
						http.StatusBadRequest,
						response.Code,
					)
				}
			},
		)
	}
}
