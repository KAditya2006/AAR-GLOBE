const fs = require('fs');
const path = require('path');
const { configureCloudinary } = require('../config/cloudinary');

const uploadRoot = path.resolve(__dirname, '../uploads');
const CLOUDINARY_FOLDER = 'aarglobe';

const getUploadStorageMode = () => process.env.UPLOAD_STORAGE || 'local';

const isLocalUploadPath = (filePath = '') => {
  return typeof filePath === 'string' && filePath.startsWith('/uploads/');
};

const isCloudinaryUrl = (filePath = '') => {
  return typeof filePath === 'string' && filePath.includes('res.cloudinary.com');
};

const getCloudinaryPublicId = (url = '') => {
  if (!isCloudinaryUrl(url)) return '';

  const withoutQuery = url.split('?')[0];
  const parts = withoutQuery.split('/upload/');
  if (parts.length < 2) return '';

  const assetPath = parts[1].replace(/^v\d+\//, '');
  const publicId = assetPath.replace(/\.[a-zA-Z0-9]+$/, '');

  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) return '';

  return publicId;
};

const deleteLocalUpload = async (filePath = '') => {
  if (!isLocalUploadPath(filePath)) return;

  const relativePath = filePath.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(uploadRoot, relativePath);
  const relativeToUploadRoot = path.relative(uploadRoot, absolutePath);

  if (relativeToUploadRoot.startsWith('..') || path.isAbsolute(relativeToUploadRoot)) return;

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const uploadToCloudinary = async (file, folderType = 'general') => {
  if (!file?.path) throw new Error('Image file is required.');

  try {
    const cloudinary = configureCloudinary();
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${CLOUDINARY_FOLDER}/${folderType}`,
      resource_type: 'image',
      overwrite: false
    });

    await deleteLocalUpload(`/uploads/${file.filename}`);

    return {
      path: result.secure_url,
      filename: result.public_id,
      publicId: result.public_id,
      storage: 'cloudinary'
    };
  } catch (error) {
    await deleteLocalUpload(`/uploads/${file.filename}`);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteCloudinaryAsset = async (filePath = '') => {
  const publicId = getCloudinaryPublicId(filePath);
  if (!publicId) return;

  const cloudinary = configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

const deleteStoredImage = async (filePath = '') => {
  if (isLocalUploadPath(filePath)) {
    await deleteLocalUpload(filePath);
    return;
  }

  if (isCloudinaryUrl(filePath)) {
    await deleteCloudinaryAsset(filePath);
  }
};

module.exports = {
  uploadRoot,
  getUploadStorageMode,
  deleteLocalUpload,
  deleteStoredImage,
  uploadToCloudinary,
  isLocalUploadPath,
  isCloudinaryUrl
};
