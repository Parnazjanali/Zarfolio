package model

import (
    "time"

    "gorm.io/gorm"
)

type Transaction struct {
    gorm.Model 
    Code              string    `gorm:"type:varchar(50);unique;not null;index" json:"code"`      // شناسه یکتا برای تراکنش
    Type              string    `gorm:"type:varchar(20);not null" json:"type"`                   // نوع تراکنش (sale, purchase, payment, etc.)
    PartyID           string    `gorm:"type:varchar(50);not null;index" json:"party_id"`         // شناسه طرف حساب
    Amount            float64   `gorm:"type:decimal(15,2);not null" json:"amount"`               // مبلغ کل تراکنش
    Currency          string    `gorm:"type:varchar(3);not null" json:"currency"`                // واحد پول (مثل IRR, USD)
    GoldWeight        float64   `gorm:"type:decimal(10,2)" json:"gold_weight"`                   // وزن طلا (گرم)
    Purity            float64   `gorm:"type:decimal(5,2)" json:"purity"`                         // عیار طلا
    GoldRate          float64   `gorm:"type:decimal(15,2)" json:"gold_rate"`                     // نرخ طلا
    TaxAmount         float64   `gorm:"type:decimal(15,2)" json:"tax_amount"`                    // مبلغ مالیات
    FeeAmount         float64   `gorm:"type:decimal(15,2)" json:"fee_amount"`                    // کارمزد
    TotalAmount       float64   `gorm:"type:decimal(15,2);not null" json:"total_amount"`         // مبلغ کل (با مالیات و کارمزد)
    Status            string    `gorm:"type:varchar(20);not null" json:"status"`                 // وضعیت تراکنش
    InvoiceCode       string    `gorm:"type:varchar(50);index" json:"invoice_code"`              // کد فاکتور مرتبط
    Items             []Item    `gorm:"foreignKey:TransactionCode;references:Code" json:"items"` // لیست آیتم‌های تراکنش
    PaymentMethod     string    `gorm:"type:varchar(20)" json:"payment_method"`                  // روش پرداخت
    ChequeID          string    `gorm:"type:varchar(50);index" json:"cheque_id"`                 // شناسه چک
    Notes             string    `gorm:"type:text" json:"notes"`                                  // توضیحات
    CreatedBy         string    `gorm:"type:varchar(50);not null" json:"created_by"`             // شناسه کاربر ایجادکننده
    ConfirmedBy       string    `gorm:"type:varchar(50)" json:"confirmed_by"`                    // شناسه کاربر تأییدکننده
    ConfirmedAt       time.Time `gorm:"type:timestamp" json:"confirmed_at"`                      // زمان تأیید
    AccountingEntryID string    `gorm:"type:varchar(50);index" json:"accounting_entry_id"`       // شناسه سند حسابداری
    Tags              []string  `gorm:"type:jsonb" json:"tags"`                                  // برچسب‌ها
    //Customer          *Customer `gorm:"foreignKey:PartyID;references:Code" json:"customer,omitempty"` // رابطه با مشتری
}

type Item struct {
    gorm.Model 
    TransactionCode string    `gorm:"type:varchar(50);not null;index" json:"transaction_code"` // کد تراکنش مرتبط (Foreign Key)
    ItemID          string    `gorm:"type:varchar(50);index" json:"item_id"`                   // شناسه آیتم
    Description     string    `gorm:"type:text" json:"description"`                            // توضیحات آیتم
    Weight          float64   `gorm:"type:decimal(10,2)" json:"weight"`                        // وزن آیتم (گرم)
    Purity          float64   `gorm:"type:decimal(5,2)" json:"purity"`                         // عیار آیتم
    UnitPrice       float64   `gorm:"type:decimal(15,2);not null" json:"unit_price"`           // قیمت واحد
    Quantity        int       `gorm:"not null" json:"quantity"`                                // تعداد
    TotalPrice      float64   `gorm:"type:decimal(15,2);not null" json:"total_price"`          // قیمت کل آیتم
}