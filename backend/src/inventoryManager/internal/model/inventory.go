package model

import "time"

type Product struct {
	ProductID     string  `json:"product_id"`
	ProductName   string  `json:"product_name"`
	Quantity      int     `json:"quantity"`
	PurchasePrice float64 `json:"purchase_price"`
	SalePrice     float64 `json:"sale_price"`
	Unit          string  `json:"unit"`
	Category      string  `json:"category"`
}

type FinishedProduct struct {
	ProductID      string  `json:"product_id"`
	ProductName    string  `json:"product_name"`
	GoldWeight     float64 `json:"gold_weight"`
	StoneDetails   []Stone `json:"stone_details"`
	ProductionCost float64 `json:"production_cost"`
	SalePrice      float64 `json:"sale_price"`
}

type RawGold struct {
	RawGoldID     string  `json:"raw_gold_id"`
	Carat         int     `json:"carat"`
	Weight        float64 `json:"weight"`
	PurchasePrice float64 `json:"purchase_price"`
}

type Stone struct {
	StoneID       string  `json:"stone_id"`
	StoneType     string  `json:"stone_type"`
	Weight        float64 `json:"weight"`
	Quantity      int     `json:"quantity"`
	PurchasePrice float64 `json:"purchase_price"`
}

type Commodity struct {
    ID            string    `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Code          string    `json:"code" gorm:"type:varchar(50);unique;not null"`
    Name          string    `json:"name" gorm:"type:varchar(255)"`
    Type          string    `json:"type" gorm:"type:varchar(50)"` 
    
    CurrentWeight float64   `json:"current_weight" gorm:"type:double precision;default:0"`
    Purity        float64   `json:"purity" gorm:"type:double precision;default:0.750"`
    
    CurrentQuantity int     `json:"current_quantity" gorm:"type:integer;default:0"`

    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}

type StockLog struct {
    ID              uint      `gorm:"primaryKey"`
    CommodityID     string    `gorm:"type:varchar(50);index;not null"`
    InvoiceID       string    `gorm:"type:varchar(50);index"` 
    TransactionType string    `gorm:"type:varchar(20)"`      
    
    // اصلاح: پشتیبانی از هر دو حالت وزنی و تعدادی
    WeightChange    float64   `gorm:"type:double precision"`
    QuantityChange  int       `gorm:"type:integer"` 
    
    BalanceAfterWeight   float64   `gorm:"type:double precision"`
    BalanceAfterQuantity int       `gorm:"type:integer"`
    
    CreatedAt       time.Time `gorm:"autoCreateTime"`
}

type StockChangeRequest struct {
    CommodityID     string  `json:"commodity_id" validate:"required"`
    InvoiceID       string  `json:"invoice_id" validate:"required"`
    TransactionType string  `json:"transaction_type"` // SALE, PURCHASE
    Weight          float64 `json:"weight"`           // برای طلا
    Quantity        int     `json:"quantity"`         // برای کالاهای تعدادی
}
