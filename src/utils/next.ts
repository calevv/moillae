// 로그인 후 돌아갈 주소(?next=)를 다루는 도우미

// 우리 앱 안의 주소만 허용해요 (열린 리다이렉트 막기)
export function safeNext(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null; // https://다른사이트 막기
  if (value.startsWith("//") || value.startsWith("/\\")) return null; // //다른사이트 같은 우회 막기
  return value;
}

// withNext("/login", "/invite/abc") → "/login?next=%2Finvite%2Fabc"
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
