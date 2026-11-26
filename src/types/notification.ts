export type NotificationType =
  | "poll_created"
  | "poll_confirmed"
  | "poll_unconfirmed";

export type AppNotification = {
  id: string;
  type: NotificationType;
  groupId: string;
  pollId: string | null;
  createdAt: string;
  readAt: string | null;
};
