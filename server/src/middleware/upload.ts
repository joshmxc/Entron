import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config";

function makeStorage(subdir: string): multer.StorageEngine {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(config.storage.uploadDir, subdir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

export const uploadExcel = multer({
  storage: makeStorage("excel"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith(".xlsx"));
  },
});

export const uploadTemplate = multer({
  storage: makeStorage("templates"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const uploadBanner = multer({
  storage: makeStorage("banners"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});
