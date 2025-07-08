package proxy

import (
	"bytes" // برای bytes.NewBuffer
	"fmt"
	"io"
	"net/http"
	"os"     // برای os.IsTimeout
	"time"

	"gold-api/internal/model" // برای مدل ErrorResponse

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type ProxyHandler struct {
	httpClient *http.Client
	logger     *zap.Logger
}

func NewProxyHandler(logger *zap.Logger) *ProxyHandler {
	if logger == nil {
		panic("Logger cannot be nil for ProxyHandler")
	}
	return &ProxyHandler{
		httpClient: &http.Client{Timeout: 30 * time.Second}, // یک HTTP client با timeout مناسب
		logger:     logger,
	}
}

func (h *ProxyHandler) HandleStaticFileProxy(targetBaseURL string) fiber.Handler {
	
	if targetBaseURL == "" {
		h.logger.Fatal("Target Base URL for static file proxy is empty. This indicates a misconfiguration.")
		return func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Static file proxy is not configured correctly."})
		}
	}

	return func(c *fiber.Ctx) error {
		targetPath := c.Params("*") 
		targetURL := fmt.Sprintf("%s/uploads/%s", targetBaseURL, targetPath) 

		h.logger.Info("Proxying static file",
			zap.String("original_path", c.OriginalURL()),
			zap.String("target_url", targetURL),
			zap.String("method", c.Method()))

		// ایجاد یک درخواست HTTP جدید برای ارسال به سرویس مقصد
		// برای GET requests، بدنه null است.
		proxyReq, err := http.NewRequest(http.MethodGet, targetURL, nil)
		if err != nil {
			h.logger.Error("Failed to create proxy request for static file", zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Proxy error: Could not create internal request."})
		}

		// کپی کردن هدرهای اصلی درخواست از کلاینت به درخواست پراکسی
		// این شامل هدرهایی مانند "Accept", "User-Agent" و ... می‌شود.
		// هدرهای "Host", "Content-Length", "Connection", "Accept-Encoding" معمولاً توسط Go's http.Client مدیریت می‌شوند یا نباید فوروارد شوند.
		for key, values := range c.GetReqHeaders() {
			if key == "Host" || key == "Content-Length" || key == "Connection" || key == "Accept-Encoding" {
				continue
			}
			for _, value := range values {
				proxyReq.Header.Add(key, value)
			}
		}

		// ارسال درخواست پراکسی به سرویس مقصد
		resp, err := h.httpClient.Do(proxyReq)
		if err != nil {
			h.logger.Error("Failed to execute proxy request for static file", zap.Error(err), zap.String("target_url", targetURL))
			// تفکیک خطاهای شبکه/Timeout برای پیام بهتر
			if os.IsTimeout(err) {
				return c.Status(fiber.StatusGatewayTimeout).JSON(model.ErrorResponse{Message: "Proxy error: Backend service timed out."})
			}
			return c.Status(fiber.StatusBadGateway).JSON(model.ErrorResponse{Message: "Proxy error: Could not reach backend service."})
		}
		defer resp.Body.Close() // حتماً بدنه پاسخ را ببندید تا منابع آزاد شوند

		// کپی کردن کد وضعیت HTTP از پاسخ سرویس مقصد به پاسخ کلاینت
		c.Status(resp.StatusCode)
		// کپی کردن هدرهای پاسخ از سرویس مقصد به پاسخ کلاینت
		for key, values := range resp.Header {
			for _, value := range values {
				if key == "Content-Length" { // Fiber خودش Content-Length را هنگام SendStream تنظیم می‌کند.
					continue
				}
				c.Set(key, value)
			}
		}

		// ارسال بدنه پاسخ (جریان فایل) به کلاینت
		return c.SendStream(resp.Body)
	}
}

// ForwardRequest همانطور که قبلا بحث کردیم، یک متد پراکسی عمومی تر است که برای سایر هندلرها
// (مانند AccountHandlerAG و ProfileHandlerAG) می تواند به جای منطق پراکسی دستی استفاده شود.
// این متد درست است و باید در همین فایل باقی بماند.
func (h *ProxyHandler) ForwardRequest(c *fiber.Ctx, targetBaseURL string, targetPath string, requiresAuth bool) error {
    fullTargetURL := fmt.Sprintf("%s%s", targetBaseURL, targetPath)

    var bodyReader io.Reader
    if c.Method() == http.MethodPost || c.Method() == http.MethodPut || c.Method() == http.MethodPatch {
        bodyReader = bytes.NewBuffer(c.Body())
    }

    proxyReq, err := http.NewRequest(c.Method(), fullTargetURL, bodyReader)
    if err != nil {
        h.logger.Error("Failed to create generic proxy request", zap.Error(err), zap.String("target_url", fullTargetURL))
        return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Proxy error: Could not create request."})
    }

    for key, values := range c.GetReqHeaders() {
        if key == "Host" || key == "Content-Length" || key == "Connection" || key == "Accept-Encoding" {
            continue
        }
        for _, value := range values {
            proxyReq.Header.Add(key, value)
        }
    }

    if requiresAuth {
        if authHeader := c.Get("Authorization"); authHeader != "" {
            proxyReq.Header.Set("Authorization", authHeader)
        }
    }
    // همچنین ممکن است نیاز به اضافه کردن Internal Service Token اینجا باشد.

    resp, err := h.httpClient.Do(proxyReq)
    if err != nil {
        h.logger.Error("Failed to execute generic proxy request", zap.Error(err), zap.String("target_url", fullTargetURL))
        if os.IsTimeout(err) {
            return c.Status(fiber.StatusGatewayTimeout).JSON(model.ErrorResponse{Message: "Proxy error: Backend service timed out."})
        }
        return c.Status(fiber.StatusBadGateway).JSON(model.ErrorResponse{Message: "Proxy error: Could not reach backend service."})
    }
    defer resp.Body.Close()

    c.Status(resp.StatusCode)
    for key, values := range resp.Header {
        for _, value := range values {
            if key == "Content-Length" {
                continue
            }
            c.Set(key, value)
        }
    }
    return c.SendStream(resp.Body)
}