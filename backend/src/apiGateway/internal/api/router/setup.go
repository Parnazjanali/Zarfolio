package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/api/proxy"
	"gold-api/internal/authz"
	"gold-api/internal/model"
	"gold-api/internal/utils"
	"os"
	"path/filepath" // اضافه شد برای کار با پسوند فایل
	"time"          // اضافه شد برای ساخت نام منحصر به فرد

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetupAllRoutes(
	app *fiber.App,
	authHandler *handler.AuthHandler,
	accountHandlerAG *handler.AccountHandlerAG,
	permissionService *authz.PermissionService,
	profileHandlerAG *handler.ProfileHandler,
	proxyHandler *proxy.ProxyHandler,
) error {
	if app == nil {
		return fmt.Errorf("fiber app instance is nil in SetupAllRoutes")
	}
	if authHandler == nil {
		return fmt.Errorf("AuthHandler is nil in SetupAllRoutes")
	}
	if accountHandlerAG == nil {
		return fmt.Errorf("AccountHandlerAG is nil in SetupAllRoutes")
	}
	if permissionService == nil {
		return fmt.Errorf("PermissionService is nil in SetupAllRoutes")
	}
	if profileHandlerAG == nil {
		return fmt.Errorf("ProfileHandlerAG is nil in SetupAllRoutes")
	}
	if proxyHandler == nil {
		return fmt.Errorf("ProxyHandler is nil in SetupAllRoutes")
	}

	apiV1 := app.Group("/api/v1")
	utils.Log.Info("Base API group /api/v1 created.")

	// --- مسیر جدید برای آپلود عکس (نسخه ساده شده) ---
	apiV1.Post("/upload-image", func(c *fiber.Ctx) error {
		file, err := c.FormFile("file")
		if err != nil {
			utils.Log.Error("Cannot read file from form", zap.Error(err))
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "فایل در درخواست یافت نشد."})
		}

		// مسیر ذخیره‌سازی فایل‌ها (این پوشه باید در ساختار پروژه شما وجود داشته باشد)
		// این مسیر به frontend/public اشاره دارد تا فایل‌ها مستقیماً برای نمایش در دسترس باشند
		uploadPath := "./frontend/public/uploads/slider/"

		// اطمینان از وجود پوشه
		if err := os.MkdirAll(uploadPath, 0755); err != nil {
			utils.Log.Error("Cannot create upload directory", zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "خطا در ساخت پوشه آپلود."})
		}

		// ایجاد یک نام منحصر به فرد برای فایل برای جلوگیری از جایگزین شدن فایل‌های همنام
		newFileName := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
		destination := filepath.Join(uploadPath, newFileName)

		// ذخیره فایل در مسیر مورد نظر
		if err := c.SaveFile(file, destination); err != nil {
			utils.Log.Error("Failed to save file", zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "خطا در ذخیره‌سازی فایل."})
		}

		// برگرداندن آدرس عمومی فایل برای استفاده در Frontend
		publicFilePath := "/uploads/slider/" + newFileName
		utils.Log.Info("Image uploaded successfully", zap.String("path", publicFilePath))
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message":  "فایل با موفقیت آپلود شد.",
			"filePath": publicFilePath,
		})
	})
	// --- پایان بخش جدید ---

	authMiddleware := middleware.NewAuthMiddleware(permissionService, utils.Log)

	if err := SetUpAuthRoutes(apiV1, authHandler, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up auth routes: %w", err)
	}

	if err := SetUpAccountRoutes(apiV1, accountHandlerAG, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up account routes: %w", err)
	}

	if err := SetUpUserManagementRoutes(apiV1, profileHandlerAG, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up user management routes: %w", err)
	}

	profileManagerServiceURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerServiceURL != "" {
		apiV1.Get("/uploads/*", proxyHandler.HandleStaticFileProxy(profileManagerServiceURL))
		utils.Log.Info("Configured GET proxy for /api/v1/uploads/* to profileManager", zap.String("profile_manager_url", profileManagerServiceURL))
	} else {
		utils.Log.Warn("PROFILE_MANAGER_BASE_URL not set in env. Cannot configure proxy for profile pictures/uploads.")
	}

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("API Gateway: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "API Gateway: The requested resource was not found."})
	})
	utils.Log.Info("API Gateway: 404 fallback route configured.")

	return nil
}