import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../auth";
import { useAuth } from "../contexts/AuthContext";

export function Callback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback()
      .then(async () => {
        await refresh();
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("Sign-in failed. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <main className="page">
        <p className="error-text">{error}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <p>Signing you in…</p>
    </main>
  );
}
