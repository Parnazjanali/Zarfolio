package utils

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// GenerateUUID generates a new UUID prefixed with "tr-".
// This ensures that all transaction IDs start with a recognizable identifier.
func GenerateUUID() string {
	// 1. تولید یک UUID استاندارد
	newUUID := uuid.New().String()

	// 2. اضافه کردن پیشوند
	// ما از یک پیشوند ثابت مانند "tr-" استفاده می‌کنیم و آن را به UUID متصل می‌کنیم.
	return fmt.Sprintf("tr-%s", newUUID)
}

// PtrString is a simple utility to return a pointer to a string.
// (این تابع برای استفاده در مدل‌های شما که فیلدهای اشاره‌گر دارند، مفید است.)
func PtrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// PtrFloat64 is a simple utility to return a pointer to a float64.
func PtrFloat64(f float64) *float64 {
	return &f
}

// GenerateUniqueInvoiceNumber (توضیح: این تابع برای تولید شماره‌ی فاکتور است و نه ID)
// این یک مثال ساده است که باید با منطق دیتابیس (Sequence) جایگزین شود.
func GenerateUniqueInvoiceNumber() string {
	// برای مثال: تاریخ امروز + یک رشته تصادفی/شمارنده
	// در یک سیستم واقعی، این باید با یک شمارنده‌ی امن در دیتابیس ترکیب شود.
	// ما از یک UUID کوتاه شده استفاده می‌کنیم تا به صورت موقت یکتا باشد.
	shortUUID := strings.ReplaceAll(uuid.New().String(), "-", "")
	return fmt.Sprintf("INV-%s", shortUUID[:8])
}
