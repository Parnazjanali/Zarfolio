package model

type Product struct {
    ProductID    string  `json:"product_id"`
    ProductName  string  `json:"product_name"`
    Quantity     int     `json:"quantity"`
    PurchasePrice float64 `json:"purchase_price"`
    SalePrice    float64 `json:"sale_price"`
    Unit         string  `json:"unit"`
    Category     string  `json:"category"`
}

type FinishedProduct struct {
    ProductID    string  `json:"product_id"`
    ProductName  string  `json:"product_name"`
    GoldWeight   float64 `json:"gold_weight"`
    StoneDetails []Stone `json:"stone_details"` 
    ProductionCost float64 `json:"production_cost"`
    SalePrice    float64 `json:"sale_price"`
}

type Currency struct {
    CurrencyID   string  `json:"currency_id"`
    CurrencyName string  `json:"currency_name"`
    Amount       float64 `json:"amount"`
    ExchangeRate float64 `json:"exchange_rate"`
}

type Cash struct {
    CashID       string  `json:"cash_id"`
    CurrencyName string  `json:"currency_name"`
    Amount       float64 `json:"amount"`
}

type Check struct {
    CheckID      string  `json:"check_id"`
    CheckNumber  string  `json:"check_number"`
    BankName     string  `json:"bank_name"`
    Amount       float64 `json:"amount"`
    DueDate      string  `json:"due_date"`
    Status       string  `json:"status"`
}

type BankAccount struct {
    AccountID    string  `json:"account_id"`
    BankName     string  `json:"bank_name"`
    AccountNumber string  `json:"account_number"`
    Balance      float64 `json:"balance"`
    CurrencyName string  `json:"currency_name"`
}

type RawGold struct {
    RawGoldID    string  `json:"raw_gold_id"`
    Carat        int     `json:"carat"`
    Weight       float64 `json:"weight"`
    PurchasePrice float64 `json:"purchase_price"`
}

type Stone struct {
    StoneID      string  `json:"stone_id"`
    StoneType    string  `json:"stone_type"`
    Weight       float64 `json:"weight"`
    Quantity     int     `json:"quantity"`
    PurchasePrice float64 `json:"purchase_price"`
}

