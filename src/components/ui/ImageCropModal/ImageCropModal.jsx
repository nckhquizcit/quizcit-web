import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Check, Minus, Plus, RefreshCw, RotateCw, X } from "lucide-react";
import getCroppedImg from "../../../utils/cropImage";
import "./ImageCropModal.css";

/**
 * Modal cắt ảnh với tỉ lệ và kích thước cố định
 */
export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9,
  targetWidth = 800,
  targetHeight = 450,
  title = "Cắt ảnh môn học",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels || processing) return;

    try {
      setProcessing(true);
      setError("");
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        targetWidth,
        targetHeight
      );

      await onCropComplete?.(result.blob, result.previewUrl);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Không thể cắt ảnh. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-container image-crop-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="image-crop-modal__header">
          <div>
            <h3>{title}</h3>
            <span className="image-crop-modal__badge">
              Tỉ lệ cố định 16:9 ({targetWidth} × {targetHeight} px)
            </span>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Đóng"
            disabled={processing}
          >
            <X size={18} />
          </button>
        </div>

        {error && <div className="image-crop-modal__error">{error}</div>}

        <div className="image-crop-modal__cropper-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
          />
        </div>

        <div className="image-crop-modal__controls">
          <div className="image-crop-modal__control-row">
            <div className="image-crop-modal__zoom-control">
              <button
                type="button"
                className="image-crop-modal__zoom-btn"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                disabled={zoom <= 1 || processing}
                aria-label="Thu nhỏ"
              >
                <Minus size={16} />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="image-crop-modal__slider"
                aria-label="Phóng to / thu nhỏ"
                disabled={processing}
              />
              <button
                type="button"
                className="image-crop-modal__zoom-btn"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                disabled={zoom >= 3 || processing}
                aria-label="Phóng to"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="image-crop-modal__btn-group">
              <button
                type="button"
                className="image-crop-modal__tool-btn"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                disabled={processing}
                title="Xoay 90 độ theo chiều kim đồng hồ"
              >
                <RotateCw size={14} />
                Xoay
              </button>
              <button
                type="button"
                className="image-crop-modal__tool-btn"
                onClick={handleReset}
                disabled={processing}
                title="Đặt lại vị trí ban đầu"
              >
                <RefreshCw size={14} />
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        <div className="image-crop-modal__footer">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={processing}
          >
            Hủy
          </button>
          <button
            type="button"
            className="add-btn"
            onClick={handleApply}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? (
              "Đang xử lý..."
            ) : (
              <>
                <Check size={16} /> Áp dụng cắt ảnh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
