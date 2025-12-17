// frontend/app/portal/a9f3x/water/receipt/page.tsx

import WaterReceiptLogic from './WaterReceiptLogic';

/**
 * WaterReceiptPage Component
 * * Đây là điểm vào chính (Entry Point) của trang Quản Lý Nhận Hàng Vào Kho.
 * Nó chỉ có nhiệm vụ import và render Component Logic để quản lý State và Data.
 */
const WaterReceiptPage = () => {
  return (
    // WaterReceiptLogic là nơi chứa tất cả state và hàm xử lý (Container)
    <WaterReceiptLogic />
  );
};

export default WaterReceiptPage;