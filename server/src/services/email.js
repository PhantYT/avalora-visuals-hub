const nodemailer = require('nodemailer');

// Настройка транспорта для отправки email
const createTransporter = () => {
  // Используем SMTP настройки из переменных окружения
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Отправка письма подтверждения регистрации
const sendConfirmationEmail = async (email, username, confirmationToken) => {
  const transporter = createTransporter();
  const confirmUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Avalora Visuals'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Подтверждение регистрации - Avalora Visuals',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #9b59b6, #e91e63); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(233, 30, 99, 0.1)); border: 1px solid rgba(155, 89, 182, 0.3); border-radius: 16px; padding: 40px; }
          h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
          p { color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #9b59b6, #e91e63); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          .highlight { color: #9b59b6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AVALORA VISUALS</div>
          </div>
          <div class="content">
            <h1>Добро пожаловать, ${username}!</h1>
            <p>Благодарим вас за регистрацию в <span class="highlight">Avalora Visuals</span> — маркетплейсе премиум визуальных модов для Minecraft.</p>
            <p>Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш email адрес:</p>
            <center>
              <a href="${confirmUrl}" class="button">Подтвердить Email</a>
            </center>
            <p style="font-size: 12px; color: #666;">Если кнопка не работает, скопируйте эту ссылку в браузер:<br>${confirmUrl}</p>
            <p style="font-size: 12px; color: #666;">Ссылка действительна 24 часа.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Avalora Visuals. Все права защищены.</p>
            <p>Если вы не регистрировались на нашем сайте, проигнорируйте это письмо.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Отправка письма для сброса пароля
const sendPasswordResetEmail = async (email, username, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Avalora Visuals'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Сброс пароля - Avalora Visuals',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #9b59b6, #e91e63); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(233, 30, 99, 0.1)); border: 1px solid rgba(155, 89, 182, 0.3); border-radius: 16px; padding: 40px; }
          h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
          p { color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #9b59b6, #e91e63); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          .warning { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 16px; margin-top: 20px; }
          .warning p { color: #ffc107; margin: 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AVALORA VISUALS</div>
          </div>
          <div class="content">
            <h1>Сброс пароля</h1>
            <p>Здравствуйте, ${username}!</p>
            <p>Мы получили запрос на сброс пароля для вашей учетной записи. Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
            <center>
              <a href="${resetUrl}" class="button">Сбросить пароль</a>
            </center>
            <p style="font-size: 12px; color: #666;">Если кнопка не работает, скопируйте эту ссылку в браузер:<br>${resetUrl}</p>
            <p style="font-size: 12px; color: #666;">Ссылка действительна 1 час.</p>
            <div class="warning">
              <p>⚠️ Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ваш пароль останется без изменений.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Avalora Visuals. Все права защищены.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail,
};
