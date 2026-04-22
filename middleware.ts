import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/forgot-2fa",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth.user.role;
  if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/security", req.url));
    }
    return NextResponse.redirect(new URL("/patient/dashboard", req.url));
  }

  if (pathname.startsWith("/patient") && role !== "PATIENT") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/security", req.url));
    }
    return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    if (role === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
    }

    return NextResponse.redirect(new URL("/patient/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
