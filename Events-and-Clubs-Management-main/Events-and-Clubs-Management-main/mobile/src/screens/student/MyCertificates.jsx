import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal, Pressable, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Award, GraduationCap } from "lucide-react-native";
import { getMyCertificates } from "../../api/participation";
import { downloadApiFileToDevice } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";
import { colors, radii, spacing, shadow } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [qrPreview, setQrPreview] = useState({ open: false, certificate: null });

  const fetchCertificates = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getMyCertificates();
      setCertificates(res.data);
      setError("");
    } catch {
      setError("Could not load your certificates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useFocusEffect(
    useCallback(() => {
      fetchCertificates({ silent: true });
    }, [fetchCertificates]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates({ silent: true });
  };

  const handleDownload = async (certificate) => {
    setDownloadingId(certificate.id);
    try {
      const downloadTarget =
        certificate.download_url || `certificates/${certificate.id}/download/`;
      await downloadApiFileToDevice(
        downloadTarget,
        `certificate_${certificate.event_title.replace(/\s+/g, "_")}.pdf`,
        "application/pdf",
      );
      setError("");
    } catch (err) {
      setError(`Download failed${err?.message ? ` — ${err.message}` : ". Please try again."}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const openQrPreview = (certificate) => setQrPreview({ open: true, certificate });
  const closeQrPreview = () => setQrPreview({ open: false, certificate: null });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading certificates…</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={
            <>
              <Award size={14} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>Achievements</Text>
            </>
          }
          title="My certificates"
          subtitle="Download your participation certificates and view event completion details."
        />

        {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}

        {certificates.length === 0 ? (
          <Card style={{ marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.xxl }}>
            <View style={styles.emptyIconWrap}>
              <GraduationCap size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No certificates yet.</Text>
            <Text style={styles.emptySubtitle}>They appear here after you complete an event.</Text>
          </Card>
        ) : (
          <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <StatusBadge tone="success">Ready to download</StatusBadge>
                <Text style={styles.cardTitle}>{cert.event_title}</Text>
                <Text style={styles.cardClub}>{cert.club_name}</Text>
                <Text style={styles.cardMeta}>Issued {formatDateTime(cert.issued_at)}</Text>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailsLabel}>Certificate details</Text>
                  <Text style={styles.detailsText}>
                    Student: <Text style={styles.detailsStrong}>{cert.user_name}</Text>
                  </Text>
                  <Text style={styles.detailsText}>
                    Reference: <Text style={styles.detailsStrong}>{cert.certificate_code}</Text>
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <Button
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => openQrPreview(cert)}
                    disabled={!cert.qr_image_base64}
                  >
                    View QR
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    onPress={() => handleDownload(cert)}
                    disabled={downloadingId === cert.id}
                    loading={downloadingId === cert.id}
                  >
                    Download PDF
                  </Button>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={qrPreview.open}
        transparent
        animationType="fade"
        onRequestClose={closeQrPreview}
      >
        <Pressable style={modalStyles.overlay} onPress={closeQrPreview}>
          <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
            {qrPreview.certificate ? (
              <>
                <Text style={modalStyles.eyebrow}>Certificate QR</Text>
                <Text style={modalStyles.title}>{qrPreview.certificate.event_title}</Text>
                <Text style={modalStyles.subtitle}>Scan this QR to open the certificate download page.</Text>

                <View style={modalStyles.imageWrap}>
                  {qrPreview.certificate.qr_image_base64 ? (
                    <Image
                      source={{ uri: `data:image/png;base64,${qrPreview.certificate.qr_image_base64}` }}
                      style={modalStyles.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={modalStyles.emptyText}>QR not available.</Text>
                  )}
                </View>

                <View style={modalStyles.urlBox}>
                  <Text style={modalStyles.urlLabel}>Download URL</Text>
                  <Text style={modalStyles.urlText}>{qrPreview.certificate.download_url}</Text>
                  <Text style={modalStyles.urlHint}>
                    Keep this QR handy if you want to open the certificate on another device.
                  </Text>
                </View>

                <Button variant="outline" size="sm" onPress={closeQrPreview}>
                  Close
                </Button>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.sm },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF" },

  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  emptySubtitle: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

  cardTitle: { marginTop: spacing.sm, fontFamily: fontFamily.semibold, fontSize: fontSize.lg, color: colors.textPrimary },
  cardClub: { marginTop: 2, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.primary },
  cardMeta: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },

  detailsBox: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: 4,
  },
  detailsLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  detailsText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  detailsStrong: { fontFamily: fontFamily.medium, color: colors.textPrimary },

  buttonRow: { marginTop: spacing.md, flexDirection: "row", gap: spacing.sm },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 400, maxHeight: "85%", backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm, ...shadow.card },
  eyebrow: { fontFamily: fontFamily.semibold, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", color: colors.textMuted },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  imageWrap: {
    marginTop: spacing.sm,
    minHeight: 200,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  qrImage: { width: 220, height: 220, backgroundColor: "#FFFFFF", borderRadius: radii.md },
  emptyText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  urlBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: 4,
  },
  urlLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  urlText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  urlHint: { marginTop: spacing.sm, fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
});

export default MyCertificates;
