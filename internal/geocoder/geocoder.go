package geo

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"groupie-tracker/internal/models"
)

const endpoint = "https://nominatim.openstreetmap.org/search"

type Geocoder struct {
	client *http.Client
	mu     sync.RWMutex
	cache  map[string]models.Coordinates
}

func New() *Geocoder {
	return &Geocoder{
		client: &http.Client{
			Timeout: 12 * time.Second,
		},
		cache: make(map[string]models.Coordinates),
	}
}

func NormalizeLocation(value string) string {
	value = strings.TrimSpace(value)

	index := strings.LastIndex(value, "-")
	if index < 0 {
		return strings.ReplaceAll(value, "_", " ")
	}

	city := strings.ReplaceAll(value[:index], "_", " ")
	country := strings.ReplaceAll(value[index+1:], "_", " ")

	return city + ", " + country
}

func (g *Geocoder) Geocode(location string) (models.Coordinates, error) {
	normalized := NormalizeLocation(location)
	key := strings.ToLower(normalized)

	g.mu.RLock()
	cached, ok := g.cache[key]
	g.mu.RUnlock()

	if ok {
		return cached, nil
	}

	parsed, err := url.Parse(endpoint)
	if err != nil {
		return models.Coordinates{}, err
	}

	query := parsed.Query()
	query.Set("q", normalized)
	query.Set("format", "jsonv2")
	query.Set("limit", "1")
	parsed.RawQuery = query.Encode()

	req, err := http.NewRequest(
		http.MethodGet,
		parsed.String(),
		nil,
	)
	if err != nil {
		return models.Coordinates{}, err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set(
		"User-Agent",
		"groupie-tracker-student-project/1.0",
	)

	resp, err := g.client.Do(req)
	if err != nil {
		return models.Coordinates{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.Coordinates{},
			fmt.Errorf("geocoder returned %s", resp.Status)
	}

	var results []models.GeocodeResult

	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return models.Coordinates{}, err
	}

	if len(results) == 0 {
		return models.Coordinates{},
			fmt.Errorf("location not found")
	}

	lat, err := strconv.ParseFloat(results[0].Lat, 64)
	if err != nil {
		return models.Coordinates{}, err
	}

	lon, err := strconv.ParseFloat(results[0].Lon, 64)
	if err != nil {
		return models.Coordinates{}, err
	}

	coords := models.Coordinates{
		Latitude:  lat,
		Longitude: lon,
	}

	g.mu.Lock()
	g.cache[key] = coords
	g.mu.Unlock()

	return coords, nil
}
