import React from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

const Auth: React.FC = () => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log("Access Token:", tokenResponse.access_token);
    },
    onError: () => {
      console.log("Login Failed");
    },
    scope: "https://www.googleapis.com/auth/bigquery", // Add additional scopes if needed
  });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      Auth page
      <button onClick={() => login()} className="login-button">
        Login with Google
      </button>
    </div>
  );
};

export default Auth;
