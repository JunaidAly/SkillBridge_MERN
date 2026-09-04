import NotificationBell from "./Notifications/NotificationBell";
import ProfileMenu from "./ProfileMenu";

function TopbarActions() {
  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <ProfileMenu />
    </div>
  );
}

export default TopbarActions;
