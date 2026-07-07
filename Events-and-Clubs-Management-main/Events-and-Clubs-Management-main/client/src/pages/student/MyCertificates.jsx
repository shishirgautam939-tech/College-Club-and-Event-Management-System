import { useState, useEffect } from "react";
import { getMyCertificates, downloadCertificate } from "../../api/participation";
import { saveBlobAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";

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

  if (loading) return <p className="text-stone-500">Loading certificates...</p>;

  return (
    <div className="page-shell space-y-6">
      <div className="space-y-2">
        <h1 className="page-title">My Certificates</h1>
        <p className="page-subtitle">
          Download your participation certificates and view event completion details.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {certificates.length === 0 ? (
        <div className="card p-10 text-center border border-stone-200 bg-gradient-to-br from-white to-cream-50 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-brand-50 text-brand-800">
            🎓
          </div>
          <p className="text-stone-700 font-semibold">No certificates yet.</p>
          <p className="text-stone-500 mt-2">
            They appear here after you complete an event.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="card p-6 flex flex-col gap-4 border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="badge badge-success">Ready to download</span>
                  <h3 className="mt-3 text-xl font-semibold text-stone-900 break-words">
                    {cert.event_title}
                  </h3>
                  <p className="text-sm text-brand-700">{cert.club_name}</p>
                  <p className="text-sm text-stone-500 mt-1">
                    Issued {formatDateTime(cert.issued_at)}
                  </p>
                </div>
                <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-800">
                  PDF
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-cream-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                  Certificate details
                </p>
                <p className="mt-3 text-sm text-stone-600">
                  Student: <span className="font-medium text-stone-800">{cert.user_name}</span>
                </p>
                <p className="text-sm text-stone-600">
                  Reference: <span className="font-medium text-stone-800 break-all">{cert.certificate_code}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-auto">
                <button
                  type="button"
                  onClick={() => openQrPreview(cert)}
                  disabled={!cert.qr_image_base64}
                  className="btn-secondary"
                >
                  View QR
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingId === cert.id}
                  className="btn-primary"
                >
                  {downloadingId === cert.id ? "Preparing..." : "Download PDF"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrPreview.open && qrPreview.certificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                  Certificate QR
                </p>
                <h3 className="mt-2 text-lg font-semibold text-stone-800">
                  {qrPreview.certificate.event_title}
                </h3>
                <p className="text-sm text-stone-500">
                  Scan this QR to open the certificate download page.
                </p>
              </div>
              <button type="button" onClick={closeQrPreview} className="btn-secondary">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <img
                  src={`data:image/png;base64,${qrPreview.certificate.qr_image_base64}`}
                  alt="Certificate QR code"
                  className="mx-auto h-64 w-64 rounded-2xl border border-stone-200 bg-white p-3"
                />
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5">
                <p className="text-sm font-medium text-stone-800">Download URL</p>
                <p className="mt-2 break-all text-sm text-stone-500">
                  {qrPreview.certificate.download_url}
                </p>
                <p className="mt-4 text-sm text-stone-500">
                  Keep this QR handy if you want to open the certificate on another device.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
