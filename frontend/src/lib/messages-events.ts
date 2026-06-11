export const MESSAGES_UNREAD_REFRESH = "messages-unread-refresh";

export function dispatchMessagesUnreadRefresh() {
  window.dispatchEvent(new CustomEvent(MESSAGES_UNREAD_REFRESH));
}
