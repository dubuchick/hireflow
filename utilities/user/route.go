package users

import "github.com/gin-gonic/gin"

func SetupRoutesAuth(r *gin.Engine, authHandler *AuthHandler) {
	r.POST("/login", authHandler.Login)
	r.POST("/sign-up", authHandler.Signup)
}
