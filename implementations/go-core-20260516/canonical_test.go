package proofbundle

import (
	"encoding/json"
	"testing"
)

func TestCanonicalJSON(t *testing.T) {
	input := `{"b":2,"a":1,"c":[3,1,2]}`
	var v any
	if err := json.Unmarshal([]byte(input), &v); err != nil {
		t.Fatal(err)
	}
	canon, err := CanonicalJSON(v)
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
