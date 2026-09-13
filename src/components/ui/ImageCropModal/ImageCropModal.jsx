import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { Check, Minus, Plus, RefreshCw, RotateCw, X } from "lucide-react";
import getCroppedImg from "../../../utils/cropImage";
import Button from "../Button/Button";
import "./ImageCropModal.css";

// Giống Modal dùng chung: chỉ những phần tử thực sự focus được mới vào vòng Tab.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

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
  const ratioLabel = aspectRatio === 1 ? "1:1" : "16:9";
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError("");
  }, [imageSrc, open]);

  // Ngăn chặn đóng modal cha khi người dùng bấm Escape trong ImageCropModal
  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        if (!processing) {
          onClose?.();
        }
        return;
      }
      if (event.key !== "Tab") return;

      // Lấy danh sách ngay lúc nhấn phím: phần tử focus được đổi theo trạng thái xử lý.
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [open, processing, onClose]);

  const handleCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleClose = () => {
    if (!processing) onClose?.();
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

  return createPortal(
    <div className="image-crop-modal__overlay modal-overlay" onClick={handleClose} role="presentation">
      <div
        ref={dialogRef}
        className="image-crop-modal modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="image-crop-modal__header">
          <div>
            <h3 id="image-crop-modal-title">{title}</h3>
            <span className="image-crop-modal__badge">
              Tỉ lệ cố định {ratioLabel} ({targetWidth} × {targetHeight} px)
            </span>
          </div>
          <button
            type="button"
            className="image-crop-modal__close-btn modal-close"
            onClick={handleClose}
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
          <Button
            type="button"
            variant="ghost"
            className="cancel-btn"
            onClick={handleClose}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            className="add-btn"
            onClick={handleApply}
            disabled={processing || !croppedAreaPixels}
            loading={processing}
            iconLeft={!processing ? <Check size={16} /> : null}
          >
            Áp dụng cắt ảnh
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
