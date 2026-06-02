import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // 公开路径
      const publicPaths = ["/", "/api/auth"];
      const isPublic = publicPaths.some(
        (p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p)
      );
      if (isPublic) return true;
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
