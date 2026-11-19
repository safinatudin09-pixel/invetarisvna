import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 1. Proteksi halaman Manajemen User: Hanya SUPER_ADMIN
    if (pathname.startsWith("/users") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/?error=forbidden", req.url));
    }

    // 2. Proteksi halaman Input Transaksi (IN, OUT, ADJUSTMENT): VIEWER dilarang akses form mutasi
    if (
      (pathname.startsWith("/transactions/in") ||
        pathname.startsWith("/transactions/out") ||
        pathname.startsWith("/transactions/adjustment")) &&
      token?.role === "VIEWER"
    ) {
      return NextResponse.redirect(
        new URL("/transactions?error=readonly", req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
