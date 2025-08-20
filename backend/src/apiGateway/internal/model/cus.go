package model

import (
	"time"

	"gorm.io/gorm"
)

type Customer struct {
	gorm.Model

	Code       string     `json:"code" gorm:"unique;not null;size:50;index"`
	Nikename   string     `json:"nikename" gorm:"unique;not null;size:255"`
	Name       string     `json:"name" gorm:"not null;size:255"`
	FamilyName *string    `json:"familyName,omitempty" gorm:"column:family_name;size:255"`
	Birthday   *time.Time `json:"birthday,omitempty"`
	Company    *string    `json:"company,omitempty" gorm:"size:255"`

	Mobile  string  `json:"mobile" gorm:"unique;not null;size:20"`
	Mobile2 *string `json:"mobile2,omitempty" gorm:"size:20"`
	Tel     *string `json:"tel,omitempty" gorm:"size:20"`
	Fax     *string `json:"fax,omitempty" gorm:"size:20"`
	Email   *string `json:"email,omitempty" gorm:"unique;size:255"`
	Website *string `json:"website,omitempty" gorm:"size:255"`

	Address    *string `json:"address,omitempty" gorm:"type:text"`
	Postalcode *string `json:"postalcode,omitempty" gorm:"size:20"`
	Shahr      *string `json:"shahr,omitempty" gorm:"size:100"`
	Ostan      *string `json:"ostan,omitempty" gorm:"size:100"`
	Keshvar    *string `json:"keshvar,omitempty" gorm:"size:100"`

	Shenasemeli   string  `json:"shenasemeli" gorm:"unique;not null;size:50"`
	Codeeghtesadi *string `json:"codeeghtesadi,omitempty" gorm:"size:50"`
	Sabt          *string `json:"sabt,omitempty" gorm:"size:50"`
	TaxID         *string `json:"taxID,omitempty" gorm:"size:50"`

	BIDID       uint    `json:"bidId" gorm:"column:bid_id;not null;index"`
	SpeedAccess bool    `json:"speedAccess" gorm:"default:false"`
	Des         *string `json:"des,omitempty" gorm:"type:text"`

	Status           string     `json:"status" gorm:"default:'Active';size:50"`
	LastActivityDate *time.Time `json:"lastActivityDate,omitempty"`
	InternalNotes    *string    `json:"internalNotes,omitempty" gorm:"type:text"`

	InitialBalanceToman float64 `json:"initialBalanceToman" gorm:"default:0"`
	InitialBalanceGold  float64 `json:"initialBalanceGold" gorm:"default:0"`

	GoldRateType        *string  `json:"goldRateType,omitempty" gorm:"size:50"`
	DefaultGoldUnit     *string  `json:"defaultGoldUnit,omitempty" gorm:"size:50"`
	DefaultGoldUnitRate *float64 `json:"defaultGoldUnitRate,omitempty"`

	BankAccounts      []CusCard `gorm:"foreignKey:PersonID"`
	CustomerTypes     []CusType `gorm:"many2many:customer_customer_types;"`
	DefaultCurrencyID *uint     `json:"defaultCurrencyId,omitempty" gorm:"index"`
	DefaultCurrency   *Currency `gorm:"foreignKey:DefaultCurrencyID;references:ID"`

	DefaultPaymentTermID *uint        `json:"defaultPaymentTermId,omitempty" gorm:"index"`
	DefaultPaymentTerm   *PaymentTerm `gorm:"foreignKey:DefaultPaymentTermID;references:ID"`

	AssignedEmployeeID *uint     `json:"assignedEmployeeId,omitempty" gorm:"index"`
	AssignedEmployee   *Employee `gorm:"foreignKey:AssignedEmployeeID;references:ID"`

	PrelabelID *uint           `json:"prelabelId,omitempty" gorm:"column:prelabel_id;index"`
	Prelabel   *PersonPrelabel `gorm:"foreignKey:PrelabelID;references:ID"`
}

type CusCard struct {
	gorm.Model

	PersonID   uint    `json:"person_id" gorm:"not null;index"`
	Bank       string  `json:"bank" gorm:"not null;size:100"`
	CardNum    *string `json:"cardNum,omitempty" gorm:"size:50"`
	AccountNum *string `json:"accountNum,omitempty" gorm:"size:50"`
	ShabaNum   *string `json:"shabaNum,omitempty" gorm:"size:50"`
	BIDID      uint    `json:"bidId" gorm:"column:bid_id;not null;index"`
}

type CusType struct {
	gorm.Model

	Code  string `json:"code" gorm:"unique;not null;size:50"`
	Label string `json:"label" gorm:"not null;size:100"`
}

type Currency struct {
	gorm.Model
	Name   string `json:"name" gorm:"unique;not null;size:50"`
	Symbol string `json:"symbol" gorm:"unique;not null;size:10"`
}

type PaymentTerm struct {
	gorm.Model
	Name string `json:"name" gorm:"unique;not null;size:100"`
	Days int    `json:"days"`
}

type Employee struct {
	gorm.Model
	Name string `json:"name" gorm:"not null"`
}

type PersonPrelabel struct {
	gorm.Model
	Label string `json:"label" gorm:"unique;not null;size:100"`
}

type CreateCustomerRequest struct {
	Code       string `json:"code" validate:"required"`
	Nikename   string `json:"nikename" validate:"required"`
	Name       string `json:"name" validate:"required"`
	FamilyName string `json:"familyName"`
	Company    string `json:"company"`
	BIDID      uint   `json:"bidId" gorm:"column:bid_id;not null;index"`

	Mobile  string `json:"mobile" validate:"required"`
	Mobile2 string `json:"mobile2"`
	Tel     string `json:"tel"`
	Fax     string `json:"fax"`
	Email   string `json:"email"`
	Website string `json:"website"`

	Address    string `json:"address"`
	Postalcode string `json:"postalCode"`
	Shahr      string `json:"shahr"`
	Ostan      string `json:"ostan"`
	Keshvar    string `json:"keshvar"`

	Shenasemeli   string `json:"shenasemeli" validate:"required"`
	Codeeghtesadi string `json:"codeeghtesadi"`
	Sabt          string `json:"sabt"`
	TaxID         string `json:"taxID"`

	InitialBalanceToman float64 `json:"initialBalanceToman"`
	InitialBalanceGold  float64 `json:"initialBalanceGold"`

	GoldRateType        string  `json:"goldRateType"`
	DefaultGoldUnit     string  `json:"defaultGoldUnit"`
	DefaultGoldUnitRate float64 `json:"defaultGoldUnitRate"`
	CustomerCategory    string  `json:"customerCategory"`
}

type UpdateCustomerRequest struct {
	Nikename   *string    `json:"nikename,omitempty"`
	Name       *string    `json:"name,omitempty"`
	FamilyName *string    `json:"familyName,omitempty" gorm:"column:family_name"`
	Birthday   *time.Time `json:"birthday,omitempty"`
	Company    *string    `json:"company,omitempty"`

	Mobile  *string `json:"mobile,omitempty"`
	Mobile2 *string `json:"mobile2,omitempty"`
	Tel     *string `json:"tel,omitempty"`
	Fax     *string `json:"fax,omitempty"`
	Email   *string `json:"email,omitempty"`
	Website *string `json:"website,omitempty"`

	Address    *string `json:"address,omitempty"`
	Postalcode *string `json:"postalcode,omitempty"`
	Shahr      *string `json:"shahr,omitempty"`
	Ostan      *string `json:"ostan,omitempty"`
	Keshvar    *string `json:"keshvar,omitempty"`

	Shenasemeli   *string `json:"shenasemeli,omitempty"`
	Codeeghtesadi *string `json:"codeeghtesadi,omitempty"`
	Sabt          *string `json:"sabt,omitempty"`
	TaxID         *string `json:"taxID,omitempty"`

	SpeedAccess *bool   `json:"speedAccess,omitempty"`
	Des         *string `json:"des,omitempty"`
	Status      *string `json:"status,omitempty"`

	CustomerCategory   *string `json:"customerCategory,omitempty"`
	PrelabelID         *uint   `json:"prelabelId,omitempty"`
	AssignedEmployeeID *uint   `json:"assignedEmployeeId,omitempty"`

	BankAccounts  *[]CusCard `json:"bankAccounts,omitempty"`
	CustomerTypes *[]CusType `json:"customerTypes,omitempty"`
}

type CustomerSearchRequest struct {
	Name        string   `json:"name"`
	PhoneNumber string   `json:"phone_number"`
	Tags        []string `json:"tags"`
	Page        int      `json:"page"`
	PageSize    int      `json:"page_size"`
}

type SearchResponse struct {
	Data  []Customer `json:"data"`
	Total int64      `json:"total"` 
}
