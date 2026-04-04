import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/courses") || path.startsWith("/library") || path.startsWith("/my-progress") || path.startsWith("/settings");
  const isAdmin = path.startsWith("/admin");

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAdmin) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id);

    const isAdminUser = (roleRows ?? []).some((row) => {
      const roleName = (row as { roles?: { name?: string } | Array<{ name?: string }> }).roles;
      if (Array.isArray(roleName)) {
        return roleName.some((r) => r.name === "admin");
      }
      return roleName?.name === "admin";
    });

    if (!isAdminUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
