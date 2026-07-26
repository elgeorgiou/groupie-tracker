package geo

import "testing"

func TestNormalizeLocation(t *testing.T) {
	tests := map[string]string{
		"seattle-usa":             "seattle, usa",
		"playa_del_carmen-mexico": "playa del carmen, mexico",
		"new_york-usa":            "new york, usa",
	}
	for input, want := range tests {
		if got := NormalizeLocation(input); got != want {
			t.Fatalf("NormalizeLocation(%q) = %q, want %q", input, got, want)
		}
	}
}
