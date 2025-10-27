package model

import (
    "time"
)


type Invoice struct {
    ID                string        `json:"id" gorm:"primaryKey;type:varchar(50)"`
    InvoiceNumber     string        `json:"invoice_number" gorm:"type:varchar(50);unique"`
    CustomerID        string        `json:"customer_id" gorm:"type:varchar(50)"`
    CustomerName      string        `json:"customer_name" gorm:"type:varchar(255)"`
    InvoiceDate       time.Time     `json:"invoice_date" gorm:"type:timestamp"`
    FlowType          string        `json:"flow_type" gorm:"type:varchar(20);check:flow_type IN ('payable','receivable')"`
    DocumentSubType   string        `json:"document_sub_type" gorm:"type:varchar(50)"`
    Items             []InvoiceItem `json:"items" gorm:"foreignKey:InvoiceID;constraint:OnDelete:CASCADE"`
    GrandTotal        float64       `json:"grand_total" gorm:"type:double precision;default:0"`
    Currency          string        `json:"currency" gorm:"type:varchar(10);default:'IRR'"`
    CurrencyRate      float64       `json:"currency_rate" gorm:"type:double precision;default:1"`
    TaxAmount         float64       `json:"tax_amount" gorm:"type:double precision;default:0"`
    DiscountAmount    float64       `json:"discount_amount" gorm:"type:double precision;default:0"`
    Notes             string        `json:"notes" gorm:"type:text"`
    Status            string        `json:"status" gorm:"type:varchar(20);default:'pending'"`
    CreatedBy         string        `json:"created_by" gorm:"type:varchar(50)"`
    ConfirmedBy       string        `json:"confirmed_by" gorm:"type:varchar(50)"`
    CreatedAt         time.Time     `json:"created_at" gorm:"type:timestamp;default:current_timestamp"`
    UpdatedAt         time.Time     `json:"updated_at" gorm:"type:timestamp;default:current_timestamp"`
    Tags              []string      `json:"tags" gorm:"type:text[]"`
    SendSMS           bool          `json:"send_sms" gorm:"default:false"`
}

type InvoiceItem struct {
    ID              string  `json:"id" gorm:"primaryKey;type:varchar(50)"`
    InvoiceID       string  `json:"invoice_id" gorm:"type:varchar(50);not null"` 
    Type            string  `json:"type" gorm:"type:varchar(50);not null"`
    Description     string  `json:"description" gorm:"type:text"`
    Quantity        float64 `json:"quantity" gorm:"type:double precision;default:1"`
    UnitPrice       float64 `json:"unit_price" gorm:"type:double precision;default:0"`
    TotalPrice      float64 `json:"total_price" gorm:"type:double precision;default:0"`
    Weight          float64 `json:"weight" gorm:"type:double precision;default:0"`
    Purity          float64 `json:"purity" gorm:"type:double precision;default:0"`
    Currency        string  `json:"currency" gorm:"type:varchar(10)"`
    CurrencyRate    float64 `json:"currency_rate" gorm:"type:double precision;default:1"`
    DiscountPercent float64 `json:"discount_percent" gorm:"type:double precision;default:0"`
    DiscountAmount  float64 `json:"discount_amount" gorm:"type:double precision;default:0"`
    TaxAmount       float64 `json:"tax_amount" gorm:"type:double precision;default:0"`
    ChequeID        *string `json:"cheque_id" gorm:"type:varchar(50)"`
    CommodityID     *string `json:"commodity_id" gorm:"type:varchar(50)"`
    CommodityCode   *string `json:"commodity_code" gorm:"type:varchar(50)"`
    Notes           string  `json:"notes" gorm:"type:text"`
}

type Payment struct {
    ID          string    `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Type        string    `json:"type" gorm:"type:varchar(50);not null"`
    Amount      float64   `json:"amount" gorm:"type:double precision;default:0"`
    Description string    `json:"description" gorm:"type:text"`
    BankID      *string   `json:"bank_id" gorm:"type:varchar(50)"`
    CashdeskID  *string   `json:"cashdesk_id" gorm:"type:varchar(50)"`
    ChequeID    *string   `json:"cheque_id" gorm:"type:varchar(50)"`
    CreatedAt   time.Time `json:"created_at" gorm:"type:timestamp;default:current_timestamp"`
}

type Commodity struct {
    ID     string  `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Name   string  `json:"name" gorm:"type:varchar(255);not null"`
    Code   string  `json:"code" gorm:"type:varchar(50);unique"`
    Weight float64 `json:"weight" gorm:"type:double precision;default:0"`
    Purity float64 `json:"purity" gorm:"type:double precision;default:0"`
    Type   string  `json:"type" gorm:"type:varchar(50);not null"`
}