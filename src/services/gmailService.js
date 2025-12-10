const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GmailService {
  constructor(accessToken, refreshToken) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  createMessage(to, subject, body, attachmentPath = null) {
    const boundary = 'boundary_' + Date.now();
    let message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
      ''
    ];

    if (attachmentPath && fs.existsSync(attachmentPath)) {
      const fileContent = fs.readFileSync(attachmentPath);
      const base64Data = fileContent.toString('base64');
      const fileName = path.basename(attachmentPath);
      const mimeType = this.getMimeType(attachmentPath);

      message.push(
        `--${boundary}`,
        `Content-Type: ${mimeType}; name="${fileName}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${fileName}"`,
        '',
        base64Data,
        ''
      );
    }

    message.push(`--${boundary}--`);

    const encodedMessage = Buffer.from(message.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return encodedMessage;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async sendEmail(to, subject, body, attachmentPath = null) {
    try {
      const encodedMessage = this.createMessage(to, subject, body, attachmentPath);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        success: true,
        messageId: response.data.id
      };
    } catch (error) {
      console.error('Gmail send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendBulkEmails(recipients, subject, body, attachmentPath = null) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, body, attachmentPath);
        results.push({
          email: recipient,
          status: 'sent',
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          email: recipient,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = GmailService;