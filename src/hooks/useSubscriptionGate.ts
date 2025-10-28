import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function useSubscriptionGate(feature: string) {
  const { profile } = useAuth();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      // Admins bypass all checks
      if (profile.role === 'admin') {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }
      
      // For v1, we only show a banner if plan is free, but don't block.
      if (profile.organization_id && profile.role !== 'admin') {
         // This logic would check against a features-by-plan map
         // For now, let's assume 'free' plan has limited access but we don't block
         // A real implementation would be:
         // const planFeatures = getFeaturesForPlan(profile.plan);
         // if (planFeatures.includes(feature)) {
         //   setIsAllowed(true);
         // } else {
         //   setIsAllowed(false);
         //   setMessage(`Upgrade to access this feature.`);
         // }
         
         // V1 logic: allow all, show message for free plan
         setIsAllowed(true); 
        //  if(profile.plan === 'free'){
        //      setMessage("This is a premium feature. Upgrade your plan for full access.");
        //  }
      }
    }
    setIsChecking(false);
  }, [profile, feature]);

  return { isAllowed, isChecking, message };
}
