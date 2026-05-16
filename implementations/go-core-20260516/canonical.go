package proofbundle

import (
	"bytes"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

// CanonicalJSON produces a deterministic JSON serialization
// matching the Python reference implementation:
// - Object keys sorted lexicographically
// - No extra whitespace
// - Compact arrays
// - Number formatting preserved from original JSON
func CanonicalJSON(v any) ([]byte, error) {
	buf := &bytes.Buffer{}
	if err := canonicalEncode(buf, v); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// CanonicalJSONFromBytes parses raw JSON and then canonicalizes it,
// using json.Number to preserve numeric representation.
func CanonicalJSONFromBytes(data []byte) ([]byte, error) {
	var v any
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.UseNumber()
	if err := dec.Decode(&v); err != nil {
		return nil, err
	}
	return CanonicalJSON(v)
}

func canonicalEncode(buf *bytes.Buffer, v any) error {
	switch val := v.(type) {
	case nil:
		buf.WriteString("null")
	case bool:
		if val {
			buf.WriteString("true")
		} else {
			buf.WriteString("false")
		}
	case json.Number:
		buf.WriteString(val.String())
	case float64:
		// Fallback for float64: format like Python's json.dumps
		// Use %g with enough precision, but ensure .0 for integers
		s := fmt.Sprintf("%v", val)
		if !strings.ContainsAny(s, ".eE") {
			s = s + ".0"
		}
		buf.WriteString(s)
	case string:
		buf.WriteByte('"')
		buf.WriteString(escapeString(val))
		buf.WriteByte('"')
	case []any:
		buf.WriteByte('[')
		for i, item := range val {
			if i > 0 {
				buf.WriteByte(',')
			}
			if err := canonicalEncode(buf, item); err != nil {
				return err
			}
		}
		buf.WriteByte(']')
	case map[string]any:
		buf.WriteByte('{')
		keys := make([]string, 0, len(val))
		for k := range val {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for i, k := range keys {
			if i > 0 {
				buf.WriteByte(',')
			}
			buf.WriteByte('"')
			buf.WriteString(escapeString(k))
			buf.WriteString(`":`)
			if err := canonicalEncode(buf, val[k]); err != nil {
				return err
			}
		}
		buf.WriteByte('}')
	default:
		// Fallback: use standard json.Marshal
		b, err := json.Marshal(val)
		if err != nil {
			return err
		}
		buf.Write(b)
	}
	return nil
}

func escapeString(s string) string {
	var sb strings.Builder
	for _, r := range s {
		switch r {
		case '"':
			sb.WriteString(`\"`)
		case '\\':
			sb.WriteString(`\\`)
		case '\b':
			sb.WriteString(`\b`)
		case '\f':
			sb.WriteString(`\f`)
		case '\n':
			sb.WriteString(`\n`)
		case '\r':
			sb.WriteString(`\r`)
		case '\t':
			sb.WriteString(`\t`)
		default:
			if r < 0x20 {
				sb.WriteString(fmt.Sprintf(`\u%04x`, r))
			} else {
				sb.WriteRune(r)
			}
		}
	}
	return sb.String()
}
