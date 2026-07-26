package handlers

import (
	"encoding/json"
	"html/template"
	"net/http"
	"strconv"
	"strings"

	"groupie-tracker/internal/api"
	geo "groupie-tracker/internal/geocoder"
	"groupie-tracker/internal/models"
)

func SearchHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	query := strings.TrimSpace(
		r.URL.Query().Get("q"),
	)

	if query == "" {
		http.Redirect(
			w,
			r,
			"/#artists",
			http.StatusSeeOther,
		)
		return
	}

	artists, err := api.FetchArtistsWithLocations()
	if err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"search_failed",
			"Internal Server Error",
			"The search could not be completed.",
		)
		return
	}

	needle := strings.ToLower(query)

	filtered := make([]models.Artist, 0)

	for _, artist := range artists {
		values := []string{
			artist.Name,
			strconv.Itoa(artist.CreationDate),
			artist.FirstAlbum,
		}

		values = append(
			values,
			artist.Members...,
		)

		for _, location := range artist.Locations {
			values = append(
				values,
				geo.NormalizeLocation(location),
			)
		}

		matched := false

		for _, value := range values {
			if strings.Contains(
				strings.ToLower(value),
				needle,
			) {
				matched = true
				break
			}
		}

		if matched {
			filtered = append(
				filtered,
				artist,
			)
		}
	}

	data, err := newIndexPageData(
		filtered,
		query,
	)

	if err == nil {
		allArtistsJSON, marshalErr := json.Marshal(artists)

		if marshalErr != nil {
			err = marshalErr
		} else {
			data.ArtistsJSON = template.JS(allArtistsJSON)
		}
	}

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

	if err := renderTemplate(
		w,
		"index.html",
		data,
	); err != nil {
		renderError(
			w,
			http.StatusInternalServerError,
			"template_failed",
			"Internal Server Error",
			"The page could not be prepared.",
		)
	}
}
