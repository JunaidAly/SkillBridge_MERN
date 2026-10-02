import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Bell,
  Trash2,
  MessageSquare,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Wallet,
  FileCheck,
  BadgeCheck,
  BadgeX,
  RotateCcw,
  Banknote,
} from "lucide-react";

// Each notification type gets its own icon and tint, so the list can be
// scanned at a glance - every row used to carry the same teal dot, which only
// said "unread" and nothing about what had happened.
const NOTIFICATION_STYLES = {
  new_message: { Icon: MessageSquare, className: "text-teal bg-teal/10" },
  meeting_reminder: { Icon: CalendarClock, className: "text-amber-600 bg-amber-50" },
  meeting_confirmed: { Icon: CalendarCheck, className: "text-teal bg-teal/10" },
  meeting_cancelled: { Icon: CalendarX, className: "text-red-500 bg-red-50" },
  credit_low_balance: { Icon: Wallet, className: "text-amber-600 bg-amber-50" },
  verification_submitted: { Icon: FileCheck, className: "text-blue-500 bg-blue-50" },
  verification_approved: { Icon: BadgeCheck, className: "text-teal bg-teal/10" },
  verification_rejected: { Icon: BadgeX, className: "text-red-500 bg-red-50" },
  refund_approved: { Icon: RotateCcw, className: "text-teal bg-teal/10" },
  refund_rejected: { Icon: RotateCcw, className: "text-red-500 bg-red-50" },
  payout_approved: { Icon: Banknote, className: "text-teal bg-teal/10" },
  payout_rejected: { Icon: Banknote, className: "text-red-500 bg-red-50" },
  payout_paid: { Icon: Banknote, className: "text-teal bg-teal/10" },
};

const notificationStyle = (type) =>
  NOTIFICATION_STYLES[type] || { Icon: Bell, className: "text-gray bg-gray-100" };
import apiClient from "../../api/client";
import { getSocket, disconnectSocket } from "../../socket";
import { logout } from "../../store/authSlice";
import { useToast } from "../../ui/Toast";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationBell() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await apiClient.get("/notifications?limit=20");
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // Notifications are non-critical - fail silently, bell just shows nothing.
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();

    const socket = getSocket();
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("newNotification", handleNewNotification);

    const forceLogout = (reason) => {
      toast.error(reason ? `Account suspended: ${reason}` : "Your account has been suspended.");
      dispatch(logout());
      disconnectSocket();
      navigate("/login", { replace: true });
    };

    // Best-effort immediate signal: the admin action force-disconnects this
    // socket right after emitting this, so it can race the disconnect. The
    // 'disconnect'/'connect_error' handlers below are the reliable fallback -
    // they re-check with the server instead of trusting a single packet.
    const handleAccountSuspended = (data) => forceLogout(data?.reason);
    socket.on("accountSuspended", handleAccountSuspended);

    // Covers both "this socket just got force-disconnected by an admin" and
    // "this socket tried to reconnect but got rejected" - either way, ask the
    // server directly whether we're actually suspended (apiClient's response
    // interceptor handles the logout if so) rather than assuming disconnect
    // always means suspension (it can just as easily mean the network blipped).
    const checkStillAllowed = () => {
      apiClient.get("/auth/me").catch(() => {});
    };
    socket.on("disconnect", checkStillAllowed);
    socket.on("connect_error", checkStillAllowed);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("accountSuspended", handleAccountSuspended);
      socket.off("disconnect", checkStillAllowed);
      socket.off("connect_error", checkStillAllowed);
    };
  }, [dispatch, navigate, toast]);

  useEffect(() => {
    if (!open) {
      setConfirmingClear(false);
      return;
    }
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      apiClient.patch(`/notifications/${notification.id}/read`).catch(() => {});
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    apiClient.patch("/notifications/read-all").catch(() => {});
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    setConfirmingClear(false);
    apiClient.delete("/notifications").catch(() => {});
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-all"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-black" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red opacity-75 animate-ping" />
            <span className="relative min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red text-white text-[10px] font-family-poppins font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-white rounded-xl shadow-lg border border-[#E5E5E5] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5] gap-3">
            <h3 className="font-family-poppins text-sm font-semibold text-black shrink-0">Notifications</h3>
            {!confirmingClear ? (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="font-family-poppins text-xs text-teal hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => setConfirmingClear(true)}
                    className="flex items-center gap-1 font-family-poppins text-xs text-red hover:underline"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-family-poppins text-xs text-gray">Clear all?</span>
                <button
                  onClick={handleClearAll}
                  className="font-family-poppins text-xs font-semibold text-red hover:underline"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="font-family-poppins text-xs text-gray hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading && (
              <p className="font-family-poppins text-sm text-gray text-center py-8">Loading...</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="font-family-poppins text-sm text-gray text-center py-8">
                No notifications yet.
              </p>
            )}
            {!loading &&
              notifications.map((n) => {
                const { Icon, className: iconClass } = notificationStyle(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F0F0F0] last:border-b-0 hover:bg-gray-50 transition-colors flex gap-3 items-start ${
                      !n.read ? "bg-light-teal/30" : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconClass}`}
                    >
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <p
                        className={`font-family-poppins text-sm text-black line-clamp-2 ${
                          !n.read ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="font-family-poppins text-xs text-gray line-clamp-2 mt-0.5">{n.body}</p>
                      )}
                      <p className="font-family-poppins text-[11px] text-gray-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </span>

                    {/* The dot carried both meanings before; now it only has to
                        say "unread", so it moves out of the icon's way. */}
                    {!n.read && (
                      <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-teal" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
