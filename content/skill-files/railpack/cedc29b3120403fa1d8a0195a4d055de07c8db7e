package deno

import (
	"testing"

	testingUtils "github.com/railwayapp/railpack/core/testing"
	"github.com/stretchr/testify/require"
)

func TestDeno(t *testing.T) {
	tests := []struct {
		name         string
		path         string
		detected     bool
		expectedMain string
	}{
		{
			name:         "deno project with main.ts",
			path:         "../../../examples/deno-2",
			detected:     true,
			expectedMain: "main.ts",
		},
		{
			name:     "non-deno project",
			path:     "../../../examples/node-npm",
			detected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := testingUtils.CreateGenerateContext(t, tt.path)
			provider := DenoProvider{}

			detected, err := provider.Detect(ctx)
			require.NoError(t, err)
			require.Equal(t, tt.detected, detected)

			if detected {
				err = provider.Initialize(ctx)
				require.NoError(t, err)

				require.Equal(t, tt.expectedMain, provider.mainFile)

				err = provider.Plan(ctx)
				require.NoError(t, err)

				// Verify start command format
				if provider.mainFile != "" {
					expectedCmd := "deno run --allow-all " + provider.mainFile
					require.Equal(t, expectedCmd, ctx.Deploy.StartCmd)
				} else {
					require.Empty(t, ctx.Deploy.StartCmd)
				}
			}
		})
	}
}
