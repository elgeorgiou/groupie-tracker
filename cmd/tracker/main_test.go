package main

import (
	"html/template"
	"os"
	"path/filepath"
	"testing"
)

// TestTemplateParsing ensures that the templates directory exists
// and that every HTML template can be parsed successfully.
func TestTemplateParsing(t *testing.T) {
	currentDirectory, err := os.Getwd()
	if err != nil {
		t.Fatalf(
			"failed to get current working directory: %v",
			err,
		)
	}

	templatesDirectory := findTemplatesDirectory(
		currentDirectory,
	)

	if templatesDirectory == "" {
		t.Fatal(
			"templates directory could not be found",
		)
	}

	pattern := filepath.Join(
		templatesDirectory,
		"*.html",
	)

	parsedTemplates, err := template.ParseGlob(pattern)
	if err != nil {
		t.Fatalf(
			"template compilation failed: %v",
			err,
		)
	}

	if parsedTemplates == nil {
		t.Fatal(
			"template.ParseGlob returned a nil template",
		)
	}

	requiredTemplates := []string{
		"index.html",
		"artist.html",
		"error.html",
	}

	for _, templateName := range requiredTemplates {
		if parsedTemplates.Lookup(templateName) == nil {
			t.Errorf(
				"required template %q was not parsed",
				templateName,
			)
		}
	}
}

// findTemplatesDirectory searches the current directory and its parents
// until it finds a directory named templates.
func findTemplatesDirectory(startDirectory string) string {
	directory := startDirectory

	for {
		target := filepath.Join(
			directory,
			"templates",
		)

		info, err := os.Stat(target)
		if err == nil && info.IsDir() {
			return target
		}

		parent := filepath.Dir(directory)

		if parent == directory {
			return ""
		}

		directory = parent
	}
}
