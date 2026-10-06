package common_test

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/common"
)

func TestRequireOwner(t *testing.T) {
	tests := []struct {
		name       string
		owner      string
		caller     string
		wantErr    bool
		wantStatus int
	}{
		{name: "owner allowed", owner: "u1", caller: "u1", wantErr: false},
		{name: "non-owner masked as not found", owner: "u1", caller: "u2", wantErr: true, wantStatus: http.StatusNotFound},
		{name: "empty caller denied", owner: "u1", caller: "", wantErr: true, wantStatus: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			appErr := common.RequireOwner(tt.owner, tt.caller, "conversation")
			if !tt.wantErr {
				assert.Nil(t, appErr)
				return
			}
			require.NotNil(t, appErr)
			var asErr *common.AppError
			require.ErrorAs(t, appErr, &asErr)
			assert.Equal(t, tt.wantStatus, asErr.Status)
		})
	}
}
