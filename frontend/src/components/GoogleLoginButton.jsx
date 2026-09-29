import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { loginWithGoogle, clearError } from "../store/authSlice";

function GoogleLoginButtonInner({ className, children }) {
  const dispatch = useDispatch();

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (tokenResponse) => {
      // Only the raw token goes to the server. It deliberately does NOT send
      // email/name read from Google here - the backend re-checks this token
      // with Google and takes the identity from that, so anything we forwarded
      // would just be an unverified claim.
      dispatch(loginWithGoogle({ credential: tokenResponse.access_token }));
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      dispatch(clearError());
    },
  });

  return (
    <button
      onClick={handleGoogleLogin}
      className={className}
    >
      {children}
    </button>
  );
}

function GoogleLoginButton({ className, children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

  if (!googleClientId) {
    return (
      <button
        onClick={() => alert('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')}
        disabled
        className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {children}
      </button>
    );
  }

  return <GoogleLoginButtonInner className={className}>{children}</GoogleLoginButtonInner>;
}

export default GoogleLoginButton;

