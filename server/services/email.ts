import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.SMTP_FROM || 'noreply@mchs.kz'
    };

    if (this.isDevelopment) {
      console.log('[Email] Development mode: emails will be logged to console');
    } else {
      this.setupTransporter();
    }
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth
    });
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (this.isDevelopment) {
        // В режиме разработки логируем в консоль
        console.log('\n📧 [Email Service] Отправка email:');
        console.log(`📬 Кому: ${data.to}`);
        console.log(`📋 Тема: ${data.subject}`);
        console.log(`📄 Текст: ${data.text || data.html}`);
        console.log('───────────────────────────────');
        return true;
      }

      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }

      const mailOptions = {
        from: this.config.from,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Sent successfully to ${data.to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('[Email] Send failed:', error);
      return false;
    }
  }

  // Уведомление о возврате пакета
  async sendPackageReturnNotification(userEmail: string, packageData: any): Promise<boolean> {
    const subject = `Возврат пакета данных - ${packageData.period}`;
    const html = `
      <h2>Уведомление о возврате пакета данных</h2>
      <p>Уважаемый коллега,</p>
      <p>Пакет данных за период <strong>${packageData.period}</strong> был возвращен для доработки.</p>
      <p><strong>Причина возврата:</strong> ${packageData.returnReason || 'Не указана'}</p>
      <p><strong>Комментарий:</strong> ${packageData.comment || 'Отсутствует'}</p>
      <p>Пожалуйста, внесите необходимые исправления и повторно отправьте пакет.</p>
      <hr>
      <p><small>Система государственного пожарного контроля МЧС РК</small></p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  // Уведомление об утверждении пакета
  async sendPackageApprovalNotification(userEmail: string, packageData: any): Promise<boolean> {
    const subject = `Утверждение пакета данных - ${packageData.period}`;
    const html = `
      <h2>Уведомление об утверждении пакета данных</h2>
      <p>Уважаемый коллега,</p>
      <p>Пакет данных за период <strong>${packageData.period}</strong> успешно утвержден.</p>
      <p><strong>Дата утверждения:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
      <p><strong>Утвердил:</strong> ${packageData.approverName}</p>
      <p>Данные включены в сводный отчет и переданы в вышестоящую организацию.</p>
      <hr>
      <p><small>Система государственного пожарного контроля МЧС РК</small></p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  // Уведомление о новых нарушениях
  async sendViolationNotification(userEmail: string, violationData: any): Promise<boolean> {
    const subject = `Обнаружены нарушения в отчетности - ${violationData.period}`;
    const html = `
      <h2>Уведомление об ошибках в отчетности</h2>
      <p>Уважаемый коллега,</p>
      <p>В отчетности за период <strong>${violationData.period}</strong> обнаружены следующие нарушения:</p>
      <ul>
        ${violationData.violations.map((v: any) => `<li><strong>${v.form}:</strong> ${v.description}</li>`).join('')}
      </ul>
      <p>Пожалуйста, проверьте и исправьте указанные ошибки.</p>
      <hr>
      <p><small>Система государственного пожарного контроля МЧС РК</small></p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  // Проверка конфигурации
  async testConnection(): Promise<boolean> {
    if (this.isDevelopment) {
      console.log('[Email] Development mode: connection test skipped');
      return true;
    }

    try {
      if (!this.transporter) {
        throw new Error('Transporter not configured');
      }
      
      await this.transporter.verify();
      console.log('[Email] Connection verified successfully');
      return true;
    } catch (error) {
      console.error('[Email] Connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;