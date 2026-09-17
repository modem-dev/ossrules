package plan

type Spreadable interface {
	IsSpread() bool
}

type StringWrapper struct {
	Value string
}

func (s StringWrapper) IsSpread() bool {
	return s.Value == "..."
}

func Spread[T Spreadable](left []T, right []T) []T {
	if left == nil {
		return right
	}

	result := make([]T, 0, len(left)+len(right))

	for _, val := range left {
		if val.IsSpread() {
			result = append(result, right...)
		} else {
			result = append(result, val)
		}
	}

	return result
}

func SpreadStrings(left []string, right []string) []string {
	if left == nil {
		return right
	}

	result := make([]string, 0, len(left)+len(right))

	for _, val := range left {
		if val == "..." {
			result = append(result, right...)
		} else {
			result = append(result, val)
		}
	}

	return result
}
