import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { loginWithGoogle, clearError } from "../store/authSlice";

function GoogleLoginButtonInner({ className, children }) {
  const dispatch = useDispatch();

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
        );
        const userData = await userInfoResponse.json();

        dispatch(loginWithGoogle({
          credential: tokenResponse.access_token,
          email: userData.email,
          name: userData.name,
          sub: userData.id,
        }));
      } catch (error) {
        console.error('Google login error:', error);
        dispatch(clearError());
      }
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

