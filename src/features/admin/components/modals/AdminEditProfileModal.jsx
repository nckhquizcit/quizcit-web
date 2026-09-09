import { useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import ImageCropModal from "../../../../components/ui/ImageCropModal/ImageCropModal";
import { uploadImage } from "../../../../services/uploadService";
import { resolveImageUrl } from "../../../../services/mappers";
import { getErrorMessage } from "../../../../services/apiClient";
import { adminProfileService } from "../../services/profileService";
import { validateDisplayName } from "../../utils/adminProfileLogic";
import { getInitials } from "../../utils/adminUsersLogic";
import "./modal.css";

export default function AdminEditProfileModal({
  open,
  onClose,
  admin,
  onSuccess,
}) {
  const [displayName, setDisplayName] = useState(() => admin?.displayName || admin?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(() => admin?.avatarUrl || null);
  const [avatarCropSource, setAvatarCropSource] = useState("");
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const displayNameInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setDisplayName(admin?.displayName || admin?.username || "");
      setAvatarUrl(admin?.avatarUrl || null);
      setFormError("");
      setIsSubmitting(false);
      setAvatarUploading(false);
    }
  }, [open, admin]);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting || avatarUploading) return;
    onClose?.();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Vui lòng chọn tập tin ảnh hợp lệ (PNG, JPG, WebP...).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormError("");
      setAvatarCropSource(String(reader.result || ""));
      setAvatarCropOpen(true);
    };
    reader.onerror = () => {
      setFormError("Không thể đọc tập tin ảnh đã chọn.");
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setAvatarUploading(true);
    setFormError("");
    try {
      const uploaded = await uploadImage(croppedBlob, "avatars", "admin-avatar.webp");
      setAvatarUrl(uploaded?.url || null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể tải ảnh đại diện lên máy chủ."));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || avatarUploading) return;

    const validationError = validateDisplayName(displayName);
    if (validationError) {
      setFormError(validationError);
      displayNameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const updated = await adminProfileService.updateAdminProfile({
        displayName: displayName.trim(),
        avatarUrl,
      });
      onSuccess?.(updated);
      onClose?.();
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật hồ sơ quản trị viên."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewInitials = getInitials(displayName || admin?.username || "A");

  return (
    <>
      <Modal open={open} onClose={handleClose} labelledById={titleId} initialFocusRef={displayNameInputRef}>
        <div className="modal-header">
          <h3 id={titleId}>Chỉnh sửa thông tin quản trị</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && <p className="modal-inline-error">{formError}</p>}

            {/* Avatar uploader section */}
            <div className="admin-avatar-edit-section">
              <div className="admin-avatar-edit-preview">
                {avatarUrl ? (
                  <img
                    src={resolveImageUrl(avatarUrl)}
                    alt="Ảnh đại diện"
                    className="admin-avatar-edit-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="admin-avatar-edit-initials">{previewInitials}</span>
                )}
                {avatarUploading && (
                  <div className="admin-avatar-edit-overlay">
                    <Loader2 size={24} className="admin-spin-icon" />
                  </div>
                )}
              </div>

              <div className="admin-avatar-edit-actions">
                <button
                  type="button"
                  className="cancel-btn admin-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading || isSubmitting}
                >
                  <Camera size={15} />
                  <span>{avatarUrl ? "Đổi ảnh khác" : "Tải ảnh lên"}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className="cancel-btn admin-avatar-btn admin-avatar-btn--remove"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading || isSubmitting}
                  >
                    <Trash2 size={15} />
                    <span>Xóa ảnh</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>

            {/* Display Name field */}
            <div className="form-group">
              <label htmlFor="admin-edit-display-name">
                Tên hiển thị <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                ref={displayNameInputRef}
                id="admin-edit-display-name"
                type="text"
                value={displayName}
                maxLength={100}
                placeholder="Nhập tên hiển thị"
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <span className="admin-field-hint">
                Tên này sẽ hiển thị trên thanh tiêu đề và các hoạt động quản trị.
              </span>
            </div>

            {/* Username field (Read-only) */}
            <div className="form-group">
              <label htmlFor="admin-edit-username">Tên đăng nhập (Username)</label>
              <input
                id="admin-edit-username"
                type="text"
                value={admin?.username || ""}
                disabled
                readOnly
                className="admin-input--readonly"
              />
              <span className="admin-field-hint">Tên đăng nhập được dùng để định danh hệ thống và không thể thay đổi.</span>
            </div>

            {/* Email field (Read-only) */}
            <div className="form-group">
              <label htmlFor="admin-edit-email">Email tài khoản</label>
              <input
                id="admin-edit-email"
                type="email"
                value={admin?.email || ""}
                disabled
                readOnly
                className="admin-input--readonly"
              />
              <span className="admin-field-hint">Để đổi email, vui lòng sử dụng chức năng Đổi email bên ngoài hồ sơ.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="modal-btn primary submit-btn"
              type="submit"
              disabled={isSubmitting || avatarUploading || !displayName.trim()}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              className="modal-btn secondary cancel-btn"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || avatarUploading}
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      <ImageCropModal
        open={avatarCropOpen}
        imageSrc={avatarCropSource}
        onClose={() => setAvatarCropOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        targetWidth={512}
        targetHeight={512}
        title="Cắt ảnh đại diện quản trị"
      />
    </>
  );
}
