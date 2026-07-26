package handlers

import (
	"bytes"
	"fmt"
	"net/http"
)

type ErrorPageData struct {
	StatusCode int
	ErrorKey   string
	Title      string
	Message    string
}

func renderError(w http.ResponseWriter, statusCode int, errorKey, title, message string) {
	var page bytes.Buffer
	err := Tmpl.ExecuteTemplate(&page, "error.html", ErrorPageData{
		StatusCode: statusCode,
		ErrorKey:   errorKey,
		Title:      title,
		Message:    message,
	})
	if err != nil {
		fmt.Println("Error Template Execution Error:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(statusCode)
	_, _ = page.WriteTo(w)
}
