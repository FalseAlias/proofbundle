package cpuid

type CPUInfo struct{}

var CPU = &CPUInfo{}

const (
	AVX2   = 1
	AVX512F = 2
)

func (c *CPUInfo) Supports(flag int) bool {
	return false
}
