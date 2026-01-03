package model

import "time"

const (
	TypeGoldFabricated = "gold_fabricated"
	TypeGoldRaw        = "gold_raw"
	TypeCoin           = "coin"
	TypeStone          = "stone"
	TypeService        = "service"
)

type CreateInvoiceRequest struct {
	UserID          string    `json:"user_id" validate:"required`
	InvoiceNumber   string    `json:"invoice_number" validate:"required"`
	CustomerID      string    `json:"customer_id" validate:"required"`
	CustomerName    string    `json:"customer_name" validate:"required"`
	InvoiceDate     time.Time `json:"invoice_date" validate:"required"`
	FlowType        string    `json:"flow_type" validate:"required,oneof=payable receivable"`
	DocumentSubType string    `json:"document_sub_type" validate:"required"`

	Items          []CreateInvoiceItemRequest `json:"items" validate:"required,gt=0,dive"`
	Currency       string                     `json:"currency" validate:"required"`
	CurrencyRate   float64                    `json:"currency_rate" validate:"required,gt=0"`
	DiscountAmount float64                    `json:"discount_amount" validate:"gte=0"`
	TaxAmount      float64                    `json:"tax_amount" validate:"gte=0"`

	Notes   string   `json:"notes,omitempty"`
	Tags    []string `json:"tags,omitempty"`
	SendSMS bool     `json:"send_sms"`
}

type CreateInvoiceItemRequest struct {
	Type          string  `json:"type" validate:"required,oneof=gold_fabricated gold_raw coin stone service"`
	Description   string  `json:"description" validate:"required"`
	CommodityID   *string `json:"commodity_id,omitempty"`
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

	Notes string `json:"notes,omitempty"`
}
