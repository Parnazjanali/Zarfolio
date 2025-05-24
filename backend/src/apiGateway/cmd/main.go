package main

import (
	"gold-api/internal/api/server"
	"gold-api/internal/utils"
)

func main() {
	if err := utils.InitLogger(); err != nil {
		panic(err)
	}
	defer utils.Log.Sync()

	server.StartServer(":8080")
}
