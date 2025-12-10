const { Resume } = require('../models');
const fs = require('fs');
const path = require('path');

exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: resumes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes'
    });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title } = req.body;

    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Resume title is required'
      });
    }

    const resume = await Resume.create({
      userId: req.user.id,
      title: title,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: resume
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
};

exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
};

exports.updateResume = async (req, res) => {
  try {
    const { title } = req.body;
    const resume = await Resume.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    await resume.update({ title });

    res.json({
      success: true,
      message: 'Resume updated successfully',
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update resume'
    });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await resume.destroy();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
};