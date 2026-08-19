/**
 * Tải ảnh vào đối tượng HTMLImageElement
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Đổi độ sang radian
 */
function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Tính kích thước bounding box sau khi xoay
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Cắt ảnh và xuất ra kích thước CỐ ĐỊNH (mặc định 800 x 450 px tỉ lệ 16:9)
 * @param {string} imageSrc - Nguồn ảnh (Data URL / Object URL / Web URL)
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - Tọa độ cắt từ react-easy-crop
 * @param {number} [rotation=0] - Góc xoay (độ)
 * @param {number} [targetWidth=800] - Chiều rộng cố định xuất ra
 * @param {number} [targetHeight=450] - Chiều cao cố định xuất ra
 * @param {string} [mimeType="image/webp"] - Định dạng ảnh xuất
 * @param {number} [quality=0.92] - Chất lượng nén ảnh (0 - 1)
 * @returns {Promise<{ blob: Blob, previewUrl: string, width: number, height: number }>}
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  targetWidth = 800,
  targetHeight = 450,
  mimeType = "image/webp",
  quality = 0.92
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Không thể khởi tạo 2D canvas context");
  }

  // Bật chế độ làm mịn hình ảnh chất lượng cao
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (rotation === 0) {
    // Không xoay: Vẽ trực tiếp vùng pixelCrop vào kích thước cố định targetWidth x targetHeight
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  } else {
    // Có xoay ảnh: Dùng canvas tạm để xoay trước
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = bBoxWidth;
    rotCanvas.height = bBoxHeight;
    const rotCtx = rotCanvas.getContext("2d");

    if (!rotCtx) {
      throw new Error("Không thể khởi tạo rotation canvas context");
    }

    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(rotRad);
    rotCtx.translate(-image.width / 2, -image.height / 2);
    rotCtx.drawImage(image, 0, 0);

    // Xuất vào canvas cố định
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      rotCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  }

  return new Promise((resolve, reject) => {
    // Thử xuất dạng webp, nếu trình duyệt không hỗ trợ sẽ fallback về jpeg
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Fallback về JPEG nếu webp lỗi
          canvas.toBlob(
            (fallbackBlob) => {
              if (!fallbackBlob) {
                reject(new Error("Không thể trích xuất Blob từ canvas"));
                return;
              }
              resolve({
                blob: fallbackBlob,
                previewUrl: URL.createObjectURL(fallbackBlob),
                width: targetWidth,
                height: targetHeight,
              });
            },
            "image/jpeg",
            quality
          );
          return;
        }

        resolve({
          blob,
          previewUrl: URL.createObjectURL(blob),
          width: targetWidth,
          height: targetHeight,
        });
      },
      mimeType,
      quality
    );
  });
}
