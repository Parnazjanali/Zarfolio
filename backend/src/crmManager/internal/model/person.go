package model

import (
    "time"

    "gorm.io/gorm"
)

type Customer struct {
    gorm.Model 

    Code                string     `gorm:"type:varchar(50);unique;not null;index" json:"code"`                    // شناسه یکتا
    Nikename            string     `gorm:"type:varchar(255);unique;not null" json:"nikename"`                     // نام مستعار
    Name                string     `gorm:"type:varchar(255);not null" json:"name"`                                // نام
    FamilyName          *string    `gorm:"column:family_name;type:varchar(255)" json:"familyName,omitempty"`       // نام خانوادگی
    Birthday            *time.Time `gorm:"type:date" json:"birthday,omitempty"`                                   // تاریخ تولد
    Company             *string    `gorm:"type:varchar(255)" json:"company,omitempty"`                            // نام شرکت
    Mobile              string     `gorm:"type:varchar(20);unique;not null" json:"mobile"`                        // شماره موبایل اصلی
    Mobile2             *string    `gorm:"type:varchar(20)" json:"mobile2,omitempty"`                             // شماره موبایل دوم
    Tel                 *string    `gorm:"type:varchar(20)" json:"tel,omitempty"`                                 // تلفن
    Fax                 *string    `gorm:"type:varchar(20)" json:"fax,omitempty"`                                 // فکس
    Email               *string    `gorm:"type:varchar(255);unique" json:"email,omitempty"`                       // ایمیل
    Website             *string    `gorm:"type:varchar(255)" json:"website,omitempty"`                            // وب‌سایت
    Address             *string    `gorm:"type:text" json:"address,omitempty"`                                    // آدرس
    Postalcode          *string    `gorm:"type:varchar(20)" json:"postalcode,omitempty"`                          // کد پستی
    Shahr               *string    `gorm:"type:varchar(100)" json:"shahr,omitempty"`                              // شهر
    Ostan               *string    `gorm:"type:varchar(100)" json:"ostan,omitempty"`                              // استان
    Keshvar             *string    `gorm:"type:varchar(100)" json:"keshvar,omitempty"`                            // کشور
    Shenasemeli         string     `gorm:"type:varchar(50);unique;not null" json:"shenasemeli"`                   // شماره ملی
    Codeeghtesadi       *string    `gorm:"type:varchar(50)" json:"codeeghtesadi,omitempty"`                       // کد اقتصادی
    Sabt                *string    `gorm:"type:varchar(50)" json:"sabt,omitempty"`                                // شماره ثبت
    TaxID               *string    `gorm:"type:varchar(50)" json:"taxID,omitempty"`                               // شناسه مالیاتی
    BIDID               uint       `gorm:"column:bid_id;not null;index" json:"bidId"`                            // شناسه کسب‌وکار
    SpeedAccess         bool       `gorm:"default:false" json:"speedAccess"`                                      // دسترسی سریع
    Des                 *string    `gorm:"type:text" json:"des,omitempty"`                                        // توضیحات
    Status              string     `gorm:"type:varchar(50);default:'Active'" json:"status"`                       // وضعیت
    LastActivityDate    *time.Time `gorm:"type:timestamp" json:"lastActivityDate,omitempty"`                      // تاریخ آخرین فعالیت
    InitialBalanceToman float64    `gorm:"type:decimal(15,2);default:0" json:"initialBalanceToman"`               // موجودی اولیه (تومان)
    InitialBalanceGold  float64    `gorm:"type:decimal(15,2);default:0" json:"initialBalanceGold"`                // موجودی اولیه (طلا)
    GoldRateType        *string    `gorm:"type:varchar(50)" json:"goldRateType,omitempty"`                        // نوع نرخ طلا
    DefaultGoldUnit     *string    `gorm:"type:varchar(50)" json:"defaultGoldUnit,omitempty"`                     // واحد پیش‌فرض طلا
    DefaultGoldUnitRate *float64   `gorm:"type:decimal(15,2)" json:"defaultGoldUnitRate,omitempty"`               // نرخ واحد پیش‌فرض طلا
    BankAccounts        []CusCard  `gorm:"foreignKey:PersonID;references:ID" json:"bankAccounts"`                 // حساب‌های بانکی
    CustomerTypes       []CusType  `gorm:"many2many:customer_customer_types;joinForeignKey:CustomerID;joinReferences:CusTypeID" json:"customerTypes"`
    DefaultCurrencyID   *uint      `gorm:"index" json:"defaultCurrencyId,omitempty"`                              // شناسه ارز پیش‌فرض
    DefaultCurrency     *Currency  `gorm:"foreignKey:DefaultCurrencyID;references:ID" json:"defaultCurrency"`      // ارز پیش‌فرض
    DefaultPaymentTermID *uint     `gorm:"index" json:"defaultPaymentTermId,omitempty"`                           // شناسه شرایط پرداخت پیش‌فرض
    DefaultPaymentTerm  *PaymentTerm `gorm:"foreignKey:DefaultPaymentTermID;references:ID" json:"defaultPaymentTerm"` // شرایط پرداخت پیش‌فرض
    AssignedEmployeeID  *uint      `gorm:"index" json:"assignedEmployeeId,omitempty"`                             // شناسه کارمند مسئول
    AssignedEmployee    *Employee  `gorm:"foreignKey:AssignedEmployeeID;references:ID" json:"assignedEmployee"`    // کارمند مسئول
    PrelabelID         *uint      `gorm:"column:prelabel_id;index" json:"prelabelId,omitempty"`                  // شناسه پیش‌برچسب
    Prelabel           *PersonPrelabel `gorm:"foreignKey:PrelabelID;references:ID" json:"prelabel"`               // پیش‌برچسب
}

type CusCard struct {
    gorm.Model
    PersonID   uint    `gorm:"not null;index" json:"person_id"`                    
    Bank       string  `gorm:"type:varchar(100);not null" json:"bank"`              
    CardNum    *string `gorm:"type:varchar(50)" json:"cardNum,omitempty"`          
    AccountNum *string `gorm:"type:varchar(50)" json:"accountNum,omitempty"`       
    ShabaNum   *string `gorm:"type:varchar(50)" json:"shabaNum,omitempty"`         
    BIDID      uint    `gorm:"column:bid_id;not null;index" json:"bidId"`         
}

type CusType struct {
    gorm.Model
    Code  string `gorm:"type:varchar(50);unique;not null" json:"code"`       
    Label string `gorm:"type:varchar(100);not null" json:"label"`            
}

type Currency struct {
    gorm.Model
    Name   string `gorm:"type:varchar(50);unique;not null" json:"name"`        
    Symbol string `gorm:"type:varchar(10);unique;not null" json:"symbol"`     
}

type PaymentTerm struct {
    gorm.Model
    Name string `gorm:"type:varchar(100);unique;not null" json:"name"`      
    Days int    `gorm:"not null" json:"days"`                               
}

type Employee struct {
    gorm.Model
    Name string `gorm:"type:varchar(255);not null" json:"name"`              
}

type PersonPrelabel struct {
    gorm.Model
    Label string `gorm:"type:varchar(100);unique;not null" json:"label"`     
}

type CreateCustomerRequest struct {
    Code                string  `json:"code" validate:"required"`
    Nikename            string  `json:"nikename" validate:"required"`
    Name                string  `json:"name" validate:"required"`
    FamilyName          string  `json:"familyName"`
    Company             string  `json:"company"`
    BIDID               uint    `json:"bidId" validate:"required"`
    Mobile              string  `json:"mobile" validate:"required"`
    Mobile2             string  `json:"mobile2"`
    Tel                 string  `json:"tel"`
    Fax                 string  `json:"fax"`
    Email               string  `json:"email"`
    Website             string  `json:"website"`
    Address             string  `json:"address"`
    Postalcode          string  `json:"postalCode"`
    Shahr               string  `json:"shahr"`
    Ostan               string  `json:"ostan"`
    Keshvar             string  `json:"keshvar"`
    Shenasemeli         string  `json:"shenasemeli" validate:"required"`
    Codeeghtesadi       string  `json:"codeeghtesadi"`
    Sabt                string  `json:"sabt"`
    TaxID               string  `json:"taxID"`
    InitialBalanceToman float64 `json:"initialBalanceToman"`
    InitialBalanceGold  float64 `json:"initialBalanceGold"`
    GoldRateType        string  `json:"goldRateType"`
    DefaultGoldUnit     string  `json:"defaultGoldUnit"`
    DefaultGoldUnitRate float64 `json:"defaultGoldUnitRate"`
    CustomerCategory    string  `json:"customerCategory"`
}

type UpdateCustomerRequest struct {
    Nikename            *string  `json:"nikename,omitempty"`
    Name                *string  `json:"name,omitempty"`
    FamilyName          *string  `json:"familyName,omitempty"`
    Birthday            *time.Time `json:"birthday,omitempty"`
    Company             *string  `json:"company,omitempty"`
    Mobile              *string  `json:"mobile,omitempty"`
    Mobile2             *string  `json:"mobile2,omitempty"`
    Tel                 *string  `json:"tel,omitempty"`
    Fax                 *string  `json:"fax,omitempty"`
    Email               *string  `json:"email,omitempty"`
    Website             *string  `json:"website,omitempty"`
    Address             *string  `json:"address,omitempty"`
    Postalcode          *string  `json:"postalcode,omitempty"`
    Shahr               *string  `json:"shahr,omitempty"`
    Ostan               *string  `json:"ostan,omitempty"`
    Keshvar             *string  `json:"keshvar,omitempty"`
    Shenasemeli         *string  `json:"shenasemeli,omitempty"`
    Codeeghtesadi       *string  `json:"codeeghtesadi,omitempty"`
    Sabt                *string  `json:"sabt,omitempty"`
    TaxID               *string  `json:"taxID,omitempty"`
    SpeedAccess         *bool    `json:"speedAccess,omitempty"`
    Des                 *string  `json:"des,omitempty"`
    Status              *string  `json:"status,omitempty"`
    CustomerCategory    *string  `json:"customerCategory,omitempty"`
    PrelabelID          *uint    `json:"prelabelId,omitempty"`
    AssignedEmployeeID  *uint    `json:"assignedEmployeeId,omitempty"`
    BankAccounts        *[]CusCard `json:"bankAccounts,omitempty"`
    CustomerTypes       *[]CusType `json:"customerTypes,omitempty"`
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

