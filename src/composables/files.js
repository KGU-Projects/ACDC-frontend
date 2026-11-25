// File → { name, mimeType, data(base64, data URL 접두어 제외) }
const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1)); // "data:application/pdf;base64," 접두어 제거
    };
    reader.readAsDataURL(file);
  });

export const filesToPayload = (files) =>
  Promise.all(
    files.map(async (file) => ({
      name: file.name,
      mimeType: file.type || 'application/pdf',
      data: await readAsBase64(file)
    }))
  );
