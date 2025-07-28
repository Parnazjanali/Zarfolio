package model

import (
	"time"

	"gorm.io/gorm" 
)


type Customer struct {
	

	Code        string    `json:"code" gorm:"unique;not null"`         
	Nikename    string    `json:"nikename" gorm:"unique;not null"`     
	Name        string    `json:"name" gorm:"not null"`                
	FamilyName  *string   `json:"familyName,omitempty" gorm:"column:family_name"` 
	Birthday    *time.Time`json:"birthday,omitempty"`                 
	Company     *string   `json:"company,omitempty"`                  

	Mobile      string    `json:"mobile" gorm:"unique;not null"`     
	Mobile2     *string   `json:"mobile2,omitempty"`
	Tel         *string   `json:"tel,omitempty"`
	Fax         *string   `json:"fax,omitempty"`
	Email       *string   `json:"email,omitempty" gorm:"unique"`      
	Website     *string   `json:"website,omitempty"`

	Address     *string   `json:"address,omitempty"`
	Postalcode  *string   `json:"postalcode,omitempty"`
	Shahr       *string   `json:"shahr,omitempty"`
	Ostan       *string   `json:"ostan,omitempty"`
	Keshvar     *string   `json:"keshvar,omitempty"`

	Shenasemeli string    `json:"shenasemeli" gorm:"unique;not null"`  
	Codeeghtesadi *string `json:"codeeghtesadi,omitempty"`
	Sabt        *string   `json:"sabt,omitempty"`                     
	TaxID       *string   `json:"taxID,omitempty"`                    

	BIDID       uint      `json:"bidId" gorm:"column:bid_id;not null"` 

	SpeedAccess bool      `json:"speedAccess" gorm:"default:false"`   
	Des         *string   `json:"des,omitempty"`                      
	InitialBalanceToman float64 `json:"initialBalanceToman" gorm:"default:0"`
	InitialBalanceGold  float64 `json:"initialBalanceGold" gorm:"default:0"`

	GoldRateType       *string `json:"goldRateType,omitempty"`      
	DefaultGoldUnit    *string `json:"defaultGoldUnit,omitempty"`   
	DefaultPaymentTerm *string `json:"defaultPaymentTerm,omitempty"`
	CustomerCategory   *string `json:"customerCategory,omitempty"`  

	
	BankAccounts    []CusCard   `gorm:"foreignKey:PersonID"` 
	CustomerTypes   []CusType   `gorm:"many2many:customer_customer_types;"` 
}

type CusCard struct {
	gorm.Model 

	PersonID    uint   `json:"person_id" gorm:"not null"` 
	Bank        string `json:"bank" gorm:"not null"`
	CardNum     *string`json:"cardNum,omitempty"`
	AccountNum  *string`json:"accountNum,omitempty"`
	ShabaNum    *string`json:"shabaNum,omitempty"`
	BIDID       uint   `json:"bidId" gorm:"column:bid_id;not null"` 
}



type CusType struct {
	gorm.Model 

	Code  string `json:"code" gorm:"unique;not null"` 
	Label string `json:"label" gorm:"not null"`      
}

