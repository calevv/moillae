import { Outlet } from "react-router";
import BottomNav from "@/components/BottomNav";

// 하단 탭이 있는 화면들의 공통 틀: 위는 화면 내용, 아래는 탭
function TabLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-white text-plum">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <div className="sticky bottom-0 z-10 bg-white">
        <BottomNav />
      </div>
    </div>
  );
}

export default TabLayout;
