import { createBrowserRouter } from "react-router";
import RootLayout from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import GroupPage from "@/pages/GroupPage";
import PollPage from "@/pages/PollPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "groups/:groupId", element: <GroupPage /> },
      { path: "groups/:groupId/polls/:pollId", element: <PollPage /> },
    ],
  },
]);
