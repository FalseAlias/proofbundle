package proofbundle

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"time"
)

var (
	ErrBoundaryEval = errors.New("boundary evaluation error")
)

// EvaluateBoundary evaluates a boundary expression against a context.
func EvaluateBoundary(boundaryJSON json.RawMessage, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	if len(boundaryJSON) == 0 {
		return true, nil
	}
	var expr map[string]interface{}
	if err := json.Unmarshal(boundaryJSON, &expr); err != nil {
		return false, fmt.Errorf("%w: %v", ErrBoundaryEval, err)
	}
	return EvaluateAtom(expr, ctx, refTime)
}

// EvaluateAtom evaluates a single boundary atom.
func EvaluateAtom(atom map[string]interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	if len(atom) != 1 {
		return false, fmt.Errorf("%w: atom must have exactly one key, got %v", ErrBoundaryEval, atom)
	}
	for op, args := range atom {
		switch op {
		case "equals":
			return evalEquals(args, ctx)
		case "in":
			return evalIn(args, ctx)
		case "range":
			return evalRange(args, ctx)
		case "present":
			return evalPresent(args, ctx)
		case "before":
			return evalBefore(args, ctx, refTime)
		case "after":
			return evalAfter(args, ctx, refTime)
		case "within":
			return evalWithin(args, ctx, refTime)
		case "expired":
			return evalExpired(args, ctx, refTime)
		case "not_expired":
			return evalNotExpired(args, ctx, refTime)
		case "age_lt":
			return evalAgeLT(args, ctx, refTime)
		case "age_gt":
			return evalAgeGT(args, ctx, refTime)
		case "within_last":
			return evalWithinLast(args, ctx, refTime)
		case "within_next":
			return evalWithinNext(args, ctx, refTime)
		case "all":
			return evalAll(args, ctx, refTime)
		case "any":
			return evalAny(args, ctx, refTime)
		case "not":
			return evalNot(args, ctx, refTime)
		default:
			return false, fmt.Errorf("%w: unknown boundary operator %q", ErrBoundaryEval, op)
		}
	}
	return false, fmt.Errorf("%w: empty atom", ErrBoundaryEval)
}

func toSlice(v interface{}) ([]interface{}, bool) {
	switch val := v.(type) {
	case []interface{}:
		return val, true
	default:
		return nil, false
	}
}

func toString(v interface{}) (string, bool) {
	switch val := v.(type) {
	case string:
		return val, true
	default:
		return "", false
	}
}

func toFloat(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	case json.Number:
		n, err := val.Float64()
		return n, err == nil
	default:
		return 0, false
	}
}

func ctxValue(ctx map[string]interface{}, key string) (interface{}, bool) {
	v, ok := ctx[key]
	return v, ok
}

func evalEquals(args interface{}, ctx map[string]interface{}) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: equals requires [field, value] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: equals field must be string", ErrBoundaryEval)
	}
	ctxVal, ok := ctxValue(ctx, field)
	if !ok {
		return false, nil
	}
	return valuesEqual(ctxVal, sl[1]), nil
}

func evalIn(args interface{}, ctx map[string]interface{}) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: in requires [field, values] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: in field must be string", ErrBoundaryEval)
	}
	ctxVal, ok := ctxValue(ctx, field)
	if !ok {
		return false, nil
	}
	list, ok := toSlice(sl[1])
	if !ok {
		return false, fmt.Errorf("%w: in values must be array", ErrBoundaryEval)
	}
	for _, v := range list {
		if valuesEqual(ctxVal, v) {
			return true, nil
		}
	}
	return false, nil
}

func evalRange(args interface{}, ctx map[string]interface{}) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 3 {
		return false, fmt.Errorf("%w: range requires [field, min, max] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: range field must be string", ErrBoundaryEval)
	}
	ctxVal, ok := ctxValue(ctx, field)
	if !ok {
		return false, nil
	}
	v, ok := toFloat(ctxVal)
	if !ok {
		return false, nil
	}
	min, ok := toFloat(sl[1])
	if !ok {
		return false, fmt.Errorf("%w: range min must be number", ErrBoundaryEval)
	}
	max, ok := toFloat(sl[2])
	if !ok {
		return false, fmt.Errorf("%w: range max must be number", ErrBoundaryEval)
	}
	return v >= min && v <= max, nil
}

func evalPresent(args interface{}, ctx map[string]interface{}) (bool, error) {
	field, ok := toString(args)
	if !ok {
		return false, fmt.Errorf("%w: present requires string field name", ErrBoundaryEval)
	}
	_, ok = ctxValue(ctx, field)
	return ok, nil
}

func parseTime(v interface{}) (time.Time, error) {
	s, ok := toString(v)
	if !ok {
		return time.Time{}, fmt.Errorf("expected string time, got %T", v)
	}
	for _, layout := range []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02",
	} {
		t, err := time.Parse(layout, s)
		if err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unparseable time: %q", s)
}

func ctxTime(ctx map[string]interface{}, field string) (time.Time, bool, error) {
	v, ok := ctx[field]
	if !ok {
		return time.Time{}, false, nil
	}
	t, err := parseTime(v)
	if err != nil {
		return time.Time{}, false, err
	}
	return t, true, nil
}

func evalBefore(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: before requires [field, time] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: before field must be string", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	bound, err := parseTime(sl[1])
	if err != nil {
		return false, err
	}
	return ctxT.Before(bound), nil
}

func evalAfter(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: after requires [field, time] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: after field must be string", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	bound, err := parseTime(sl[1])
	if err != nil {
		return false, err
	}
	return ctxT.After(bound), nil
}

func evalWithin(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 3 {
		return false, fmt.Errorf("%w: within requires [field, start, end] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: within field must be string", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	start, err := parseTime(sl[1])
	if err != nil {
		return false, err
	}
	end, err := parseTime(sl[2])
	if err != nil {
		return false, err
	}
	return (ctxT.Equal(start) || ctxT.After(start)) && (ctxT.Equal(end) || ctxT.Before(end)), nil
}

func evalExpired(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	field, ok := toString(args)
	if !ok {
		return false, fmt.Errorf("%w: expired requires string field name", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	return refTime.After(ctxT), nil
}

func evalNotExpired(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	field, ok := toString(args)
	if !ok {
		return false, fmt.Errorf("%w: not_expired requires string field name", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	return !refTime.After(ctxT), nil
}

func evalAgeLT(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: age_lt requires [field, seconds] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: age_lt field must be string", ErrBoundaryEval)
	}
	limit, ok := toFloat(sl[1])
	if !ok || math.IsNaN(limit) {
		return false, fmt.Errorf("%w: age_lt seconds must be number", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	age := refTime.Sub(ctxT).Seconds()
	return age < limit, nil
}

func evalAgeGT(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: age_gt requires [field, seconds] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: age_gt field must be string", ErrBoundaryEval)
	}
	limit, ok := toFloat(sl[1])
	if !ok || math.IsNaN(limit) {
		return false, fmt.Errorf("%w: age_gt seconds must be number", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	age := refTime.Sub(ctxT).Seconds()
	return age > limit, nil
}

func evalWithinLast(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: within_last requires [field, seconds] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: within_last field must be string", ErrBoundaryEval)
	}
	limit, ok := toFloat(sl[1])
	if !ok || math.IsNaN(limit) {
		return false, fmt.Errorf("%w: within_last seconds must be number", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	age := refTime.Sub(ctxT).Seconds()
	return age >= 0 && age <= limit, nil
}

func evalWithinNext(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok || len(sl) != 2 {
		return false, fmt.Errorf("%w: within_next requires [field, seconds] array", ErrBoundaryEval)
	}
	field, ok := toString(sl[0])
	if !ok {
		return false, fmt.Errorf("%w: within_next field must be string", ErrBoundaryEval)
	}
	limit, ok := toFloat(sl[1])
	if !ok || math.IsNaN(limit) {
		return false, fmt.Errorf("%w: within_next seconds must be number", ErrBoundaryEval)
	}
	ctxT, found, err := ctxTime(ctx, field)
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	diff := ctxT.Sub(refTime).Seconds()
	return diff >= 0 && diff <= limit, nil
}

func evalAll(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok {
		return false, fmt.Errorf("%w: all requires array of atoms", ErrBoundaryEval)
	}
	for _, item := range sl {
		atom, ok := item.(map[string]interface{})
		if !ok {
			return false, fmt.Errorf("%w: all item must be object", ErrBoundaryEval)
		}
		result, err := EvaluateAtom(atom, ctx, refTime)
		if err != nil {
			return false, err
		}
		if !result {
			return false, nil
		}
	}
	return true, nil
}

func evalAny(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	sl, ok := toSlice(args)
	if !ok {
		return false, fmt.Errorf("%w: any requires array of atoms", ErrBoundaryEval)
	}
	for _, item := range sl {
		atom, ok := item.(map[string]interface{})
		if !ok {
			return false, fmt.Errorf("%w: any item must be object", ErrBoundaryEval)
		}
		result, err := EvaluateAtom(atom, ctx, refTime)
		if err != nil {
			return false, err
		}
		if result {
			return true, nil
		}
	}
	return false, nil
}

func evalNot(args interface{}, ctx map[string]interface{}, refTime time.Time) (bool, error) {
	atom, ok := args.(map[string]interface{})
	if !ok {
		return false, fmt.Errorf("%w: not requires object atom", ErrBoundaryEval)
	}
	result, err := EvaluateAtom(atom, ctx, refTime)
	if err != nil {
		return false, err
	}
	return !result, nil
}

func valuesEqual(a, b interface{}) bool {
	sa, aIsStr := toString(a)
	sb, bIsStr := toString(b)
	if aIsStr && bIsStr {
		return sa == sb
	}
	fa, aIsNum := toFloat(a)
	fb, bIsNum := toFloat(b)
	if aIsNum && bIsNum {
		return fa == fb
	}
	if aIsStr && bIsNum {
		// Try parse string as number
		if n, err := strconv.ParseFloat(sa, 64); err == nil {
			return n == fb
		}
	}
	if aIsNum && bIsStr {
		if n, err := strconv.ParseFloat(sb, 64); err == nil {
			return fa == n
		}
	}
	// JSON deep equality for arrays/objects
	ba, _ := json.Marshal(a)
	bb, _ := json.Marshal(b)
	return string(ba) == string(bb)
}
