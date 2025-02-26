package main

import (
	"backend/app/config"
	"backend/app/databases"

	roles "backend/utilities/role"
	"backend/utilities/self_assessment"
	users "backend/utilities/user"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	conf, err := config.Init()
	if err != nil {
		panic(err)
	}

	db, err := databases.ConnectPGXPool(conf.DB.URL)
	if err != nil {
		panic(err)
	}

	defer db.Close()

	// Initialize queries
	roleQueries := roles.New(db)
	userQueries := users.New(db)
	selfAssesmentQueries := self_assessment.New(db)

	secretKey := conf.JWT.Secret
	// Initialize handlers
	roleHandler := roles.NewRoleHandler(roleQueries)
	userHandler := users.NewAuthHandler(userQueries, secretKey)
	selfAssessmentHandler := self_assessment.NewSelfAssessmentHandler(selfAssesmentQueries)

	// Setup router
	r := gin.Default()

	// Configure CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Your React app URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	roles.SetupRoutesRole(r, roleHandler)
	users.SetupRoutesAuth(r, userHandler)
	self_assessment.SetupRoutesSelfAssessment(r, selfAssessmentHandler)
	
	r.Run()
}
