import { useEffect, useRef } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Loader2 } from "lucide-react";

// Toolbar trimmed for a 1:1 tutoring session - no invite/livestreaming/recording/etc.
// Button names are Jitsi's documented TOOLBAR_BUTTONS values (interface_config.js).
const TOOLBAR_BUTTONS = [
  "microphone",
  "camera",
  "desktop",
  "fullscreen",
  "fodeviceselection",
  "hangup",
  "profile",
  "chat",
  "settings",
  "raisehand",
  "videoquality",
  "filmstrip",
  "tileview",
  "closedcaptions",
  "videobackgroundblur",
];

function Spinner() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );
}

function VideoCallRoom({ roomName, jwt, displayName, email, onCallEnded }) {
  const apiRef = useRef(null);

  useEffect(() => {
    return () => {
      // @jitsi/react-sdk does not dispose the external API on unmount itself (checked
      // the installed v1.4.4 source directly - no dispose() call anywhere in it), so
      // without this the iframe and any open camera/mic stream keep running after this
      // component is torn down (e.g. navigating away mid-call).
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full">
      <JitsiMeeting
        domain="8x8.vc"
        roomName={roomName}
        jwt={jwt}
        userInfo={{ displayName, email }}
        spinner={Spinner}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinConfig: { enabled: false },
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        }}
        onApiReady={(api) => {
          apiRef.current = api;
        }}
        onReadyToClose={() => {
          onCallEnded?.();
        }}
        getIFrameRef={(parentNode) => {
          parentNode.style.height = "100%";
          parentNode.style.width = "100%";
        }}
      />
    </div>
  );
}

export default VideoCallRoom;
