package cli

import (
	"context"

	"github.com/railwayapp/railpack/buildkit"
	"github.com/urfave/cli/v3"
)

var FrontendCommand = &cli.Command{
	Name:  "frontend",
	Usage: "Start the BuildKit GRPC frontend server",
	Action: func(ctx context.Context, cmd *cli.Command) error {
		buildkit.StartFrontend()

		return nil
	},
}
