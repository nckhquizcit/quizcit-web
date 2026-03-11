import "./ForgotPasswordCard.css";
import { FaRegCircleCheck as CheckIcon } from "react-icons/fa6";
import { MdOutlineMailOutline as EmailIcon } from "react-icons/md";
export default function ForgotPasswordCard() {
  return (
    <div className="forgot-password-card-container">
      <EmailIcon className="text-[3rem]"></EmailIcon>
      <h1 className="text-[3rem]">Quên mật khẩu?</h1>
      <p className="text-[1.2rem]">Đừng lo lắng,chúng tôi có thể giúp bạn</p>
      <div className="description-container">
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Nhập email đã đăng ký</p>
        </div>
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Xác minh mã từ email</p>
        </div>
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Đặt mật khẩu mới</p>
        </div>
      </div>
    </div>
  );
}
