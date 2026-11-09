import { Outlet } from "react-router";

function RootLayout() {
  return (
    <div className="text-3xl font-bold">
      RootLayout
      <Outlet />
    </div>
  );
}

export default RootLayout;
