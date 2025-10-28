
import { supabase } from "@/integrations/supabase/client";

export interface QRCodeOptions {
  trackedLinkId: string;
  slug: string;
  activationId: string;
  zoneId?: string | null;
  agentId?: string | null;
}

export const qrService = {
  /**
   * Generate QR code and upload to storage
   */
  async generateAndUploadQR(options: QRCodeOptions): Promise<string> {
    const { trackedLinkId, slug, activationId, zoneId, agentId } = options;
    
    // Generate QR code URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dashtrack.com";
    const qrUrl = `${appUrl}/r/${slug}`;
    
    // Use a QR code generation API (we'll use qrcode library)
    const QRCode = (await import("qrcode")).default;
    
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    // Determine storage path based on context
    let storagePath: string;
    if (agentId && zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}/${agentId}.png`;
    } else if (zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}.png`;
    } else {
      storagePath = `qr/${trackedLinkId}/${activationId}.png`;
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("qr")
      .upload(storagePath, qrBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Generate signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("qr")
      .createSignedUrl(storagePath, 31536000); // 1 year in seconds

    if (signedError) throw signedError;
    
    return signedUrlData.signedUrl;
  },

  /**
   * Get signed URL for existing QR code
   */
  async getQRSignedUrl(trackedLinkId: string, activationId: string, zoneId?: string | null, agentId?: string | null, expiresIn: number = 3600): Promise<string> {
    let storagePath: string;
    if (agentId && zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}/${agentId}.png`;
    } else if (zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}.png`;
    } else {
      storagePath = `qr/${trackedLinkId}/${activationId}.png`;
    }

    const { data, error } = await supabase.storage
      .from("qr")
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Delete QR code from storage
   */
  async deleteQR(trackedLinkId: string, activationId: string, zoneId?: string | null, agentId?: string | null): Promise<void> {
    let storagePath: string;
    if (agentId && zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}/${agentId}.png`;
    } else if (zoneId) {
      storagePath = `qr/${trackedLinkId}/${activationId}/${zoneId}.png`;
    } else {
      storagePath = `qr/${trackedLinkId}/${activationId}.png`;
    }

    const { error } = await supabase.storage
      .from("qr")
      .remove([storagePath]);

    if (error) throw error;
  }
};
