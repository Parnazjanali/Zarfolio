package email

import (
    "fmt"
    "net/smtp"
    "os"
    "profile-gold/internal/utils" 
    "go.uber.org/zap"
)

type EmailServiceImpl struct {
    smtpHost string
    smtpPort string
    smtpUser string
    smtpPass string
    senderEmail string
    frontendResetURL string 
}

func NewEmailService() (*EmailServiceImpl, error) {
    smtpHost := os.Getenv("SMTP_HOST")
    smtpPort := os.Getenv("SMTP_PORT")
    smtpUser := os.Getenv("SMTP_USER")
    smtpPass := os.Getenv("SMTP_PASS")
    senderEmail := os.Getenv("SENDER_EMAIL")
    frontendResetURL := os.Getenv("http://localhost:5173/request-password-reset") 

    if smtpHost == "" || smtpPort == "" || smtpUser == "" || smtpPass == "" || senderEmail == "" || frontendResetURL == "" {
        utils.Log.Fatal("Email service environment variables are not fully set (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SENDER_EMAIL, FRONTEND_RESET_PASSWORD_URL).")
    }

    return &EmailServiceImpl{
        smtpHost: smtpHost,
        smtpPort: smtpPort,
        smtpUser: smtpUser,
        smtpPass: smtpPass,
        senderEmail: senderEmail,
        frontendResetURL: frontendResetURL,
    }, nil
}

func (s *EmailServiceImpl) SendPasswordResetEmail(toEmail, resetToken string) error {
    resetLink := fmt.Sprintf("%s?token=%s", s.frontendResetURL, resetToken)
    
    subject := "Subject: درخواست بازنشانی رمز عبور\r\n"
    body := fmt.Sprintf(`
    سلام،

    شما درخواست بازنشانی رمز عبور را ارسال کرده‌اید.
    برای بازنشانی رمز عبور خود، لطفاً روی لینک زیر کلیک کنید:

    %s

    اگر شما این درخواست را ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.

    با احترام،
    تیم پشتیبانی
    `, resetLink)

    msg := []byte(subject + "\r\n" + body)

    auth := smtp.PlainAuth("", s.smtpUser, s.smtpPass, s.smtpHost)
    addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

    err := smtp.SendMail(addr, auth, s.senderEmail, []string{toEmail}, msg)
    if err != nil {
        utils.Log.Error("Failed to send password reset email", zap.Error(err), zap.String("to_email", toEmail))
        return fmt.Errorf("failed to send email: %w", err)
    }

    utils.Log.Info("Password reset email sent successfully", zap.String("to_email", toEmail))
    return nil
}