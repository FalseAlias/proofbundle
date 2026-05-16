package proofbundle

import (
	"bytes"
	"encoding/json"
	"errors"
	"math"
	"sort"
	"strconv"
	"strings"
)

const maxSafeInteger = 9007199254740991 // 2^53 - 1

var (
	ErrInvalidNumber     = errors.New("invalid number in canonical JSON")
	ErrNumberOutOfRange  = errors.New("number out of safe integer range")
	ErrCanonicalEncoding = errors.New("canonical encoding error")
)

// CanonicalJSON encodes a Go value into the PB-CANON-JSON-1 canonical form.
// Returns a deterministic, whitespace-free JSON byte slice with sorted object keys.
func CanonicalJSON(v interface{}) ([]byte, error) {
	var buf bytes.Buffer
	if err := writeCanonical(&buf, v); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeCanonical(buf *bytes.Buffer, v interface{}) error {
	switch val := v.(type) {
	case nil:
		buf.WriteString("null")
	case bool:
		if val {
			buf.WriteString("true")
		} else {
			buf.WriteString("false")
		}
	case float64:
		if math.IsNaN(val) || math.IsInf(val, 0) {
			return ErrInvalidNumber
		}
		if val != math.Trunc(val) {
			return ErrInvalidNumber
		}
		if val > maxSafeInteger || val < -maxSafeInteger {
			return ErrNumberOutOfRange
		}
		// Write as integer without decimal point
		if val == 0 {
			buf.WriteString("0")
		} else {
			buf.WriteString(strconv.FormatInt(int64(val), 10))
		}
	case json.Number:
		s := string(val)
		if strings.ContainsAny(s, ".eE") {
			return ErrInvalidNumber
		}
		n, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return ErrInvalidNumber
		}
		if n > maxSafeInteger || n < -maxSafeInteger {
			return ErrNumberOutOfRange
		}
		buf.WriteString(s)
	case int:
		if int64(val) > maxSafeInteger || int64(val) < -maxSafeInteger {
			return ErrNumberOutOfRange
		}
		buf.WriteString(strconv.FormatInt(int64(val), 10))
	case int64:
		if val > maxSafeInteger || val < -maxSafeInteger {
			return ErrNumberOutOfRange
		}
		buf.WriteString(strconv.FormatInt(val, 10))
	case string:
		writeJSONString(buf, val)
	case []interface{}:
		buf.WriteByte('[')
		for i, elem := range val {
			if i > 0 {
				buf.WriteByte(',')
			}
			if err := writeCanonical(buf, elem); err != nil {
				return err
			}
		}
		buf.WriteByte(']')
	case []map[string]interface{}:
		buf.WriteByte('[')
		for i, elem := range val {
			if i > 0 {
				buf.WriteByte(',')
			}
			if err := writeCanonical(buf, elem); err != nil {
				return err
			}
		}
		buf.WriteByte(']')
	case map[string]interface{}:
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
			writeJSONString(buf, k)
			buf.WriteByte(':')
			if err := writeCanonical(buf, val[k]); err != nil {
				return err
			}
		}
		buf.WriteByte('}')
	default:
		// Try JSON marshal/unmarshal round-trip to normalize
		b, err := json.Marshal(val)
		if err != nil {
			return err
		}
		var raw interface{}
		if err := json.Unmarshal(b, &raw); err != nil {
			return err
		}
		return writeCanonical(buf, raw)
	}
	return nil
}

func writeJSONString(buf *bytes.Buffer, s string) {
	buf.WriteByte('"')
	for _, r := range s {
		switch r {
		case '"':
			buf.WriteString("\\\"")
		case '\\':
			buf.WriteString("\\\\")
		case '\b':
			buf.WriteString("\\b")
		case '\f':
			buf.WriteString("\\f")
		case '\n':
			buf.WriteString("\\n")
		case '\r':
			buf.WriteString("\\r")
		case '\t':
			buf.WriteString("\\t")
		default:
			if r < 0x20 {
				buf.WriteString("\\u")
				buf.WriteString(strconv.FormatInt(int64(r), 16))
			} else {
				buf.WriteRune(r)
			}
		}
	}
	buf.WriteByte('"')
}
