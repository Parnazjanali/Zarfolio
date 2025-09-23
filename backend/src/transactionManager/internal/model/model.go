package model

import "time"

type Transaction struct {
	ID                string    `json:"id" bson:"_id"`                                  // شناسه یکتا برای تراکنش
	Type              string    `json:"type" bson:"type"`                               // نوع تراکنش (sale, purchase, payment, expense, cheque, deposit, withdraw, return)
	PartyID           string    `json:"party_id" bson:"party_id"`                       // شناسه طرف حساب (مشتری یا تامین‌کننده)
	Amount            float64   `json:"amount" bson:"amount"`                           // مبلغ کل تراکنش (در واحد ارز)
	Currency          string    `json:"currency" bson:"currency"`                       // واحد پول (مثل IRR, USD)
	GoldWeight        float64   `json:"gold_weight" bson:"gold_weight"`                 // وزن طلا (به گرم)
	Purity            float64   `json:"purity" bson:"purity"`                           // عیار طلا (مثل 18 یا 24 عیار)
	GoldRate          float64   `json:"gold_rate" bson:"gold_rate"`                     // نرخ طلا در زمان تراکنش (قیمت واحد)
	TaxAmount         float64   `json:"tax_amount" bson:"tax_amount"`                   // مبلغ مالیات
	FeeAmount         float64   `json:"fee_amount" bson:"fee_amount"`                   // کارمزد (مثل کارمزد ساخت یا تراکنش)
	TotalAmount       float64   `json:"total_amount" bson:"total_amount"`               // مبلغ کل (شامل مالیات و کارمزد)
	Status            string    `json:"status" bson:"status"`                           // وضعیت تراکنش (pending, confirmed, cancelled)
	InvoiceCode       string    `json:"invoice_code" bson:"invoice_code"`               // کد فاکتور مرتبط
	Items             []Item    `json:"items" bson:"items"`                             // لیست آیتم‌های تراکنش (مثل جزئیات طلا)
	PaymentMethod     string    `json:"payment_method" bson:"payment_method"`           // روش پرداخت (cash, cheque, transfer)
	ChequeID          string    `json:"cheque_id" bson:"cheque_id"`                     // شناسه چک (در صورت استفاده)
	Notes             string    `json:"notes" bson:"notes"`                             // توضیحات اضافی
	CreatedBy         string    `json:"created_by" bson:"created_by"`                   // شناسه کاربر ایجادکننده
	ConfirmedBy       string    `json:"confirmed_by" bson:"confirmed_by"`               // شناسه کاربر تأییدکننده
	CreatedAt         time.Time `json:"created_at" bson:"created_at"`                   // زمان ایجاد
	UpdatedAt         time.Time `json:"updated_at" bson:"updated_at"`                   // زمان به‌روزرسانی
	ConfirmedAt       time.Time `json:"confirmed_at" bson:"confirmed_at"`               // زمان تأیید (در صورت تأیید)
	AccountingEntryID string    `json:"accounting_entry_id" bson:"accounting_entry_id"` // شناسه سند حسابداری
	Tags              []string  `json:"tags" bson:"tags"`                               // برچسب‌ها برای دسته‌بندی
}
type Item struct {
	ItemID      string  `json:"item_id" bson:"item_id"`         // شناسه آیتم
	Description string  `json:"description" bson:"description"` // توضیحات آیتم (مثل نوع طلا یا جواهر)
	Weight      float64 `json:"weight" bson:"weight"`           // وزن آیتم (گرم)
	Purity      float64 `json:"purity" bson:"purity"`           // عیار آیتم
	UnitPrice   float64 `json:"unit_price" bson:"unit_price"`   // قیمت واحد
	Quantity    int     `json:"quantity" bson:"quantity"`       // تعداد
	TotalPrice  float64 `json:"total_price" bson:"total_price"` // قیمت کل آیتم
}
