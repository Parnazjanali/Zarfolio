package service

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"profile-gold/internal/utils" // Assuming utils.Log is here
)

var (
	redisClient *redis.Client
	redisCtx    = context.Background()
)

// RedisService handles operations related to Redis, particularly for token revocation.
type RedisService struct {
	client *redis.Client
	logger *zap.Logger
}

// NewRedisService creates a new RedisService.
// It expects a Redis client to be already initialized and passed to it.
func NewRedisService(client *redis.Client, logger *zap.Logger) (*RedisService, error) {
	if client == nil {
		return nil, fmt.Errorf("redis client cannot be nil")
	}
	if logger == nil {
		// Fallback to a default logger if none provided, though ideally it should always be provided.
		// For now, let's use the global utils.Log if available, or panic.
		if utils.Log == nil {
			panic("Logger is nil and utils.Log is not initialized")
		}
		logger = utils.Log
	}
	return &RedisService{client: client, logger: logger}, nil
}

// InitRedis initializes the global Redis client.
// This should be called once during application startup.
func InitRedis() error {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379" // Default address
		utils.Log.Warn("REDIS_ADDR environment variable not set, using default", zap.String("address", redisAddr))
	}

	redisPassword := os.Getenv("REDIS_PASSWORD") // Empty if no password

	opts := &redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
		DB:       0, // Default DB
	}

	redisClient = redis.NewClient(opts)

	// Ping the server to ensure connection is established.
	if _, err := redisClient.Ping(redisCtx).Result(); err != nil {
		utils.Log.Error("Failed to connect to Redis", zap.Error(err), zap.String("address", redisAddr))
		return fmt.Errorf("failed to connect to redis: %w", err)
	}

	utils.Log.Info("Successfully connected to Redis", zap.String("address", redisAddr))
	return nil
}

// GetClient returns the initialized Redis client.
// This is useful for other parts of the application that might need direct Redis access,
// though it's generally better to expose specific methods via RedisService.
func GetClient() *redis.Client {
	if redisClient == nil {
		// This indicates InitRedis was not called or failed.
		// Depending on application structure, this might panic or try to re-initialize.
		// For now, we'll log a fatal error as it's a critical setup issue.
		utils.Log.Fatal("Redis client requested before initialization or after initialization failed.")
	}
	return redisClient
}

// AddToBlacklist adds a token to the Redis blacklist with a specific TTL.
// The key will be the token itself (or its signature/JTI).
func (s *RedisService) AddToBlacklist(tokenID string, ttl time.Duration) error {
	if ttl <= 0 {
		s.logger.Warn("Attempted to add token to blacklist with non-positive TTL", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]), zap.Duration("ttl", ttl))
		return fmt.Errorf("TTL must be positive")
	}
	err := s.client.Set(redisCtx, tokenID, "revoked", ttl).Err()
	if err != nil {
		s.logger.Error("Failed to add token to Redis blacklist", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]), zap.Error(err))
		return fmt.Errorf("could not set token in redis: %w", err)
	}
	s.logger.Info("Token added to blacklist", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]), zap.Duration("ttl", ttl))
	return nil
}

// IsBlacklisted checks if a token is in the Redis blacklist.
func (s *RedisService) IsBlacklisted(tokenID string) (bool, error) {
	exists, err := s.client.Exists(redisCtx, tokenID).Result()
	if err != nil {
		s.logger.Error("Failed to check token in Redis blacklist", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]), zap.Error(err))
		return false, fmt.Errorf("could not check token existence in redis: %w", err)
	}
	if exists > 0 {
		s.logger.Debug("Token found in blacklist", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]))
		return true, nil
	}
	s.logger.Debug("Token not found in blacklist", zap.String("tokenID_prefix", tokenID[:min(10, len(tokenID))]))
	return false, nil
}

// Removed local min function. It will use the one defined in user_service.go (or another file within the 'service' package).
// Ensure that a min(int, int) int function is available within the 'service' package.
