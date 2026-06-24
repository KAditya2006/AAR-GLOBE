const { getUploadStorageMode, uploadToCloudinary } = require('../utils/uploadStorage');

exports.uploadImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Image file is required.' });
  }

  try {
    if (getUploadStorageMode() === 'cloudinary') {
      const folderType = req.uploadType || 'general';
      const data = await uploadToCloudinary(req.file, folderType);
      return res.status(201).json({ success: true, data });
    }

    res.status(201).json({
      success: true,
      data: {
        path: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        storage: 'local'
      }
    });
  } catch (error) {
    next(error);
  }
};
