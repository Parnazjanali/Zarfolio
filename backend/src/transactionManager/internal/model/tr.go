package model

import (
	"time"
)

type Invoice struct {
	ID              string        `json:"id" gorm:"primaryKey;type:varchar(50)"`
	InvoiceNumber   string        `json:"invoice_number" gorm:"type:varchar(50);unique"`
	CustomerID      string        `json:"customer_id" gorm:"type:varchar(50)"`
	CustomerName    string        `json:"customer_name" gorm:"type:varchar(255)"`
	InvoiceDate     time.Time     `json:"invoice_date" gorm:"type:timestamp"`
	FlowType        string        `json:"flow_type" gorm:"type:varchar(20);check:flow_type IN ('payable','receivable')"`
	DocumentSubType string        `json:"document_sub_type" gorm:"type:varchar(50)"`
	Items           []InvoiceItem `json:"items" gorm:"foreignKey:InvoiceID;constraint:OnDelete:CASCADE"`
	GrandTotal      float64       `json:"grand_total" gorm:"type:double precision;default:0"`
	Currency        string        `json:"currency" gorm:"type:varchar(10);default:'IRR'"`
	CurrencyRate    float64       `json:"currency_rate" gorm:"type:double precision;default:1"`
	TaxAmount       float64       `json:"tax_amount" gorm:"type:double precision;default:0"`
	DiscountAmount  float64       `json:"discount_amount" gorm:"type:double precision;default:0"`
	Notes           string        `json:"notes" gorm:"type:text"`
	Status          string        `json:"status" gorm:"type:varchar(20);default:'pending'"`
	CreatedBy       string        `json:"created_by" gorm:"type:varchar(50)"`
	ConfirmedBy     string        `json:"confirmed_by" gorm:"type:varchar(50)"`
	CreatedAt       time.Time     `json:"created_at" gorm:"type:timestamp;default:current_timestamp"`
	UpdatedAt       time.Time     `json:"updated_at" gorm:"type:timestamp;default:current_timestamp"`
	Tags            []string      `json:"tags" gorm:"type:text[]"`
	SendSMS         bool          `json:"send_sms" gorm:"default:false"`
}

type PaymentSnapshot struct {
    ID          string  `json:"id" gorm:"primaryKey"`
    InvoiceID   string  `json:"invoice_id"`
    Type        string  `json:"type"`  
    Amount      float64 `json:"amount"` 
    ReferenceID string  `json:"reference_id"` 
}


type InvoiceItem struct {
    ID            string  `json:"id" gorm:"primaryKey"`
    InvoiceID     string  `json:"invoice_id"`
    CommodityID   *string `json:"commodity_id"`
    CommodityCode *string `json:"commodity_code"`

    Type          string  `json:"type"` 
    Description   string  `json:"description"`
    Quantity      float64 `json:"quantity"`
    Weight        float64 `json:"weight"`
    Purity        float64 `json:"purity"`
    ItemWeightNet float64 `json:"item_weight_net"`

    BaseGoldPrice   float64 `json:"base_gold_price"`
    LaborFee        float64 `json:"labor_fee"`
    StoneValue      float64 `json:"stone_value"`
    UnitPrice       float64 `json:"unit_price"`
    DiscountPercent float64 `json:"discount_percent"` 
    DiscountAmount  float64 `json:"discount_amount"`
    TaxAmount       float64 `json:"tax_amount"`
    TotalPrice      float64 `json:"total_price"`
    
    Notes           string  `json:"notes"`
}

type StockChangeItem struct {
	CommodityID     string  `json:"commodity_id"`
	TransactionType string  `json:"transaction_type"`  
	NetWeightChange float64 `json:"net_weight_change"` 
	Purity          float64 `json:"purity"`            
}

type CreateInvoiceRequest struct {
	InvoiceNumber   string    `json:"invoice_number" validate:"required"`
	CustomerID      string    `json:"customer_id" validate:"required"`
	CustomerName    string    `json:"customer_name" validate:"required"`
	InvoiceDate     time.Time `json:"invoice_date" validate:"required"`
	FlowType        string    `json:"flow_type" validate:"required,oneof=payable receivable"` 
	DocumentSubType string    `json:"document_sub_type" validate:"required"`                  

	Items []CreateInvoiceItemRequest `json:"items" validate:"required,gt=0,dive"`
	Currency       string  `json:"currency" validate:"required"`          
	CurrencyRate   float64 `json:"currency_rate" validate:"required,gt=0"` 
	DiscountAmount float64 `json:"discount_amount" validate:"gte=0"`
	TaxAmount      float64 `json:"tax_amount" validate:"gte=0"`

	Notes   string   `json:"notes,omitempty"`
	Tags    []string `json:"tags,omitempty"`
	SendSMS bool     `json:"send_sms"`
}

type CreateInvoiceItemRequest struct {
	Type        string  `json:"type" validate:"required,oneof=gold_fabricated gold_raw coin stone service"`
	Description string  `json:"description" validate:"required"`
	CommodityID *string `json:"commodity_id,omitempty"` 
    	CommodityCode *string `json:"commodity_code" gorm:"type:varchar(50)"`


	Quantity      float64 `json:"quantity" validate:"required,gt=0"`
	Weight        float64 `json:"weight" validate:"required,gte=0"`
	Purity        float64 `json:"purity" validate:"required,gt=0"`  
	ItemWeightNet float64 `json:"item_weight_net" validate:"gte=0"` 

	BaseGoldPrice float64 `json:"base_gold_price" validate:"required,gt=0"` 
    	LaborFee      float64 `json:"labor_fee" validate:"gte=0"`            
	StoneValue    float64 `json:"stone_value" validate:"gte=0"`            

	UnitPrice       float64 `json:"unit_price" validate:"required,gte=0"`
	DiscountPercent float64 `json:"discount_percent" validate:"gte=0,lte=100"`
	TaxAmount       float64 `json:"tax_amount" validate:"gte=0"`
    DiscountAmount  float64 `json:"discount_amount" validate:"gte=0"` 

    Notes           string  `json:"notes,omitempty"`

}
