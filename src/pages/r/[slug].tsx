import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { ParsedUrlQuery } from "querystring";
import { clickService } from "@/services/clickService";
import { trackedLinkService } from "@/services/trackedLinkService";

interface TrackedLink {
  id: string;
  organization_id: string;
  activation_id: string;
  zone_id: string | null;
  agent_id: string | null;
  slug: string;
  destination_strategy: string;
  single_url: string | null;
  ios_url: string | null;
  android_url: string | null;
  fallback_url: string | null;
  is_active: boolean;
}

export default function RedirectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const userAgent = context.req.headers["user-agent"] || "";
  const ip = (context.req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
             context.req.socket.remoteAddress || "";
  const referrer = context.req.headers.referer || "";

  try {
    const supabaseAdmin = createPagesServerClient(context);
    
    // Re-create a service role client to bypass RLS for this critical path
    const supabaseService = createPagesServerClient(context, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: link, error: linkError } = await supabaseService
      .from("tracked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      return {
        notFound: true
      };
    }

    const deviceType = detectDeviceType(userAgent);
    const isBot = detectBot(userAgent);

    const clickData = {
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
    };

    const { error: clickError } = await supabaseService
      .from("clicks")
      .insert(clickData);

    if (clickError) {
      console.error("Failed to record click:", clickError);
    }

    const today = new Date().toISOString().split("T")[0];
    
    const { error: metricsError } = await supabaseService.rpc("upsert_daily_metrics", {
      p_tracked_link_id: link.id,
      p_date: today,
      p_is_bot: isBot,
      p_organization_id: link.organization_id
    });

    if (metricsError) {
      console.error("Failed to update metrics:", metricsError);
    }

    const redirectUrl = getRedirectUrl(link, deviceType);

    return {
      redirect: {
        destination: redirectUrl,
        permanent: false
      }
    };
  } catch (error) {
    console.error("Redirect error:", error);
    return {
      notFound: true
    };
  }
};

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return "ios";
  }
  
  if (ua.includes("android")) {
    return "android";
  }
  
  return "other";
}

function detectBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const botPatterns = [
    "bot",
    "crawl",
    "spider",
    "facebookexternalhit",
    "whatsapp",
    "telegram",
    "slackbot",
    "twitterbot",
    "linkedinbot",
    "discordbot"
  ];
  
  return botPatterns.some(pattern => ua.includes(pattern));
}

function getRedirectUrl(link: TrackedLink, deviceType: string): string {
  if (link.destination_strategy === "single" && link.single_url) {
    return link.single_url;
  }
  
  if (link.destination_strategy === "smart") {
    if (deviceType === "ios" && link.ios_url) {
      return link.ios_url;
    }
    
    if (deviceType === "android" && link.android_url) {
      return link.android_url;
    }
    
    if (link.fallback_url) {
      return link.fallback_url;
    }
  }
  
  return link.fallback_url || link.single_url || "https://example.com";
}
