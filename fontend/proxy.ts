// frontend/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_BY_PATH, ROUTE_MAP } from "@/lib/routeMap";
import { decryptData } from "@/lib/encryption"; // Đảm bảo hàm này đã sẵn sàng

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const encryptedRole = req.cookies.get("user_role")?.value;
  const path = req.nextUrl.pathname;

  // 1. Giải mã Role từ Cookies
  // userRole sẽ nhận giá trị gốc như "ADMIN", "MANAGER", hoặc "USER"
  const userRole = encryptedRole ? decryptData(encryptedRole) : null;

  // 2. Kiểm tra tính toàn vẹn của Role
  // Nếu có chuỗi mã hóa nhưng giải mã thất bại (bị sửa đổi), xóa cookie và đá về login
  if (encryptedRole && !userRole) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    response.cookies.delete("user_role");
    return response;
  }

  // 3. Trường hợp chưa đăng nhập (không có token)
  if (!token) {
    // Nếu cố truy cập vào vùng portal, bắt buộc về login
    if (path.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 4. Trường hợp đã đăng nhập (có token và userRole hợp lệ)
  if (token && userRole) {
    // Nếu đang ở trang login mà đã có session, đẩy về trang chủ theo Role
    if (path === "/login" || path === "/") {
      const targetPath = ROUTE_MAP[userRole as keyof typeof ROUTE_MAP] || "/login";
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // Kiểm tra quyền truy cập vào đường dẫn cụ thể trong /portal
    const requiredRoleEntry = Object.entries(ROLE_BY_PATH).find(([route]) =>
      path.startsWith(route)
    );
    const requiredRole = requiredRoleEntry ? requiredRoleEntry[1] : null;

    if (requiredRole) {
      const hierarchy = ["USER", "MANAGER", "ADMIN"];
      const userLevel = hierarchy.indexOf(userRole);
      const routeLevel = hierarchy.indexOf(requiredRole);

      // Nếu cấp độ người dùng thấp hơn yêu cầu của trang (ví dụ: USER vào portal ADMIN)
      if (userLevel < routeLevel) {
        // Đưa người dùng về vùng an toàn của chính họ thay vì trang login
        const safePath = ROUTE_MAP[userRole as keyof typeof ROUTE_MAP];
        return NextResponse.redirect(new URL(safePath, req.url));
      }
    }
  }

  return NextResponse.next();
}

// Giới hạn Middleware chạy cho các route cần thiết
export const config = {
  matcher: ["/portal/:path*", "/login", "/"],
};