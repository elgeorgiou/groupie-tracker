package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"groupie-tracker/internal/models"
)

var BaseAPI = "https://groupietrackers.01edu.ai/api"

var client = &http.Client{
	Timeout: 12 * time.Second,
}

func decodeURL(url string, target any) error {
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("request API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned %s", resp.Status)
	}

	if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
		return fmt.Errorf("decode API response: %w", err)
	}

	return nil
}

func FetchArtists() ([]models.Artist, error) {
	var artists []models.Artist

	if err := decodeURL(BaseAPI+"/artists", &artists); err != nil {
		return nil, err
	}

	return artists, nil
}

func FetchArtistByID(id int) (models.Artist, error) {
	var artist models.Artist

	err := decodeURL(
		fmt.Sprintf("%s/artists/%d", BaseAPI, id),
		&artist,
	)

	return artist, err
}

func FetchRelation(id int) (models.Relation, error) {
	var relation models.Relation

	err := decodeURL(
		fmt.Sprintf("%s/relation/%d", BaseAPI, id),
		&relation,
	)

	return relation, err
}

func FetchLocations() (models.LocationIndex, error) {
	var locationIndex models.LocationIndex

	err := decodeURL(
		BaseAPI+"/locations",
		&locationIndex,
	)

	return locationIndex, err
}

func FetchArtistsWithLocations() ([]models.Artist, error) {
	artists, err := FetchArtists()
	if err != nil {
		return nil, err
	}

	locations, err := FetchLocations()
	if err != nil {
		return nil, err
	}

	locationsByArtistID := make(
		map[int][]string,
		len(locations.Index),
	)

	for _, location := range locations.Index {
		locationsByArtistID[location.ID] = append(
			[]string(nil),
			location.Locations...,
		)
	}

	for index := range artists {
		artists[index].Locations =
			locationsByArtistID[artists[index].ID]
	}

	return artists, nil
}
