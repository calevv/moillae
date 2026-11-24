// 서비스 워커에 덧붙이는 푸시 처리.
// vite-plugin-pwa가 만든 sw.js가 importScripts로 이 파일을 불러와요.

// 1) 푸시가 오면 알림 띄우기
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json(); // 우리 서버는 { title, body, url, tag } 모양으로 보내요
    } catch {
      data = { body: event.data.text() }; // 글자만 온 경우 (개발자 도구 테스트 등)
    }
  }

  const title = data.title || "모일래";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    data: { url: data.url || "/home" }, // 누르면 열 주소
    tag: data.tag, // 같은 tag면 새 알림이 이전 알림을 대신해요 (같은 투표 알림이 쌓이지 않게)
  };

  // 알림을 다 띄울 때까지 서비스 워커가 꺼지지 않게 기다려 달라는 뜻
  event.waitUntil(self.registration.showNotification(title, options));
});

// 2) 알림을 누르면 그 화면 열기
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url || "/home",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      // 이미 열려 있는 모일래 창이 있으면 그 창을 앞으로 가져와서 이동
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      // 없으면 새로 열기
      await self.clients.openWindow(url);
    })(),
  );
});
