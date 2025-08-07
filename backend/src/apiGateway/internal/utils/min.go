package utils

func Min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
func PtrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func PtrFloat64(f float64) *float64 {
	return &f
}
