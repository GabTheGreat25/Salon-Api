const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { RESOURCE } = require("../constants/index");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 500;
const LIMIT = "limit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const fileName = file.originalname.replace(/\.[^/.]+$/, "");
    const uniqueFilename = uuidv4();
    return {
      folder: RESOURCE.IMAGES,
      transformation: [
        { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, crop: LIMIT },
      ],
      public_id: `${fileName}-${uniqueFilename}`,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
