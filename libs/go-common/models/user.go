package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type GenericServiceIntegrations struct {
	Id string
}

type ServiceIntegrations struct {
	Onesignal GenericServiceIntegrations
}

type UserPreferences struct {
	Notifications map[string][]string
	TimeZone      string
}

type User struct {
	Id          primitive.ObjectID `bson:"_id"`
	FirstName   string
	LastName    string
	Email       string
	Phone       string
	Integration ServiceIntegrations
	Business    primitive.ObjectID
	Preferences UserPreferences
}

func (c *User) FullName() string {
	return c.FirstName + " " + c.LastName
}

type AdminUser struct {
	Id          primitive.ObjectID `bson:"_id"`
	FirstName   string
	LastName    string
	FullName    string
	Email       string
	Phone       string
	Integration ServiceIntegrations
}
