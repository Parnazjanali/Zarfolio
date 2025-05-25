package utils

func GetJWTSecret() []byte {
	// This should be replaced with a secure method of retrieving the secret
	// For example, from an environment variable or a secure vault
	return []byte("your_jwt_secret_key")
}