import { useState, useEffect } from "react";
import { Award, GraduationCap, Loader2 } from "lucide-react";
import { getMyCertificates, downloadCertificate } from "../../api/participation";
import { saveBlobAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [qrPreview, setQrPreview] = useState({ open: false, certificate: null });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await getMyCertificates();
      setCertificates(res.data);
    } catch {
      setError("Could not load your certificates.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate) => {
    setDownloadingId(certificate.id);
    try {
      const downloadTarget = certificate.download_url || certificate.id;
      const res = await downloadCertificate(downloadTarget);
      saveBlobAsFile(
        res.data,
        `certificate_${certificate.event_title.replace(/\s+/g, "_")}.pdf`,
      );
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const openQrPreview = (certificate) => {
    setQrPreview({ open: true, certificate });
  };

  const closeQrPreview = () => {
    setQrPreview({ open: false, certificate: null });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading certificates…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><Award className="size-3.5" /> Achievements</>}
        title="My certificates"
        subtitle="Download your participation certificates and view event completion details."
      />

      {error && <InlineAlert type="error">{error}</InlineAlert>}

      {certificates.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </div>
          <p className="font-semibold text-foreground">No certificates yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">They appear here after you complete an event.</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <StatusBadge tone="success">Ready to download</StatusBadge>
                  <h3 className="mt-3 text-lg font-semibold break-words text-foreground">{cert.event_title}</h3>
                  <p className="text-sm text-primary">{cert.club_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Issued {formatDateTime(cert.issued_at)}</p>
                </div>
                <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary sm:flex">
                  PDF
                </div>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Certificate details
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Student: <span className="font-medium text-foreground">{cert.user_name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Reference: <span className="font-medium break-all text-foreground">{cert.certificate_code}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => openQrPreview(cert)} disabled={!cert.qr_image_base64}>
                  View QR
                </Button>
                <Button type="button" onClick={() => handleDownload(cert)} disabled={downloadingId === cert.id}>
                  {downloadingId === cert.id ? "Preparing..." : "Download PDF"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={qrPreview.open} onOpenChange={(open) => !open && closeQrPreview()}>
        <DialogContent className="sm:max-w-lg">
          {qrPreview.certificate && (
            <>
              <DialogHeader>
                <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Certificate QR</p>
                <DialogTitle>{qrPreview.certificate.event_title}</DialogTitle>
                <DialogDescription>Scan this QR to open the certificate download page.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <img
                    src={`data:image/png;base64,${qrPreview.certificate.qr_image_base64}`}
                    alt="Certificate QR code"
                    className="mx-auto h-64 w-64 rounded-xl border bg-white p-3"
                  />
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium text-foreground">Download URL</p>
                  <p className="mt-2 text-sm break-all text-muted-foreground">
                    {qrPreview.certificate.download_url}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Keep this QR handy if you want to open the certificate on another device.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCertificates;
