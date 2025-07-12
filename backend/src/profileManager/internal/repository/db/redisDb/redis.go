package redisdb 

import (
	"context"
	"fmt"
	"os"
	utils "profile-gold/internal/utils"
	"time"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

var RedisClient *redis.Client

func InitRedisClient() error {
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisPassword := os.Getenv("REDIS_PASSWORD") // <-- این مقدار "" خواهد بود اگر در .env خالی باشد
	redisDbStr := os.Getenv("REDIS_DB")

	if redisHost == "" || redisPort == "" {
		utils.Log.Fatal("REDIS_HOST or REDIS_PORT environment variables are not set. Exiting application.",
			zap.String("hint", "Please set them in your .env file or environment variables."))
	}

	redisAddr := fmt.Sprintf("%s:%s", redisHost, redisPort)
	utils.Log.Info("Initializing Redis client...", zap.String("address", redisAddr), zap.String("db", redisDbStr))

	dbIndex := 0
	_, err := fmt.Sscanf(redisDbStr, "%d", &dbIndex)
	if err != nil {
		utils.Log.Warn("Failed to parse REDIS_DB, defaulting to 0", zap.String("redis_db_env", redisDbStr), zap.Error(err))
	}

	redisOptions := &redis.Options{
		Addr:        redisAddr,
		DB:          dbIndex,
		PoolSize:    10,
		PoolTimeout: 30 * time.Second, // Timeout برای عملیات‌های پول
		IdleTimeout: 5 * time.Minute,
	}

	if redisPassword != "" { // <-- این شرط اضافه شد!
		redisOptions.Password = redisPassword // <-- فقط اگر رمز عبور در env خالی نبود، آن را تنظیم کن
		utils.Log.Debug("Redis password configured, attempting authentication.")
	} else {
		utils.Log.Debug("No Redis password provided in .env, attempting connection without authentication.")
	}
	// ---------------------------------------------------------------------

	RedisClient = redis.NewClient(redisOptions) // <-- از redisOptions جدید استفاده کن

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second) // Timeout برای Ping
	defer cancel()

	pong, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		utils.Log.Error("Failed to connect to Redis during Ping test", zap.Error(err), zap.String("address", redisAddr))
		utils.Log.Fatal("Critical: Redis connection failed. Exiting Profile Manager.", zap.Error(err))
		return fmt.Errorf("failed to connect to redis: %w", err)
	}
	utils.Log.Info("Redis client connected successfully.", zap.String("ping_response", pong))

	utils.Log.Info("Redis client initialized successfully and connected.", zap.String("address", redisAddr), zap.Int("db_index", dbIndex))
	return nil

}
