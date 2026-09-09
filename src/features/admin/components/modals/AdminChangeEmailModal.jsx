import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Mail, ShieldAlert } from "lucide-react";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import { logout } from "../../../../services/authService";
import { useToast } from "../../../../components/ui";
import { adminProfileService } from "../../services/profileService";
import { validateEmail, validateOtp, OTP_LENGTH } from "../../utils/adminProfileLogic";
import "./modal.css";

export default function AdminChangeEmailModal({ open, onClose, currentEmail }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [challengeId, setChallengeId] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const otpInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    let active = true;
    async function startFlow() {
      setIsLoadingChallenge(true);
      try {
        const challenge = await adminProfileService.requestEmailChange();
        if (active) {
          setChallengeId(challenge?.challengeId || "");
          setTargetEmail(challenge?.email || currentEmail || "");
        }
      } catch (error) {
        if (active) {
          setFormError(getErrorMessage(error, "Không thể gửi mã xác thực tới email hiện tại. Vui lòng thử lại sau."));
        }
      } finally {
        if (active) {
          setIsLoadingChallenge(false);
        }
      }
    }

    startFlow();

    return () => {
      active = false;
    };
  }, [open, currentEmail]);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting || isLoadingChallenge) return;
    onClose?.();
  };

  const handleStep1Submit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isLoadingChallenge) return;

    const otpError = validateOtp(otp);
    if (otpError) {
      setFormError(otpError);
      return;
    }

    const emailError = validateEmail(newEmail, currentEmail);
    if (emailError) {
      setFormError(emailError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await adminProfileService.verifyOldEmail({
        challengeId,
        otp: otp.trim(),
        newEmail: newEmail.trim().toLowerCase(),
      });

      setChallengeId(response?.challengeId || "");
      setTargetEmail(response?.email || newEmail.trim().toLowerCase());
      setOtp("");
      setStep(2);
    } catch (error) {
      setFormError(getErrorMessage(error, "Mã xác thực không hợp lệ hoặc email mới đã tồn tại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const otpError = validateOtp(otp);
    if (otpError) {
      setFormError(otpError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await adminProfileService.confirmEmailChange({
        challengeId,
        otp: otp.trim(),
      });
      toast.success("Đổi email thành công! Mọi phiên đăng nhập đã được làm mới, vui lòng đăng nhập lại.");
      logout();
      navigate("/login");
    } catch (error) {
      setFormError(getErrorMessage(error, "Mã xác thực không chính xác hoặc đã hết hạn."));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} labelledById={titleId} initialFocusRef={otpInputRef}>
      <div className="modal-header">
        <h3 id={titleId}>Đổi email quản trị</h3>
      </div>

      <div className="modal-body">
        <div className="admin-modal-notice">
          <ShieldAlert size={18} className="admin-modal-notice-icon" />
          <p>
            {step === 1
              ? `Mã xác thực gồm 6 chữ số đã được gửi tới email hiện tại (${targetEmail || currentEmail || "của bạn"}). Vui lòng nhập mã và email mới.`
              : `Mã xác nhận đã gửi tới email mới (${targetEmail || newEmail}). Vui lòng kiểm tra hộp thư và nhập mã xác thực.`}
          </p>
        </div>

        {formError && <p className="modal-inline-error">{formError}</p>}

        {isLoadingChallenge ? (
          <div className="admin-loading-placeholder">
            <p>Đang chuẩn bị phiên đổi email và gửi mã xác thực...</p>
          </div>
        ) : step === 1 ? (
          <form id="admin-email-step1-form" onSubmit={handleStep1Submit}>
            <div className="form-group">
              <label htmlFor="admin-email-old-otp">
                Mã xác thực gửi tới email hiện tại <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                ref={otpInputRef}
                id="admin-email-old-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_LENGTH}
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                required
                disabled={isSubmitting}
                className="admin-otp-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-email-new">
                Địa chỉ email mới <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="admin-email-new"
                type="email"
                placeholder="quan-tri-moi@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <span className="admin-field-hint">
                Sau bước này, mã xác thực thứ 2 sẽ được gửi đến email mới này để xác nhận.
              </span>
            </div>
          </form>
        ) : (
          <form id="admin-email-step2-form" onSubmit={handleStep2Submit}>
            <div className="form-group">
              <label htmlFor="admin-email-new-otp">
                Mã xác thực gửi tới {targetEmail || newEmail} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                ref={otpInputRef}
                id="admin-email-new-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_LENGTH}
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                required
                disabled={isSubmitting}
                className="admin-otp-input"
              />
            </div>
            <p className="admin-field-hint" style={{ marginTop: "8px" }}>
              Sau khi xác nhận đổi email, hệ thống sẽ đăng xuất để đảm bảo an toàn tài khoản.
            </p>
          </form>
        )}
      </div>

      <div className="modal-footer">
        {step === 1 ? (
          <button
            form="admin-email-step1-form"
            className="modal-btn primary submit-btn"
            type="submit"
            disabled={isSubmitting || isLoadingChallenge || !otp || !newEmail}
          >
            <span>{isSubmitting ? "Đang xử lý..." : "Tiếp tục"}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            form="admin-email-step2-form"
            className="modal-btn primary submit-btn"
            type="submit"
            disabled={isSubmitting || !otp}
          >
            <Check size={16} />
            <span>{isSubmitting ? "Đang xác nhận..." : "Xác nhận đổi email"}</span>
          </button>
        )}
        <button
          className="modal-btn secondary cancel-btn"
          type="button"
          onClick={handleClose}
          disabled={isSubmitting || isLoadingChallenge}
        >
          Hủy
        </button>
      </div>
    </Modal>
  );
}
