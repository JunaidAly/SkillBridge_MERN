import { useMemo } from "react";

function getFileType(fileUrl = "", fileName = "", fileMimeType = "") {
  const lowerName = (fileName || fileUrl || "").toLowerCase();
  if (fileMimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (
    fileMimeType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp)$/.test(lowerName)
  )
    return "image";
  if (
    fileMimeType.includes("word") ||
    /\.(doc|docx)$/.test(lowerName)
  )
    return "doc";
  return "other";
}

function CertificationPreviewModal({ isOpen, onClose, cert }) {
  const type = useMemo(
    () => getFileType(cert?.fileUrl, cert?.fileName, cert?.fileMimeType),
    [cert]
  );

  if (!isOpen) return null;

  // Use backend endpoint for viewing so Content-Type/headers are consistent (and avoids Cloudinary URL quirks)
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const viewUrl = cert?._id
    ? `${apiBase}/users/me/certifications/${cert._id}/download?disposition=inline`
    : "";

  const src =
    type === "doc"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`
      : viewUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="min-w-0">
            <p className="font-family-poppins font-semibold text-black truncate">
              {cert?.name || "Certificate"}
            </p>
            {cert?.fileName && (
              <p className="font-family-poppins text-xs text-gray truncate">
                {cert.fileName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="font-family-poppins text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="h-[75vh] bg-gray-50">
          {!cert?._id ? (
            <div className="h-full flex items-center justify-center text-gray">
              No file attached.
            </div>
          ) : type === "image" ? (
            <div className="h-full overflow-auto p-4">
              <img
                src={viewUrl}
                alt={cert.name || "Certificate"}
                className="max-w-full mx-auto rounded"
              />
            </div>
          ) : (
            <iframe
              title="certificate-preview"
              src={src}
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CertificationPreviewModal;

