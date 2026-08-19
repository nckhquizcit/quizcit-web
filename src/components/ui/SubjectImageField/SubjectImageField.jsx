import { useState, useRef } from "react";
import { Crop, FileImage, Globe, ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { uploadImage, uploadImageFromUrl } from "../../../services/uploadService";
import { resolveImageUrl } from "../../../services/mappers";
import ImageCropModal from "../ImageCropModal/ImageCropModal";
import Spinner from "../Spinner/Spinner";
import "./SubjectImageField.css";

/**
 * Component quản lý tải lên file hoặc nhập URL, cắt ảnh và hiển thị ảnh môn học theo kích thước cố định
 */
export default function SubjectImageField({
  value = "",
  onChange,
  label = "Ảnh bìa môn học",
  hint = "Tỉ lệ cố định 16:9 (800 × 450 px)",
  disabled = false,
}) {
  const [activeTab, setActiveTab] = useState("file"); // "file" | "url"
  const [urlInput, setUrlInput] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tập tin hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result);
      setCropModalOpen(true);
    };
    reader.onerror = () => {
      setError("Không thể đọc tập tin ảnh đã chọn.");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled && !uploading && activeTab === "file") {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading || activeTab !== "file") return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFetchUrl = async (e) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Vui lòng nhập URL hình ảnh.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
      setError("URL hình ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    // Nếu là data URL, có thể mở trực tiếp modal crop
    if (trimmed.startsWith("data:")) {
      setSelectedImageSrc(trimmed);
      setCropModalOpen(true);
      return;
    }

    try {
      setUploading(true);
      setLoadingMessage("Đang tải ảnh từ URL về hệ thống...");
      setError("");
      const result = await uploadImageFromUrl(trimmed, "subjects");
      setSelectedImageSrc(resolveImageUrl(result.url));
      setCropModalOpen(true);
    } catch (err) {
      setError(err?.message || "Không thể tải ảnh từ URL. Vui lòng kiểm tra lại đường dẫn.");
    } finally {
      setUploading(false);
      setLoadingMessage("");
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      setUploading(true);
      setLoadingMessage("Đang xử lý & lưu ảnh chuẩn tỉ lệ 16:9...");
      setError("");
      const result = await uploadImage(croppedBlob, "subjects", "subject-cover.webp");
      onChange?.(result.url);
      setUrlInput("");
    } catch (err) {
      setError(err?.message || "Không thể tải ảnh lên máy chủ. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setLoadingMessage("");
    }
  };

  const handleReCrop = () => {
    if (!value) return;
    setSelectedImageSrc(resolveImageUrl(value));
    setCropModalOpen(true);
  };

  const handleRemove = (event) => {
    event.stopPropagation();
    onChange?.("");
    setUrlInput("");
    setError("");
  };

  const triggerUpload = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const hasImage = Boolean(value);

  return (
    <div className="subject-image-field">
      <div className="subject-image-field__header">
        <span className="subject-image-field__label">{label}</span>
        {hint && <span className="subject-image-field__hint">{hint}</span>}
      </div>

      {!hasImage && (
        <div className="subject-image-field__tabs" role="tablist">
          <button
            type="button"
            className={`subject-image-field__tab ${activeTab === "file" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("file");
              setError("");
            }}
            disabled={disabled || uploading}
          >
            <FileImage size={14} /> Tải từ máy tính
          </button>
          <button
            type="button"
            className={`subject-image-field__tab ${activeTab === "url" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("url");
              setError("");
            }}
            disabled={disabled || uploading}
          >
            <Globe size={14} /> Nhập từ URL
          </button>
        </div>
      )}

      <div
        className={`subject-image-field__container ${isDragOver ? "is-dragover" : ""} ${
          hasImage ? "has-image" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!hasImage && activeTab === "file" ? triggerUpload : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
          onChange={handleInputChange}
          style={{ display: "none" }}
          disabled={disabled || uploading}
        />

        {uploading && (
          <div className="subject-image-field__loading-overlay">
            <Spinner size={28} />
            <span>{loadingMessage || "Đang xử lý..."}</span>
          </div>
        )}

        {hasImage ? (
          <>
            <img
              src={resolveImageUrl(value)}
              alt="Ảnh môn học"
              className="subject-image-field__preview-img"
            />
            <span className="subject-image-field__badge">16:9 (800 × 450 px)</span>
            {!disabled && !uploading && (
              <div className="subject-image-field__actions-overlay">
                <button
                  type="button"
                  className="subject-image-field__action-btn"
                  onClick={triggerUpload}
                  title="Tải ảnh khác từ máy tính"
                >
                  <RefreshCw size={13} /> Thay ảnh (file)
                </button>
                <button
                  type="button"
                  className="subject-image-field__action-btn"
                  onClick={() => {
                    setActiveTab("url");
                    onChange?.("");
                  }}
                  title="Nhập URL ảnh mới"
                >
                  <Globe size={13} /> Nhập URL mới
                </button>
                <button
                  type="button"
                  className="subject-image-field__action-btn"
                  onClick={handleReCrop}
                  title="Cắt lại ảnh này"
                >
                  <Crop size={13} /> Cắt lại
                </button>
                <button
                  type="button"
                  className="subject-image-field__action-btn is-danger"
                  onClick={handleRemove}
                  title="Xóa ảnh"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            )}
          </>
        ) : activeTab === "url" ? (
          <form className="subject-image-field__url-form" onSubmit={handleFetchUrl} onClick={(e) => e.stopPropagation()}>
            <div className="subject-image-field__icon-wrap">
              <Globe size={22} />
            </div>
            <div className="subject-image-field__drop-text">
              Nhập liên kết (URL) ảnh
            </div>
            <div className="subject-image-field__url-input-group">
              <input
                type="url"
                className="subject-image-field__url-input"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled || uploading}
                autoFocus
              />
              <button
                type="submit"
                className="subject-image-field__url-submit-btn"
                disabled={disabled || uploading || !urlInput.trim()}
              >
                <Crop size={14} /> Tải & Cắt
              </button>
            </div>
            <div className="subject-image-field__drop-sub">
              Dán URL ảnh trực tiếp. Hệ thống sẽ nạp ảnh và mở công cụ cắt chuẩn tỉ lệ 16:9.
            </div>
          </form>
        ) : (
          <div className="subject-image-field__dropzone">
            <div className="subject-image-field__icon-wrap">
              <UploadCloud size={24} />
            </div>
            <div className="subject-image-field__drop-text">
              Tải lên hoặc kéo thả ảnh môn học vào đây
            </div>
            <div className="subject-image-field__drop-sub">
              Hỗ trợ PNG, JPG, WEBP. Ảnh sẽ tự động được đưa vào công cụ cắt chuẩn tỉ lệ 16:9.
            </div>
          </div>
        )}
      </div>

      {error && <div className="subject-image-field__error">{error}</div>}

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        targetWidth={800}
        targetHeight={450}
        title="Cắt ảnh bìa môn học"
      />
    </div>
  );
}
