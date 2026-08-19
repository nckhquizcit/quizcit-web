import apiClient, { getErrorMessage } from "./apiClient";

/**
 * Tải ảnh lên máy chủ
 * @param {File|Blob} fileOrBlob - File hoặc Blob của ảnh đã crop
 * @param {string} [folder="subjects"] - Tên thư mục lưu trữ
 * @param {string} [fileName="subject-image.webp"] - Tên file
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, contentType: string }>}
 */
export async function uploadImage(fileOrBlob, folder = "subjects", fileName = "subject-image.webp") {
  const formData = new FormData();
  
  if (fileOrBlob instanceof File) {
    formData.append("file", fileOrBlob);
  } else {
    // Blob từ canvas crop
    const file = new File([fileOrBlob], fileName, {
      type: fileOrBlob.type || "image/webp",
    });
    formData.append("file", file);
  }

  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await apiClient.post("/api/uploads/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tải ảnh lên máy chủ. Vui lòng thử lại."));
  }
}

/**
 * Tải ảnh từ URL bên ngoài về máy chủ để chuẩn bị cắt và lưu trữ an toàn
 * @param {string} url - URL hình ảnh trực tiếp (http/https)
 * @param {string} [folder="subjects"] - Thư mục lưu trữ
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, contentType: string }>}
 */
export async function uploadImageFromUrl(url, folder = "subjects") {
  try {
    const response = await apiClient.post("/api/uploads/from-url", {
      url: url.trim(),
      folder,
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tải ảnh từ URL đã cung cấp. Vui lòng kiểm tra lại đường dẫn."));
  }
}

