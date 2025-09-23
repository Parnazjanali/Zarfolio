package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpInventoryRoutes(apiGroup fiber.Router,
	InventoryHandlerAg *handler.InventoryHandler,
	authMiddleware *middleware.AuthMiddleware,
	logger *zap.Logger,
) error {

	defer logger.Sync()

	if InventoryHandlerAg == nil {
		return fmt.Errorf("InventoryHandlerAg is nil in SetUpInventoryRoutes")
	}
	if authMiddleware == nil {
		return fmt.Errorf("AuthMiddleware is nil in SetUpInventoryRoutes")
	}

	inventoryGroup := apiGroup.Group("/inventory")
	logger.Debug("Configuring /api/v1/inventory protected routes")

	//موجودی کالا
	productRoutes := inventoryGroup.Group("/products")
	productRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateProduct)
	/*productRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllProducts)
	productRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetProductByID)
	productRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateProduct)
	productRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteProduct)

	// 2. Currency (موجودی ارز)
	currencyRoutes := inventoryGroup.Group("/currencies")
	currencyRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateCurrency)
	currencyRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllCurrencies)
	currencyRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetCurrencyByID)
	currencyRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateCurrency)
	currencyRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteCurrency)

	// 3. Stones (موجودی سنگ)
	stoneRoutes := inventoryGroup.Group("/stones")
	stoneRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateStone)
	stoneRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllStones)
	stoneRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetStoneByID)
	stoneRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateStone)
	stoneRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteStone)

	// 4. Raw Gold (موجودی طلا خام)
	rawGoldRoutes := inventoryGroup.Group("/raw-gold")
	rawGoldRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateRawGold)
	rawGoldRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllRawGolds)
	rawGoldRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetRawGoldByID)
	rawGoldRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateRawGold)
	rawGoldRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteRawGold)

	// 5. Finished Products (موجودی کار ساخته)
	finishedProductRoutes := inventoryGroup.Group("/finished-products")
	finishedProductRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateFinishedProduct)
	finishedProductRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllFinishedProducts)
	finishedProductRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetFinishedProductByID)
	finishedProductRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateFinishedProduct)
	finishedProductRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteFinishedProduct)

	// 6. Tags (موجودی اتیکت)
	tagRoutes := inventoryGroup.Group("/tags")
	tagRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateTag)
	tagRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllTags)
	tagRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetTagByID)
	tagRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateTag)
	tagRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteTag)

	// 7. Cash (موجودی وجوه نقد)
	cashRoutes := inventoryGroup.Group("/cash")
	cashRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateCash)
	cashRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllCash)
	cashRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetCashByID)
	cashRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateCash)
	cashRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteCash)

	// 8. Checks (موجودی چک)
	checkRoutes := inventoryGroup.Group("/checks")
	checkRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateCheck)
	checkRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllChecks)
	checkRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetCheckByID)
	checkRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateCheck)
	checkRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteCheck)

	// 9. Bank Accounts (موجودی حساب بانکی)
	bankAccountRoutes := inventoryGroup.Group("/bank-accounts")
	bankAccountRoutes.Post("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryCreateItem), InventoryHandlerAg.CreateBankAccount)
	bankAccountRoutes.Get("/", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetAllBankAccounts)
	bankAccountRoutes.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryReadItem), InventoryHandlerAg.GetBankAccountByID)
	bankAccountRoutes.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryUpdateItem), InventoryHandlerAg.UpdateBankAccount)
	bankAccountRoutes.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermInventoryDeleteItem), InventoryHandlerAg.DeleteBankAccount)
*/
	 logger.Debug("Inventory routes configured with RBAC")
    return nil 
}
