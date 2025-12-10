const { Template } = require('../models');

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, and body are required'
      });
    }

    const template = await Template.create({
      userId: req.user.id,
      name,
      subject,
      body
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.update({
      name: name || template.name,
      subject: subject || template.subject,
      body: body || template.body
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
};