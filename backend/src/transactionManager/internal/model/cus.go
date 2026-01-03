package model

type SlimCustomer struct {
	ID       int    `json:"ID"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Nikename string `json:"nikename"`
	Status   string `json:"status"`
}
