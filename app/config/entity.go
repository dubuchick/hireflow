package config

type Conf struct {
	DB struct {
		URL string `env:"DB_URL"`
	}
	JWT struct{
		Secret string `env:"JWT_SECRET"`
	}
}
