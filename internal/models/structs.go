package models

type Artist struct {
	ID           int      `json:"id"`
	Image        string   `json:"image"`
	Name         string   `json:"name"`
	Members      []string `json:"members"`
	CreationDate int      `json:"creationDate"`
	FirstAlbum   string   `json:"firstAlbum"`
	LocationsURL string   `json:"locations"`
	DatesURL     string   `json:"concertDates"`
	RelationsURL string   `json:"relations"`
	Locations    []string `json:"locationsList,omitempty"`
}

type Relation struct {
	ID             int                 `json:"id"`
	DatesLocations map[string][]string `json:"datesLocations"`
}

type LocationIndex struct {
	Index []LocationNode `json:"index"`
}

type LocationNode struct {
	ID        int      `json:"id"`
	Locations []string `json:"locations"`
}

type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type GeocodeResult struct {
	Lat string `json:"lat"`
	Lon string `json:"lon"`
}
