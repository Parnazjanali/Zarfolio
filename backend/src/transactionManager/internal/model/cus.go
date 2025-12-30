package model

type SlimCustomer struct {
    ID       string  `json:"id"`
    Code     string  `json:"code"`
    Name     string  `json:"name"`
    Nikename string  `json:"nikename"`
    Status   string  `json:"status"` 
}