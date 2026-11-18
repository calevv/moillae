// 시트가 여러 개 겹쳐도, 마지막 하나가 닫힐 때만 스크롤을 풀어요
let count = 0;

export function lockScroll() {
  count += 1;
  document.body.style.overflow = "hidden";
  return () => {
    count = Math.max(0, count - 1);
    if (count === 0) document.body.style.overflow = "";
  };
}
