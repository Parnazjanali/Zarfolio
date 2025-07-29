package main

import (
	"crm-gold/internal/repository/db/postgresDb" 
	"crm-gold/internal/utils"
)

func main() {
	utils.InitLogger()
	defer utils.Log.Sync() 
	postgresDb.InitDB()
	if postgresDb.DB == nil {
		utils.Log.Fatal("Database connection is nil, exiting...")
	}
}
