package proofbundle

import (
	"testing"
)

func TestCanonicalJSON(t *testing.T) {
	// Note: json.Unmarshal converts numbers to float64, so integers become 1.0
	// Use CanonicalJSONFromBytes to preserve original number formatting
	input := `{"b":2,"a":1,"c":[3,1,2]}`
	canon, err := CanonicalJSONFromBytes([]byte(input))
	if err != nil {
		t.Fatal(err)
	}
	expected := `{"a":1,"b":2,"c":[3,1,2]}`
	if string(canon) != expected {
		t.Fatalf("canonical mismatch:\n got: %s\n want: %s", canon, expected)
	}
}

func TestCanonicalJSONFromBytes(t *testing.T) {
	input := `{"z":true,"a":1.0,"b":"str","c":[null,1.5,2]}`
	canon, err := CanonicalJSONFromBytes([]byte(input))
	if err != nil {
		t.Fatal(err)
	}
	expected := `{"a":1.0,"b":"str","c":[null,1.5,2],"z":true}`
	if string(canon) != expected {
		t.Fatalf("canonical mismatch:\n got: %s\n want: %s", canon, expected)
	}
}
