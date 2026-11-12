import { createBrowserRouter } from "react-router";
import RequireAuth from "@/layouts/RequireAuth";
import RootLayout from "@/layouts/RootLayout";
import CalendarPage from "@/pages/CalendarPage";
import CreateGroupPage from "@/pages/CreateGroupPage";
import CreatePollPage from "@/pages/CreatePollPage";
import GroupPage from "@/pages/GroupPage";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import PollPage from "@/pages/PollPage";
import EmailLoginPage from "@/pages/EmailLoginPage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import InvitePage from "@/pages/InvitePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // 로그인 없이 볼 수 있는 화면
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "login/email", element: <EmailLoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      { path: "invite/:code", element: <InvitePage /> },

      // 로그인(또는 데모)해야 볼 수 있는 화면
      {
        element: <RequireAuth />,
        children: [
          { path: "home", element: <HomePage /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "groups/new", element: <CreateGroupPage /> },
          { path: "groups/:groupId", element: <GroupPage /> },
          { path: "groups/:groupId/polls/new", element: <CreatePollPage /> },
          { path: "groups/:groupId/polls/:pollId", element: <PollPage /> },
        ],
      },
    ],
  },
]);
