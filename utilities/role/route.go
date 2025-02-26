package roles

import (
	"backend/app/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutesRole(r *gin.Engine, roleHandler *RoleHandler) {
	auth := r.Group("roles")
	auth.Use(middleware.AuthMiddleware())

	auth.GET("/:id", roleHandler.GetRole)
}
