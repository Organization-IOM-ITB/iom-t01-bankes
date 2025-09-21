// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { nextUrl } = req;
    const { token } = req.nextauth;

    // Extract the user's role from the token
    const userRole = token?.role;

    // Define role-based route restrictions
    if (nextUrl.pathname.startsWith("/student") && userRole !== "Mahasiswa" ) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (nextUrl.pathname.startsWith("/iom") && userRole !== "Pengurus_IOM" ) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (nextUrl.pathname.startsWith("/admin") && userRole !== "Admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (nextUrl.pathname.startsWith("/guest") && userRole !== "Guest") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Allow access if the role matches the route
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Protects routes if no token is present
    },
    pages: {
      signIn: "/", // Redirect unauthenticated users to homepage
    },
  }
);

// Protected routes
export const config = {
  matcher: ["/student/:path*", "/iom/:path*", "/admin/:path*", "/guest/:path*"],
};