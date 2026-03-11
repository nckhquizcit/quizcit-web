import "./VerifyCard.css";
import { FaRegCircleCheck as CheckIcon } from "react-icons/fa6";
import { MdOutlineMailOutline as EmailIcon } from "react-icons/md";
export default function VerifyCard() {
  return (
    <div className="verify-card-container">
      <EmailIcon className="text-[3rem]"></EmailIcon>
      <h1 className="text-[3rem]">Xác minh tài khoản</h1>
      <p className="text-[1.2rem]">
        Vui lòng xác minh tài khoản của bạn trước khi sử dụng.
      </p>
      <div className="description-container">
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Mã xác minh đã được gửi đến email của bạn</p>
        </div>
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Nếu không tìm thấy email, vui lòng kiểm tra hộp thư spam</p>
        </div>
        <div className="description-item">
          <CheckIcon></CheckIcon>
          <p>Mỗi mã xác minh có hiệu lực trong 15 phút</p>
        </div>
      </div>
    </div>
  );
}
