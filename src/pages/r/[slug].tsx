
import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Smart redirect endpoint for tracked links
 * Detects device type, logs click, and redirects to appropriate URL
 */

interface RedirectPageProps {
  error?: string;
}

export default function RedirectPage({ error }: RedirectPageProps) {
  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>404 - Link Not Found</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <p>Redirecting...</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const userAgent = context.req.headers["user-agent"] || "";
  const ip = (context.req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
             context.req.socket.remoteAddress || 
             null;
  const referrer = context.req.headers.referer || context.req.headers.referrer || null;

  try {
    // Lookup tracked link by slug
    const { data: link, error: linkError } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      return {
        props: {
          error: "Link not found or inactive"
        }
      };
    }

    // Detect device type
    const ua = userAgent.toLowerCase();
    let deviceType = "other";
    if (/(iphone|ipod|ipad)/i.test(ua)) {
      deviceType = "ios";
    } else if (/android/i.test(ua)) {
      deviceType = "android";
    } else if (/(tablet|ipad)/i.test(ua)) {
      deviceType = "tablet";
    } else if (/(mobile)/i.test(ua)) {
      deviceType = "mobile";
    } else {
      deviceType = "desktop";
    }

    // Detect bots
    const botPatterns = /(bot|crawl|spider|facebookexternalhit|slurp|mediapartners|bingbot|googlebot)/i;
    const isBot = botPatterns.test(ua);

    // Insert click record
    const { error: clickError } = await supabase
      .from("clicks")
      .insert({
        organization_id: link.organization_id,
        activation_id: link.activation_id,
        zone_id: link.zone_id,
        agent_id: link.agent_id,
        tracked_link_id: link.id,
        ip: ip,
        user_agent: userAgent,
        referrer: referrer,
        device_type: deviceType,
        is_bot: isBot
      });

    if (clickError) {
      console.error("Error logging click:", clickError);
    }

    // Upsert daily metrics
    const today = new Date().toISOString().split("T")[0];
    const { error: metricsError } = await supabase.rpc("upsert_daily_metrics", {
      p_tracked_link_id: link.id,
      p_organization_id: link.organization_id,
      p_date: today,
      p_is_bot: isBot
    });

    if (metricsError) {
      console.error("Error updating metrics:", metricsError);
    }

    // Determine redirect URL based on strategy
    let redirectUrl: string;

    if (link.destination_strategy === "single") {
      redirectUrl = link.single_url || link.fallback_url || "https://example.com";
    } else {
      // Smart strategy
      if (deviceType === "ios" && link.ios_url) {
        redirectUrl = link.ios_url;
      } else if (deviceType === "android" && link.android_url) {
        redirectUrl = link.android_url;
      } else {
        redirectUrl = link.fallback_url || "https://example.com";
      }
    }

    // Perform 302 redirect
    return {
      redirect: {
        destination: redirectUrl,
        statusCode: 302
      }
    };
  } catch (error) {
    console.error("Error in redirect:", error);
    return {
      props: {
        error: "An error occurred while processing your request"
      }
    };
  }
};
