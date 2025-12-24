import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_BY_PATH, ROUTE_MAP } from "@/lib/routeMap";
import { decryptData } from "@/lib/encryption";

/**
 * Phân cấp quyền hạn (Hierarchy)
 * Cấp độ cao hơn sẽ có quyền truy cập của cấp độ thấp hơn.
 */
const ROLE_HIERARCHY = ["USER", "MANAGER", "ADMIN"];

/**
 * Hàm Proxy/Middleware mặc định xử lý mọi Request
 */
export default function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const encryptedRole = req.cookies.get("user_role")?.value;
  const path = req.nextUrl.pathname;

  // 1. Giải mã Role từ Cookies
  let userRole: string | null = null;
  try {
    userRole = encryptedRole ? decryptData(encryptedRole) : null;
  } catch (error) {
    userRole = null; // Giải mã thất bại (có thể do bị can thiệp)
  }

  // 2. Kiểm tra tính toàn vẹn của Role (Security Check)
  if (encryptedRole && !userRole) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    response.cookies.delete("user_role");
    return response;
  }

  // 3. Xử lý khi CHƯA đăng nhập
  if (!token) {
    if (path.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 4. Xử lý khi ĐÃ đăng nhập
  if (token && userRole) {
    // Nếu đang ở trang login hoặc trang chủ mà đã có session -> Chuyển hướng về Dashboard tương ứng
    if (path === "/login" || path === "/") {
      const targetPath = ROUTE_MAP[userRole as keyof typeof ROUTE_MAP] || "/login";
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // Kiểm tra quyền truy cập vào vùng /portal
    if (path.startsWith("/portal")) {
      // Tìm quyền yêu cầu tối thiểu dựa trên routeMap
      const requiredRoleEntry = Object.entries(ROLE_BY_PATH).find(([route]) =>
        path.startsWith(route)
      );
      
      const requiredRole = requiredRoleEntry ? requiredRoleEntry[1] : null;

      if (requiredRole) {
        const userLevel = ROLE_HIERARCHY.indexOf(userRole.toUpperCase());
        const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole.toUpperCase());

        // Nếu cấp độ người dùng thấp hơn yêu cầu của trang (Ví dụ: USER vào /portal/admin)
        if (userLevel < requiredLevel) {
          // Chuyển hướng về vùng an toàn của chính họ
          const safePath = ROUTE_MAP[userRole as keyof typeof ROUTE_MAP] || "/login";
          const response = NextResponse.redirect(new URL(safePath, req.url));
          
          // Tùy chọn: Bạn có thể thêm header để thông báo cho frontend biết truy cập bị từ chối
          response.headers.set('x-access-denied', 'true');
          
          return response;
        }
      }
    }
  }

  return NextResponse.next();
}

/**
 * Cấu hình các route mà Middleware này sẽ chạy qua
 */
export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn bắt đầu bằng /portal
     * Khớp chính xác trang /login và trang chủ /
     */
    "/portal/:path*", 
    "/login", 
    "/"
  ],
};