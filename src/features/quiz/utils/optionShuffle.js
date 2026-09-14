// Đảo thứ tự đáp án trong một câu hỏi.
//
// Thứ tự phải ổn định trong suốt một lượt làm bài (re-render, chuyển trang,
// tải lại trang, và cả khi xem lại ở trang Kết quả), nếu không đáp án sẽ nhảy
// vị trí và người dùng chọn nhầm. Vì vậy dùng seed cố định thay vì Math.random().
//
// Seed lấy từ `attemptId` để mỗi lượt làm ra một thứ tự khác nhau, nhưng cùng
// lượt thì luôn giống nhau. BE chấm điểm bằng `optionId` nên thứ tự hiển thị
// không ảnh hưởng tới kết quả.

/** Băm chuỗi thành số nguyên 32-bit, ổn định giữa các lần chạy. */
export function hashSeed(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Bộ sinh số giả ngẫu nhiên có seed (mulberry32) — cùng seed luôn ra cùng dãy. */
function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Trả về bản sao đã đảo của `options`, giữ nguyên phần tử gốc.
 *
 * `seedKey` nên gồm cả attemptId và questionId để mỗi câu trong cùng một bài
 * có thứ tự riêng, không dùng chung một hoán vị.
 */
export function shuffleOptions(options, seedKey) {
  const list = Array.isArray(options) ? [...options] : [];
  if (list.length < 2) return list;

  const random = createRandom(hashSeed(seedKey));
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

export const getOptionSeedKey = (attemptId, questionId) =>
  `${attemptId || "no-attempt"}:${questionId || "no-question"}`;
