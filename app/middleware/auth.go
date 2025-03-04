package middleware

import (
	"backend/app/config"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

type AuthConfig struct {
	SecretKey string
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
			c.Abort()
			return
		}

		if strings.HasPrefix(tokenString, "Bearer ") {
			tokenString = strings.TrimSpace(strings.TrimPrefix(tokenString, "Bearer "))
		}

		conf, err := config.Init()
		if err != nil {
			panic(err)
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(conf.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract claims from the token
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Get the user ID from the 'sub' claim and set it in the context
			if userID, exists := claims["sub"]; exists {
				// Convert to string if it's not already
				userIDStr := fmt.Sprintf("%v", userID)

				// Set the user ID in the context
				c.Set("userID", userIDStr)
			}
		}

		c.Next()
	}
}
