package constant

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPath2RelayMode(t *testing.T) {
	tests := []struct {
		path string
		want int
	}{
		{path: "/v1/alpha/search", want: RelayModeAlphaSearch},
		{path: "/v1/alpha/search?foo=1", want: RelayModeAlphaSearch},
		{path: "/pg/chat/completions", want: RelayModeChatCompletions},
		{path: "/pg/images/generations", want: RelayModeImagesGenerations},
	}
	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			assert.Equal(t, tt.want, Path2RelayMode(tt.path))
		})
	}
}

func TestRelayRequestPath(t *testing.T) {
	tests := []struct {
		path string
		want string
	}{
		{path: "/pg/chat/completions", want: "/v1/chat/completions"},
		{path: "/pg/images/generations", want: "/v1/images/generations"},
		{path: "/v1/images/generations", want: "/v1/images/generations"},
		{path: "/pg", want: "/pg"},
	}
	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			assert.Equal(t, tt.want, RelayRequestPath(tt.path))
		})
	}
}
