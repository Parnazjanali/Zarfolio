package redisdb

import (
	"context"
	"fmt"
	"profile-gold/internal/utils"
	"time"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

type redisTokenRepository struct {
	client *redis.Client
}

// TokenRepository defines the interface for token blacklist operations.
type TokenRepository interface {
	AddTokenToBlacklist(ctx context.Context, token string, expiration time.Duration) error
	IsTokenBlacklisted(ctx context.Context, token string) (bool, error)
}

// NewRedisTokenRepository creates a new TokenRepository using Redis.
func NewRedisTokenRepository(client *redis.Client) TokenRepository {
	if client == nil {
		utils.Log.Fatal("Redis client is nil for RedisTokenRepository.")
	}
	utils.Log.Info("RedisTokenRepository initialized successfully.")
	return &redisTokenRepository{client: client}
}

// IsTokenBlacklisted checks if a token exists in the blacklist.
// It now accepts a context.
func (r *redisTokenRepository) IsTokenBlacklisted(ctx context.Context, token string) (bool, error) {
	key := fmt.Sprintf("jwt_blacklist:%s", token)
	// It's generally good practice for the caller to manage context timeouts.
	// If no timeout is on ctx, this could block. For Fiber, c.Context() is request-scoped.
	result, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		// Log error but don't return raw redis error to avoid leaking details.
		utils.Log.Error("Redis: Error checking if token is blacklisted",
			zap.String("key", key),
			zap.String("token_prefix", token[:utils.Min(len(token), 10)]), // Corrected to utils.Min
			zap.Error(err))
		return false, fmt.Errorf("error checking token blacklist status") // Generic error
	}
	return result == 1, nil
}

// AddTokenToBlacklist adds a token to the Redis blacklist with a given expiration.
// It now accepts a context.
func (r *redisTokenRepository) AddTokenToBlacklist(ctx context.Context, token string, expiration time.Duration) error {
	key := fmt.Sprintf("jwt_blacklist:%s", token)

	// Using the passed-in context directly. If it's request-scoped, it should be fine.
	statusCmd := r.client.SetEX(ctx, key, "blacklisted", expiration)
	if statusCmd.Err() != nil {
		utils.Log.Error("Failed to add token to Redis blacklist",
			zap.String("token_prefix", token[:utils.Min(len(token), 10)]), // Corrected to utils.Min
			zap.Error(statusCmd.Err()))
		return fmt.Errorf("failed to add token to blacklist: %w", statusCmd.Err())
	}
	utils.Log.Debug("Token added to Redis blacklist",
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]), // Corrected to utils.Min
		zap.Duration("expiration", expiration))

	return nil
}
