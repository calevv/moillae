import { createBrowserRouter } from "react-router";
import RootLayout from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import GroupPage from "@/pages/GroupPage";
import PollPage from "@/pages/PollPage";
import LandingPage from "@/pages/LandingPage";
import CreatePollPage from "@/pages/CreatePollPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "home", element: <HomePage /> },
      { path: "groups/:groupId", element: <GroupPage /> },
      { path: "groups/:groupId/polls/:pollId", element: <PollPage /> },
      { path: "groups/:groupId/polls/new", element: <CreatePollPage /> },
    ],
  },
]);
