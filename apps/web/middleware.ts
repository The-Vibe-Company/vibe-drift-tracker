import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
  ],
};
