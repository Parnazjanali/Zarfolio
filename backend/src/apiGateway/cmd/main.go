package main

import (
	"fmt"
	"gold-api/internal/api/server"
	"gold-api/internal/utils"
	"os"
)

func main() {
	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer func() {
		if err := utils.Log.Sync(); err != nil && err.Error() != "sync /dev/stdout: invalid argument" {

			fmt.Fprintf(os.Stderr, "Failed to sync logger: %v\n", err)
		}
	}()

	server.StartServer(":8080")
}
