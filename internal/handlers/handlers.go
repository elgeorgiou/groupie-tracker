package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"groupie-tracker/internal/api"
	geo "groupie-tracker/internal/geocoder"
	"groupie-tracker/internal/models"
)

var Tmpl *template.Template
var Geocoder = geo.New()

type IndexPageData struct {
	Artists     []models.Artist
	ArtistsJSON template.JS
	Locations   []string
	Query       string
}

type ArtistPageData struct {
	Artist    models.Artist
	Relations models.Relation
}

func newIndexPageData(
	artists []models.Artist,
	query string,
) (IndexPageData, error) {
	data, err := json.Marshal(artists)
	if err != nil {
		return IndexPageData{}, err
	}

	set := make(map[string]struct{})

	for _, artist := range artists {
		for _, location := range artist.Locations {
			set[location] = struct{}{}
		}
	}

	locations := make([]string, 0, len(set))

	for location := range set {
		locations = append(locations, location)
	}

	sort.Strings(locations)

	return IndexPageData{
		Artists:     artists,
		ArtistsJSON: template.JS(data),
		Locations:   locations,
		Query:       query,
	}, nil
}

func renderTemplate(
	w http.ResponseWriter,
	name string,
	data any,
) error {
	var page bytes.Buffer

	if err := Tmpl.ExecuteTemplate(&page, name, data); err != nil {
		return err
	}

	w.Header().Set(
		"Content-Type",
		"text/html; charset=utf-8",
	)

	_, err := page.WriteTo(w)

	return err
}

func ArtistsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.URL.Path != "/" {
		renderError(
			w,
			http.StatusNotFound,
			"page_not_found",
			"Page Not Found",
			"The requested page could not be found.",
		)
		return
	}

	artists, err := api.FetchArtistsWithLocations()
	if err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"artists_fetch_failed",
			"Internal Server Error",
			"The artist collection could not be loaded.",
		)
		return
	}

	data, err := newIndexPageData(artists, "")
	if err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"template_failed",
			"Internal Server Error",
			"The page could not be prepared.",
		)
		return
	}

	if err := renderTemplate(w, "index.html", data); err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"template_failed",
			"Internal Server Error",
			"The page could not be prepared.",
		)
	}
}

func ArtistDetailHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	id, err := strconv.Atoi(r.URL.Query().Get("id"))
	if err != nil || id <= 0 {
		renderError(
			w,
			http.StatusBadRequest,
			"invalid_artist_id",
			"Bad Request",
			"The artist identifier is invalid.",
		)
		return
	}

	artist, err := api.FetchArtistByID(id)
	if err != nil {
		renderError(
			w,
			http.StatusNotFound,
			"artist_not_found",
			"Artist Not Found",
			"The requested artist could not be found.",
		)
		return
	}

	relation, err := api.FetchRelation(id)
	if err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"relation_fetch_failed",
			"Internal Server Error",
			"The concert information could not be loaded.",
		)
		return
	}

	data := ArtistPageData{
		Artist:    artist,
		Relations: relation,
	}

	if err := renderTemplate(w, "artist.html", data); err != nil {
		fmt.Println(err)

		renderError(
			w,
			http.StatusInternalServerError,
			"template_failed",
			"Internal Server Error",
			"The page could not be prepared.",
		)
	}
}

func GeocodeHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	location := strings.TrimSpace(
		r.URL.Query().Get("q"),
	)

	if location == "" {
		http.Error(
			w,
			"missing location",
			http.StatusBadRequest,
		)
		return
	}

	coords, err := Geocoder.Geocode(location)
	if err != nil {
		http.Error(
			w,
			"location could not be geocoded",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(coords)
}
