const QRCode = require("qrcode");

async function generateQRCode(data) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

module.exports = {
  generateQRCode,
};
