import archiver from "archiver";
import fs from "fs";
import path from "path";
import { Response } from "express";

export function streamZipToResponse(
  res: Response,
  files: Array<{ filePath: string; name: string }>,
  zipName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", reject);
    archive.on("end", resolve);
    archive.pipe(res);

    for (const { filePath, name } of files) {
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: path.basename(name) });
      }
    }

    archive.finalize();
  });
}
