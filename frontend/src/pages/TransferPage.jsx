import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { bankingApi } from "../services/api";

export default function TransferPage({ qr = false }) {
  const [form, setForm] = useState({ receiverAccount: "", qrCode: "", amount: "" });
  const [myQr, setMyQr] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    if (!qr) return;
    bankingApi.myQr()
      .then(({ data }) => setMyQr(data))
      .catch((err) => setStatus({ error: getError(err) }));
  }, [qr]);

  useEffect(() => {
    if (!myQr?.qrCode) return;
    QRCode.toDataURL(qrPayload(myQr.qrCode), { width: 280, margin: 2, color: { dark: "#102421", light: "#ffffff" } })
      .then(setQrImage)
      .catch(() => setStatus({ error: "Unable to create QR image" }));
  }, [myQr]);

  useEffect(() => () => stopCamera(), []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = qr
        ? { qrCode: form.qrCode.trim(), amount: form.amount }
        : { receiverAccount: form.receiverAccount.trim(), amount: form.amount };
      await (qr ? bankingApi.qrPayment(payload) : bankingApi.transfer(payload));
      setStatus({ success: qr ? "QR payment completed" : "Transfer completed" });
      setForm({ ...form, receiverAccount: "", qrCode: "", amount: "" });
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };

  const applyScannedQr = (rawValue) => {
    const scannedCode = parseQrPayload(rawValue);
    if (!scannedCode) {
      setStatus({ error: "This QR image is not a SmartBank payment QR" });
      return;
    }
    setForm((current) => ({ ...current, qrCode: scannedCode }));
    setStatus({ success: "Receiver QR scanned. Enter amount and pay." });
    stopCamera();
  };

  const scanImage = async (file) => {
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) applyScannedQr(result.data);
      else setStatus({ error: "No QR code found in selected image" });
      URL.revokeObjectURL(image.src);
    };
    image.onerror = () => setStatus({ error: "Unable to read selected image" });
    image.src = URL.createObjectURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
      window.setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }, 0);
      scanTimerRef.current = window.setInterval(scanCameraFrame, 600);
    } catch {
      setStatus({ error: "Camera permission denied or camera not available" });
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const scanCameraFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result?.data) applyScannedQr(result.data);
  };

  const downloadQr = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${myQr?.accountHolder || "smartbank"}-qr.png`.replace(/[^a-z0-9.-]+/gi, "-");
    link.click();
  };

  return <section className="panel form-panel"><h2>{qr ? "QR Payment" : "Transfer Money"}</h2>
    {qr && <div className="qr-payment-grid">
      <div>
        <h3>Your Account QR</h3>
        {qrImage ? <img className="qr-image" src={qrImage} alt="Your SmartBank account QR" /> : <div className="qr-loading">Loading QR...</div>}
        <button type="button" className="qr-download" onClick={downloadQr} disabled={!qrImage}>Download QR</button>
      </div>
    </div>}
    <form onSubmit={submit}>
    {qr ? (
      <div className="qr-scan-panel">
        <label>Scan Receiver QR From Gallery<input type="file" accept="image/*" onChange={(e) => scanImage(e.target.files?.[0])} /></label>
        <div className="qr-actions">
          <button type="button" onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? "Stop Camera" : "Scan With Camera"}</button>
          <span className={form.qrCode ? "scan-state ready" : "scan-state"}>{form.qrCode ? "Receiver QR ready" : "No receiver QR scanned"}</span>
        </div>
        {cameraOn && <video ref={videoRef} className="qr-camera" playsInline muted />}
      </div>
    ) : (
      <label>Receiver Account<input value={form.receiverAccount} onChange={(e) => setForm({ ...form, receiverAccount: e.target.value })} required /></label>
    )}
    <label>Amount<input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
    <FormStatus {...status} />
    <button disabled={qr && !form.qrCode}>{qr ? "Pay Now" : "Send Money"}</button>
  </form></section>;
}

function qrPayload(qrCode) {
  return `SMARTBANK_PAY:${qrCode}`;
}

function parseQrPayload(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("SMARTBANK_PAY:")) return trimmed.replace("SMARTBANK_PAY:", "").trim();
  if (trimmed.startsWith("SBQR-")) return trimmed;
  return "";
}
