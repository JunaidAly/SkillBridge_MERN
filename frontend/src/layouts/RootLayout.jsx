import { Outlet, ScrollRestoration } from "react-router-dom";

// Wraps every route purely so ScrollRestoration has somewhere to live.
// Without it a client-side navigation keeps whatever scroll position the
// previous page had - clicking "Contact Us" from a footer dropped you
// halfway down the new page. It also restores the old position on back
// and forward, which a plain scroll-to-top would throw away.
function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export default RootLayout;
