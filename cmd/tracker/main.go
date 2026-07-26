package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	"groupie-tracker/internal/handlers"
)

func main() {
	var err error
	handlers.Tmpl, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	mux.HandleFunc("/", handlers.ArtistsHandler)
	mux.HandleFunc("/artist", handlers.ArtistDetailHandler)
	mux.HandleFunc("/search", handlers.SearchHandler)
	mux.HandleFunc("/api/geocode", handlers.GeocodeHandler)

	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	fmt.Println("Server starting on http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}
