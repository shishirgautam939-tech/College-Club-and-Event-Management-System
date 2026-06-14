import { useState, useEffect } from "react";
import { getMyCertificates, downloadCertificate } from "../../api/participation";
import { saveBlobAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

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
      const res = await downloadCertificate(certificate.id);
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

  if (loading) return <p className="text-stone-500">Loading certificates...</p>;

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="page-title">My Certificates</h1>
        <p className="page-subtitle">
          Download your participation certificates for events you attended.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {certificates.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-stone-500">
            No certificates yet. They appear here after you attend a completed event.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="card p-5 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-stone-800">{cert.event_title}</h3>
                <p className="text-sm text-brand-700">{cert.club_name}</p>
                <p className="text-sm text-stone-500 mt-1">
                  Issued {formatDateTime(cert.issued_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(cert)}
                disabled={downloadingId === cert.id}
                className="btn-primary mt-auto"
              >
                {downloadingId === cert.id ? "Preparing..." : "Download PDF"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
