const { EmailLog, Resume, Template } = require('../models');
const GmailService = require('../services/gmailService');

exports.sendEmail = async (req, res) => {
  try {
    const { recipients, templateId, resumeId, subject, body } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required'
      });
    }

    let emailSubject = subject;
    let emailBody = body;
    let resumePath = null;

    if (templateId) {
      const template = await Template.findOne({
        where: { id: templateId, userId: req.user.id }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      emailSubject = template.subject;
      emailBody = template.body;
    }

    if (!emailSubject || !emailBody) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required'
      });
    }

    if (resumeId) {
      const resume = await Resume.findOne({
        where: { id: resumeId, userId: req.user.id }
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      resumePath = resume.filePath;
    }

    const gmailService = new GmailService(
      req.user.accessToken,
      req.user.refreshToken
    );

    const results = await gmailService.sendBulkEmails(
      recipients,
      emailSubject,
      emailBody,
      resumePath
    );

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    await EmailLog.create({
      userId: req.user.id,
      templateId: templateId || null,
      resumeId: resumeId || null,
      recipients: recipients,
      subject: emailSubject,
      status: failedCount === 0 ? 'sent' : 'failed',
      errorMessage: failedCount > 0 ? `${failedCount} emails failed` : null
    });

    res.json({
      success: true,
      message: `Emails sent: ${successCount}, Failed: ${failedCount}`,
      data: {
        results,
        summary: {
          total: recipients.length,
          sent: successCount,
          failed: failedCount
        }
      }
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
  }
};

exports.getEmailHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await EmailLog.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name']
        },
        {
          model: Resume,
          as: 'resume',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email history'
    });
  }
};

exports.getEmailById = async (req, res) => {
  try {
    const emailLog = await EmailLog.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Template,
          as: 'template'
        },
        {
          model: Resume,
          as: 'resume'
        }
      ]
    });

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found'
      });
    }

    res.json({
      success: true,
      data: emailLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email details'
    });
  }
};