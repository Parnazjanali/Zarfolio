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
type TokenRepository interface {
	AddTokenToBlacklist(token string, expiration time.Duration) error
	IsTokenBlacklisted(token string) (bool, error)
}

func (r *redisTokenRepository) IsTokenBlacklisted(token string) (bool, error) {
	key := fmt.Sprintf("jwt_blacklist:%s", token)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		utils.Log.Error("Failed to check token in Redis blacklist",
			zap.String("token_prefix", token[:min(len(token), 10)]),
			zap.Error(err))
		return false, err
	}
	return result == 1, nil
}

func (r *redisTokenRepository) AddTokenToBlacklist(token string, expiration time.Duration) error {
	key := fmt.Sprintf("jwt_blacklist:%s", token)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	statusCmd := r.client.SetEX(ctx, key, "blacklisted", expiration)
	if statusCmd.Err() != nil {
		utils.Log.Error("Failed to add token to Redis blacklist",
			zap.String("token_prefix", token[:min(len(token), 10)]),
			zap.Error(statusCmd.Err()))
		return fmt.Errorf("failed to add token to blacklist: %w", statusCmd.Err())
	}
	utils.Log.Debug("Token added to Redis blacklist",
		zap.String("token_prefix", token[:min(len(token), 10)]),
		zap.Duration("expiration", expiration))

	return nil
}

func NewRedisTokenRepository(client *redis.Client) TokenRepository {
	if client == nil {
		utils.Log.Fatal("Redis client is nil for RedisTokenRepository.")
	}
	utils.Log.Info("RedisTokenRepository initialized successfully.")
	return &redisTokenRepository{client: client}
}
