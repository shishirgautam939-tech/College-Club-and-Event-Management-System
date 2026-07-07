export const saveBlobAsFile = (blob, filename) => {
  const fileBlob = blob instanceof Blob ? blob : new Blob([blob]);
  const url = window.URL.createObjectURL(fileBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
