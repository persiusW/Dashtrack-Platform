import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function useSubscriptionGate(feature: string) {
  const { profile } = useAuth();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }
      if (profile.organization_id && profile.role !== 'admin') {
         setIsAllowed(true);
      }
    }
    setIsChecking(false);
  }, [profile, feature]);

  return { isAllowed, isChecking, message };
}
